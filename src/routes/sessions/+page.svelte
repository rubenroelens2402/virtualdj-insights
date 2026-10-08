
<script lang="ts">
    import { goto } from '$app/navigation';
    import type { PageData } from './$types.js';

    let { data }: { data: PageData } = $props();

    const formatNumber = new Intl.NumberFormat('en-BE');

    const cards = $derived([
        { label: 'Total sessions', value: data.stats.totalSessions },
        { label: 'Total plays', value: data.stats.totalPlays }
    ]);

    function formatDate(value: string) {
        const [year, month, day] = value.split('-');
        return `${day}/${month}/${year}`;
    }

    function formatTime(value: string | null) {
        return value ? value.slice(11, 16) : '-';
    }

    function formatDuration(start: string | null, end: string | null) {
        if (!start || !end) return '-';

        // Span between the first and last recorded track starts.
        const toMinutes = (value: string) => {
            const [date, time] = value.split('T');
            const [year, month, day] = date.split('-').map(Number);
            const [hour, minute] = time.split(':').map(Number);

            return Date.UTC(year, month - 1, day, hour, minute) / 60000;
        };

        const minutes = toMinutes(end) - toMinutes(start);

        if (!Number.isFinite(minutes) || minutes < 0) return '-';

        const hours = Math.floor(minutes / 60);
        const remainder = minutes % 60;

        return hours > 0
            ? `${hours}h ${remainder}m`
            : `${remainder}m`;
    }

    function navigate(page: number) {
        if (page < 1 || page > data.totalPages) return;

        goto(`/sessions?page=${page}`);
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
    <div class="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2">
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
                    Your recorded mixing sessions, newest first
                </p>
            </div>

            <span class="shrink-0 text-[11px] text-slate-400">
                {formatNumber.format(data.stats.totalSessions)} sessions
            </span>
        </div>

        <!-- Scrollable session list -->
        <div class="overview-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
            <div class="flex flex-col gap-2">

                {#each data.sessions as session (session.id)}
                    <a
                        href={`/sessions/${session.id}`}
                        class="group flex items-center justify-between gap-4 rounded-xl border border-white/7 bg-white/2 px-4 py-3 transition-colors hover:border-sky-400/15 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
                    >
                        <!-- Session information -->
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
                                <p class="text-[13px] font-semibold text-slate-200 transition-colors group-hover:text-white">
                                    {formatDate(session.sessionDate)}
                                </p>

                                <p class="mt-1 text-[11px] text-slate-400">
                                    {formatTime(session.startedAt)}
                                    –
                                    {formatTime(session.endedAt)}

                                    <span class="mx-1 text-slate-600">·</span>

                                    {formatDuration(session.startedAt, session.endedAt)}
                                    span
                                </p>
                            </div>
                        </div>

                        <!-- Track count -->
                        <div class="flex shrink-0 items-center gap-4">
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
                                class="text-slate-600 transition-colors group-hover:text-sky-300"
                                aria-hidden="true"
                            >
                                <path d="m9 18 6-6-6-6" />
                            </svg>
                        </div>
                    </a>
                {:else}
                    <p class="py-12 text-center text-xs text-slate-400">
                        No sessions recorded. Import your VirtualDJ history first.
                    </p>
                {/each}

            </div>
        </div>

        <!-- Pagination -->
        <div class="mt-3 flex shrink-0 items-center justify-between gap-3 border-t border-white/7 pt-3">
            <p class="text-[11px] text-slate-400">
                Page {data.page} of {data.totalPages}
            </p>

            <div class="flex gap-2">
                <button
                    type="button"
                    onclick={() => navigate(data.page - 1)}
                    disabled={data.page <= 1}
                    class="cursor-pointer rounded-lg border border-white/10 bg-white/3 px-3 py-2 text-[11px] font-medium text-slate-300 transition-colors hover:bg-white/7 disabled:cursor-not-allowed disabled:opacity-30"
                >
                    Previous
                </button>

                <button
                    type="button"
                    onclick={() => navigate(data.page + 1)}
                    disabled={data.page >= data.totalPages}
                    class="cursor-pointer rounded-lg border border-white/10 bg-white/3 px-3 py-2 text-[11px] font-medium text-slate-300 transition-colors hover:bg-white/7 disabled:cursor-not-allowed disabled:opacity-30"
                >
                    Next
                </button>
            </div>
        </div>

    </section>
</div>
