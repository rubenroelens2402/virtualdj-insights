
import { db } from '#lib/server/db/index.js';
import { tracks } from '#lib/server/db/schema.js';
import { count, like, or, asc, desc, eq, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ url }) => {
    const search = url.searchParams.get('search')?.trim() ?? '';
    const requestedPage = Number(url.searchParams.get('page') ?? '1');
    const pageSize = 25;

    const filter = search
        ? or(
            like(tracks.title, `%${search}%`),
            like(tracks.artist, `%${search}%`),
            like(tracks.filePath, `%${search}%`)
        )
        : undefined;

    const [totalResult] = await db
        .select({ value: count() })
        .from(tracks)
        .where(filter);

    const total = totalResult?.value ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Number.isSafeInteger(requestedPage)
        ? Math.min(Math.max(1, requestedPage), totalPages)
        : 1;

    const library = await db
        .select({
            id: tracks.id,
            artist: tracks.artist,
            title: tracks.title,
            genre: tracks.genre,
            bpm: tracks.bpm,
            musicalKey: tracks.musicalKey,
            durationSeconds: tracks.durationSeconds,
            playCount: tracks.playCount
        })
        .from(tracks)
        .where(filter)
        .orderBy(asc(tracks.artist), asc(tracks.title), asc(tracks.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

    const [stats] = await db
        .select({
            totalTracks: count(),
            playedTracks: sql<number>`count(case when ${tracks.playCount} > 0 then 1 end)`,
            averageBpm: sql<number | null>`avg(${tracks.bpm})`,
            totalPlays: sql<number>`coalesce(sum(${tracks.playCount}), 0)`
        })
        .from(tracks);

    return {
        tracks: library,
        search,
        page,
        pageSize,
        total,
        totalPages,
        stats
    };
};
