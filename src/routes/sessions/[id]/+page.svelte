
<script lang="ts">
    import type { PageData } from './$types.js';

    let { data }: { data: PageData } = $props();

    const formatNumber = new Intl.NumberFormat('en-BE');

    // --------------------------------------------------
    // KPI cards
    // --------------------------------------------------

    const cards = $derived([
        {
            label: 'Tracks played',
            value: formatNumber.format(data.stats.totalTracks)
        },
        {
            label: 'Unique artists',
            value: formatNumber.format(data.stats.uniqueArtists)
        },
        {
            label: 'Library matches',
            value: formatNumber.format(data.stats.matchedTracks)
        },
        {
            label: 'Average BPM',
            value: data.stats.averageBpm == null
                ? '-'
                : Number(data.stats.averageBpm).toFixed(1)
        }
    ]);

    // --------------------------------------------------
    // Sorting
    // --------------------------------------------------

    type SortKey =
        | 'position'
        | 'playedAt'
        | 'artist'
        | 'title'
        | 'bpm'
        | 'musicalKey'
        | 'genre'
        | 'matched';

    type SortOrder = 'asc' | 'desc';

    let sort = $state<SortKey>('position');
    let order = $state<SortOrder>('asc');

    const columns: {
        label: string;
        key: SortKey;
    }[] = [
        { label: '#', key: 'position' },
        { label: 'Time', key: 'playedAt' },
        { label: 'Artist', key: 'artist' },
        { label: 'Track', key: 'title' },
        { label: 'BPM', key: 'bpm' },
        { label: 'Key', key: 'musicalKey' },
        { label: 'Genre', key: 'genre' },
        { label: 'Matched', key: 'matched' }
    ];

    const sortedTracklist = $derived.by(() => {
        const rows = [...data.tracklist];

        const compareText = (
            a: string | null,
            b: string | null
        ) => (a ?? '').localeCompare(b ?? '', undefined, {
            sensitivity: 'base'
        });

        const compareNumbers = (
            a: number | null,
            b: number | null
        ) => (a ?? -1) - (b ?? -1);

        rows.sort((a, b) => {
            let result = 0;

            switch (sort) {
                case 'position':
                    result = a.position - b.position;
                    break;

                case 'playedAt':
                    result = compareText(a.playedAt, b.playedAt);
                    break;

                case 'artist':
                    result = compareText(a.artist, b.artist);
                    break;

                case 'title':
                    result = compareText(a.title, b.title);
                    break;

                case 'bpm':
                    result = compareNumbers(a.bpm, b.bpm);
                    break;

                case 'musicalKey':
                    result = compareText(a.musicalKey, b.musicalKey);
                    break;

                case 'genre':
                    result = compareText(a.genre, b.genre);
                    break;

                case 'matched':
                    result = Number(a.trackId !== null) -
                        Number(b.trackId !== null);
                    break;
            }

            return (order === 'asc' ? result : -result) ||
                a.position - b.position;
        });

        return rows;
    });

    function sortBy(column: SortKey) {
        if (sort === column) {
            order = order === 'asc' ? 'desc' : 'asc';
        } else {
            sort = column;
            order = column === 'bpm' || column === 'matched'
                ? 'desc'
                : 'asc';
        }
    }

    // --------------------------------------------------
    // Formatters
    // --------------------------------------------------

    function formatTime(value: string | null) {
        return value ? value.slice(11, 16) : '-';
    }

    function formatDate(value: string) {
        const [year, month, day] = value.split('-');

        return `${day}/${month}/${year}`;
    }

    function formatBpm(value: number | null) {
        return value == null ? '-' : Number(value).toFixed(1);
    }

    const matchingPercentage = $derived(
        data.stats.totalTracks > 0
            ? Math.round(
                data.stats.matchedTracks /
                data.stats.totalTracks * 100
            )
            : 0
    );
</script>

<svelte:head>
    <title>
        DJ Session {formatDate(data.session.sessionDate)} | VirtualDJ Insights
    </title>
</svelte:head>

