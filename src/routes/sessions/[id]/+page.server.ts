
import { error } from '@sveltejs/kit';
import { eq, asc } from 'drizzle-orm';

import { db } from '#lib/server/db/index.js';
import { sessions, plays, tracks } from '#lib/server/db/schema.js';

import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ params }) => {
    const sessionId = Number(params.id);

    if (!Number.isSafeInteger(sessionId) || sessionId <= 0) {
        error(404, 'Session not found');
    }

    const [session] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, sessionId))
        .limit(1);

    if (!session) {
        error(404, 'Session not found');
    }

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
            durationSeconds: tracks.durationSeconds
        })
        .from(plays)
        .leftJoin(tracks, eq(plays.trackId, tracks.id))
        .where(eq(plays.sessionId, sessionId))
        .orderBy(asc(plays.position));

    const uniqueArtists = new Set(
        tracklist
            .map(track => track.artist)
            .filter(Boolean)
    ).size;

    const matchedTracks = tracklist.filter(
        track => track.trackId !== null
    ).length;

    const bpmValues = tracklist
        .map(track => track.bpm)
        .filter((bpm): bpm is number => bpm !== null);

    const averageBpm = bpmValues.length > 0
        ? bpmValues.reduce((sum, bpm) => sum + bpm, 0)
            / bpmValues.length
        : null;

    return {
        session,
        tracklist,
        stats: {
            totalTracks: tracklist.length,
            uniqueArtists,
            matchedTracks,
            averageBpm
        }
    };
};
