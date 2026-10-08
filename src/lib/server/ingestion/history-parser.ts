
import { readFile } from 'node:fs/promises';

export interface ParsedPlay {
    position: number;
    playedAt: string;
    artist: string | null;
    title: string;
    originalText: string;
}

export interface ParsedSession {
    sessionDate: string;
    sourcePosition: number;
    startedAt: string | null;
    endedAt: string | null;
    plays: ParsedPlay[];
}

function localTimestamp(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0');

    return [
        date.getFullYear(),
        '-',
        pad(date.getMonth() + 1),
        '-',
        pad(date.getDate()),
        'T',
        pad(date.getHours()),
        ':',
        pad(date.getMinutes()),
        ':00'
    ].join('');
}

function parseHeaderDate(value: string): Date {
    const [year, month, day] = value.split('/').map(Number);
    return new Date(year, month - 1, day);
}

function parseArtistAndTitle(value: string) {
    const separator = value.indexOf(' - ');

    if (separator === -1) {
        return { artist: null, title: value.trim() };
    }

    return {
        artist: value.slice(0, separator).trim() || null,
        title: value.slice(separator + 3).trim()
    };
}

export function parseHistory(content: string): ParsedSession[] {
    const sessions: ParsedSession[] = [];
    const lines = content.split(/\r?\n/);

    let current: ParsedSession | null = null;
    let currentDate: Date | null = null;
    let lastMinute: number | null = null;

    for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
        const line = lines[lineNumber].trim();

        const header = line.match(
            /^VirtualDJ History (\d{4}\/\d{2}\/\d{2})$/
        );

        if (header) {
            currentDate = parseHeaderDate(header[1]);
            lastMinute = null;

            current = {
                sessionDate: header[1].replaceAll('/', '-'),
                sourcePosition: lineNumber,
                startedAt: null,
                endedAt: null,
                plays: []
            };

            sessions.push(current);
            continue;
        }

        if (!current || !currentDate) continue;

        const match = line.match(/^(\d{2}):(\d{2}) : (.*)$/);
        if (!match) continue;

        const hours = Number(match[1]);
        const minutes = Number(match[2]);

        if (hours > 23 || minutes > 59) continue;

        const minuteOfDay = hours * 60 + minutes;

        // Example: 23:58 followed by 00:00
        if (lastMinute !== null && minuteOfDay < lastMinute) {
            currentDate.setDate(currentDate.getDate() + 1);
        }

        lastMinute = minuteOfDay;

        const playedDate = new Date(currentDate);
        playedDate.setHours(hours, minutes, 0, 0);

        const playedAt = localTimestamp(playedDate);
        const originalText = match[3];
        const metadata = parseArtistAndTitle(originalText);

        if (!metadata.title) continue;

        current.plays.push({
            position: current.plays.length,
            playedAt,
            artist: metadata.artist,
            title: metadata.title,
            originalText
        });

        current.startedAt ??= playedAt;
        current.endedAt = playedAt;
    }

    return sessions;
}

export async function parseHistoryFile(path: string) {
    const content = await readFile(path, 'utf8');
    return parseHistory(content);
}
