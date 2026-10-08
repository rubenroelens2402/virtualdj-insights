
<script lang="ts">
    import type { PageData } from './$types.js';

    let { data }: { data: PageData } = $props();
</script>

<div class="space-y-8">
    <header>
        <h1 class="text-3xl font-semibold">Playing History</h1>
        <p class="mt-2 text-slate-400">
            Explore your recorded VirtualDJ activity
        </p>
    </header>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {#each [
            { label: 'Total Plays', value: data.stats.totalPlays },
            { label: 'Unique Track Labels', value: data.stats.uniqueTracks },
            { label: 'Sessions', value: data.stats.totalSessions }
        ] as stat}
            <div class="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                <p class="text-sm text-slate-400">{stat.label}</p>
                <p class="mt-2 text-3xl font-semibold">
                    {stat.value.toLocaleString()}
                </p>
            </div>
        {/each}
    </div>

    <section class="overflow-hidden rounded-xl border border-slate-800">
        <div class="border-b border-slate-800 p-5">
            <h2 class="font-semibold">Recent Plays</h2>
        </div>

        <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
                <thead class="bg-slate-900 text-slate-400">
                    <tr>
                        <th class="p-4">Played At</th>
                        <th class="p-4">Artist</th>
                        <th class="p-4">Track</th>
                    </tr>
                </thead>
                <tbody>
                    {#each data.recentPlays as play (play.id)}
                        <tr class="border-t border-slate-800 hover:bg-slate-800/40">
                            <td class="p-4 whitespace-nowrap text-slate-400">
                                {play.playedAt.replace('T', ' ')}
                            </td>
                            <td class="p-4">{play.artist ?? 'Unknown'}</td>
                            <td class="p-4 font-medium">{play.title}</td>
                        </tr>
                    {:else}
                        <tr>
                            <td colspan="3" class="p-10 text-center text-slate-400">
                                No history imported yet.
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </section>
</div>
