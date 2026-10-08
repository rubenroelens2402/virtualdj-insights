<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const formatNumber = new Intl.NumberFormat('en-BE');

	const formatDateValue = new Intl.DateTimeFormat('en-GB', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		timeZone: 'UTC'
	});

	// --------------------------------------------------
	// Filter state
	// --------------------------------------------------

	let search = $state('');
	let genre = $state('');
	let musicalKey = $state('');
	let bpmMin = $state('');
	let bpmMax = $state('');
	let played = $state('all');
	let lastPlayedFrom = $state('');
	let showFilters = $state(false);

	$effect(() => {
		search = data.search;
		genre = data.genre;
		musicalKey = data.musicalKey;
		bpmMin = data.bpmMin?.toString() ?? '';
		bpmMax = data.bpmMax?.toString() ?? '';
		played = data.played;
		lastPlayedFrom = data.lastPlayedFrom;
	});

	// --------------------------------------------------
	// KPI cards
	// --------------------------------------------------

	const cards = $derived([
		{ label: 'Total tracks', value: data.stats.totalTracks },
		{ label: 'Played tracks', value: data.stats.playedTracks },
		{ label: 'Recorded plays', value: data.stats.totalPlays },
		{ label: 'Average BPM', value: Math.round(data.stats.averageBpm ?? 0) }
	]);

	// --------------------------------------------------
	// Columns
	// --------------------------------------------------

	const columns = [
		{ label: 'Artist', key: 'artist' },
		{ label: 'Track', key: 'title' },
		{ label: 'Genre', key: 'genre' },
		{ label: 'BPM', key: 'bpm' },
		{ label: 'Key', key: 'musicalKey' },
		{ label: 'Duration', key: 'durationSeconds' },
		{ label: 'Plays', key: 'playCount' },
		{ label: 'First seen', key: 'firstSeen' },
		{ label: 'Last played', key: 'lastPlay' }
	] as const;

	type SortKey = (typeof columns)[number]['key'];

	const activeFilterCount = $derived(
		Number(Boolean(data.search)) +
			Number(Boolean(data.genre)) +
			Number(Boolean(data.musicalKey)) +
			Number(data.bpmMin !== null) +
			Number(data.bpmMax !== null) +
			Number(data.played !== 'all') +
			Number(Boolean(data.lastPlayedFrom))
	);

	// --------------------------------------------------
	// Navigation helpers
	// --------------------------------------------------

	function currentParams() {
		const params = new URLSearchParams();

		if (data.search) params.set('search', data.search);
		if (data.genre) params.set('genre', data.genre);
		if (data.musicalKey) params.set('key', data.musicalKey);

		if (data.bpmMin !== null) {
			params.set('bpmMin', String(data.bpmMin));
		}

		if (data.bpmMax !== null) {
			params.set('bpmMax', String(data.bpmMax));
		}

		if (data.played !== 'all') {
			params.set('played', data.played);
		}

		if (data.lastPlayedFrom) {
			params.set('lastPlayedFrom', data.lastPlayedFrom);
		}

		params.set('sort', data.sort);
		params.set('order', data.order);

		return params;
	}

	function navigate(params: URLSearchParams) {
		const query = params.toString();
		const url = `/library${query ? `?${query}` : ''}`;

		void goto(url, {
			reset: false
		});
	}

	function applyFilters(event: SubmitEvent) {
		event.preventDefault();

		const params = currentParams();

		const filters = {
			search: search.trim(),
			genre: genre.trim(),
			key: musicalKey.trim(),
			bpmMin: bpmMin.trim(),
			bpmMax: bpmMax.trim(),
			played: played === 'all' ? '' : played,
			lastPlayedFrom
		};

		for (const [key, value] of Object.entries(filters)) {
			if (value) {
				params.set(key, value);
			} else {
				params.delete(key);
			}
		}

		// A new filter should start on the first page.
		params.delete('page');

		navigate(params);
	}

	function clearFilters() {
		search = '';
		genre = '';
		musicalKey = '';
		bpmMin = '';
		bpmMax = '';
		played = 'all';
		lastPlayedFrom = '';

		const params = new URLSearchParams();
		params.set('sort', data.sort);
		params.set('order', data.order);

		navigate(params);
	}

	function sortBy(column: SortKey) {
		const params = currentParams();

		const defaultOrder =
			column === 'playCount' || column === 'lastPlay' || column === 'firstSeen' ? 'desc' : 'asc';

		const nextOrder = data.sort === column ? (data.order === 'asc' ? 'desc' : 'asc') : defaultOrder;

		params.set('sort', column);
		params.set('order', nextOrder);
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

	function formatDuration(seconds: number | null) {
		if (seconds === null || !Number.isFinite(seconds)) {
			return '-';
		}

		const minutes = Math.floor(seconds / 60);
		const remainder = Math.floor(seconds % 60);

		return `${minutes}:${String(remainder).padStart(2, '0')}`;
	}

	function formatDate(value: Date | null) {
		return value ? formatDateValue.format(value) : '-';
	}
</script>

<svelte:head>
	<title>Music Library | VirtualDJ Insights</title>
</svelte:head>

<div class="flex h-full min-h-0 flex-col gap-3.5">
	<!-- Header -->
	<header class="flex shrink-0 items-center justify-between">
		<div>
			<h1 class="text-[23px] font-semibold tracking-tight text-slate-100">Music Library</h1>

			<p class="mt-0.5 text-xs text-slate-400">Explore your VirtualDJ collection</p>
		</div>
	</header>

	<!-- KPIs -->
	<div class="grid shrink-0 grid-cols-2 gap-3 xl:grid-cols-4">
		{#each cards as card}
			<div class="glass-card kpi-card">
				<p class="kpi-title">{card.label}</p>

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
				<h2 class="panel-title">Music library</h2>

				<p class="panel-description">Browse, search and filter your tracks</p>
			</div>

			<span class="shrink-0 text-[11px] text-slate-400">
				{formatNumber.format(data.total)} matching tracks
			</span>
		</div>

		<!-- Search and filters -->
		<form onsubmit={applyFilters} class="mb-3 flex shrink-0 flex-col gap-2" role="search">
			<!-- Main search row -->
			<div class="flex items-center gap-2">
				<input
					type="search"
					bind:value={search}
					aria-label="Search music library"
					placeholder="Search tracks, artists, filenames, genres..."
					class="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/4 px-3 py-2 text-xs text-slate-100 transition-colors outline-none placeholder:text-slate-500 focus:border-sky-400/40"
				/>

				<button
					type="button"
					onclick={() => (showFilters = !showFilters)}
					aria-expanded={showFilters}
					class="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/3 px-3 py-2 text-xs text-slate-300 transition-colors hover:bg-white/7"
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

				<button
					type="submit"
					class="shrink-0 cursor-pointer rounded-lg border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-xs font-medium text-sky-300 transition-colors hover:bg-sky-400/15"
				>
					Apply
				</button>
			</div>

			<!-- Advanced filters -->
			{#if showFilters}
				<div
					class="grid grid-cols-2 gap-2 rounded-lg border border-white/8 bg-white/2 p-3 lg:grid-cols-3 xl:grid-cols-6"
				>
					<label class="flex min-w-0 flex-col gap-1.5">
						<span class="text-[10px] font-medium text-slate-400"> Genre </span>

						<input
							type="text"
							bind:value={genre}
							placeholder="Any genre"
							class="min-w-0 rounded-lg border border-white/10 bg-slate-900/60 px-2.5 py-2 text-xs text-slate-200 outline-none focus:border-sky-400/40"
						/>
					</label>

					<label class="flex min-w-0 flex-col gap-1.5">
						<span class="text-[10px] font-medium text-slate-400"> Musical key </span>

						<input
							type="text"
							bind:value={musicalKey}
							placeholder="Any key"
							class="min-w-0 rounded-lg border border-white/10 bg-slate-900/60 px-2.5 py-2 text-xs text-slate-200 outline-none focus:border-sky-400/40"
						/>
					</label>

					<label class="flex min-w-0 flex-col gap-1.5">
						<span class="text-[10px] font-medium text-slate-400"> Minimum BPM </span>

						<input
							type="number"
							min="0"
							step="1"
							bind:value={bpmMin}
							placeholder="Min"
							class="min-w-0 rounded-lg border border-white/10 bg-slate-900/60 px-2.5 py-2 text-xs text-slate-200 outline-none focus:border-sky-400/40"
						/>
					</label>

					<label class="flex min-w-0 flex-col gap-1.5">
						<span class="text-[10px] font-medium text-slate-400"> Maximum BPM </span>

						<input
							type="number"
							min="0"
							step="1"
							bind:value={bpmMax}
							placeholder="Max"
							class="min-w-0 rounded-lg border border-white/10 bg-slate-900/60 px-2.5 py-2 text-xs text-slate-200 outline-none focus:border-sky-400/40"
						/>
					</label>

					<label class="flex min-w-0 flex-col gap-1.5">
						<span class="text-[10px] font-medium text-slate-400"> Play status </span>

						<select
							bind:value={played}
							class="min-w-0 rounded-lg border border-white/10 bg-slate-900 px-2.5 py-2 text-xs text-slate-200 outline-none focus:border-sky-400/40"
						>
							<option value="all">All tracks</option>
							<option value="played">Played</option>
							<option value="unplayed">Never played</option>
						</select>
					</label>

					<label class="flex min-w-0 flex-col gap-1.5">
						<span class="text-[10px] font-medium text-slate-400"> Last played since </span>

						<input
							type="date"
							bind:value={lastPlayedFrom}
							class="min-w-0 rounded-lg border border-white/10 bg-slate-900 px-2.5 py-2 text-xs text-slate-200 outline-none focus:border-sky-400/40"
						/>
					</label>

					<div class="col-span-full flex justify-end">
						<button
							type="button"
							onclick={clearFilters}
							class="cursor-pointer text-[11px] text-slate-400 transition-colors hover:text-white"
						>
							Clear all filters
						</button>
					</div>
				</div>
			{/if}
		</form>

		<!-- Scrollable table -->
		<div
			class="overview-scrollbar min-h-0 min-w-0 flex-1 overflow-auto rounded-lg border border-white/6"
		>
			<table class="w-full min-w-260 border-separate border-spacing-0 text-left text-[12px]">
				<!-- Sortable table headers -->
				<thead>
					<tr>
						{#each columns as column}
							<th
								scope="col"
								aria-sort={data.sort === column.key
									? data.order === 'asc'
										? 'ascending'
										: 'descending'
									: 'none'}
								class="sticky top-0 z-10 border-b border-white/8 bg-[#172235] p-0"
							>
								<button
									type="button"
									onclick={() => sortBy(column.key)}
									class="flex w-full cursor-pointer items-center gap-1.5 px-3 py-3 text-left text-[10px] font-semibold tracking-wide whitespace-nowrap uppercase transition-colors hover:text-sky-300"
									class:text-sky-300={data.sort === column.key}
									class:text-slate-400={data.sort !== column.key}
								>
									{column.label}

									{#if data.sort === column.key}
										<span aria-hidden="true">
											{data.order === 'asc' ? '↑' : '↓'}
										</span>
									{:else}
										<span aria-hidden="true" class="text-slate-600"> ↕ </span>
									{/if}
								</button>
							</th>
						{/each}
					</tr>
				</thead>

				<!-- Track data -->
				<tbody>
					{#each data.tracks as track (track.id)}
						<tr class="transition-colors hover:bg-white/4">
							<td class="max-w-52 border-b border-white/5 px-3 py-2.5 font-medium text-slate-200">
								<span class="block truncate" title={track.artist ?? ''}>
									{track.artist ?? '-'}
								</span>
							</td>

							<td class="max-w-68 border-b border-white/5 px-3 py-2.5 text-slate-100">
								<span class="block truncate" title={track.title ?? ''}>
									{track.title ?? '-'}
								</span>
							</td>

							<td class="max-w-36 border-b border-white/5 px-3 py-2.5 text-slate-400">
								<span class="block truncate" title={track.genre ?? ''}>
									{track.genre ?? '-'}
								</span>
							</td>

							<td
								class="border-b border-white/5 px-3 py-2.5 font-mono text-[11px] whitespace-nowrap text-slate-300"
							>
								{track.bpm?.toFixed(1) ?? '-'}
							</td>

							<td class="border-b border-white/5 px-3 py-2.5 whitespace-nowrap text-slate-300">
								{track.musicalKey ?? '-'}
							</td>

							<td
								class="border-b border-white/5 px-3 py-2.5 font-mono text-[11px] whitespace-nowrap text-slate-400"
							>
								{formatDuration(track.durationSeconds)}
							</td>

							<td
								class="border-b border-white/5 px-3 py-2.5 text-right font-mono text-[11px] text-slate-300"
							>
								{track.playCount}
							</td>

							<td
								class="border-b border-white/5 px-3 py-2.5 font-mono text-[11px] whitespace-nowrap text-slate-400"
							>
								{formatDate(track.firstSeen)}
							</td>

							<td
								class="border-b border-white/5 px-3 py-2.5 font-mono text-[11px] whitespace-nowrap text-slate-400"
							>
								{formatDate(track.lastPlay)}
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="9" class="px-4 py-12 text-center text-xs text-slate-400">
								No tracks match the selected filters.
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

			<div class="flex items-center gap-2">
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
