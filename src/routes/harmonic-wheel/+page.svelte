<script lang="ts">
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const formatNumber = new Intl.NumberFormat('en-BE');

	// --------------------------------------------------
	// Camelot wheel definition
	// --------------------------------------------------

	const wheel = [
		{ number: 1, major: 'B', minor: 'G♯m' },
		{ number: 2, major: 'F♯', minor: 'D♯m' },
		{ number: 3, major: 'D♭', minor: 'B♭m' },
		{ number: 4, major: 'A♭', minor: 'Fm' },
		{ number: 5, major: 'E♭', minor: 'Cm' },
		{ number: 6, major: 'B♭', minor: 'Gm' },
		{ number: 7, major: 'F', minor: 'Dm' },
		{ number: 8, major: 'C', minor: 'Am' },
		{ number: 9, major: 'G', minor: 'Em' },
		{ number: 10, major: 'D', minor: 'Bm' },
		{ number: 11, major: 'A', minor: 'F♯m' },
		{ number: 12, major: 'E', minor: 'C♯m' }
	] as const;

	// Each row: Camelot minor code, minor spellings,
	// Camelot major code, major spellings.
	const keyDefinitions = [
		['1A', ['G#m', 'Abm'], ['1B', ['B', 'Cb']]],
		['2A', ['D#m', 'Ebm'], ['2B', ['F#', 'Gb']]],
		['3A', ['A#m', 'Bbm'], ['3B', ['C#', 'Db']]],
		['4A', ['Fm'], ['4B', ['G#', 'Ab']]],
		['5A', ['Cm'], ['5B', ['D#', 'Eb']]],
		['6A', ['Gm'], ['6B', ['A#', 'Bb']]],
		['7A', ['Dm'], ['7B', ['F']]],
		['8A', ['Am'], ['8B', ['C']]],
		['9A', ['Em'], ['9B', ['G']]],
		['10A', ['Bm'], ['10B', ['D']]],
		['11A', ['F#m', 'Gbm'], ['11B', ['A']]],
		['12A', ['C#m', 'Dbm'], ['12B', ['E']]]
	] as const;

	function normalizeKey(value: string) {
		return value
			.trim()
			.replaceAll('♯', '#')
			.replaceAll('♭', 'b')
			.replace(/\s+/g, '')
			.replace(/minor$/i, 'm')
			.replace(/major$/i, '')
			.toLowerCase();
	}

	const keyLookup = new Map<string, string>();

	for (const [minorCode, minorNames, majorDefinition] of keyDefinitions) {
		const [majorCode, majorNames] = majorDefinition;

		keyLookup.set(normalizeKey(minorCode), minorCode);
		keyLookup.set(normalizeKey(majorCode), majorCode);

		for (const name of minorNames) {
			keyLookup.set(normalizeKey(name), minorCode);
		}

		for (const name of majorNames) {
			keyLookup.set(normalizeKey(name), majorCode);
		}
	}

	function toCamelot(key: string | null) {
		if (!key) return null;
		return keyLookup.get(normalizeKey(key)) ?? null;
	}

	// --------------------------------------------------
	// Interaction state
	// --------------------------------------------------

	let selectedKey = $state<string | null>(null);
	let search = $state('');
	let sort = $state('plays');

	type CompatibilityRole = 'selected' | 'previous' | 'next' | 'relative';

	// Subtle colors designed for the Midnight theme.
	const compatibilityColors = {
		selected: '#7dd3fc',
		previous: '#a78bfa',
		next: '#5dd6bf',
		relative: '#f0b87a'
	} as const;

	const compatibilityLabels = {
		selected: 'Selected key',
		previous: 'Previous key',
		next: 'Next key',
		relative: 'Relative major/minor'
	} as const;

	const compatibleKeys = $derived.by(() => {
		const result = new Map<string, CompatibilityRole>();

		if (!selectedKey) return result;

		const number = Number(selectedKey.slice(0, -1));
		const mode = selectedKey.endsWith('A') ? 'A' : 'B';

		// Wrap around: 1 -> 12 and 12 -> 1.
		const previous = number === 1 ? 12 : number - 1;
		const next = number === 12 ? 1 : number + 1;

		result.set(selectedKey, 'selected');
		result.set(`${previous}${mode}`, 'previous');
		result.set(`${next}${mode}`, 'next');
		result.set(`${number}${mode === 'A' ? 'B' : 'A'}`, 'relative');

		return result;
	});

	function compatibilityRole(key: string | null) {
		return key ? (compatibleKeys.get(key) ?? null) : null;
	}

	function compatibilityColor(key: string | null) {
		const role = compatibilityRole(key);

		return role ? compatibilityColors[role] : null;
	}

	function compatibilityLabel(key: string | null) {
		const role = compatibilityRole(key);

		return role ? compatibilityLabels[role] : '';
	}

	const enrichedTracks = $derived(
		data.tracks.map((track) => ({
			...track,
			camelot: toCamelot(track.musicalKey)
		}))
	);

	const mappedTracks = $derived(enrichedTracks.filter((track) => track.camelot !== null));

	const counts = $derived.by(() => {
		const result = new Map<string, number>();

		for (const track of mappedTracks) {
			const key = track.camelot!;

			result.set(key, (result.get(key) ?? 0) + 1);
		}

		return result;
	});

	const visibleTracks = $derived.by(() => {
		const query = search.trim().toLowerCase();

		const result = mappedTracks.filter((track) => {
			// No selected key: show all mapped tracks.
			// Selected key: include all four compatible keys.
			if (selectedKey && !compatibleKeys.has(track.camelot!)) {
				return false;
			}

			if (!query) return true;

			return [track.artist, track.title, track.genre, track.musicalKey, track.camelot].some(
				(value) => value?.toLowerCase().includes(query)
			);
		});

		result.sort((a, b) => {
			if (sort === 'artist') {
				return (a.artist ?? '').localeCompare(b.artist ?? '');
			}

			if (sort === 'bpm') {
				return (b.bpm ?? -1) - (a.bpm ?? -1);
			}

			if (sort === 'recent') {
				return (b.lastPlayed ?? '').localeCompare(a.lastPlayed ?? '');
			}

			return b.historicalPlays - a.historicalPlays;
		});

		return result;
	});

	const selectedLabel = $derived.by(() => {
		if (!selectedKey) return 'All harmonic keys';

		const number = Number(selectedKey.slice(0, -1));
		const mode = selectedKey.endsWith('A') ? 'minor' : 'major';

		const entry = wheel.find((item) => item.number === number);

		if (!entry) return selectedKey;

		return `${selectedKey} · ${mode === 'minor' ? entry.minor : entry.major} ${mode}`;
	});

	function selectKey(key: string) {
		selectedKey = selectedKey === key ? null : key;
	}

	function handleKeydown(event: KeyboardEvent, key: string | null) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();

			if (key === null) {
				selectedKey = null;
			} else {
				selectKey(key);
			}
		}
	}

	// --------------------------------------------------
	// SVG wheel geometry
	// --------------------------------------------------

	const center = 210;

	function polar(radius: number, angle: number) {
		const radians = (angle * Math.PI) / 180;

		return {
			x: center + radius * Math.cos(radians),
			y: center + radius * Math.sin(radians)
		};
	}

	function segmentPath(
		innerRadius: number,
		outerRadius: number,
		startAngle: number,
		endAngle: number
	) {
		const outerStart = polar(outerRadius, startAngle);
		const outerEnd = polar(outerRadius, endAngle);
		const innerEnd = polar(innerRadius, endAngle);
		const innerStart = polar(innerRadius, startAngle);

		return [
			`M ${outerStart.x} ${outerStart.y}`,
			`A ${outerRadius} ${outerRadius} 0 0 1 ${outerEnd.x} ${outerEnd.y}`,
			`L ${innerEnd.x} ${innerEnd.y}`,
			`A ${innerRadius} ${innerRadius} 0 0 0 ${innerStart.x} ${innerStart.y}`,
			'Z'
		].join(' ');
	}

	function startAngle(number: number) {
		// Number 1 centered at the top.
		return -105 + (number - 1) * 30;
	}

	function middleAngle(number: number) {
		return -90 + (number - 1) * 30;
	}

	function segmentColor(number: number, minor: boolean) {
		const hue = 205 + (number - 1) * 7;

		return minor ? `hsl(${hue} 32% 20%)` : `hsl(${hue} 38% 27%)`;
	}

	// --------------------------------------------------
	// Formatters
	// --------------------------------------------------

	function formatBpm(value: number | null) {
		return value == null ? '-' : Number(value).toFixed(1);
	}

	function formatDate(value: string | null) {
		if (!value) return '-';

		const [date] = value.split('T');
		const [year, month, day] = date.split('-');

		return `${day}/${month}/${year}`;
	}
