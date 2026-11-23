import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { app } from 'electron';
import initSqlJs, { Database } from 'sql.js';
import { TrackRepository } from '../../database/repositories/TrackRepository';
import { PlaylistRepository } from '../../database/repositories/PlaylistRepository';

let dbInstance: Database | null = null;
let trackRepoInstance: TrackRepository | null = null;
let playlistRepoInstance: PlaylistRepository | null = null;

const DB_FILENAME = 'abyss_music.db';

/**
 * Gets the path to the database file in the user data directory.
 */
function getDbPath(): string {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, DB_FILENAME);
}

/**
 * Initializes the SQL.js database and creates the tracks table if it doesn't exist.
 */
export async function initializeDatabase(): Promise<void> {
  if (dbInstance) {
    return;
  }

  const SQL = await initSqlJs();
  const dbPath = getDbPath();

  try {
    const dbBuffer = await fs.readFile(dbPath);
    dbInstance = new SQL.Database(dbBuffer);
  } catch (error) {
    // Database file doesn't exist, create a new one
    dbInstance = new SQL.Database();
    await saveDatabase();
  }

  // Create the tracks table if it doesn't exist
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS tracks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      artist TEXT NOT NULL,
      album TEXT,
      duration INTEGER NOT NULL,
      filePath TEXT NOT NULL,
      coverUrl TEXT,
      bitrate INTEGER,
      addedAt INTEGER NOT NULL,
      sourceType TEXT NOT NULL DEFAULT 'local',
      isFavorite INTEGER NOT NULL DEFAULT 0
    )
  `);

  // Create the playlists table
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS playlists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      coverUrl TEXT,
      createdAt INTEGER NOT NULL
    )
  `);

  // Create the playlist_tracks junction table
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS playlist_tracks (
      playlistId TEXT NOT NULL,
      trackId TEXT NOT NULL,
      position INTEGER NOT NULL,
      PRIMARY KEY (playlistId, trackId),
      FOREIGN KEY (playlistId) REFERENCES playlists(id) ON DELETE CASCADE,
      FOREIGN KEY (trackId) REFERENCES tracks(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for better performance
  dbInstance.run('CREATE INDEX IF NOT EXISTS idx_tracks_artist ON tracks(artist)');
  dbInstance.run('CREATE INDEX IF NOT EXISTS idx_tracks_album ON tracks(album)');
  dbInstance.run('CREATE INDEX IF NOT EXISTS idx_tracks_addedAt ON tracks(addedAt)');

  trackRepoInstance = new TrackRepository(dbInstance);
  playlistRepoInstance = new PlaylistRepository(dbInstance);
}

/**
 * Saves the database to disk.
 */
export async function saveDatabase(): Promise<void> {
  if (!dbInstance) {
    throw new Error('Database not initialized');
  }

  const dbPath = getDbPath();
  const data = dbInstance.export();
  const buffer = Buffer.from(data);
  await fs.writeFile(dbPath, buffer);
}

/**
 * Gets the database instance.
 */
export function getDatabase(): Database {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return dbInstance;
}

/**
 * Gets the TrackRepository instance.
 */
export function getTrackRepository(): TrackRepository {
  if (!trackRepoInstance) {
    throw new Error('TrackRepository not initialized. Call initializeDatabase() first.');
  }
  return trackRepoInstance;
}

/**
 * Gets the PlaylistRepository instance.
 */
export function getPlaylistRepository(): PlaylistRepository {
  if (!playlistRepoInstance) {
    throw new Error('PlaylistRepository not initialized. Call initializeDatabase() first.');
  }
  return playlistRepoInstance;
}

/**
 * Closes the database and saves to disk.
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await saveDatabase();
    dbInstance.close();
    dbInstance = null;
    trackRepoInstance = null;
    playlistRepoInstance = null;
  }
}
