
import { join } from 'node:path';
import { parseDatabase } from './database-parser.js';
import { parseHistoryFile } from './history-parser.js';
import { db } from '../db/index.js';
import { tracks, sessions, plays } from '../db/schema.js';
import { eq, inArray } from 'drizzle-orm';
import 'dotenv/config';

import type { ParsedSession, ParsedPlay } from './history-parser.js';

// --------------------------------------------------
// Library synchronization (unchanged)
// --------------------------------------------------

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

        db.transaction(tx => {
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

// --------------------------------------------------
// History matching helpers
// --------------------------------------------------

type ExistingSession = typeof sessions.$inferSelect;
type ExistingPlay = typeof plays.$inferSelect;

// The session anchor must remain stable even if earlier
// sessions are added to the history file.
//
// Date + first recorded play is safer than line number,
// but still cannot distinguish genuinely identical anchors.

function sessionKey(
    sessionDate: string,
    firstPlay: {
        playedAt: string;
        originalText: string;
    } | undefined
): string | null {
    if (!firstPlay) return null;

    return JSON.stringify([
        sessionDate,
        firstPlay.playedAt,
        firstPlay.originalText
    ]);
}

// Preserve the original text rather than normalizing it.
// Exact matching is conservative and avoids joining
// different remixes or edits accidentally.

function playKey(play: {
    playedAt: string;
    originalText: string;
}): string {
    return JSON.stringify([
        play.playedAt,
        play.originalText
    ]);
}

// Build a lookup containing only keys that occur exactly
// once. Duplicate keys are deliberately left unresolved.

function uniqueLookup<T>(
    items: T[],
    getKey: (item: T) => string | null
): Map<string, T> {
    const result = new Map<string, T>();
    const duplicates = new Set<string>();

    for (const item of items) {
        const key = getKey(item);

        if (key === null) continue;

        if (result.has(key)) {
            result.delete(key);
            duplicates.add(key);
        } else if (!duplicates.has(key)) {
            result.set(key, item);
        }
    }

    return result;
}

// --------------------------------------------------
// History synchronization
// --------------------------------------------------

export async function syncHistory() {
    const virtualdjPath = process.env.VIRTUALDJ_PATH;

    if (!virtualdjPath) {
        throw new Error('VIRTUALDJ_PATH is not configured');
    }

    const sourceFile = 'History/tracklist.txt';
    const historyPath = join(virtualdjPath, 'History', 'tracklist.txt');

    // Parse before opening a write transaction.
    const parsedSessions = await parseHistoryFile(historyPath);

    // Do not interpret an empty parse result as permission
    // to delete the entire existing history.
    if (parsedSessions.length === 0) {
        throw new Error(
            'History parser returned no sessions; existing data was left unchanged'
        );
    }

    return db.transaction(tx => {
        // ----------------------------------------------
        // Read existing source records
        // ----------------------------------------------

        const existingSessions = tx
            .select()
            .from(sessions)
            .where(eq(sessions.sourceFile, sourceFile))
            .all();

        const existingSessionIds = existingSessions.map(s => s.id);

        const existingPlays = existingSessionIds.length
            ? tx
                .select()
                .from(plays)
                .where(inArray(plays.sessionId, existingSessionIds))
                .all()
            : [];

        const playsBySession = new Map<number, ExistingPlay[]>();

        for (const play of existingPlays) {
            const list = playsBySession.get(play.sessionId) ?? [];

            list.push(play);
            playsBySession.set(play.sessionId, list);
        }

        for (const list of playsBySession.values()) {
            list.sort((a, b) => a.position - b.position);
        }

        // ----------------------------------------------
        // Match sessions using stable anchors
        // ----------------------------------------------

        const oldSessionLookup = uniqueLookup(
            existingSessions,
            session => sessionKey(
                session.sessionDate,
                playsBySession.get(session.id)?.[0]
            )
        );

        const parsedSessionLookup = uniqueLookup(
            parsedSessions,
            session => sessionKey(
                session.sessionDate,
                session.plays[0]
            )
        );

        // ----------------------------------------------
        // Move positions out of the way temporarily
        //
        // Prevents unique-index collisions when source
        // positions or play positions change.
        // ----------------------------------------------

        for (const session of existingSessions) {
            tx.update(sessions)
                .set({ sourcePosition: -session.id })
                .where(eq(sessions.id, session.id))
                .run();
        }

        for (const play of existingPlays) {
            tx.update(plays)
                .set({ position: -play.id })
                .where(eq(plays.id, play.id))
                .run();
        }

        // ----------------------------------------------
        // Reconcile sessions and plays
        // ----------------------------------------------

        let createdSessions = 0;
        let preservedSessions = 0;
        let deletedSessions = 0;

        let createdPlays = 0;
        let preservedPlays = 0;
        let deletedPlays = 0;

        const retainedSessionIds = new Set<number>();
        const retainedPlayIds = new Set<number>();

        for (const parsedSession of parsedSessions) {
            const key = sessionKey(
                parsedSession.sessionDate,
                parsedSession.plays[0]
            );

            // A match is accepted only when the anchor
            // is unique in both the old and new dataset.

            const existingSession =
                key !== null && parsedSessionLookup.has(key)
                    ? oldSessionLookup.get(key)
                    : undefined;

            let sessionId: number;

            if (existingSession) {
                sessionId = existingSession.id;
                retainedSessionIds.add(sessionId);

                tx.update(sessions)
                    .set({
                        sessionDate: parsedSession.sessionDate,
                        startedAt: parsedSession.startedAt,
                        endedAt: parsedSession.endedAt,
                        sourcePosition: parsedSession.sourcePosition
                    })
                    .where(eq(sessions.id, sessionId))
                    .run();

                preservedSessions++;
            } else {
                const inserted = tx
                    .insert(sessions)
                    .values({
                        sessionDate: parsedSession.sessionDate,
                        startedAt: parsedSession.startedAt,
                        endedAt: parsedSession.endedAt,
                        sourceFile,
                        sourcePosition: parsedSession.sourcePosition
                    })
                    .returning({ id: sessions.id })
                    .get();

                if (!inserted) {
                    throw new Error('Failed to insert session');
                }

                sessionId = inserted.id;
                createdSessions++;
            }

            // ------------------------------------------
            // Match existing plays within the session
            // ------------------------------------------

            const oldPlays = existingSession
                ? playsBySession.get(existingSession.id) ?? []
                : [];

            const oldPlayLookup = uniqueLookup(
                oldPlays,
                play => playKey(play)
            );

            const newPlayLookup = uniqueLookup(
                parsedSession.plays,
                play => playKey(play)
            );

            for (const parsedPlay of parsedSession.plays) {
                const key = playKey(parsedPlay);

                const oldPlay =
                    newPlayLookup.has(key)
                        ? oldPlayLookup.get(key)
                        : undefined;

                if (oldPlay) {
                    // Keep play.id and trackId.
                    // Only update values originating
                    // from the current history file.

                    retainedPlayIds.add(oldPlay.id);

                    tx.update(plays)
                        .set({
                            playedAt: parsedPlay.playedAt,
                            position: parsedPlay.position,
                            artist: parsedPlay.artist,
                            title: parsedPlay.title,
                            originalText: parsedPlay.originalText
                        })
                        .where(eq(plays.id, oldPlay.id))
                        .run();

                    preservedPlays++;
                } else {
                    tx.insert(plays)
                        .values({
                            sessionId,
                            trackId: null,
                            playedAt: parsedPlay.playedAt,
                            position: parsedPlay.position,
                            artist: parsedPlay.artist,
                            title: parsedPlay.title,
                            originalText: parsedPlay.originalText
                        })
                        .run();

                    createdPlays++;
                }
            }
        }

        // ----------------------------------------------
        // Remove records no longer in source
        //
        // Do this only after reconciliation, so moved
        // records retain their original IDs.
        // ----------------------------------------------

        const stalePlays = existingPlays.filter(
            play => !retainedPlayIds.has(play.id)
        );

        if (stalePlays.length > 0) {
            tx.delete(plays)
                .where(inArray(
                    plays.id,
                    stalePlays.map(play => play.id)
                ))
                .run();

            deletedPlays = stalePlays.length;
        }

        const staleSessions = existingSessions.filter(
            session => !retainedSessionIds.has(session.id)
        );

        if (staleSessions.length > 0) {
            tx.delete(sessions)
                .where(inArray(
                    sessions.id,
                    staleSessions.map(session => session.id)
                ))
                .run();

            deletedSessions = staleSessions.length;
        }

        return {
            sessions: parsedSessions.length,
            plays: parsedSessions.reduce(
                (total, session) => total + session.plays.length,
                0
            ),
            createdSessions,
            preservedSessions,
            deletedSessions,
            createdPlays,
            preservedPlays,
            deletedPlays
        };
    });
}
