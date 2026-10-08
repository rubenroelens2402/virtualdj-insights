
import { db } from '#lib/server/db/index.js';
import { tracks, plays, sessions } from '#lib/server/db/schema.js';
import { count, sql, desc, eq } from 'drizzle-orm';

export function getOverview() {
    // 1. Music library statistics
    const [library] = db
        .select({
            totalTracks: count(),
            playedTracks: sql<number>`
                count(case when ${tracks.playCount} > 0 then 1 end)
            `
        })
        .from(tracks)
        .all();

    // 2. History statistics
    const [history] = db
        .select({ totalPlays: count() })
        .from(plays)
        .all();

    const [sessionStats] = db
        .select({ totalSessions: count() })
        .from(sessions)
        .all();

    // 3. Monthly playing activity
    const month = sql<string>`substr(${plays.playedAt}, 1, 7)`;

    const monthlyActivity = db
        .select({
            month,
            total: count()
        })
        .from(plays)
        .groupBy(month)
        .orderBy(month)
        .all();

    // 4. Top artists from history
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

    // 5. Playing activity by hour (00:00–23:59)
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

    // 6. Recently recorded sessions
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
        monthlyActivity,
        topArtists,
        hourlyActivity,
        recentSessions
    };
}
