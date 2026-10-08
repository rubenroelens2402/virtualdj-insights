import { db } from '#lib/server/db/index.js';
import { tracks } from '#lib/server/db/schema.js';
import { asc, isNotNull, count, and, gt } from 'drizzle-orm';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
    const libraryTracks = await db
        .select({
            id: tracks.id,
            artist: tracks.artist,
            title: tracks.title,
            genre: tracks.genre,
            bpm: tracks.bpm,
            musicalKey: tracks.musicalKey,
            durationSeconds: tracks.durationSeconds,
            playCount: tracks.playCount,
            lastPlay: tracks.lastPlay
        })
        .from(tracks)
        .where(
            and(
                isNotNull(tracks.musicalKey),
                gt(tracks.playCount, 0)
            )
        )
        .orderBy(
            asc(tracks.artist),
            asc(tracks.title)
        );

    const [summary] = await db
        .select({ totalTracks: count() })
        .from(tracks);

    return {
        tracks: libraryTracks,
        totalLibraryTracks: summary?.totalTracks ?? 0
    };
};