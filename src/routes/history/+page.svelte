
<script lang="ts">
    import type { PageData } from './$types.js';

    let { data }: { data: PageData } = $props();

    const formatNumber = new Intl.NumberFormat('en-BE');

    const cards = $derived([
        { label: 'Total plays', value: data.stats.totalPlays },
        { label: 'Unique track labels', value: data.stats.uniqueTracks },
        { label: 'DJ sessions', value: data.stats.totalSessions }
    ]);

    function formatPlayedAt(value: string) {
        return value.replace('T', ' ').slice(0, 16);
    }
</script>

<svelte:head>
    <title>Playing History | VirtualDJ Insights</title>
</svelte:head>

<div class="flex h-full min-h-0 flex-col gap-3.5">

    <!-- Header -->
    <header class="flex shrink-0 items-center justify-between">
        <div>
            <h1 class="text-[23px] font-semibold tracking-tight text-slate-100">
                Playing History
            </h1>

            <p class="mt-0.5 text-xs text-slate-400">
                Explore your recorded VirtualDJ activity
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

    <!-- History panel -->
    <section class="overview-surface flex min-h-0 flex-1 flex-col p-4">

        <!-- Panel header -->
        <div class="mb-3 flex shrink-0 items-start justify-between gap-3">
            <div>
                <h2 class="panel-title">
                    Recent plays
                </h2>

                <p class="panel-description">
                    Latest recorded tracks from your VirtualDJ history
                </p>
            </div>

            <span class="shrink-0 text-[11px] text-slate-400">
                {formatNumber.format(data.recentPlays.length)} records
            </span>
        </div>

        <!-- Scrollable table -->
        <div class="overview-scrollbar min-h-0 min-w-0 flex-1 overflow-auto rounded-lg border border-white/6">

            <table class="w-full border-separate border-spacing-0 text-left text-[12px]">
                <thead>
                    <tr class="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                        <th scope="col" class="sticky top-0 z-10 w-44 border-b border-white/8 bg-[#172235] px-3 py-3 whitespace-nowrap">
                            Played at
                        </th>

                        <th scope="col" class="sticky top-0 z-10 w-[30%] border-b border-white/8 bg-[#172235] px-3 py-3">
                            Artist
                        </th>

                        <th scope="col" class="sticky top-0 z-10 border-b border-white/8 bg-[#172235] px-3 py-3">
                            Track
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {#each data.recentPlays as play (play.id)}
                        <tr class="transition-colors hover:bg-white/4">

                            <td class="border-b border-white/5 px-3 py-2.5 font-mono text-[11px] whitespace-nowrap text-slate-400">
                                {formatPlayedAt(play.playedAt)}
                            </td>

                            <td class="border-b border-white/5 px-3 py-2.5 text-slate-300">
                                {play.artist ?? 'Unknown'}
                            </td>

                            <td class="border-b border-white/5 px-3 py-2.5 font-medium text-slate-100">
                                {play.title ?? 'Unknown track'}
                            </td>

                        </tr>
                    {:else}
                        <tr>
                            <td colspan="3" class="px-4 py-12 text-center text-xs text-slate-400">
                                No playing history yet. Import your VirtualDJ history first.
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>

        </div>
    </section>
</div>
