
import { error } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.js';
import { sessions, plays, tracks } from '#lib/server/db/schema.js';
import { count, countDistinct, eq, sql, asc } from 'drizzle-orm';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ params }) => {
    // --------------------------------------------------
    // Validate session ID
    // --------------------------------------------------

    const sessionId = Number(params.id);

    if (!Number.isSafeInteger(sessionId) || sessionId <= 0) {
        error(404, 'Invalid session ID');
    }

    // --------------------------------------------------
    // Session details
    // --------------------------------------------------

    const [session] = await db
        .select({
            id: sessions.id,
            sessionDate: sessions.sessionDate,
            startedAt: sessions.startedAt,
            endedAt: sessions.endedAt
        })
        .from(sessions)
        .where(eq(sessions.id, sessionId))
        .limit(1);

    if (!session) {
        error(404, 'Session not found');
    }

    // --------------------------------------------------
    // Tracklist enriched with library metadata
    // --------------------------------------------------

    const tracklist = await db
        .select({
            id: plays.id,
            position: plays.position,
            playedAt: plays.playedAt,

            artist: plays.artist,
            title: plays.title,

            trackId: plays.trackId,

            bpm: tracks.bpm,
            musicalKey: tracks.musicalKey,
            genre: tracks.genre,
            durationSeconds: tracks.durationSeconds
        })
        .from(plays)
        .leftJoin(tracks, eq(plays.trackId, tracks.id))
        .where(eq(plays.sessionId, sessionId))
        .orderBy(asc(plays.position), asc(plays.id));

    // --------------------------------------------------
    // Session KPIs
    // --------------------------------------------------

    const [stats] = await db
        .select({
            totalTracks: count(plays.id),

            uniqueArtists: countDistinct(plays.artist),

            matchedTracks: count(tracks.id),

            averageBpm: sql<number | null>`
                avg(${tracks.bpm})
            `
        })
        .from(plays)
        .leftJoin(tracks, eq(plays.trackId, tracks.id))
        .where(eq(plays.sessionId, sessionId));

    return {
        session,
        tracklist,
        stats: {
            totalTracks: stats?.totalTracks ?? 0,
            uniqueArtists: stats?.uniqueArtists ?? 0,
            matchedTracks: stats?.matchedTracks ?? 0,
            averageBpm: stats?.averageBpm ?? null
        }
    };
};
