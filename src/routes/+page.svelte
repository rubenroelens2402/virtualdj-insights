
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
        textBright: '#cbd5e1',
        grid: 'rgba(148,163,184,0.09)'
    };

    // --------------------------------------------------
    // KPI cards
    // --------------------------------------------------

    const cards = $derived([
        { label: 'Library tracks', value: data.kpis.totalTracks },
        { label: 'Historical plays', value: data.kpis.totalPlays },
        { label: 'DJ sessions', value: data.kpis.totalSessions },
        { label: 'Played library tracks', value: data.kpis.playedTracks }
    ]);

    // --------------------------------------------------
    // Playing activity — monthly bar chart
    // --------------------------------------------------

    const activityChart = $derived.by((): EChartsOption => ({
        backgroundColor: 'transparent',
        animationDuration: 400,

        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            valueFormatter: value => `${value} plays`
        },

        grid: {
            left: 38,
            right: 14,
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
                lineStyle: {
                    color: theme.grid
                }
            },
            axisLabel: {
                color: theme.text,
                fontSize: 10
            }
        },

        series: [{
            name: 'Plays',
            type: 'bar',
            barMaxWidth: 34,
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
    // Top artists — horizontal bar chart
    // --------------------------------------------------

    const artistChart = $derived.by((): EChartsOption => {
        const artists = [...data.topArtists].reverse();

        return {
            backgroundColor: 'transparent',
            animationDuration: 400,

            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' }
            },

            grid: {
                left: 110,
                right: 24,
                top: 8,
                bottom: 22
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
                    color: theme.textBright,
                    fontSize: 11,
                    width: 95,
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
                        color: theme.accentBright,
                        opacity: 1
                    }
                }
            }]
        };
    });

    // --------------------------------------------------
    // Playing hours — 24-hour distribution
    // --------------------------------------------------

    const hours = Array.from({ length: 24 }, (_, index) => index);

    const hourlyValues = $derived.by(() => {
        const counts = new Map(
            data.hourlyActivity.map(row => [row.hour, row.total])
        );

        return hours.map(hour => counts.get(hour) ?? 0);
    });

    const peakHour = $derived.by(() => {
        const maximum = Math.max(0, ...hourlyValues);

        if (maximum === 0) return null;

        const hour = hourlyValues.indexOf(maximum);

        return `${String(hour).padStart(2, '0')}:00`;
    });

    const hourlyChart = $derived.by((): EChartsOption => {
        const maximum = Math.max(0, ...hourlyValues);

        return {
            backgroundColor: 'transparent',
            animationDuration: 400,

            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                }
            },

            grid: {
                left: 38,
                right: 12,
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
                    lineStyle: {
                        color: theme.grid
                    }
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
                    color: params =>
                        params.value === maximum && maximum > 0
                            ? theme.accentBright
                            : theme.accent,
                    borderRadius: [3, 3, 0, 0],
                    opacity: 0.85
                },
                emphasis: {
                    itemStyle: {
                        opacity: 1
                    }
                }
            }]
        };
    });

    // --------------------------------------------------
    // Formatters
    // --------------------------------------------------

    function formatDate(value: string) {
        const [year, month, day] = value.split('-');
        return `${day}/${month}/${year}`;
    }
</script>

<svelte:head>
    <title>Overview | VirtualDJ Insights</title>
    <meta
        name="description"
        content="Explore your music library, playing history and DJ sessions."
    />
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

    <!-- KPIs -->
    <div class="grid shrink-0 grid-cols-2 gap-3 xl:grid-cols-4">
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

    <!-- Dashboard grid -->
    <div class="overview-dashboard-grid grid min-h-0 flex-1 grid-cols-12 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-3.5">

        <!-- Monthly playing activity -->
        <section class="overview-surface col-span-12 flex min-h-0 flex-col p-4 xl:col-span-8">
            <div class="mb-2 shrink-0">
                <h2 class="panel-title">
                    Playing activity
                </h2>

                <p class="panel-description">
                    Monthly track plays
                </p>
            </div>

            <div class="min-h-0 flex-1">
                <Chart option={activityChart} height={210} />
            </div>
        </section>

        <!-- Recent sessions -->
        <section class="overview-surface col-span-12 flex min-h-0 flex-col p-4 xl:col-span-4">
            <div class="mb-2 shrink-0">
                <h2 class="panel-title">
                    Recent sessions
                </h2>

                <p class="panel-description">
                    Latest recorded DJ sessions
                </p>
            </div>

            <div class="overview-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
                {#each data.recentSessions as session (session.id)}
                    <a
                        href={`/sessions/${session.id}`}
                        class="session-row items-center justify-between gap-3 rounded-lg px-3 py-2.5"
                    >
                        <div class="min-w-0">
                            <p class="text-[12px] font-medium text-slate-200">
                                {formatDate(session.sessionDate)}
                            </p>

                            <p class="mt-0.5 text-[11px] text-slate-500">
                                {session.startedAt?.slice(11, 16) ?? '-'}
                            </p>
                        </div>

                        <div class="shrink-0 text-right">
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

        <!-- Top artists -->
        <section class="overview-surface col-span-12 flex min-h-0 flex-col p-4 xl:col-span-6">
            <div class="mb-2 shrink-0">
                <h2 class="panel-title">
                    Top played artists
                </h2>

                <p class="panel-description">
                    Most frequent in your playing history
                </p>
            </div>

            <div class="min-h-0 flex-1">
                <Chart option={artistChart} height={210} />
            </div>
        </section>

        <!-- Playing hours -->
        <section class="overview-surface col-span-12 flex min-h-0 flex-col p-4 xl:col-span-6">
            <div class="mb-2 flex shrink-0 items-start justify-between gap-3">
                <div>
                    <h2 class="panel-title">
                        Playing hours
                    </h2>

                    <p class="panel-description">
                        Track starts throughout the day
                    </p>
                </div>

                {#if peakHour}
                    <div class="shrink-0 text-right">
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
