
<script lang="ts">
    import Chart from '../lib/components/charts/Chart.svelte';
    import type { EChartsOption } from 'echarts';
    import type { PageData } from './$types.js';

    let { data }: { data: PageData } = $props();

    const formatNumber = new Intl.NumberFormat('en-BE');

    const theme = {
        accent: '#38bdf8',
        accentBright: '#7dd3fc',
        text: '#94a3b8',
        grid: 'rgba(148,163,184,0.10)'
    };

    const cards = $derived([
        { label: 'Library tracks', value: data.kpis.totalTracks },
        { label: 'Historical plays', value: data.kpis.totalPlays },
        { label: 'DJ sessions', value: data.kpis.totalSessions },
        { label: 'Played library tracks', value: data.kpis.playedTracks }
    ]);

    // --------------------------------------------------
    // Monthly activity: vertical bar chart
    // --------------------------------------------------

    const activityChart = $derived.by((): EChartsOption => ({
        animationDuration: 450,
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            valueFormatter: (value) => `${value} plays`
        },
        grid: {
            left: 38,
            right: 12,
            top: 14,
            bottom: 30
        },
        xAxis: {
            type: 'category',
            data: data.monthlyActivity.map(row => row.month),
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: {
                color: theme.text,
                fontSize: 10,
                hideOverlap: true
            }
        },
        yAxis: {
            type: 'value',
            minInterval: 1,
            splitLine: {
                lineStyle: { color: theme.grid }
            },
            axisLabel: {
                color: theme.text,
                fontSize: 10
            }
        },
        series: [{
            name: 'Plays',
            type: 'bar',
            barMaxWidth: 36,
            data: data.monthlyActivity.map(row => row.total),
            itemStyle: {
                color: theme.accent,
                borderRadius: [4, 4, 0, 0],
                opacity: 0.85
            },
            emphasis: {
                itemStyle: {
                    color: theme.accentBright,
                    opacity: 1
                }
            }
        }]
    }));

    // --------------------------------------------------
    // Top artists: compact horizontal bars
    // --------------------------------------------------

    const artistChart = $derived.by((): EChartsOption => {
        const artists = [...data.topArtists].reverse();

        return {
            animationDuration: 450,
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' }
            },
            grid: {
                left: 105,
                right: 28,
                top: 5,
                bottom: 20
            },
            xAxis: {
                type: 'value',
                minInterval: 1,
                splitLine: { show: false },
                axisLine: { show: false },
                axisLabel: {
                    color: theme.text,
                    fontSize: 10
                }
            },
            yAxis: {
                type: 'category',
                data: artists.map(row => row.artist ?? 'Unknown'),
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: {
                    color: '#cbd5e1',
                    fontSize: 11,
                    width: 92,
                    overflow: 'truncate'
                }
            },
            series: [{
                name: 'Plays',
                type: 'bar',
                barMaxWidth: 12,
                data: artists.map(row => row.total),
                itemStyle: {
                    color: theme.accent,
                    borderRadius: [0, 3, 3, 0],
                    opacity: 0.85
                },
                emphasis: {
                    itemStyle: {
                        opacity: 1,
                        color: theme.accentBright
                    }
                }
            }]
        };
    });

    // --------------------------------------------------
    // Hourly distribution: 24-hour bar chart
    // --------------------------------------------------

    const hours = Array.from({ length: 24 }, (_, i) => i);

    const hourlyValues = $derived.by(() => {
        const counts = new Map(
            data.hourlyActivity.map(row => [row.hour, row.total])
        );

        return hours.map(hour => counts.get(hour) ?? 0);
    });

    const peakHour = $derived.by(() => {
        const max = Math.max(0, ...hourlyValues);
        if (max === 0) return null;

        const index = hourlyValues.indexOf(max);
        return `${String(index).padStart(2, '0')}:00`;
    });

    const hourlyChart = $derived.by((): EChartsOption => {
        const max = Math.max(0, ...hourlyValues);

        return {
            animationDuration: 450,
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' }
            },
            grid: {
                left: 38,
                right: 10,
                top: 14,
                bottom: 30
            },
            xAxis: {
                type: 'category',
                data: hours.map(hour =>
                    `${String(hour).padStart(2, '0')}:00`
                ),
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: {
                    color: theme.text,
                    fontSize: 10,
                    interval: 3
                }
            },
            yAxis: {
                type: 'value',
                minInterval: 1,
                splitLine: {
                    lineStyle: { color: theme.grid }
                },
                axisLabel: {
                    color: theme.text,
                    fontSize: 10
                }
            },
            series: [{
                name: 'Plays',
                type: 'bar',
                barMaxWidth: 18,
                data: hourlyValues,
                itemStyle: {
                    color: (params) =>
                        params.value === max && max > 0
                            ? theme.accentBright
                            : theme.accent,
                    borderRadius: [3, 3, 0, 0],
                    opacity: 0.85
                },
                emphasis: {
                    itemStyle: { opacity: 1 }
                }
            }]
        };
    });

    function formatDate(value: string) {
        const [year, month, day] = value.split('-');
        return `${day}/${month}/${year}`;
    }
