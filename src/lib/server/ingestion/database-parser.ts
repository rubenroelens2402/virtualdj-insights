
import { readFile } from 'node:fs/promises';
import { win32 } from 'node:path';
import { XMLParser } from 'fast-xml-parser';

export interface ParsedTrack {
    filePath: string;
    fileSize: number | null;
    title: string | null;
    artist: string | null;
    remix: string | null;
    genre: string | null;
    year: number | null;
    bpm: number | null;
    bpmRaw: number | null;
    musicalKey: string | null;
    durationSeconds: number | null;
    bitrate: number | null;
    firstSeen: Date | null;
    lastModified: Date | null;
    firstPlay: Date | null;
    lastPlay: Date | null;
    playCount: number;
}

type Attributes = Record<string, unknown>;

function stringOrNull(value: unknown): string | null {
    if (value === undefined || value === null) return null;

    const text = String(value).trim();
    return text || null;
}

function numberOrNull(value: unknown): number | null {
    if (value === undefined || value === null || value === '') {
        return null;
    }

    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

function timestampOrNull(value: unknown): Date | null {
    const seconds = numberOrNull(value);
    if (seconds === null || seconds <= 0) return null;

    const date = new Date(seconds * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
}

function getFilenameMetadata(filePath: string) {
    const filename = win32.parse(filePath).name;
    const separator = filename.indexOf(' - ');

    if (separator === -1) {
        return { artist: null, title: filename };
    }

    return {
        artist: filename.slice(0, separator).trim() || null,
        title: filename.slice(separator + 3).trim() || null
    };
}

function normalizeTrack(song: Attributes): ParsedTrack | null {
    const filePath = stringOrNull(song.FilePath);
    if (!filePath) return null;

    const tags = (song.Tags ?? {}) as Attributes;
    const infos = (song.Infos ?? {}) as Attributes;
    const scan = (song.Scan ?? {}) as Attributes;

    const filename = getFilenameMetadata(filePath);
    const bpmRaw = numberOrNull(scan.Bpm ?? tags.Bpm);

    return {
        filePath,
        fileSize: numberOrNull(song.FileSize),

        title: stringOrNull(tags.Title) ?? filename.title,
        artist: stringOrNull(tags.Author) ?? filename.artist,
        remix: stringOrNull(tags.Remix),
        genre: stringOrNull(tags.Genre),
        year: numberOrNull(tags.Year),

        bpmRaw,
        bpm: bpmRaw !== null && bpmRaw > 0
            ? 60 / bpmRaw
            : null,

        musicalKey:
            stringOrNull(scan.Key) ?? stringOrNull(tags.Key),

        durationSeconds: numberOrNull(infos.SongLength),
        bitrate: numberOrNull(infos.Bitrate),

        firstSeen: timestampOrNull(infos.FirstSeen),
        lastModified: timestampOrNull(infos.LastModified),
        firstPlay: timestampOrNull(infos.FirstPlay),
        lastPlay: timestampOrNull(infos.LastPlay),

        playCount: numberOrNull(infos.PlayCount) ?? 0
    };
}

export async function parseDatabase(
    filePath: string
): Promise<ParsedTrack[]> {
    const xml = await readFile(filePath, 'utf8');

    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '',
        parseAttributeValue: true
    });

    const document = parser.parse(xml);
    const songs = document.VirtualDJ_Database?.Song;

    if (songs === undefined) {
        throw new Error('No VirtualDJ song elements found');
    }

    const songList = Array.isArray(songs) ? songs : [songs];

    const results: ParsedTrack[] = [];

    for (const song of songList) {
        const track = normalizeTrack(song);

        if (track) {
            results.push(track);
        }
    }

    return results;
}
