<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	let search = $state('');

	$effect(() => {
		search = data.search ?? '';
	});

	function applySearch(event: SubmitEvent) {
		event.preventDefault();

		const params = new URLSearchParams();

		if (search.trim()) {
			params.set('search', search.trim());
		}

		goto(`/library?${params.toString()}`);
	}

	function navigateToPage(page: number) {
		const params = new URLSearchParams();

		if (data.search) params.set('search', data.search);
		params.set('page', String(page));

		goto(`/library?${params.toString()}`);
	}

	function formatDuration(seconds: number | null) {
		if (seconds === null) return '-';

		const minutes = Math.floor(seconds / 60);
		const remainder = Math.floor(seconds % 60);

		return `${minutes}:${String(remainder).padStart(2, '0')}`;
	}
</script>

<div class="space-y-8">
	<header>
		<h1 class="text-3xl font-semibold">Music Library</h1>
		<p class="mt-2 text-slate-400">Explore your VirtualDJ collection</p>
	</header>

	<!-- Statistics -->
	<div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
		{#each [{ label: 'Total Tracks', value: data.stats.totalTracks }, { label: 'Played Tracks', value: data.stats.playedTracks }, { label: 'Recorded Plays', value: data.stats.totalPlays }, { label: 'Average BPM', value: Math.round(data.stats.averageBpm ?? 0) }] as stat}
			<div class="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
				<p class="text-sm text-slate-400">{stat.label}</p>
				<p class="mt-2 text-3xl font-semibold">
					{stat.value.toLocaleString()}
				</p>
			</div>
		{/each}
	</div>

	<!-- Search -->
	<form onsubmit={applySearch} class="flex gap-3">
		<input
			type="search"
			bind:value={search}
			placeholder="Search tracks, artists, filenames..."
			class="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
		/>

		<button type="submit" class="rounded-lg bg-blue-600 px-6 py-3 font-medium hover:bg-blue-500">
			Search
		</button>
	</form>

	<!-- Table -->
	<div class="overflow-hidden rounded-xl border border-slate-800">
		<div class="overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead class="bg-slate-900 text-slate-400">
					<tr>
						<th class="p-4">Artist</th>
						<th class="p-4">Track</th>
						<th class="p-4">Genre</th>
						<th class="p-4">BPM</th>
						<th class="p-4">Key</th>
						<th class="p-4">Duration</th>
						<th class="p-4 text-right">Plays</th>
					</tr>
				</thead>

				<tbody>
					{#each data.tracks as track (track.id)}
						<tr class="border-t border-slate-800 hover:bg-slate-800/40">
							<td class="p-4 font-medium">
								{track.artist ?? '-'}
							</td>
							<td class="p-4">{track.title ?? '-'}</td>
							<td class="p-4 text-slate-400">
								{track.genre ?? '-'}
							</td>
							<td class="p-4">
								{track.bpm?.toFixed(1) ?? '-'}
							</td>
							<td class="p-4">
								{track.musicalKey ?? '-'}
							</td>
							<td class="p-4 text-slate-400">
								{formatDuration(track.durationSeconds)}
							</td>
							<td class="p-4 text-right">
								{track.playCount}
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="7" class="p-10 text-center text-slate-400"> No tracks found. </td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Pagination -->
		<div class="flex items-center justify-between border-t border-slate-800 p-4">
			<span class="text-sm text-slate-400">
				{data.total.toLocaleString()} matching tracks · Page {data.page} of {data.totalPages}
			</span>

			<div class="flex gap-2">
				<button
					onclick={() => navigateToPage(data.page - 1)}
					disabled={data.page <= 1}
					class="rounded-lg border border-slate-700 px-4 py-2 disabled:opacity-30"
				>
					Previous
				</button>

				<button
					onclick={() => navigateToPage(data.page + 1)}
					disabled={data.page >= data.totalPages}
					class="rounded-lg border border-slate-700 px-4 py-2 disabled:opacity-30"
				>
					Next
				</button>
			</div>
		</div>
	</div>
</div>
