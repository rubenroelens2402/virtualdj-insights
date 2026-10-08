<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const formatNumber = new Intl.NumberFormat('en-BE');

	// --------------------------------------------------
	// Filters
	// --------------------------------------------------

	let search = $state('');
	let dateFrom = $state('');
	let dateTo = $state('');
	let sessionId = $state('');
	let showFilters = $state(false);

	$effect(() => {
		search = data.search;
		dateFrom = data.dateFrom;
		dateTo = data.dateTo;
		sessionId = data.sessionId?.toString() ?? '';
	});

	// --------------------------------------------------
	// KPI cards
	// --------------------------------------------------

	const cards = $derived([
		{ label: 'Total plays', value: data.stats.totalPlays },
		{ label: 'Unique track labels', value: data.stats.uniqueTracks },
		{ label: 'DJ sessions', value: data.stats.totalSessions }
	]);

	// --------------------------------------------------
	// Sortable columns
	// --------------------------------------------------

	const columns = [
		{ label: 'Played at', key: 'playedAt' },
		{ label: 'Artist', key: 'artist' },
		{ label: 'Track', key: 'title' },
		{ label: 'Session', key: 'sessionDate' }
	] as const;

	type SortKey = (typeof columns)[number]['key'];

	const activeFilterCount = $derived(
		Number(Boolean(data.search)) +
			Number(Boolean(data.dateFrom)) +
			Number(Boolean(data.dateTo)) +
			Number(data.sessionId !== null)
	);

	// --------------------------------------------------
	// Navigation
	// --------------------------------------------------

	function currentParams() {
		const params = new URLSearchParams();

		if (data.search) params.set('search', data.search);
		if (data.dateFrom) params.set('dateFrom', data.dateFrom);
		if (data.dateTo) params.set('dateTo', data.dateTo);

		if (data.sessionId !== null) {
			params.set('sessionId', String(data.sessionId));
		}

		params.set('sort', data.sort);
		params.set('order', data.order);

		return params;
	}

	function navigate(params: URLSearchParams) {
		const query = params.toString();

		void goto(`/history${query ? `?${query}` : ''}`);
	}

	function applyFilters(event: SubmitEvent) {
		event.preventDefault();

		const params = currentParams();

		const filters = {
			search: search.trim(),
			dateFrom,
			dateTo,
			sessionId: sessionId.trim()
		};

		for (const [key, value] of Object.entries(filters)) {
			if (value) {
				params.set(key, value);
			} else {
				params.delete(key);
			}
		}

		// Reset pagination when filters change.
		params.delete('page');

		navigate(params);
	}

	function clearFilters() {
		search = '';
		dateFrom = '';
		dateTo = '';
		sessionId = '';

		const params = new URLSearchParams();

		params.set('sort', data.sort);
		params.set('order', data.order);

		navigate(params);
	}

	function sortBy(column: SortKey) {
		const params = currentParams();

		const defaultOrder = column === 'playedAt' || column === 'sessionDate' ? 'desc' : 'asc';

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

	function formatPlayedAt(value: string) {
		const [date, time] = value.split('T');

		if (!date || !time) return value;

		const [year, month, day] = date.split('-');

		return `${day}/${month}/${year} ${time.slice(0, 5)}`;
	}

	function formatDate(value: string) {
		const [year, month, day] = value.split('-');

		return `${day}/${month}/${year}`;
	}
</script>

<svelte:head>
	<title>Playing History | VirtualDJ Insights</title>
</svelte:head>

<div class="flex h-full min-h-0 flex-col gap-3.5">
	<!-- Header -->
	<header class="flex shrink-0 items-center justify-between">
		<div>
			<h1 class="text-[23px] font-semibold tracking-tight text-slate-100">Playing History</h1>

			<p class="mt-0.5 text-xs text-slate-400">Explore your recorded VirtualDJ activity</p>
		</div>
	</header>

	<!-- KPI cards -->
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
				<h2 class="panel-title">Playing history</h2>

				<p class="panel-description">Browse, search and filter your recorded plays</p>
			</div>

			<span class="shrink-0 text-[11px] text-slate-400">
				{formatNumber.format(data.total)} matching plays
			</span>
		</div>

		<!-- Search and filters -->
		<form onsubmit={applyFilters} class="mb-3 flex shrink-0 flex-col gap-2" role="search">
			<!-- Main search -->
			<div class="flex items-center gap-2">
				<input
					type="search"
					bind:value={search}
					aria-label="Search playing history"
					placeholder="Search tracks and artists..."
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
					class="grid grid-cols-1 gap-2 rounded-lg border border-white/8 bg-white/2 p-3 sm:grid-cols-2 xl:grid-cols-3"
				>
					<label class="flex min-w-0 flex-col gap-1.5">
						<span class="text-[10px] font-medium text-slate-400"> Played from </span>

						<input
							type="date"
							bind:value={dateFrom}
							class="min-w-0 rounded-lg border border-white/10 bg-slate-900 px-2.5 py-2 text-xs text-slate-200 outline-none focus:border-sky-400/40"
						/>
					</label>

					<label class="flex min-w-0 flex-col gap-1.5">
						<span class="text-[10px] font-medium text-slate-400"> Played until </span>

						<input
							type="date"
							bind:value={dateTo}
							class="min-w-0 rounded-lg border border-white/10 bg-slate-900 px-2.5 py-2 text-xs text-slate-200 outline-none focus:border-sky-400/40"
						/>
					</label>

					<label class="flex min-w-0 flex-col gap-1.5">
						<span class="text-[10px] font-medium text-slate-400"> Session ID </span>

						<input
							type="number"
							min="1"
							step="1"
							bind:value={sessionId}
							placeholder="All sessions"
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
			<table class="w-full min-w-150 border-separate border-spacing-0 text-left text-[12px]">
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

				<!-- Playing history -->
				<tbody>
					{#each data.recentPlays as play (play.id)}
						<tr class="transition-colors hover:bg-white/4">
							<!-- Played at -->
							<td
								class="border-b border-white/5 px-3 py-2.5 font-mono text-[11px] whitespace-nowrap text-slate-400"
							>
								{formatPlayedAt(play.playedAt)}
							</td>

							<!-- Artist -->
							<td class="max-w-56 border-b border-white/5 px-3 py-2.5 text-slate-300">
								<span class="block truncate" title={play.artist ?? ''}>
									{play.artist ?? 'Unknown'}
								</span>
							</td>

							<!-- Track -->
							<td class="max-w-90 border-b border-white/5 px-3 py-2.5 font-medium text-slate-100">
								<span class="block truncate" title={play.title}>
									{play.title}
								</span>
							</td>

							<!-- Session -->
							<td class="border-b border-white/5 px-3 py-2.5">
								<a
									href={`/sessions/${play.sessionId}`}
									class="text-slate-400 transition-colors hover:text-sky-300 hover:underline"
									title="Open session"
								>
									{formatDate(play.sessionDate)}
								</a>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="4" class="px-4 py-12 text-center text-xs text-slate-400">
								No recorded plays match your filters.
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Pagination -->
		<div class="mt-3 flex shrink-0 items-center justify-between gap-3">
			<p class="text-[11px] text-slate-400">
				{formatNumber.format(data.total)} matching plays
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
