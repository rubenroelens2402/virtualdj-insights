<script lang="ts">
    import './layout.css';

    let { children } = $props();

    const navigation = [
        { name: 'Overview', href: '/' },
        { name: 'Library', href: '/library' },
        { name: 'History', href: '/history' },
        { name: 'Sessions', href: '/sessions' }
    ];
</script>

<div class="flex h-screen overflow-hidden bg-transparent text-slate-100">
    <aside class="w-60 shrink-0 border-r border-white/8 bg-slate-950/35 backdrop-blur-xl">
        <div class="flex h-full flex-col px-5 py-5">
            <a href="/" class="text-xl font-semibold tracking-tight text-white">
                VirtualDJ Insights
            </a>

            <nav class="mt-8 flex flex-col gap-2">
                {#each navigation as item}
                    <a href={item.href} class="nav-link">
                        {item.name}
                    </a>
                {/each}
            </nav>
        </div>
    </aside>

    <main class="min-w-0 flex-1 overflow-auto overview-scrollbar">
        <div class="h-full p-4 xl:p-5">
            {@render children()}
        </div>
    </main>
</div>