<div class="flex h-full min-h-0 flex-col gap-3.5">

    <!-- Navigation and header -->
    <header class="flex shrink-0 items-center justify-between gap-4">

        <div class="min-w-0">
            <h1 class="text-[23px] font-semibold tracking-tight text-slate-100">
                {formatDate(data.session.sessionDate)}
            </h1>

            <p class="mt-0.5 text-xs text-slate-400">
                DJ Session

                <span class="mx-1.5 text-slate-600">·</span>

                {formatTime(data.session.startedAt)}
                –
                {formatTime(data.session.endedAt)}
            </p>
        </div>

        <a
            href="/sessions"
            class="inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/10 bg-white/3 px-3 py-2 text-[11px] font-medium text-slate-300 transition-colors hover:border-white/15 hover:bg-white/7 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
        >
            <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
            >
                <path d="m15 18-6-6 6-6" />
            </svg>

            Back to sessions
        </a>

    </header>

    <!-- KPI cards -->
    <div class="grid shrink-0 grid-cols-2 gap-3 xl:grid-cols-4">
        {#each cards as card}
            <div class="glass-card kpi-card">
                <p class="kpi-title">
                    {card.label}
                </p>

                <p class="kpi-value">
                    {card.value}
                </p>
            </div>
        {/each}
    </div>

    <!-- Tracklist panel -->
    <section class="overview-surface flex min-h-0 flex-1 flex-col p-4">

        <!-- Panel header -->
        <div class="mb-3 flex shrink-0 items-start justify-between gap-3">

            <div>
                <h2 class="panel-title">
                    Session tracklist
                </h2>

                <p class="panel-description">
                    Tracks played during this session
                </p>
            </div>

            <div class="shrink-0 text-right">

                <p class="text-[11px] text-slate-400">
                    {formatNumber.format(data.tracklist.length)} recorded plays
                </p>

                <p class="mt-0.5 text-[10px] text-slate-500">
                    {matchingPercentage}% library matched
                </p>

            </div>
        </div>

        <!-- Scrollable tracklist -->
        <div class="overview-scrollbar min-h-0 min-w-0 flex-1 overflow-auto rounded-lg border border-white/6">

            <table class="w-full min-w-210 border-separate border-spacing-0 text-left text-[12px]">

                <!-- Sortable headers -->
                <thead>
                    <tr>
                        {#each columns as column}
                            <th
                                scope="col"
                                aria-sort={sort === column.key
                                    ? order === 'asc' ? 'ascending' : 'descending'
                                    : 'none'}
                                class="sticky top-0 z-10 border-b border-white/8 bg-[#172235] p-0"
                            >
                                <button
                                    type="button"
                                    onclick={() => sortBy(column.key)}
                                    class="flex w-full cursor-pointer items-center gap-1.5 px-3 py-3 text-left text-[10px] font-semibold tracking-wide whitespace-nowrap uppercase transition-colors hover:text-sky-300"
                                    class:text-sky-300={sort === column.key}
                                    class:text-slate-400={sort !== column.key}
                                >
                                    {column.label}

                                    {#if sort === column.key}
                                        <span aria-hidden="true">
                                            {order === 'asc' ? '↑' : '↓'}
                                        </span>
                                    {:else}
                                        <span aria-hidden="true" class="text-slate-600">
                                            ↕
                                        </span>
                                    {/if}
                                </button>
                            </th>
                        {/each}
                    </tr>
                </thead>

                <!-- Track data -->
                <tbody>
                    {#each sortedTracklist as track (track.id)}
                        <tr class="transition-colors hover:bg-white/4">

                            <!-- Position -->
                            <td class="border-b border-white/5 px-3 py-2.5 font-mono text-[11px] text-slate-500">
                                {track.position + 1}
                            </td>

                            <!-- Played time -->
                            <td class="border-b border-white/5 px-3 py-2.5 font-mono text-[11px] whitespace-nowrap text-slate-400">
                                {formatTime(track.playedAt)}
                            </td>

                            <!-- Artist -->
                            <td class="max-w-52 border-b border-white/5 px-3 py-2.5 text-slate-300">
                                <span class="block truncate" title={track.artist ?? ''}>
                                    {track.artist ?? 'Unknown'}
                                </span>
                            </td>

                            <!-- Track -->
                            <td class="max-w-72 border-b border-white/5 px-3 py-2.5 font-medium text-slate-100">
                                <span class="block truncate" title={track.title}>
                                    {track.title}
                                </span>
                            </td>

                            <!-- BPM -->
                            <td class="border-b border-white/5 px-3 py-2.5 font-mono text-[11px] whitespace-nowrap text-slate-300">
                                {formatBpm(track.bpm)}
                            </td>

                            <!-- Musical key -->
                            <td class="border-b border-white/5 px-3 py-2.5 whitespace-nowrap text-slate-300">
                                {track.musicalKey ?? '-'}
                            </td>

                            <!-- Genre -->
                            <td class="max-w-40 border-b border-white/5 px-3 py-2.5 text-slate-400">
                                <span class="block truncate" title={track.genre ?? ''}>
                                    {track.genre ?? '-'}
                                </span>
                            </td>

                            <!-- Library match -->
                            <td class="border-b border-white/5 px-3 py-2.5">
                                {#if track.trackId !== null}
                                    <span class="inline-flex items-center gap-1.5 text-[11px] text-emerald-300">
                                        <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                                        Matched
                                    </span>
                                {:else}
                                    <span class="text-[11px] text-slate-500">
                                        Unmatched
                                    </span>
                                {/if}
                            </td>

                        </tr>
                    {:else}
                        <tr>
                            <td colspan="8" class="px-4 py-12 text-center text-xs text-slate-400">
                                This session has no recorded tracks.
                            </td>
                        </tr>
                    {/each}
                </tbody>

            </table>
        </div>

    </section>
</div>
