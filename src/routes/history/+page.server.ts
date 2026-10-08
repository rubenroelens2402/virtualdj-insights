
import { db } from '#lib/server/db/index.js';
import { plays, sessions } from '#lib/server/db/schema.js';
import { count, desc, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
    const [playStats] = await db
        .select({
            totalPlays: count(),
            uniqueTracks: sql<number>`
                count(distinct ${plays.originalText})
            `
        })
        .from(plays);

    const [sessionStats] = await db
        .select({ totalSessions: count() })
        .from(sessions);

    const recentPlays = await db
        .select({
            id: plays.id,
            playedAt: plays.playedAt,
            artist: plays.artist,
            title: plays.title,
            sessionDate: sessions.sessionDate
        })
        .from(plays)
        .innerJoin(sessions, sql`${plays.sessionId} = ${sessions.id}`)
        .orderBy(desc(plays.playedAt), desc(plays.position))
        .limit(100);

    return {
        stats: {
            totalPlays: playStats?.totalPlays ?? 0,
            uniqueTracks: playStats?.uniqueTracks ?? 0,
            totalSessions: sessionStats?.totalSessions ?? 0
        },
        recentPlays
    };
};
