
import { db } from '#lib/server/db/index.js';
import { plays, sessions } from '#lib/server/db/schema.js';
import {
    and,
    asc,
    count,
    desc,
    eq,
    gte,
    like,
    lt,
    or,
    sql
} from 'drizzle-orm';
import type { PageServerLoad } from './$types.js';

// --------------------------------------------------
// Sortable columns
// --------------------------------------------------

const sortColumns = {
    playedAt: plays.playedAt,
    artist: plays.artist,
    title: plays.title,
    sessionDate: sessions.sessionDate
};

type SortKey = keyof typeof sortColumns;
type SortOrder = 'asc' | 'desc';

function isSortKey(value: string): value is SortKey {
    return Object.prototype.hasOwnProperty.call(sortColumns, value);
}

function parseDate(value: string | null): string {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return '';
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    return !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
            ? value
            : '';
}

function parsePositiveInteger(value: string | null): number | null {
    if (!value || !/^\d+$/.test(value)) return null;

    const parsed = Number(value);

    return Number.isSafeInteger(parsed) && parsed > 0
        ? parsed
        : null;
}

// --------------------------------------------------
// History loader
// --------------------------------------------------

export const load: PageServerLoad = async ({ url }) => {
    const params = url.searchParams;

    const search = params.get('search')?.trim() ?? '';
    const dateFrom = parseDate(params.get('dateFrom'));
    const dateTo = parseDate(params.get('dateTo'));
    const sessionId = parsePositiveInteger(params.get('sessionId'));

    const requestedSort = params.get('sort') ?? 'playedAt';
    const sort: SortKey = isSortKey(requestedSort)
        ? requestedSort
        : 'playedAt';

    const requestedOrder = params.get('order');
    const order: SortOrder =
        requestedOrder === 'asc' || requestedOrder === 'desc'
            ? requestedOrder
            : sort === 'playedAt' || sort === 'sessionDate'
                ? 'desc'
                : 'asc';

    const requestedPage = Number(params.get('page') ?? '1');
    const pageSize = 50;

    // --------------------------------------------------
    // Filters
    // --------------------------------------------------

    const conditions = [];

    if (search) {
        const pattern = `%${search}%`;

        conditions.push(
            or(
                like(plays.artist, pattern),
                like(plays.title, pattern),
                like(plays.originalText, pattern)
            )
        );
    }

    if (dateFrom) {
        conditions.push(
            gte(plays.playedAt, `${dateFrom}T00:00:00`)
        );
    }

    if (dateTo) {
        // Exclusive upper bound includes the entire selected date.
        const nextDay = new Date(`${dateTo}T00:00:00.000Z`);
        nextDay.setUTCDate(nextDay.getUTCDate() + 1);

        conditions.push(
            lt(plays.playedAt, nextDay.toISOString().slice(0, 10))
        );
    }

    if (sessionId !== null) {
        conditions.push(eq(plays.sessionId, sessionId));
    }

    const filter = conditions.length
        ? and(...conditions)
        : undefined;

    // --------------------------------------------------
    // Pagination
    // --------------------------------------------------

    const [totalResult] = await db
        .select({ value: count() })
        .from(plays)
        .where(filter);

    const total = totalResult?.value ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const page = Number.isSafeInteger(requestedPage)
        ? Math.min(Math.max(1, requestedPage), totalPages)
        : 1;

    // --------------------------------------------------
    // Sorting
    // --------------------------------------------------

    const sortColumn = sortColumns[sort];
    const direction = order === 'desc' ? desc : asc;

    // --------------------------------------------------
    // Filtered playing history
    // --------------------------------------------------

    const recentPlays = await db
        .select({
            id: plays.id,
            playedAt: plays.playedAt,
            artist: plays.artist,
            title: plays.title,
            sessionId: plays.sessionId,
            sessionDate: sessions.sessionDate,
            position: plays.position
        })
        .from(plays)
        .innerJoin(
            sessions,
            eq(plays.sessionId, sessions.id)
        )
        .where(filter)
        .orderBy(
            direction(sortColumn),
            desc(plays.id)
        )
        .limit(pageSize)
        .offset((page - 1) * pageSize);

    // --------------------------------------------------
    // Global history statistics
    // --------------------------------------------------

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

    return {
        stats: {
            totalPlays: playStats?.totalPlays ?? 0,
            uniqueTracks: playStats?.uniqueTracks ?? 0,
            totalSessions: sessionStats?.totalSessions ?? 0
        },

        recentPlays,

        search,
        dateFrom,
        dateTo,
        sessionId,
        sort,
        order,

        page,
        pageSize,
        total,
        totalPages
    };
};
