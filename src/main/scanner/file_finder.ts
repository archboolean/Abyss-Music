import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/**
 * Поддерживаемые расширения аудиофайлов (в нижнем регистре).
 */
export const SUPPORTED_AUDIO_EXTENSIONS = new Set<string>([
    '.mp3',
    '.flac',
    '.wav',
    '.ogg',
    '.m4a',
    '.aac',
    '.opus',
    '.wma',
]);

/**
 * Проверяет, относится ли файл к поддерживаемым аудиоформатам.
 */
export function isSupportedAudioFile(filePath: string): boolean {
    const extension = path.extname(filePath).toLowerCase();
    return SUPPORTED_AUDIO_EXTENSIONS.has(extension);
}

/**
 * Рекурсивно собирает пути ко всем аудиофайлам в указанной папке и её подпапках.
 *
 * Сложная логика: используем итеративный стек вместо глубокой рекурсии функций,
 * чтобы исключить переполнение стека вызовов (RangeError) на очень вложенных каталогах
 * и безопасно пропускать системные папки без прав доступа.
 */
export async function collectAudioFilePaths(
    rootDirectoryPath: string,
    abortSignal?: AbortSignal
): Promise<string[]> {
    const collectedAudioPaths: string[] = [];
    const directoriesToVisit: string[] = [path.resolve(rootDirectoryPath)];

    while (directoriesToVisit.length > 0) {
        if (abortSignal?.aborted) {
            break;
        }

        const currentDirectory = directoriesToVisit.pop()!;

        let directoryEntries;
        try {
            // withFileTypes позволяет сразу узнать тип элемента без лишних системных вызовов stat()
            directoryEntries = await fs.readdir(currentDirectory, { withFileTypes: true });
        } catch {
            // Пропускаем каталоги, к которым нет прав доступа (например, System Volume Information)
            continue;
        }

        for (const entry of directoryEntries) {
            const fullEntryPath = path.join(currentDirectory, entry.name);

            if (entry.isDirectory()) {
                // Игнорируем скрытые служебные директории, начинающиеся с точки (например, .git)
                if (!entry.name.startsWith('.')) {
                    directoriesToVisit.push(fullEntryPath);
                }
            } else if (entry.isFile() && isSupportedAudioFile(fullEntryPath)) {
                collectedAudioPaths.push(fullEntryPath);
            }
        }
    }

    return collectedAudioPaths;
}