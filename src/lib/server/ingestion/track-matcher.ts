
import { db } from '#lib/server/db/index.js';
import { plays, tracks } from '#lib/server/db/schema.js';
import { eq, isNull } from 'drizzle-orm';

// --------------------------------------------------
// Normalization
// --------------------------------------------------

function normalize(value: string | null | undefined) {
    return (value ?? '')
        .normalize('NFKC')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');
}

function matchKey(
    artist: string | null | undefined,
    title: string | null | undefined
) {
    const normalizedArtist = normalize(artist);
    const normalizedTitle = normalize(title);

    if (!normalizedArtist || !normalizedTitle) return null;

    return `${normalizedArtist}\u0000${normalizedTitle}`;
}

// --------------------------------------------------
// Track matching
// --------------------------------------------------

export async function matchHistoryToLibrary() {
    const library = await db
        .select({
            id: tracks.id,
            artist: tracks.artist,
            title: tracks.title
        })
        .from(tracks);

    const unmatchedPlays = await db
        .select({
            id: plays.id,
            artist: plays.artist,
            title: plays.title
        })
        .from(plays)
        .where(isNull(plays.trackId));

    // A null ID marks an ambiguous artist/title pair.
    const lookup = new Map<string, number | null>();

    for (const track of library) {
        const key = matchKey(track.artist, track.title);

        if (!key) continue;

        if (lookup.has(key)) {
            lookup.set(key, null);
        } else {
            lookup.set(key, track.id);
        }
    }

    let matched = 0;
    let ambiguous = 0;
    let unmatched = 0;

    for (const play of unmatchedPlays) {
        const key = matchKey(play.artist, play.title);

        if (!key || !lookup.has(key)) {
            unmatched++;
            continue;
        }

        const trackId = lookup.get(key);

        if (trackId == null) {
            ambiguous++;
            continue;
        }

        await db
            .update(plays)
            .set({ trackId })
            .where(
                eq(plays.id, play.id)
            );

        matched++;
    }

    return {
        libraryTracks: library.length,
        checked: unmatchedPlays.length,
        matched,
        ambiguous,
        unmatched
    };
}
