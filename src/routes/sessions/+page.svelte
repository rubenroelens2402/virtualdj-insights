
<script lang="ts">
    import { goto } from '$app/navigation';
    import type { PageData } from './$types.js';

    let { data }: { data: PageData } = $props();

    function formatDate(value: string) {
        const [year, month, day] = value.split('-');

        return `${day}/${month}/${year}`;
    }

    function formatTime(value: string | null) {
        return value ? value.slice(11, 16) : '-';
    }

    function formatDuration(start: string | null, end: string | null) {
        if (!start || !end) return '-';

        // These strings contain local wall-clock timestamps.
        const toMinutes = (value: string) => {
            const [date, time] = value.split('T');
            const [year, month, day] = date.split('-').map(Number);
            const [hour, minute] = time.split(':').map(Number);

            return Date.UTC(year, month - 1, day, hour, minute) / 60000;
        };

        const minutes = toMinutes(end) - toMinutes(start);
        if (minutes < 0) return '-';

        const hours = Math.floor(minutes / 60);
        const remainder = minutes % 60;

        return hours > 0
            ? `${hours}h ${remainder}m`
            : `${remainder}m`;
    }

    function navigate(page: number) {
        goto(`/sessions?page=${page}`);
    }
</script>

<div class="space-y-8">
    <header>
        <h1 class="text-3xl font-semibold">DJ Sessions</h1>
        <p class="mt-2 text-slate-400">
            Explore your VirtualDJ mixing history
        </p>
    </header>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
            <p class="text-sm text-slate-400">Total Sessions</p>
            <p class="mt-2 text-3xl font-semibold">
                {data.stats.totalSessions.toLocaleString()}
            </p>
        </div>

        <div class="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
            <p class="text-sm text-slate-400">Total Plays</p>
            <p class="mt-2 text-3xl font-semibold">
                {data.stats.totalPlays.toLocaleString()}
            </p>
        </div>
    </div>

    <section class="overflow-hidden rounded-xl border border-slate-800">
        <div class="border-b border-slate-800 p-5">
            <h2 class="font-semibold">All Sessions</h2>
        </div>

        <div class="divide-y divide-slate-800">
            {#each data.sessions as session (session.id)}
                <a
                    href={`/sessions/${session.id}`}
                    class="flex items-center justify-between gap-4 p-5 transition hover:bg-slate-800/40"
                >
                    <div class="flex items-center gap-4">
                        <div class="rounded-xl bg-slate-800 p-3 text-xl">
                            ♫
                        </div>

                        <div>
                            <p class="font-medium">
                                {formatDate(session.sessionDate)}
                            </p>
                            <p class="mt-1 text-sm text-slate-400">
                                {formatTime(session.startedAt)}
                                –
                                {formatTime(session.endedAt)}
                            </p>
                        </div>
                    </div>

                    <div class="text-right">
                        <p class="font-medium">
                            {session.trackCount} tracks
                        </p>

                        <p class="mt-1 text-xs text-slate-400">
                            {formatDuration(session.startedAt, session.endedAt)}
                            span
                        </p>
                    </div>
                </a>
            {:else}
                <p class="p-10 text-center text-slate-400">
                    No sessions found. Import your VirtualDJ history first.
                </p>
            {/each}
        </div>
    </section>

    <div class="flex items-center justify-between">
        <span class="text-sm text-slate-400">
            Page {data.page} of {data.totalPages}
        </span>

        <div class="flex gap-2">
            <button
                onclick={() => navigate(data.page - 1)}
                disabled={data.page <= 1}
                class="rounded-lg border border-slate-700 px-4 py-2 disabled:opacity-30"
            >
                Previous
            </button>

            <button
                onclick={() => navigate(data.page + 1)}
                disabled={data.page >= data.totalPages}
                class="rounded-lg border border-slate-700 px-4 py-2 disabled:opacity-30"
            >
                Next
            </button>
        </div>
    </div>
</div>
