
<script lang="ts">
    import { goto } from '$app/navigation';
    import type { PageData } from './$types.js';

    let { data }: { data: PageData } = $props();

    let search = $state('');

    const formatNumber = new Intl.NumberFormat('en-BE');

    const cards = $derived([
        { label: 'Total tracks', value: data.stats.totalTracks },
        { label: 'Played tracks', value: data.stats.playedTracks },
        { label: 'Recorded plays', value: data.stats.totalPlays },
        { label: 'Average BPM', value: Math.round(data.stats.averageBpm ?? 0) }
    ]);

    $effect(() => {
        search = data.search ?? '';
    });

    function applySearch(event: SubmitEvent) {
        event.preventDefault();

        const params = new URLSearchParams();

        if (search.trim()) {
            params.set('search', search.trim());
        }

        goto(`/library${params.size ? `?${params.toString()}` : ''}`);
    }

    function navigateToPage(page: number) {
        if (page < 1 || page > data.totalPages) return;

        const params = new URLSearchParams();

        if (data.search) {
            params.set('search', data.search);
        }

        params.set('page', String(page));

        goto(`/library?${params.toString()}`);
    }

    function formatDuration(seconds: number | null) {
        if (seconds === null || !Number.isFinite(seconds)) return '-';

        const minutes = Math.floor(seconds / 60);
        const remainder = Math.floor(seconds % 60);

        return `${minutes}:${String(remainder).padStart(2, '0')}`;
    }
</script>

<svelte:head>
    <title>Music Library | VirtualDJ Insights</title>
</svelte:head>

