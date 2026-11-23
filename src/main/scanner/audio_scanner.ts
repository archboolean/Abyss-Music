import { collectAudioFilePaths } from './file_finder';
import { extractTrackMetadata } from './metadata_extractor';
import type {
    DirectoryScanResult,
    ScanDirectoryOptions,
    ScannedAudioTrack,
} from './scanner_types';

const DEFAULT_CONCURRENCY_LIMIT = 8;

/**
 * Сканирует выбранную пользователем директорию и извлекает метаданные всех аудиофайлов.
 *
 * Сложная логика: файлы обрабатываются пулом воркеров с ограничением параллельности
 * (concurrencyLimit). Если запускать Promise.all сразу на тысячах треков, ОС вернёт
 * ошибку EMFILE (слишком много открытых файлов), а память быстро заполнится обложками.
 */
export async function scanAudioDirectory(
    directoryPath: string,
    options: ScanDirectoryOptions = {}
): Promise<DirectoryScanResult> {
    const startTimeMs = Date.now();
    const {
        onProgress,
        abortSignal,
        concurrencyLimit = DEFAULT_CONCURRENCY_LIMIT,
    } = options;

    const audioFilePaths = await collectAudioFilePaths(directoryPath, abortSignal);
    const totalFiles = audioFilePaths.length;

    const tracks: ScannedAudioTrack[] = [];
    const skippedFiles: DirectoryScanResult['skippedFiles'] = [];

    let nextFileIndex = 0;
    let processedFiles = 0;

    // Каждый воркер последовательно берёт следующий индекс из общей очереди,
    // пока не закончатся файлы или сканирование не будет отменено.
    const runWorker = async (): Promise<void> => {
        while (nextFileIndex < totalFiles) {
            if (abortSignal?.aborted) {
                return;
            }

            const currentIndex = nextFileIndex;
            nextFileIndex += 1;
            const currentFilePath = audioFilePaths[currentIndex];

            try {
                const trackMetadata = await extractTrackMetadata(currentFilePath);
                tracks.push(trackMetadata);
            } catch (error) {
                const reason = error instanceof Error ? error.message : 'Неизвестная ошибка чтения тегов';
                skippedFiles.push({ filePath: currentFilePath, reason });
            } finally {
                processedFiles += 1;
                onProgress?.({
                    processedFiles,
                    totalFiles,
                    currentFilePath,
                });
            }
        }
    };

    // Запускаем не больше воркеров, чем реально найдено файлов
    const activeWorkerCount = Math.min(Math.max(1, concurrencyLimit), totalFiles);
    const workerPromises = Array.from({ length: activeWorkerCount }, () => runWorker());
    await Promise.all(workerPromises);

    return {
        tracks,
        skippedFiles,
        elapsedTimeMs: Date.now() - startTimeMs,
    };
}