</script>

<svelte:head>
    <title>Overview | VirtualDJ Insights</title>
</svelte:head>

<div class="overview-page flex h-full min-h-0 flex-col gap-3.5">

    <!-- Header -->
    <header class="flex shrink-0 items-center justify-between">
        <div>
            <h1 class="text-[23px] font-semibold tracking-tight text-slate-100">
                Overview
            </h1>
            <p class="mt-0.5 text-xs text-slate-400">
                Your music and DJ activity at a glance
            </p>
        </div>
    </header>

    <!-- Statistics -->
    <div class="grid shrink-0 grid-cols-2 gap-3 xl:grid-cols-4">
        {#each cards as card}
            <div class="overview-surface rounded-xl px-4 py-3.5">
                <p class="text-[11px] font-medium text-slate-400">
                    {card.label}
                </p>
                <p class="mt-1.5 text-[27px] leading-none font-semibold tracking-tight text-slate-100">
                    {formatNumber.format(card.value)}
                </p>
            </div>
        {/each}
    </div>

    <!-- Visualizations -->
    <div class="grid min-h-0 flex-1 grid-cols-12 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-3.5">

        <!-- Monthly activity -->
        <section class="overview-surface col-span-12 flex min-h-0 flex-col rounded-xl p-4 xl:col-span-8">
            <div class="mb-2 shrink-0">
                <h2 class="text-[13px] font-semibold text-slate-100">
                    Playing activity
                </h2>
                <p class="mt-0.5 text-[11px] text-slate-400">
                    Monthly track plays
                </p>
            </div>

            <div class="min-h-0 flex-1">
                <Chart option={activityChart} height={210} />
            </div>
        </section>

        <!-- Recent sessions -->
        <section class="overview-surface col-span-12 flex min-h-0 flex-col rounded-xl p-4 xl:col-span-4">
            <div class="mb-2 shrink-0">
                <h2 class="text-[13px] font-semibold text-slate-100">
                    Recent sessions
                </h2>
                <p class="mt-0.5 text-[11px] text-slate-400">
                    Your latest recorded sessions
                </p>
            </div>

            <div class="min-h-0 flex-1 overflow-y-auto pr-1">
                {#each data.recentSessions as session (session.id)}
                    <a
                        href={`/sessions/${session.id}`}
                        class="session-row flex items-center justify-between gap-3 rounded-lg px-3 py-2.5"
                    >
                        <div class="min-w-0">
                            <p class="text-[12px] font-medium text-slate-200">
                                {formatDate(session.sessionDate)}
                            </p>
                            <p class="mt-0.5 text-[11px] text-slate-500">
                                {session.startedAt?.slice(11, 16) ?? '-'}
                            </p>
                        </div>
                        <div class="text-right">
                            <p class="text-[12px] font-semibold text-slate-200">
                                {session.trackCount}
                            </p>
                            <p class="text-[10px] text-slate-500">
                                tracks
                            </p>
                        </div>
                    </a>
                {:else}
                    <p class="py-8 text-center text-xs text-slate-400">
                        No sessions recorded
                    </p>
                {/each}
            </div>
        </section>

        <!-- Artists -->
        <section class="overview-surface col-span-12 flex min-h-0 flex-col rounded-xl p-4 xl:col-span-6">
            <div class="mb-2 shrink-0">
                <h2 class="text-[13px] font-semibold text-slate-100">
                    Top played artists
                </h2>
                <p class="mt-0.5 text-[11px] text-slate-400">
                    Most frequent in your playing history
                </p>
            </div>

            <div class="min-h-0 flex-1">
                <Chart option={artistChart} height={210} />
            </div>
        </section>

        <!-- Hours -->
        <section class="overview-surface col-span-12 flex min-h-0 flex-col rounded-xl p-4 xl:col-span-6">
            <div class="mb-2 flex shrink-0 items-start justify-between">
                <div>
                    <h2 class="text-[13px] font-semibold text-slate-100">
                        Playing hours
                    </h2>
                    <p class="mt-0.5 text-[11px] text-slate-400">
                        Track starts throughout the day
                    </p>
                </div>

                {#if peakHour}
                    <div class="text-right">
                        <p class="text-[10px] text-slate-500">
                            Most active hour
                        </p>
                        <p class="text-[13px] font-semibold text-sky-300">
                            {peakHour}
                        </p>
                    </div>
                {/if}
            </div>

            <div class="min-h-0 flex-1">
                <Chart option={hourlyChart} height={210} />
            </div>
        </section>
    </div>
</div>