<div class="flex h-full min-h-0 flex-col gap-3.5">

    <!-- Header -->
    <header class="flex shrink-0 items-center justify-between">
        <div>
            <h1 class="text-[23px] font-semibold tracking-tight text-slate-100">
                Music Library
            </h1>

            <p class="mt-0.5 text-xs text-slate-400">
                Explore your VirtualDJ collection
            </p>
        </div>
    </header>

    <!-- KPIs -->
    <div class="grid shrink-0 grid-cols-2 gap-3 xl:grid-cols-4">
        {#each cards as card}
            <div class="glass-card kpi-card">
                <p class="kpi-title">
                    {card.label}
                </p>

                <p class="kpi-value">
                    {formatNumber.format(card.value)}
                </p>
            </div>
        {/each}
    </div>

    <!-- Library panel -->
    <section class="overview-surface flex min-h-0 flex-1 flex-col p-4">

        <!-- Panel header -->
        <div class="mb-3 flex shrink-0 items-start justify-between gap-3">
            <div>
                <h2 class="panel-title">
                    Music library
                </h2>

                <p class="panel-description">
                    Browse and search your tracks
                </p>
            </div>

            <span class="shrink-0 text-[11px] text-slate-400">
                {formatNumber.format(data.total)} tracks
            </span>
        </div>

        <!-- Search -->
        <form onsubmit={applySearch} class="mb-3 flex shrink-0 gap-2" role="search">
            <input
                type="search"
                bind:value={search}
                aria-label="Search music library"
                placeholder="Search tracks, artists, filenames..."
                class="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/4 px-3 py-2 text-xs text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-sky-400/40"
            />

            <button
                type="submit"
                class="cursor-pointer rounded-lg border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-xs font-medium text-sky-300 transition-colors hover:bg-sky-400/15"
            >
                Search
            </button>
        </form>

        <!-- Scrollable table -->
        <div class="overview-scrollbar min-h-0 min-w-0 flex-1 overflow-auto rounded-lg border border-white/6">
            <table class="w-full min-w-185 border-separate border-spacing-0 text-left text-[12px]">

                <thead>
                    <tr class="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                        <th scope="col" class="sticky top-0 z-10 border-b border-white/8 bg-[#172235] px-3 py-3">
                            Artist
                        </th>

                        <th scope="col" class="sticky top-0 z-10 border-b border-white/8 bg-[#172235] px-3 py-3">
                            Track
                        </th>

                        <th scope="col" class="sticky top-0 z-10 border-b border-white/8 bg-[#172235] px-3 py-3">
                            Genre
                        </th>

                        <th scope="col" class="sticky top-0 z-10 border-b border-white/8 bg-[#172235] px-3 py-3">
                            BPM
                        </th>

                        <th scope="col" class="sticky top-0 z-10 border-b border-white/8 bg-[#172235] px-3 py-3">
                            Key
                        </th>

                        <th scope="col" class="sticky top-0 z-10 border-b border-white/8 bg-[#172235] px-3 py-3">
                            Duration
                        </th>

                        <th scope="col" class="sticky top-0 z-10 border-b border-white/8 bg-[#172235] px-3 py-3 text-right">
                            Plays
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {#each data.tracks as track (track.id)}
                        <tr class="transition-colors hover:bg-white/4">

                            <td class="max-w-56 border-b border-white/5 px-3 py-2.5 font-medium text-slate-200">
                                <span class="block truncate" title={track.artist ?? ''}>
                                    {track.artist ?? '-'}
                                </span>
                            </td>

                            <td class="max-w-72 border-b border-white/5 px-3 py-2.5 text-slate-100">
                                <span class="block truncate" title={track.title ?? ''}>
                                    {track.title ?? '-'}
                                </span>
                            </td>

                            <td class="max-w-40 border-b border-white/5 px-3 py-2.5 text-slate-400">
                                <span class="block truncate" title={track.genre ?? ''}>
                                    {track.genre ?? '-'}
                                </span>
                            </td>

                            <td class="border-b border-white/5 px-3 py-2.5 font-mono text-[11px] whitespace-nowrap text-slate-300">
                                {track.bpm?.toFixed(1) ?? '-'}
                            </td>

                            <td class="border-b border-white/5 px-3 py-2.5 whitespace-nowrap text-slate-300">
                                {track.musicalKey ?? '-'}
                            </td>

                            <td class="border-b border-white/5 px-3 py-2.5 font-mono text-[11px] whitespace-nowrap text-slate-400">
                                {formatDuration(track.durationSeconds)}
                            </td>

                            <td class="border-b border-white/5 px-3 py-2.5 text-right font-mono text-[11px] text-slate-300">
                                {track.playCount}
                            </td>

                        </tr>
                    {:else}
                        <tr>
                            <td colspan="7" class="px-4 py-12 text-center text-xs text-slate-400">
                                No tracks found. Try another search or synchronize your library.
                            </td>
                        </tr>
                    {/each}
                </tbody>

            </table>
        </div>

        <!-- Pagination -->
        <div class="mt-3 flex shrink-0 items-center justify-between gap-3">
            <p class="text-[11px] text-slate-400">
                {formatNumber.format(data.total)} matching tracks
                <span class="mx-1.5 text-slate-600">·</span>
                Page {data.page} of {data.totalPages}
            </p>

            <div class="flex gap-2">
                <button
                    type="button"
                    onclick={() => navigateToPage(data.page - 1)}
                    disabled={data.page <= 1}
                    class="cursor-pointer rounded-lg border border-white/10 bg-white/3 px-3 py-2 text-[11px] font-medium text-slate-300 transition-colors hover:bg-white/7 disabled:cursor-not-allowed disabled:opacity-30"
                >
                    Previous
                </button>

                <button
                    type="button"
                    onclick={() => navigateToPage(data.page + 1)}
                    disabled={data.page >= data.totalPages}
                    class="cursor-pointer rounded-lg border border-white/10 bg-white/3 px-3 py-2 text-[11px] font-medium text-slate-300 transition-colors hover:bg-white/7 disabled:cursor-not-allowed disabled:opacity-30"
                >
                    Next
                </button>
            </div>
        </div>

    </section>
</div>
