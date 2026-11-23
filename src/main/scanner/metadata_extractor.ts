import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { parseFile, selectCover } from 'music-metadata';
import type { ScannedAudioTrack } from './scanner_types';

const DEFAULT_ARTIST_NAME = 'Неизвестный исполнитель';
const DEFAULT_ALBUM_NAME = 'Неизвестный альбом';

/**
 * Преобразует бинарные данные обложки из ID3-тегов в строку Data URL,
 * готовую для прямой вставки в тег <img src="..." /> в React.
 */
function convertCoverToDataUrl(
    pictures: Awaited<ReturnType<typeof parseFile>>['common']['picture']
): string | null {
    const primaryCover = selectCover(pictures);
    if (!primaryCover || !primaryCover.data || primaryCover.data.length === 0) {
        return null;
    }

    // Приводим Uint8Array к Node Buffer для надёжного кодирования в Base64
    const base64Image = Buffer.from(primaryCover.data).toString('base64');
    const mimeType = primaryCover.format || 'image/jpeg';

    return `data:${mimeType};base64,${base64Image}`;
}

/**
 * Извлекает ID3-теги и технические характеристики (битрейт, длительность, обложка)
 * из одного аудиофайла.
 */
export async function extractTrackMetadata(filePath: string): Promise<ScannedAudioTrack> {
    // Запрашиваем размер файла и метаданные параллельно для ускорения обработки
    const [fileStats, parsedMetadata] = await Promise.all([
        fs.stat(filePath),
        parseFile(filePath, {
            duration: true,
            skipCovers: false,
        }),
    ]);

    const fileNameWithoutExtension = path.basename(filePath, path.extname(filePath));
    const { common, format } = parsedMetadata;

    // Битрейт в music-metadata возвращается в бит/с — переводим в привычные кбит/с
    const bitrateKbps = format.bitrate ? Math.round(format.bitrate / 1000) : 0;
    const durationSeconds = format.duration ? Math.round(format.duration) : 0;

    return {
        filePath,
        fileName: path.basename(filePath),
        title: common.title?.trim() || fileNameWithoutExtension,
        artist: common.artist?.trim() || DEFAULT_ARTIST_NAME,
        album: common.album?.trim() || DEFAULT_ALBUM_NAME,
        durationSeconds,
        bitrateKbps,
        coverDataUrl: convertCoverToDataUrl(common.picture),
        fileSizeBytes: fileStats.size,
    };
}