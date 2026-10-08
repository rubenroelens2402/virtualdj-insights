
import { db } from '#lib/server/db/index.js';
import { sessions, plays, tracks } from '#lib/server/db/schema.js';
import {
    and,
    asc,
    count,
    desc,
    eq,
    gte,
    lte,
    sql
} from 'drizzle-orm';
import type { PageServerLoad } from './$types.js';

type SortKey = 'date' | 'tracks' | 'matched' | 'bpm';
type SortOrder = 'asc' | 'desc';

function parseDate(value: string | null) {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';

    const date = new Date(`${value}T00:00:00.000Z`);

    return !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
        ? value
        : '';
}

export const load: PageServerLoad = async ({ url }) => {
    const params = url.searchParams;

    const dateFrom = parseDate(params.get('dateFrom'));
    const dateTo = parseDate(params.get('dateTo'));

    const requestedMinTracks = Number(params.get('minTracks') ?? '0');
    const minTracks = Number.isSafeInteger(requestedMinTracks)
        ? Math.max(0, requestedMinTracks)
        : 0;

    const allowedSorts: SortKey[] = ['date', 'tracks', 'matched', 'bpm'];
    const requestedSort = params.get('sort') as SortKey;

    const sort: SortKey = allowedSorts.includes(requestedSort)
        ? requestedSort
        : 'date';

    const order: SortOrder = params.get('order') === 'asc'
        ? 'asc'
        : 'desc';

    const requestedPage = Number(params.get('page') ?? '1');
    const pageSize = 20;

    // --------------------------------------------------
    // Aggregate plays and enriched library metadata
    // --------------------------------------------------

    const sessionActivity = db
        .select({
            sessionId: plays.sessionId,

            trackCount: count(plays.id).as('track_count'),

            matchedCount: sql<number>`
                count(${tracks.id})
            `.as('matched_count'),

            averageBpm: sql<number | null>`
                avg(${tracks.bpm})
            `.as('average_bpm')
        })
        .from(plays)
        .leftJoin(tracks, eq(plays.trackId, tracks.id))
        .groupBy(plays.sessionId)
        .as('session_activity');

    const trackCount = sql<number>`
        coalesce(${sessionActivity.trackCount}, 0)
    `;

    const matchedCount = sql<number>`
        coalesce(${sessionActivity.matchedCount}, 0)
    `;

    // --------------------------------------------------
    // Filters
    // --------------------------------------------------

    const conditions = [];

    if (dateFrom) {
        conditions.push(gte(sessions.sessionDate, dateFrom));
    }

    if (dateTo) {
        conditions.push(lte(sessions.sessionDate, dateTo));
    }

    if (minTracks > 0) {
        conditions.push(gte(trackCount, minTracks));
    }

    const filter = conditions.length
        ? and(...conditions)
        : undefined;

    // --------------------------------------------------
    // Sorting
    // --------------------------------------------------

    const sortColumns = {
        date: sessions.sessionDate,
        tracks: trackCount,
        matched: matchedCount,
        bpm: sessionActivity.averageBpm
    };

    const sortColumn = sortColumns[sort];
    const direction = order === 'asc' ? asc : desc;

    // --------------------------------------------------
    // Filtered count and pagination
    // --------------------------------------------------

    const [totalResult] = await db
        .select({ value: count() })
        .from(sessions)
        .leftJoin(
            sessionActivity,
            eq(sessions.id, sessionActivity.sessionId)
        )
        .where(filter);

    const total = totalResult?.value ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const page = Number.isSafeInteger(requestedPage)
        ? Math.min(Math.max(1, requestedPage), totalPages)
        : 1;

    // --------------------------------------------------
    // Session list
    // --------------------------------------------------

    const rows = await db
        .select({
            id: sessions.id,
            sessionDate: sessions.sessionDate,
            startedAt: sessions.startedAt,
            endedAt: sessions.endedAt,
            trackCount,
            matchedCount,
            averageBpm: sessionActivity.averageBpm
        })
        .from(sessions)
        .leftJoin(
            sessionActivity,
            eq(sessions.id, sessionActivity.sessionId)
        )
        .where(filter)
        .orderBy(
            direction(sortColumn),
            desc(sessions.id)
        )
        .limit(pageSize)
        .offset((page - 1) * pageSize);

    // --------------------------------------------------
    // Global statistics
    // --------------------------------------------------

    const [sessionStats] = await db
        .select({ value: count() })
        .from(sessions);

    const [playStats] = await db
        .select({
            totalPlays: count(),
            matchedPlays: sql<number>`
                count(${plays.trackId})
            `
        })
        .from(plays);

    return {
        sessions: rows,

        stats: {
            totalSessions: sessionStats?.value ?? 0,
            totalPlays: playStats?.totalPlays ?? 0,
            matchedPlays: playStats?.matchedPlays ?? 0
        },

        dateFrom,
        dateTo,
        minTracks,
        sort,
        order,

        page,
        pageSize,
        total,
        totalPages
    };
};
