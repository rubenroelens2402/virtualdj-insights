
import {
    sqliteTable,
    integer,
    text,
    real,
    index
} from 'drizzle-orm/sqlite-core';
import { uniqueIndex } from 'drizzle-orm/sqlite-core';

export const tracks = sqliteTable('tracks', {
    id: integer('id').primaryKey({ autoIncrement: true }),

    // Identity
    filePath: text('file_path').notNull().unique(),
    fileSize: integer('file_size'),

    // Metadata
    title: text('title'),
    artist: text('artist'),
    remix: text('remix'),
    genre: text('genre'),
    year: integer('year'),

    // Audio analysis
    bpm: real('bpm'),
    bpmRaw: real('bpm_raw'),
    musicalKey: text('musical_key'),
    durationSeconds: real('duration_seconds'),
    bitrate: integer('bitrate'),

    // VirtualDJ history
    firstSeen: integer('first_seen', { mode: 'timestamp' }),
    lastModified: integer('last_modified', { mode: 'timestamp' }),
    firstPlay: integer('first_play', { mode: 'timestamp' }),
    lastPlay: integer('last_play', { mode: 'timestamp' }),
    playCount: integer('play_count').notNull().default(0),

    // Our synchronization metadata
    syncedAt: integer('synced_at', { mode: 'timestamp' })
}, (table) => [
    index('tracks_artist_idx').on(table.artist),
    index('tracks_bpm_idx').on(table.bpm)
]);


export const sessions = sqliteTable('sessions', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    sessionDate: text('session_date').notNull(),
    startedAt: text('started_at'),
    endedAt: text('ended_at'),
    sourceFile: text('source_file').notNull(),
    sourcePosition: integer('source_position').notNull()
}, (table) => [
    uniqueIndex('sessions_source_idx')
        .on(table.sourceFile, table.sourcePosition)
]);


export const plays = sqliteTable('plays', {
    id: integer('id').primaryKey({ autoIncrement: true }),

    sessionId: integer('session_id')
        .notNull()
        .references(() => sessions.id),

    trackId: integer('track_id')
        .references(() => tracks.id),

    playedAt: text('played_at').notNull(),
    position: integer('position').notNull(),

    artist: text('artist'),
    title: text('title').notNull(),
    originalText: text('original_text').notNull()
}, (table) => [
    uniqueIndex('plays_session_position_idx')
        .on(table.sessionId, table.position),
    index('plays_played_at_idx').on(table.playedAt),
    index('plays_track_id_idx').on(table.trackId)
]);
