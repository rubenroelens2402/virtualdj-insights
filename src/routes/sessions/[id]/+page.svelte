
<script lang="ts">
    import type { PageData } from './$types.js';

    let { data }: { data: PageData } = $props();

    function formatTime(value: string) {
        return value.slice(11, 16);
    }

    function formatDate(value: string) {
        const [year, month, day] = value.split('-');
        return `${day}/${month}/${year}`;
    }
</script>

<div class="space-y-8">

    <!-- Navigation -->
    <a
        href="/sessions"
        class="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
    >
        ← Back to Sessions
    </a>

    <!-- Header -->
    <header>
        <p class="text-sm text-slate-400">DJ Session</p>

        <h1 class="mt-2 text-3xl font-semibold">
            {formatDate(data.session.sessionDate)}
        </h1>

        <p class="mt-2 text-slate-400">
            {data.session.startedAt
                ? formatTime(data.session.startedAt)
                : '-'}
            –
            {data.session.endedAt
                ? formatTime(data.session.endedAt)
                : '-'}
        </p>
    </header>

    <!-- KPIs -->
    <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {#each [
            { label: 'Tracks Played', value: data.stats.totalTracks },
            { label: 'Unique Artists', value: data.stats.uniqueArtists },
            { label: 'Library Matches', value: data.stats.matchedTracks },
            {
                label: 'Average BPM',
                value: data.stats.averageBpm === null
                    ? '-'
                    : data.stats.averageBpm.toFixed(1)
            }
        ] as stat}
            <div class="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                <p class="text-sm text-slate-400">{stat.label}</p>
                <p class="mt-2 text-3xl font-semibold">
                    {stat.value}
                </p>
            </div>
        {/each}
    </div>

    <!-- Tracklist -->
    <section class="overflow-hidden rounded-xl border border-slate-800">

        <div class="border-b border-slate-800 p-5">
            <h2 class="font-semibold">Session Tracklist</h2>
            <p class="mt-1 text-sm text-slate-400">
                {data.tracklist.length} recorded plays
            </p>
        </div>

        <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">

                <thead class="bg-slate-900 text-slate-400">
                    <tr>
                        <th class="p-4">#</th>
                        <th class="p-4">Time</th>
                        <th class="p-4">Artist</th>
                        <th class="p-4">Track</th>
                        <th class="p-4">BPM</th>
                        <th class="p-4">Key</th>
                    </tr>
                </thead>

                <tbody>
                    {#each data.tracklist as track (track.id)}
                        <tr class="border-t border-slate-800 hover:bg-slate-800/40">

                            <td class="p-4 text-slate-500">
                                {track.position + 1}
                            </td>

                            <td class="p-4 font-mono text-slate-400">
                                {formatTime(track.playedAt)}
                            </td>

                            <td class="p-4">
                                {track.artist ?? 'Unknown'}
                            </td>

                            <td class="p-4 font-medium">
                                {track.title}
                            </td>

                            <td class="p-4">
                                {track.bpm?.toFixed(1) ?? '-'}
                            </td>

                            <td class="p-4">
                                {track.musicalKey ?? '-'}
                            </td>

                        </tr>
                    {:else}
                        <tr>
                            <td colspan="6" class="p-10 text-center text-slate-400">
                                This session has no recorded tracks.
                            </td>
                        </tr>
                    {/each}
                </tbody>

            </table>
        </div>
    </section>

</div>
