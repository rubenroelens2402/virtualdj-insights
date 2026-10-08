<script lang="ts">
    import './layout.css';
    import { page } from '$app/state';

    let { children } = $props();

    const navigation = [
        { name: 'Overview', href: '/', icon: 'overview' },
        { name: 'Library', href: '/library', icon: 'library' },
        { name: 'History', href: '/history', icon: 'history' },
        { name: 'Sessions', href: '/sessions', icon: 'sessions' }
    ] as const;

    function isActive(href: string) {
        return href === '/'
            ? page.url.pathname === '/'
            : page.url.pathname === href ||
                page.url.pathname.startsWith(`${href}/`);
    }
</script>

<div class="app-background flex h-dvh overflow-hidden text-slate-100">

    <!-- Sidebar -->
    <aside class="app-sidebar flex w-52 shrink-0 flex-col sm:w-56">

        <!-- Brand -->
        <a
            href="/"
            class="flex items-center gap-3 px-4 pt-5 pb-7 sm:px-5"
            aria-label="VirtualDJ Insights home"
        >
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/10 text-sky-300">
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                >
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="2.5" />
                    <path d="M12 3a9 9 0 0 1 9 9" />
                </svg>
            </div>

            <div class="min-w-0">
                <p class="truncate text-[14px] font-semibold tracking-tight text-white">
                    VirtualDJ Insights
                </p>

                <p class="text-[10px] font-medium tracking-wider text-slate-500 uppercase">
                    Local analytics
                </p>
            </div>
        </a>

        <!-- Navigation -->
        <div class="px-3">
            <p class="mb-2 px-3 text-[10px] font-semibold tracking-[.12em] text-slate-600 uppercase">
                Workspace
            </p>

            <nav class="flex flex-col gap-1" aria-label="Main navigation">
                {#each navigation as item}
                    <a
                        href={item.href}
                        class="nav-link"
                        class:nav-link-active={isActive(item.href)}
                        aria-current={isActive(item.href) ? 'page' : undefined}
                    >
                        {#if item.icon === 'overview'}
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                            </svg>
                        {:else if item.icon === 'library'}
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
                                <circle cx="12" cy="12" r="9" />
                                <circle cx="12" cy="12" r="2.5" />
                                <path d="M12 3a9 9 0 0 1 9 9" />
                            </svg>
                        {:else if item.icon === 'history'}
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                                <path d="M3 3v5h5" />
                                <path d="M12 7v5l3 2" />
                            </svg>
                        {:else}
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <path d="M9 18V5l12-2v13" />
                                <circle cx="6" cy="18" r="3" />
                                <circle cx="18" cy="16" r="3" />
                            </svg>
                        {/if}

                        <span>{item.name}</span>

                        {#if isActive(item.href)}
                            <span class="ml-auto h-1.5 w-1.5 rounded-full bg-sky-400"></span>
                        {/if}
                    </a>
                {/each}
            </nav>
        </div>

        <!-- Sidebar footer -->
        <div class="mt-auto border-t border-white/5 px-5 py-4 text-[11px] text-slate-500">
            Local installation
        </div>
    </aside>

    <!-- Viewport-constrained content -->
    <main class="app-main min-h-0 min-w-0 flex-1 overflow-hidden">
        <div class="app-main-content flex h-full min-h-0 min-w-0 flex-col overflow-hidden p-4 xl:p-5">
            {@render children()}
        </div>
    </main>

</div>