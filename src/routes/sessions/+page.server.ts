
import { db } from '#lib/server/db/index.js';
import { sessions, plays } from '#lib/server/db/schema.js';
import { count, desc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ url }) => {
    const requestedPage = Number(url.searchParams.get('page') ?? '1');
    const pageSize = 20;

    const [totalResult] = await db
        .select({ value: count() })
        .from(sessions);

    const total = totalResult?.value ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Number.isSafeInteger(requestedPage)
        ? Math.min(Math.max(1, requestedPage), totalPages)
        : 1;

    const rows = await db
        .select({
            id: sessions.id,
            sessionDate: sessions.sessionDate,
            startedAt: sessions.startedAt,
            endedAt: sessions.endedAt,
            trackCount: count(plays.id)
        })
        .from(sessions)
        .leftJoin(plays, eq(plays.sessionId, sessions.id))
        .groupBy(sessions.id)
        .orderBy(
            desc(sessions.startedAt),
            desc(sessions.id)
        )
        .limit(pageSize)
        .offset((page - 1) * pageSize);

    const [playStats] = await db
        .select({ value: count() })
        .from(plays);

    return {
        sessions: rows,
        stats: {
            totalSessions: total,
            totalPlays: playStats?.value ?? 0
        },
        page,
        totalPages
    };
};
