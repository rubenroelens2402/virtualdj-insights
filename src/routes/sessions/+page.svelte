
<script lang="ts">
    import { goto } from '$app/navigation';
    import type { PageData } from './$types.js';

    let { data }: { data: PageData } = $props();

    const formatNumber = new Intl.NumberFormat('en-BE');

    // --------------------------------------------------
    // Filters
    // --------------------------------------------------

    let dateFrom = $state('');
    let dateTo = $state('');
    let minTracks = $state('');
    let showFilters = $state(false);

    $effect(() => {
        dateFrom = data.dateFrom;
        dateTo = data.dateTo;
        minTracks = data.minTracks > 0
            ? String(data.minTracks)
            : '';
    });

    const activeFilterCount = $derived(
        Number(Boolean(data.dateFrom)) +
        Number(Boolean(data.dateTo)) +
        Number(data.minTracks > 0)
    );

    // --------------------------------------------------
    // KPIs
    // --------------------------------------------------

    const cards = $derived([
        { label: 'Total sessions', value: data.stats.totalSessions },
        { label: 'Total plays', value: data.stats.totalPlays },
        { label: 'Matched plays', value: data.stats.matchedPlays }
    ]);

    // --------------------------------------------------
    // Navigation
    // --------------------------------------------------

    function currentParams() {
        const params = new URLSearchParams();

        if (data.dateFrom) params.set('dateFrom', data.dateFrom);
        if (data.dateTo) params.set('dateTo', data.dateTo);

        if (data.minTracks > 0) {
            params.set('minTracks', String(data.minTracks));
        }

        params.set('sort', data.sort);
        params.set('order', data.order);

        return params;
    }

    function navigate(params: URLSearchParams) {
        const query = params.toString();

        void goto(`/sessions${query ? `?${query}` : ''}`, {
            reset: false
        });
    }

    function applyFilters(event: SubmitEvent) {
        event.preventDefault();

        const params = currentParams();

        const filters = {
            dateFrom,
            dateTo,
            minTracks: minTracks.trim()
        };

        for (const [key, value] of Object.entries(filters)) {
            if (value) {
                params.set(key, value);
            } else {
                params.delete(key);
            }
        }

        params.delete('page');
        navigate(params);
    }

    function clearFilters() {
        dateFrom = '';
        dateTo = '';
        minTracks = '';

        const params = new URLSearchParams();

        params.set('sort', data.sort);
        params.set('order', data.order);

        navigate(params);
    }

    function changeSort(value: string) {
        const params = currentParams();

        const [sort, order] = value.split(':');

        params.set('sort', sort);
        params.set('order', order);
        params.delete('page');

        navigate(params);
    }

    function navigateToPage(page: number) {
        if (page < 1 || page > data.totalPages) return;

        const params = currentParams();

        params.set('page', String(page));
        navigate(params);
    }

    // --------------------------------------------------
    // Formatters
    // --------------------------------------------------

    function formatDate(value: string) {
        const [year, month, day] = value.split('-');

        return `${day}/${month}/${year}`;
    }

    function formatTime(value: string | null) {
        return value ? value.slice(11, 16) : '-';
    }

    function formatDuration(
        start: string | null,
        end: string | null
    ) {
        if (!start || !end) return '-';

        const toMinutes = (value: string) => {
            const [date, time] = value.split('T');
            const [year, month, day] = date.split('-').map(Number);
            const [hour, minute] = time.split(':').map(Number);

            return Date.UTC(
                year, month - 1, day, hour, minute
            ) / 60000;
        };

        const minutes = toMinutes(end) - toMinutes(start);

        if (!Number.isFinite(minutes) || minutes < 0) {
            return '-';
        }

        const hours = Math.floor(minutes / 60);
        const remainder = minutes % 60;

        return hours > 0
            ? `${hours}h ${remainder}m`
            : `${remainder}m`;
    }

    function formatBpm(value: number | null) {
        return value === null ? '-' : value.toFixed(1);
    }
</script>

<svelte:head>
    <title>DJ Sessions | VirtualDJ Insights</title>
</svelte:head>

