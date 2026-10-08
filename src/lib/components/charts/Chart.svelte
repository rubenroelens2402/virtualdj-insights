
<script lang="ts">
    import { onMount } from 'svelte';
    import type { ECharts, EChartsOption } from 'echarts';

    let {
        option,
        height = 280
    }: {
        option: EChartsOption;
        height?: number;
    } = $props();

    let container: HTMLDivElement;
    let chart = $state<ECharts | null>(null);

    onMount(() => {
        let active = true;
        let instance: ECharts | null = null;
        let observer: ResizeObserver | null = null;

        async function initialize() {
            const echarts = await import('echarts');

            if (!active) return;

            instance = echarts.init(container, 'dark');
            chart = instance;

            observer = new ResizeObserver(() => {
                instance?.resize();
            });

            observer.observe(container);
        }

        void initialize();

        return () => {
            active = false;
            observer?.disconnect();
            instance?.dispose();
            chart = null;
        };
    });

    $effect(() => {
        if (!chart) return;

        chart.setOption({
            backgroundColor: 'transparent',
            ...option
        }, true);
    });
</script>

<div
    bind:this={container}
    style:height={`${height}px`}
    class="w-full"
></div>
