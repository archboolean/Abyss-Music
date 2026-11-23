/**
 * Результат извлечения метаданных одного аудиофайла.
 * Локальный тип сканера — позже легко маппится на модель TrackItem для SQLite.
 */
export interface ScannedAudioTrack {
    filePath: string;
    fileName: string;
    title: string;
    artist: string;
    album: string;
    durationSeconds: number;
    bitrateKbps: number;
    /** Обложка трека в формате Data URL (data:image/...;base64,...) или null, если её нет */
    coverDataUrl: string | null;
    fileSizeBytes: number;
}

/**
 * Информация о ходе сканирования для отправки в UI через IPC.
 */
export interface ScanProgressInfo {
    processedFiles: number;
    totalFiles: number;
    currentFilePath: string;
}

/**
 * Итоговый отчёт о завершении сканирования директории.
 */
export interface DirectoryScanResult {
    tracks: ScannedAudioTrack[];
    skippedFiles: Array<{
        filePath: string;
        reason: string;
    }>;
    elapsedTimeMs: number;
}

export interface ScanDirectoryOptions {
    /** Колбэк для обновления прогресс-бара в интерфейсе */
    onProgress?: (progress: ScanProgressInfo) => void;
    /** Сигнал отмены сканирования пользователем */
    abortSignal?: AbortSignal;
    /** Максимум одновременно читаемых файлов (защита от перегрузки диска и ошибки EMFILE) */
    concurrencyLimit?: number;
}