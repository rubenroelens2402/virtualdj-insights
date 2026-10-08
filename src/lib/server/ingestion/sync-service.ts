
import { join } from 'node:path';
import { parseDatabase } from './database-parser';
import { db } from '../db';
import { tracks } from '../db/schema';
import 'dotenv/config';

import { eq, inArray } from 'drizzle-orm';
import { sessions, plays } from '#lib/server/db/schema.js';
import { parseHistoryFile } from './history-parser.js';

export async function syncLibrary() {
    const virtualdjPath = process.env.VIRTUALDJ_PATH;

    if (!virtualdjPath) {
        throw new Error('VIRTUALDJ_PATH is not configured');
    }

    const databasePath = join(virtualdjPath, 'database.xml');
    const parsedTracks = await parseDatabase(databasePath);

    const batchSize = 500;
    const syncedAt = new Date();

    for (let i = 0; i < parsedTracks.length; i += batchSize) {
        const batch = parsedTracks.slice(i, i + batchSize);

        db.transaction((tx) => {
            for (const track of batch) {
                tx.insert(tracks)
                    .values({ ...track, syncedAt })
                    .onConflictDoUpdate({
                        target: tracks.filePath,
                        set: {
                            fileSize: track.fileSize,
                            title: track.title,
                            artist: track.artist,
                            remix: track.remix,
                            genre: track.genre,
                            year: track.year,
                            bpm: track.bpm,
                            bpmRaw: track.bpmRaw,
                            musicalKey: track.musicalKey,
                            durationSeconds: track.durationSeconds,
                            bitrate: track.bitrate,
                            firstSeen: track.firstSeen,
                            lastModified: track.lastModified,
                            firstPlay: track.firstPlay,
                            lastPlay: track.lastPlay,
                            playCount: track.playCount,
                            syncedAt
                        }
                    })
                    .run();
            }
        });
    }

    return {
        processed: parsedTracks.length,
        syncedAt: syncedAt.toISOString()
    };
}

export async function syncHistory() {
    const virtualdjPath = process.env.VIRTUALDJ_PATH;

    if (!virtualdjPath) {
        throw new Error('VIRTUALDJ_PATH is not configured');
    }

    const sourceFile = 'History/tracklist.txt';
    const historyPath = join(virtualdjPath, 'History', 'tracklist.txt');

    const parsedSessions = await parseHistoryFile(historyPath);

    let importedPlays = 0;

    db.transaction((tx) => {
        // Find existing sessions imported from this particular file.
        const existing = tx
            .select({ id: sessions.id })
            .from(sessions)
            .where(eq(sessions.sourceFile, sourceFile))
            .all();

        const sessionIds = existing.map((session) => session.id);

        // Delete child records before their parent sessions.
        if (sessionIds.length > 0) {
            tx.delete(plays)
                .where(inArray(plays.sessionId, sessionIds))
                .run();
        }

        tx.delete(sessions)
            .where(eq(sessions.sourceFile, sourceFile))
            .run();

        // Insert the newly parsed sessions and their plays.
        for (const session of parsedSessions) {
            const inserted = tx
                .insert(sessions)
                .values({
                    sessionDate: session.sessionDate,
                    startedAt: session.startedAt,
                    endedAt: session.endedAt,
                    sourceFile,
                    sourcePosition: session.sourcePosition
                })
                .returning({ id: sessions.id })
                .get();

            if (!inserted) {
                throw new Error('Failed to insert session');
            }

            for (const play of session.plays) {
                tx.insert(plays)
                    .values({
                        sessionId: inserted.id,
                        trackId: null,
                        playedAt: play.playedAt,
                        position: play.position,
                        artist: play.artist,
                        title: play.title,
                        originalText: play.originalText
                    })
                    .run();

                importedPlays++;
            }
        }
    });

    return {
        sessions: parsedSessions.length,
        plays: importedPlays
    };
}