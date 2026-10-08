
import { db } from '#lib/server/db/index.js';
import { tracks } from '#lib/server/db/schema.js';
import {
    and,
    count,
    like,
    or,
    asc,
    desc,
    eq,
    gt,
    gte,
    lte,
    isNull,
    sql
} from 'drizzle-orm';
import type { PageServerLoad } from './$types.js';

// --------------------------------------------------
// Sortable columns
// --------------------------------------------------

const sortColumns = {
    artist: tracks.artist,
    title: tracks.title,
    genre: tracks.genre,
    bpm: tracks.bpm,
    musicalKey: tracks.musicalKey,
    durationSeconds: tracks.durationSeconds,
    playCount: tracks.playCount,
    firstSeen: tracks.firstSeen,
    firstPlay: tracks.firstPlay,
    lastPlay: tracks.lastPlay
};

type SortKey = keyof typeof sortColumns;
type SortOrder = 'asc' | 'desc';
type PlayStatus = 'all' | 'played' | 'unplayed';

function isSortKey(value: string): value is SortKey {
    return value in sortColumns;
}

function parseOptionalNumber(value: string | null) {
    if (value === null || value.trim() === '') return null;

    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0
        ? parsed
        : null;
}

function parseDate(value: string | null) {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return null;
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    return !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
        ? date
        : null;
}

// --------------------------------------------------
// Library loader
// --------------------------------------------------

export const load: PageServerLoad = async ({ url }) => {
    const params = url.searchParams;

    const search = params.get('search')?.trim() ?? '';
    const genre = params.get('genre')?.trim() ?? '';
    const musicalKey = params.get('key')?.trim() ?? '';

    const bpmMin = parseOptionalNumber(params.get('bpmMin'));
    const bpmMax = parseOptionalNumber(params.get('bpmMax'));

    const requestedStatus = params.get('played') ?? 'all';
    const played: PlayStatus =
        requestedStatus === 'played' || requestedStatus === 'unplayed'
            ? requestedStatus
            : 'all';

    const lastPlayedFromInput = params.get('lastPlayedFrom') ?? '';
    const lastPlayedFrom = parseDate(lastPlayedFromInput);

    const requestedSort = params.get('sort') ?? 'artist';
    const sort: SortKey = isSortKey(requestedSort)
        ? requestedSort
        : 'artist';

    const requestedOrder = params.get('order');
    const order: SortOrder =
        requestedOrder === 'asc' || requestedOrder === 'desc'
            ? requestedOrder
            : sort === 'lastPlay' || sort === 'playCount'
                ? 'desc'
                : 'asc';

    const requestedPage = Number(params.get('page') ?? '1');
    const pageSize = 25;

    // --------------------------------------------------
    // Filters
    // --------------------------------------------------

    const conditions = [];

    if (search) {
        const pattern = `%${search}%`;

        conditions.push(
            or(
                like(tracks.title, pattern),
                like(tracks.artist, pattern),
                like(tracks.filePath, pattern),
                like(tracks.genre, pattern),
                like(tracks.remix, pattern)
            )
        );
    }

    if (genre) {
        conditions.push(
            like(tracks.genre, `%${genre}%`)
        );
    }

    if (musicalKey) {
        conditions.push(
            like(tracks.musicalKey, `%${musicalKey}%`)
        );
    }

    if (bpmMin !== null) {
        conditions.push(gte(tracks.bpm, bpmMin));
    }

    if (bpmMax !== null) {
        conditions.push(lte(tracks.bpm, bpmMax));
    }

    if (played === 'played') {
        conditions.push(gt(tracks.playCount, 0));
    }

    if (played === 'unplayed') {
        conditions.push(eq(tracks.playCount, 0));
    }

    if (lastPlayedFrom) {
        conditions.push(gte(tracks.lastPlay, lastPlayedFrom));
    }

    const filter = conditions.length > 0
        ? and(...conditions)
        : undefined;

    // --------------------------------------------------
    // Pagination
    // --------------------------------------------------

    const [totalResult] = await db
        .select({ value: count() })
        .from(tracks)
        .where(filter);

    const total = totalResult?.value ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const page = Number.isSafeInteger(requestedPage)
        ? Math.min(Math.max(1, requestedPage), totalPages)
        : 1;

    // --------------------------------------------------
    // Sorting
    // --------------------------------------------------

    const column = sortColumns[sort];
    const direction = order === 'desc' ? desc : asc;

    // --------------------------------------------------
    // Library data
    // --------------------------------------------------

    const library = await db
        .select({
            id: tracks.id,
            artist: tracks.artist,
            title: tracks.title,
            genre: tracks.genre,
            bpm: tracks.bpm,
            musicalKey: tracks.musicalKey,
            durationSeconds: tracks.durationSeconds,
            playCount: tracks.playCount,
            firstSeen: tracks.firstSeen,
            firstPlay: tracks.firstPlay,
            lastPlay: tracks.lastPlay
        })
        .from(tracks)
        .where(filter)
        .orderBy(
            direction(column),
            asc(tracks.id)
        )
        .limit(pageSize)
        .offset((page - 1) * pageSize);

    // --------------------------------------------------
    // Global library statistics
    // --------------------------------------------------

    const [stats] = await db
        .select({
            totalTracks: count(),
            playedTracks: sql<number>`
                count(case when ${tracks.playCount} > 0 then 1 end)
            `,
            averageBpm: sql<number | null>`
                avg(${tracks.bpm})
            `,
            totalPlays: sql<number>`
                coalesce(sum(${tracks.playCount}), 0)
            `
        })
        .from(tracks);

    return {
        tracks: library,
        stats,

        search,
        genre,
        musicalKey,
        bpmMin,
        bpmMax,
        played,
        lastPlayedFrom: lastPlayedFrom
            ? lastPlayedFromInput
            : '',

        sort,
        order,

        page,
        pageSize,
        total,
        totalPages
    };
};