</script>

<svelte:head>
	<title>Harmonic Wheel | VirtualDJ Insights</title>
	<meta
		name="description"
		content="Explore your played and matched tracks through an interactive Camelot harmonic wheel."
	/>
</svelte:head>

<div class="flex h-full min-h-0 flex-col gap-3.5">
	<!-- Page heading -->
	<header class="flex shrink-0 items-center justify-between">
		<div>
			<h1 class="text-[23px] font-semibold tracking-tight text-slate-100">Harmonic Wheel</h1>

			<p class="mt-0.5 text-xs text-slate-400">Explore your played library tracks by musical key</p>
		</div>
	</header>

	<!-- KPIs -->
	<div class="grid shrink-0 grid-cols-2 gap-3 xl:grid-cols-4">
		<div class="glass-card kpi-card">
			<p class="kpi-title">Library tracks</p>
			<p class="kpi-value">
				{formatNumber.format(data.totalLibraryTracks)}
			</p>
		</div>

		<div class="glass-card kpi-card">
			<p class="kpi-title">Keyed tracks</p>
			<p class="kpi-value">
				{formatNumber.format(mappedTracks.length)}
			</p>
		</div>

		<div class="glass-card kpi-card">
			<p class="kpi-title">Keys represented</p>
			<p class="kpi-value">
				{formatNumber.format(counts.size)}
				<span class="text-sm font-normal text-slate-500">/ 24</span>
			</p>
		</div>

		<div class="glass-card kpi-card">
			<p class="kpi-title">Selected tracks</p>
			<p class="kpi-value">
				{formatNumber.format(visibleTracks.length)}
			</p>
		</div>
	</div>

	<!-- Main content -->
	<div class="grid min-h-0 flex-1 grid-cols-12 gap-3.5">
		<!-- Camelot wheel -->
		<section class="overview-surface col-span-12 flex min-h-0 flex-col p-4 xl:col-span-5">
			<div class="mb-2 shrink-0">
				<h2 class="panel-title">Camelot wheel</h2>
				<p class="panel-description">Select a key to explore matching tracks</p>
			</div>

			<div class="flex min-h-0 flex-1 items-center justify-center">
				<svg
					viewBox="0 0 420 420"
					class="aspect-square w-full max-w-110"
					role="group"
					aria-label="Interactive harmonic wheel with 24 major and minor keys"
				>
					{#each wheel as segment}
						{@const angle = startAngle(segment.number)}
						{@const middle = middleAngle(segment.number)}
						{@const majorCode = `${segment.number}B`}
						{@const minorCode = `${segment.number}A`}
						{@const majorPosition = polar(166, middle)}
						{@const minorPosition = polar(101, middle)}

						<!-- Outer ring: major keys -->
						<g
							role="button"
							tabindex="0"
							aria-label={`${majorCode}, ${segment.major} major, ${counts.get(majorCode) ?? 0} tracks${compatibilityRole(majorCode) ? `, ${compatibilityLabel(majorCode)}` : ''}`}
							aria-pressed={selectedKey === majorCode}
							onclick={() => selectKey(majorCode)}
							onkeydown={(event) => handleKeydown(event, majorCode)}
							class="cursor-pointer outline-none"
						>
							<path
								d={segmentPath(129, 199, angle + 0.7, angle + 29.3)}
								fill={segmentColor(segment.number, false)}
								stroke={compatibilityColor(majorCode) ?? 'rgba(255,255,255,.10)'}
								stroke-width={compatibilityRole(majorCode) === 'selected'
									? 3.5
									: compatibilityRole(majorCode)
										? 2.5
										: 1}
								opacity={selectedKey && !compatibleKeys.has(majorCode) ? 0.42 : 1}
								class="transition-all duration-150 hover:brightness-130"
							/>

							<text
								x={majorPosition.x}
								y={majorPosition.y - 5}
								fill="#f1f5f9"
								font-size="13"
								font-weight="600"
								text-anchor="middle"
								pointer-events="none"
							>
								{majorCode}
							</text>

							<text
								x={majorPosition.x}
								y={majorPosition.y + 11}
								fill="#cbd5e1"
								font-size="12"
								text-anchor="middle"
								pointer-events="none"
							>
								{segment.major}
							</text>

							<title>
								{majorCode} · {segment.major} major · {counts.get(majorCode) ?? 0} tracks
							</title>
						</g>

						<!-- Inner ring: minor keys -->
						<g
							role="button"
							tabindex="0"
							aria-label={`${minorCode}, ${segment.minor}, ${counts.get(minorCode) ?? 0} tracks${compatibilityRole(minorCode) ? `, ${compatibilityLabel(minorCode)}` : ''}`}
							aria-pressed={selectedKey === minorCode}
							onclick={() => selectKey(minorCode)}
							onkeydown={(event) => handleKeydown(event, minorCode)}
							class="cursor-pointer outline-none"
						>
							<path
								d={segmentPath(57, 126, angle + 0.7, angle + 29.3)}
								fill={segmentColor(segment.number, true)}
								stroke={compatibilityColor(minorCode) ?? 'rgba(255,255,255,.10)'}
								stroke-width={compatibilityRole(minorCode) === 'selected'
									? 3.5
									: compatibilityRole(minorCode)
										? 2.5
										: 1}
								opacity={selectedKey && !compatibleKeys.has(minorCode) ? 0.42 : 1}
								class="transition-all duration-150 hover:brightness-130"
							/>

							<text
								x={minorPosition.x}
								y={minorPosition.y - 5}
								fill="#f1f5f9"
								font-size="12"
								font-weight="600"
								text-anchor="middle"
								pointer-events="none"
							>
								{minorCode}
							</text>

							<text
								x={minorPosition.x}
								y={minorPosition.y + 10}
								fill="#cbd5e1"
								font-size="11"
								text-anchor="middle"
								pointer-events="none"
							>
								{segment.minor}
							</text>

							<title>
								{minorCode} · {segment.minor} · {counts.get(minorCode) ?? 0} tracks
							</title>
						</g>
					{/each}

					<!-- Central reset control -->
					<g
						role="button"
						tabindex="0"
						aria-label="Show all harmonic keys"
						onclick={() => (selectedKey = null)}
						onkeydown={(event) => handleKeydown(event, null)}
						class="cursor-pointer outline-none"
					>
						<circle
							cx="210"
							cy="210"
							r="52"
							fill="#080f1e"
							stroke="rgba(148,163,184,.25)"
							stroke-width="1.5"
						/>

						<text
							x="210"
							y="205"
							text-anchor="middle"
							fill="#7dd3fc"
							font-size="15"
							font-weight="700"
							pointer-events="none"
						>
							{selectedKey ?? 'ALL'}
						</text>

						<text
							x="210"
							y="222"
							text-anchor="middle"
							fill="#94a3b8"
							font-size="10"
							pointer-events="none"
						>
							{selectedKey ? 'Click to reset' : '24 keys'}
						</text>
					</g>
				</svg>
			</div>

			<div class="mt-2 shrink-0 text-center text-[11px] text-slate-500">
				Outer ring: Major (B)
				<span class="mx-2">·</span>
				Inner ring: Minor (A)
			</div>
		</section>

		<!-- Matching tracks -->
		<section class="overview-surface col-span-12 flex min-h-0 flex-col p-4 xl:col-span-7">
			<div class="mb-3 flex shrink-0 items-start justify-between gap-3">
				<div>
					<h2 class="panel-title">
						{selectedKey ? `${selectedLabel} · Compatible tracks` : 'All harmonic keys'}
					</h2>

					<p class="panel-description">
						{selectedKey
							? 'Tracks in the selected key, adjacent keys and relative major/minor'
							: 'All matched library tracks played at least once'}
					</p>
				</div>

				<span class="shrink-0 text-[11px] text-slate-400">
					{formatNumber.format(visibleTracks.length)} tracks
				</span>
			</div>

			{#if selectedKey}
				<div class="mb-3 flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2">
					{#each Array.from(compatibleKeys.entries()) as [key, role]}
						<button
							type="button"
							onclick={() => (selectedKey = key)}
							title={`Select ${key}`}
							class="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-1 py-0.5 text-[11px] text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
						>
							<span class="h-2 w-2 rounded-full" style:background-color={compatibilityColors[role]}
							></span>

							<span class="font-semibold" style:color={compatibilityColors[role]}>
								{key}
							</span>

							<span>
								{compatibilityLabels[role]}
							</span>
						</button>
					{/each}
				</div>
			{/if}

			<!-- Search and sort -->
			<div class="mb-3 flex shrink-0 flex-wrap gap-2">
				<input
					type="search"
					bind:value={search}
					aria-label="Search harmonic wheel tracks"
					placeholder="Search artist, track or genre..."
					class="min-w-40 flex-1 rounded-lg border border-white/10 bg-white/4 px-3 py-2 text-xs text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-400/40"
				/>

				<select
					bind:value={sort}
					aria-label="Sort harmonic wheel tracks"
					class="rounded-lg border border-white/10 bg-[#111b2d] px-3 py-2 text-xs text-slate-200 outline-none focus:border-sky-400/40"
				>
					<option value="plays">Most played</option>
					<option value="recent">Recently played</option>
					<option value="artist">Artist A–Z</option>
					<option value="bpm">Highest BPM</option>
				</select>

				{#if selectedKey}
					<button
						type="button"
						onclick={() => (selectedKey = null)}
						class="cursor-pointer rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-400 hover:bg-white/5 hover:text-white"
					>
						Clear key
					</button>
				{/if}
			</div>

			<!-- Scrollable results -->
			<div class="overview-scrollbar min-h-0 flex-1 overflow-auto rounded-lg border border-white/6">
				<table class="w-full min-w-135 border-separate border-spacing-0 text-left text-[12px]">
					<thead>
						<tr class="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
							<th class="sticky top-0 z-10 border-b border-white/8 bg-[#172235] px-3 py-3">
								Artist
							</th>
							<th class="sticky top-0 z-10 border-b border-white/8 bg-[#172235] px-3 py-3">
								Track
							</th>
							<th class="sticky top-0 z-10 border-b border-white/8 bg-[#172235] px-3 py-3">
								Key
							</th>
							<th class="sticky top-0 z-10 border-b border-white/8 bg-[#172235] px-3 py-3">
								BPM
							</th>
							<th
								class="sticky top-0 z-10 border-b border-white/8 bg-[#172235] px-3 py-3 text-right"
							>
								Plays
							</th>
							<th class="sticky top-0 z-10 border-b border-white/8 bg-[#172235] px-3 py-3">
								Last played
							</th>
						</tr>
					</thead>

					<tbody>
						{#each visibleTracks as track (track.id)}
							<tr class="transition-colors hover:bg-white/4">
								<td class="max-w-40 border-b border-white/5 px-3 py-2.5 text-slate-300">
									<span class="block truncate" title={track.artist ?? ''}>
										{track.artist ?? 'Unknown'}
									</span>
								</td>

								<td class="max-w-58 border-b border-white/5 px-3 py-2.5 font-medium text-slate-100">
									<span class="block truncate" title={track.title ?? ''}>
										{track.title ?? 'Unknown'}
									</span>
								</td>

								<td class="border-b border-white/5 px-3 py-2.5 whitespace-nowrap">
									<div class="flex items-center gap-2">
										{#if selectedKey}
											<span
												class="h-1.5 w-1.5 shrink-0 rounded-full"
												style:background-color={compatibilityColor(track.camelot) ?? '#64748b'}
												title={compatibilityLabel(track.camelot)}
												aria-hidden="true"
											></span>
										{/if}

										<span
											class="font-semibold"
											style:color={selectedKey
												? (compatibilityColor(track.camelot) ?? '#7dd3fc')
												: '#7dd3fc'}
											title={compatibilityLabel(track.camelot) || undefined}
										>
											{track.camelot}
										</span>

										<span class="text-slate-500">
											{track.musicalKey}
										</span>
									</div>
								</td>

								<td
									class="border-b border-white/5 px-3 py-2.5 font-mono text-[11px] text-slate-300"
								>
									{formatBpm(track.bpm)}
								</td>

								<td
									class="border-b border-white/5 px-3 py-2.5 text-right font-mono text-[11px] text-slate-300"
								>
									{track.historicalPlays}
								</td>

								<td
									class="border-b border-white/5 px-3 py-2.5 font-mono text-[11px] whitespace-nowrap text-slate-400"
								>
									{formatDate(track.lastPlayed)}
								</td>
							</tr>
						{:else}
							<tr>
								<td colspan="6" class="px-4 py-12 text-center">
									<p class="text-xs font-medium text-slate-300">No matching tracks found</p>

									<p class="mt-2 text-[11px] text-slate-500">
										Try another key or search, or synchronize and match your historical plays.
									</p>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<div class="mt-3 shrink-0 text-[11px] text-slate-500">
				Only tracks linked to recorded plays are included. Tracks without a recognized musical key
				are excluded.
			</div>
		</section>
	</div>
</div>
