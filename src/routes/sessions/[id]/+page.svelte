
<script lang="ts">
    import type { PageData } from './$types.js';

    let { data }: { data: PageData } = $props();

    const formatNumber = new Intl.NumberFormat('en-BE');

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
            value: data.stats.averageBpm === null
                ? '-'
                : data.stats.averageBpm.toFixed(1)
        }
    ]);

    function formatTime(value: string | null) {
        return value ? value.slice(11, 16) : '-';
    }

    function formatDate(value: string) {
        const [year, month, day] = value.split('-');
        return `${day}/${month}/${year}`;
    }
</script>

<svelte:head>
    <title>
        DJ Session {formatDate(data.session.sessionDate)} | VirtualDJ Insights
    </title>

    <meta
        name="description"
        content="Explore recorded tracks and statistics for a VirtualDJ session."
    />
</svelte:head>

<div class="flex h-full min-h-0 flex-col gap-3.5">

    <!-- Navigation and page heading -->
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
                    Tracks played during this session, in chronological order
                </p>
            </div>

            <span class="shrink-0 text-[11px] text-slate-400">
                {formatNumber.format(data.tracklist.length)} recorded plays
            </span>
        </div>

        <!-- Scrollable table -->
        <div class="overview-scrollbar min-h-0 min-w-0 flex-1 overflow-auto rounded-lg border border-white/6">

            <table class="w-full min-w-145 border-separate border-spacing-0 text-left text-[12px]">

                <thead>
                    <tr class="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">

                        <th
                            scope="col"
                            class="sticky top-0 z-10 w-12 border-b border-white/8 bg-[#172235] px-3 py-3"
                        >
                            #
                        </th>

                        <th
                            scope="col"
                            class="sticky top-0 z-10 w-20 border-b border-white/8 bg-[#172235] px-3 py-3"
                        >
                            Time
                        </th>

                        <th
                            scope="col"
                            class="sticky top-0 z-10 w-[28%] border-b border-white/8 bg-[#172235] px-3 py-3"
                        >
                            Artist
                        </th>

                        <th
                            scope="col"
                            class="sticky top-0 z-10 border-b border-white/8 bg-[#172235] px-3 py-3"
                        >
                            Track
                        </th>

                        <th
                            scope="col"
                            class="sticky top-0 z-10 w-20 border-b border-white/8 bg-[#172235] px-3 py-3"
                        >
                            BPM
                        </th>

                        <th
                            scope="col"
                            class="sticky top-0 z-10 w-20 border-b border-white/8 bg-[#172235] px-3 py-3"
                        >
                            Key
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {#each data.tracklist as track (track.id)}
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
                            <td class="max-w-64 border-b border-white/5 px-3 py-2.5 text-slate-300">
                                <span
                                    class="block truncate"
                                    title={track.artist ?? ''}
                                >
                                    {track.artist ?? 'Unknown'}
                                </span>
                            </td>

                            <!-- Track title -->
                            <td class="max-w-80 border-b border-white/5 px-3 py-2.5 font-medium text-slate-100">
                                <span
                                    class="block truncate"
                                    title={track.title ?? ''}
                                >
                                    {track.title ?? 'Unknown track'}
                                </span>
                            </td>

                            <!-- BPM -->
                            <td class="border-b border-white/5 px-3 py-2.5 font-mono text-[11px] whitespace-nowrap text-slate-300">
                                {track.bpm?.toFixed(1) ?? '-'}
                            </td>

                            <!-- Musical key -->
                            <td class="border-b border-white/5 px-3 py-2.5 whitespace-nowrap text-slate-300">
                                {track.musicalKey ?? '-'}
                            </td>

                        </tr>
                    {:else}
                        <tr>
                            <td
                                colspan="6"
                                class="px-4 py-12 text-center text-xs text-slate-400"
                            >
                                This session has no recorded tracks.
                            </td>
                        </tr>
                    {/each}
                </tbody>

            </table>
        </div>

    </section>

</div>
