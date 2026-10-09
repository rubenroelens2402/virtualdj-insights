<script lang="ts">
	type DailyActivity = {
		date: string;
		total: number;
	};

	type CalendarDay = {
		date: string;
		count: number;
		level: number;
		future: boolean;
	};

	let {
		activity
	}: {
		activity: DailyActivity[];
	} = $props();

	const weekdays = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];

	const monthFormatter = new Intl.DateTimeFormat('en-GB', {
		month: 'short',
		timeZone: 'UTC'
	});

	const dateFormatter = new Intl.DateTimeFormat('en-GB', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		timeZone: 'UTC'
	});

	const today = new Date().toLocaleDateString('en-CA');
	const currentYear = new Date().getFullYear();

	let selectedYear = $state(currentYear);

	const years = $derived.by(() => {
		const result = new Set<number>([currentYear]);

		for (const row of activity) {
			const year = Number(row.date.slice(0, 4));

			if (Number.isInteger(year)) result.add(year);
		}

		return [...result].sort((a, b) => b - a);
	});

	const activityMap = $derived(new Map(activity.map((row) => [row.date, row.total])));

	const calendar = $derived.by(() => {
		const firstDay = new Date(Date.UTC(selectedYear, 0, 1));
		const lastDay = new Date(Date.UTC(selectedYear, 11, 31));

		const start = new Date(firstDay);
		const mondayOffset = (start.getUTCDay() + 6) % 7;

		start.setUTCDate(start.getUTCDate() - mondayOffset);

		const end = new Date(lastDay);
		const sundayOffset = 6 - ((end.getUTCDay() + 6) % 7);

		end.setUTCDate(end.getUTCDate() + sundayOffset);

		const days: (CalendarDay | null)[] = [];
		const realCounts: number[] = [];

		for (let date = new Date(start); date <= end; date.setUTCDate(date.getUTCDate() + 1)) {
			const iso = date.toISOString().slice(0, 10);
			const belongsToYear = date.getUTCFullYear() === selectedYear;

			if (!belongsToYear) {
				days.push(null);
				continue;
			}

			const count = activityMap.get(iso) ?? 0;
			const future = iso > today;

			if (!future) realCounts.push(count);

			days.push({
				date: iso,
				count,
				level: 0,
				future
			});
		}

		// Scale the intensity to the busiest day in this year.
		const maximum = Math.max(0, ...realCounts);

		for (const day of days) {
			if (!day || day.future || day.count === 0) continue;

			const ratio = maximum > 0 ? day.count / maximum : 0;

			day.level = ratio >= 0.75 ? 4 : ratio >= 0.4 ? 3 : ratio >= 0.15 ? 2 : 1;
		}

		const weeks: (CalendarDay | null)[][] = [];

		for (let i = 0; i < days.length; i += 7) {
			weeks.push(days.slice(i, i + 7));
		}

		const months: { label: string; week: number }[] = [];

		for (let month = 0; month < 12; month++) {
			const first = new Date(Date.UTC(selectedYear, month, 1));

			const week = Math.floor((first.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));

			months.push({
				label: monthFormatter.format(first),
				week
			});
		}

		const activeDays = realCounts.filter((count) => count > 0).length;
		const totalPlays = realCounts.reduce((sum, count) => sum + count, 0);

		return {
			weeks,
			months,
			totalPlays,
			activeDays,
			maximum
		};
	});

	function formatTooltip(day: CalendarDay) {
		const formatted = dateFormatter.format(new Date(`${day.date}T00:00:00Z`));

		return `${formatted}: ${day.count} ${day.count === 1 ? 'play' : 'plays'}`;
	}

	function levelColor(level: number) {
		return ['#1a2739', '#16495e', '#126c88', '#1598bb', '#38bdf8'][level];
	}

	function changeYear(event: Event) {
		const target = event.currentTarget as HTMLSelectElement;

		selectedYear = Number(target.value);
	}
</script>

<div class="flex h-full min-h-0 flex-col gap-3">
	<!-- Year and statistics -->
	<div class="flex shrink-0 flex-wrap items-center justify-between gap-3">
		<div class="flex flex-wrap items-center gap-x-4 gap-y-1">
			<div>
				<span class="text-[17px] font-semibold text-slate-100">
					{calendar.totalPlays.toLocaleString('en-BE')}
				</span>
				<span class="ml-1 text-[11px] text-slate-500"> plays </span>
			</div>

			<div>
				<span class="text-[17px] font-semibold text-slate-100">
					{calendar.activeDays}
				</span>
				<span class="ml-1 text-[11px] text-slate-500"> active days </span>
			</div>

			<div>
				<span class="text-[17px] font-semibold text-slate-100">
					{calendar.maximum}
				</span>
				<span class="ml-1 text-[11px] text-slate-500"> peak plays/day </span>
			</div>
		</div>

		<select
			aria-label="Select activity year"
			value={selectedYear}
			onchange={changeYear}
			class="rounded-lg border border-white/10 bg-[#111b2d] px-2.5 py-1.5 text-[11px] text-slate-200 outline-none focus:border-sky-400/40"
		>
			{#each years as year}
				<option value={year}>{year}</option>
			{/each}
		</select>
	</div>

	<!-- Calendar area -->
	<div
		class="overview-scrollbar flex min-h-0 flex-1 items-center overflow-x-auto overflow-y-hidden"
	>
		<div class="flex h-full w-full min-w-125 flex-col justify-center gap-3">
			<!-- Month labels -->
			<div class="relative ml-7 h-4 shrink-0">
				{#each calendar.months as month}
					<span
						class="absolute top-0 text-[10px] text-slate-500"
						style:left={`${(month.week / calendar.weeks.length) * 100}%`}
					>
						{month.label}
					</span>
				{/each}
			</div>

			<!-- Weekday labels + squares -->
			<div class="flex h-30 shrink-0 items-stretch gap-2">
				<div class="flex w-5 shrink-0 flex-col justify-between gap-0.75">
					{#each weekdays as weekday}
						<span class="flex min-h-0 flex-1 items-center text-[9px] text-slate-600">
							{weekday}
						</span>
					{/each}
				</div>

				<div class="flex min-w-0 flex-1 gap-1">
					{#each calendar.weeks as week, weekIndex}
						<div class="flex min-w-0 flex-1 flex-col gap-1" aria-label={`Week ${weekIndex + 1}`}>
							{#each week as day, dayIndex}
								{#if day && !day.future}
									<a
										href={`/history?dateFrom=${day.date}&dateTo=${day.date}`}
										title={formatTooltip(day)}
										aria-label={`${formatTooltip(day)}. View history.`}
										class="min-h-0 flex-1 rounded-[3px] border border-white/4 transition-all duration-150 hover:z-10 hover:scale-125 hover:border-sky-200/70 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-sky-300"
										style:background-color={levelColor(day.level)}
									></a>
								{:else}
									<span
										class="min-h-0 flex-1 rounded-[3px]"
										style:background-color={day?.future ? 'rgba(148,163,184,.035)' : 'transparent'}
										aria-hidden="true"
									></span>
								{/if}
							{/each}
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>

	<!-- Legend -->
	<div class="flex shrink-0 items-center justify-between gap-3">
		<p class="text-[10px] text-slate-500">Select a day to explore its history</p>

		<div class="flex items-center gap-1.5">
			<span class="text-[10px] text-slate-500">Less</span>

			{#each [0, 1, 2, 3, 4] as level}
				<span class="h-2.5 w-2.5 rounded-[3px]" style:background-color={levelColor(level)}></span>
			{/each}

			<span class="text-[10px] text-slate-500">More</span>
		</div>
	</div>
</div>
