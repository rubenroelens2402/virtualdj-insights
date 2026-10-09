
import { db } from '#lib/server/db/index.js';
import { tracks, plays, sessions } from '#lib/server/db/schema.js';
import { count, sql, desc, eq } from 'drizzle-orm';

export function getOverview() {
    // --------------------------------------------------
    // Library statistics
    // --------------------------------------------------

    const [library] = db
        .select({
            totalTracks: count(),
            playedTracks: sql<number>`
                count(case when ${tracks.playCount} > 0 then 1 end)
            `
        })
        .from(tracks)
        .all();

    // --------------------------------------------------
    // History and session statistics
    // --------------------------------------------------

    const [history] = db
        .select({ totalPlays: count() })
        .from(plays)
        .all();

    const [sessionStats] = db
        .select({ totalSessions: count() })
        .from(sessions)
        .all();

    // --------------------------------------------------
    // Daily activity for calendar heatmap
    // --------------------------------------------------

    const day = sql<string>`substr(${plays.playedAt}, 1, 10)`;

    const dailyActivity = db
        .select({
            date: day,
            total: count()
        })
        .from(plays)
        .groupBy(day)
        .orderBy(day)
        .all();

    // --------------------------------------------------
    // Top artists
    // --------------------------------------------------

    const topArtists = db
        .select({
            artist: plays.artist,
            total: count()
        })
        .from(plays)
        .where(sql`
            ${plays.artist} is not null
            and trim(${plays.artist}) <> ''
        `)
        .groupBy(plays.artist)
        .orderBy(desc(count()))
        .limit(10)
        .all();

    // --------------------------------------------------
    // Playing activity by hour
    // --------------------------------------------------

    const hour = sql<number>`
        cast(substr(${plays.playedAt}, 12, 2) as integer)
    `;

    const hourlyActivity = db
        .select({
            hour,
            total: count()
        })
        .from(plays)
        .groupBy(hour)
        .orderBy(hour)
        .all();

    // --------------------------------------------------
    // Recent sessions
    // --------------------------------------------------

    const recentSessions = db
        .select({
            id: sessions.id,
            sessionDate: sessions.sessionDate,
            startedAt: sessions.startedAt,
            trackCount: count(plays.id)
        })
        .from(sessions)
        .leftJoin(plays, eq(plays.sessionId, sessions.id))
        .groupBy(sessions.id)
        .orderBy(desc(sessions.startedAt), desc(sessions.id))
        .limit(5)
        .all();

    return {
        kpis: {
            totalTracks: library?.totalTracks ?? 0,
            playedTracks: library?.playedTracks ?? 0,
            totalPlays: history?.totalPlays ?? 0,
            totalSessions: sessionStats?.totalSessions ?? 0
        },
        dailyActivity,
        topArtists,
        hourlyActivity,
        recentSessions
    };
}