<div class="flex h-full min-h-0 flex-col gap-3.5">

    <!-- Header -->
    <header class="flex shrink-0 items-center justify-between">
        <div>
            <h1 class="text-[23px] font-semibold tracking-tight text-slate-100">
                DJ Sessions
            </h1>

            <p class="mt-0.5 text-xs text-slate-400">
                Explore your VirtualDJ mixing history
            </p>
        </div>
    </header>

    <!-- KPIs -->
    <div class="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-3">
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

    <!-- Sessions panel -->
    <section class="overview-surface flex min-h-0 flex-1 flex-col p-4">

        <!-- Panel header -->
        <div class="mb-3 flex shrink-0 items-start justify-between gap-3">
            <div>
                <h2 class="panel-title">
                    All sessions
                </h2>

                <p class="panel-description">
                    Browse and explore recorded DJ sessions
                </p>
            </div>

            <span class="shrink-0 text-[11px] text-slate-400">
                {formatNumber.format(data.total)} matching sessions
            </span>
        </div>

        <!-- Controls -->
        <div class="mb-3 flex shrink-0 flex-col gap-2">

            <div class="flex flex-wrap items-center justify-between gap-2">

                <!-- Sort -->
                <div class="flex min-w-0 items-center gap-2">
                    <span class="shrink-0 text-[11px] text-slate-400">
                        Sort by
                    </span>

                    <select
                        aria-label="Sort sessions"
                        value={`${data.sort}:${data.order}`}
                        onchange={event => changeSort(event.currentTarget.value)}
                        class="rounded-lg border border-white/10 bg-[#111b2d] px-3 py-2 text-xs text-slate-200 outline-none focus:border-sky-400/40"
                    >
                        <option value="date:desc">Newest first</option>
                        <option value="date:asc">Oldest first</option>
                        <option value="tracks:desc">Most tracks</option>
                        <option value="tracks:asc">Fewest tracks</option>
                        <option value="matched:desc">Most matched</option>
                        <option value="matched:asc">Fewest matched</option>
                        <option value="bpm:desc">Highest average BPM</option>
                        <option value="bpm:asc">Lowest average BPM</option>
                    </select>
                </div>

                <button
                    type="button"
                    onclick={() => showFilters = !showFilters}
                    aria-expanded={showFilters}
                    class="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/3 px-3 py-2 text-xs text-slate-300 transition-colors hover:bg-white/7"
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
                        <path d="M4 7h16" />
                        <path d="M7 12h10" />
                        <path d="M10 17h4" />
                    </svg>

                    Filters

                    {#if activeFilterCount > 0}
                        <span class="rounded-md bg-sky-400/10 px-1.5 text-[10px] text-sky-300">
                            {activeFilterCount}
                        </span>
                    {/if}
                </button>
            </div>

            {#if showFilters}
                <form
                    onsubmit={applyFilters}
                    class="grid grid-cols-2 items-end gap-2 rounded-lg border border-white/8 bg-white/2 p-3 xl:grid-cols-4"
                >
                    <label class="flex min-w-0 flex-col gap-1.5">
                        <span class="text-[10px] text-slate-400">
                            Session from
                        </span>

                        <input
                            type="date"
                            bind:value={dateFrom}
                            class="w-full min-w-0 rounded-lg border border-white/10 bg-[#111b2d] px-2.5 py-2 text-xs text-slate-200 outline-none focus:border-sky-400/40"
                        />
                    </label>

                    <label class="flex min-w-0 flex-col gap-1.5">
                        <span class="text-[10px] text-slate-400">
                            Session until
                        </span>

                        <input
                            type="date"
                            bind:value={dateTo}
                            class="w-full min-w-0 rounded-lg border border-white/10 bg-[#111b2d] px-2.5 py-2 text-xs text-slate-200 outline-none focus:border-sky-400/40"
                        />
                    </label>

                    <label class="flex min-w-0 flex-col gap-1.5">
                        <span class="text-[10px] text-slate-400">
                            Minimum tracks
                        </span>

                        <input
                            type="number"
                            min="0"
                            step="1"
                            bind:value={minTracks}
                            placeholder="Any"
                            class="w-full min-w-0 rounded-lg border border-white/10 bg-[#111b2d] px-2.5 py-2 text-xs text-slate-200 outline-none focus:border-sky-400/40"
                        />
                    </label>

                    <div class="flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onclick={clearFilters}
                            class="cursor-pointer text-[11px] text-slate-400 hover:text-white"
                        >
                            Clear
                        </button>

                        <button
                            type="submit"
                            class="cursor-pointer rounded-lg border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-xs font-medium text-sky-300 hover:bg-sky-400/15"
                        >
                            Apply
                        </button>
                    </div>
                </form>
            {/if}
        </div>

        <!-- Scrollable session list -->
        <div class="overview-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
            <div class="flex flex-col gap-2">

                {#each data.sessions as session (session.id)}
                    <a
                        href={`/sessions/${session.id}`}
                        class="group flex items-center justify-between gap-4 rounded-xl border border-white/7 bg-white/2 px-4 py-3 transition-colors hover:border-sky-400/15 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
                    >
                        <div class="flex min-w-0 items-center gap-3">

                            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-400/12 bg-sky-400/7 text-sky-300">
                                <svg
                                    width="19"
                                    height="19"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="1.7"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    aria-hidden="true"
                                >
                                    <path d="M9 18V5l12-2v13" />
                                    <circle cx="6" cy="18" r="3" />
                                    <circle cx="18" cy="16" r="3" />
                                </svg>
                            </div>

                            <div class="min-w-0">
                                <p class="text-[13px] font-semibold text-slate-200 group-hover:text-white">
                                    {formatDate(session.sessionDate)}
                                </p>

                                <p class="mt-1 text-[11px] text-slate-400">
                                    {formatTime(session.startedAt)}
                                    –
                                    {formatTime(session.endedAt)}

                                    <span class="mx-1 text-slate-600">·</span>

                                    {formatDuration(
                                        session.startedAt,
                                        session.endedAt
                                    )} span
                                </p>
                            </div>
                        </div>

                        <!-- Enrichment and activity -->
                        <div class="flex shrink-0 items-center gap-5">

                            <div class="hidden text-right sm:block">
                                <p class="text-[12px] font-semibold text-slate-300">
                                    {formatBpm(session.averageBpm)}
                                </p>

                                <p class="text-[10px] text-slate-500">
                                    avg BPM
                                </p>
                            </div>

                            <div class="hidden text-right md:block">
                                <p class="text-[12px] font-semibold text-slate-300">
                                    {session.matchedCount}/{session.trackCount}
                                </p>

                                <p class="text-[10px] text-slate-500">
                                    matched
                                </p>
                            </div>

                            <div class="text-right">
                                <p class="text-[13px] font-semibold text-slate-200">
                                    {session.trackCount}
                                </p>

                                <p class="text-[10px] text-slate-500">
                                    tracks
                                </p>
                            </div>

                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="1.8"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                class="text-slate-600 group-hover:text-sky-300"
                                aria-hidden="true"
                            >
                                <path d="m9 18 6-6-6-6" />
                            </svg>
                        </div>
                    </a>
                {:else}
                    <p class="py-12 text-center text-xs text-slate-400">
                        No sessions match the selected filters.
                    </p>
                {/each}

            </div>
        </div>

        <!-- Pagination -->
        <div class="mt-3 flex shrink-0 items-center justify-between gap-3 border-t border-white/7 pt-3">
            <p class="text-[11px] text-slate-400">
                {formatNumber.format(data.total)} matching sessions
                <span class="mx-1.5 text-slate-600">·</span>
                Page {data.page} of {data.totalPages}
            </p>

            <div class="flex gap-2">
                <button
                    type="button"
                    onclick={() => navigateToPage(data.page - 1)}
                    disabled={data.page <= 1}
                    class="cursor-pointer rounded-lg border border-white/10 bg-white/3 px-3 py-2 text-[11px] font-medium text-slate-300 hover:bg-white/7 disabled:cursor-not-allowed disabled:opacity-30"
                >
                    Previous
                </button>

                <button
                    type="button"
                    onclick={() => navigateToPage(data.page + 1)}
                    disabled={data.page >= data.totalPages}
                    class="cursor-pointer rounded-lg border border-white/10 bg-white/3 px-3 py-2 text-[11px] font-medium text-slate-300 hover:bg-white/7 disabled:cursor-not-allowed disabled:opacity-30"
                >
                    Next
                </button>
            </div>
        </div>

    </section>
</div>
