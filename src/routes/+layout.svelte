<script lang="ts">
	import './layout.css';
	import { page } from '$app/state';
	import { invalidateAll } from '$app/navigation';

	let { children } = $props();

	type SyncType = 'library' | 'history';

	const navigation = [
		{ name: 'Overview', href: '/', icon: 'overview' },
		{ name: 'Library', href: '/library', icon: 'library' },
		{ name: 'History', href: '/history', icon: 'history' },
		{ name: 'Sessions', href: '/sessions', icon: 'sessions' }
	] as const;

	let syncing = $state<SyncType | null>(null);
	let syncMessage = $state('');
	let syncError = $state(false);

	function isActive(href: string) {
		return href === '/'
			? page.url.pathname === '/'
			: page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
	}

	async function sync(type: SyncType) {
		if (syncing) return;

		syncing = type;
		syncMessage = '';
		syncError = false;

		const endpoint = type === 'library' ? '/api/sync' : '/api/sync/history';

		try {
			const response = await fetch(endpoint, {
				method: 'POST'
			});

			const result = await response.json();

			if (!response.ok || result.success === false) {
				throw new Error(
					result.error ?? result.message ?? `Synchronization failed (${response.status})`
				);
			}

			syncMessage =
				type === 'library'
					? `Library synced${typeof result.processed === 'number' ? ` · ${result.processed} tracks` : ''}`
					: 'History synchronized successfully';

			// Reload all page.server.ts data without reloading the browser.
			await invalidateAll();
		} catch (error) {
			syncError = true;
			syncMessage =
				error instanceof Error ? error.message : 'An unexpected synchronization error occurred';
		} finally {
			syncing = null;
		}
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
			<div
				class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/10 text-sky-300"
			>
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
							<svg
								width="17"
								height="17"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.7"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"
							>
								<rect x="3" y="3" width="7" height="7" rx="1.5" />
								<rect x="14" y="3" width="7" height="7" rx="1.5" />
								<rect x="3" y="14" width="7" height="7" rx="1.5" />
								<rect x="14" y="14" width="7" height="7" rx="1.5" />
							</svg>
						{:else if item.icon === 'library'}
							<svg
								width="17"
								height="17"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.7"
								aria-hidden="true"
							>
								<circle cx="12" cy="12" r="9" />
								<circle cx="12" cy="12" r="2.5" />
								<path d="M12 3a9 9 0 0 1 9 9" />
							</svg>
						{:else if item.icon === 'history'}
							<svg
								width="17"
								height="17"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.7"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"
							>
								<path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
								<path d="M3 3v5h5" />
								<path d="M12 7v5l3 2" />
							</svg>
						{:else}
							<svg
								width="17"
								height="17"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.7"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"
							>
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

		<!-- Synchronization -->
		<div class="mt-auto px-3 pb-4">
			<div class="mb-3 border-t border-white/8 pt-4">
				<p class="px-3 text-[10px] font-semibold tracking-[.12em] text-slate-600 uppercase">
					Synchronization
				</p>
			</div>

			<div class="flex flex-col gap-1">
				<button
					type="button"
					class="nav-link w-full cursor-pointer text-left disabled:cursor-wait disabled:opacity-50"
					disabled={syncing !== null}
					onclick={() => sync('library')}
				>
					<svg
						width="17"
						height="17"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.7"
						stroke-linecap="round"
						stroke-linejoin="round"
						class:animate-spin={syncing === 'library'}
						aria-hidden="true"
					>
						<path d="M20 11a8 8 0 0 0-14-5L4 8" />
						<path d="M4 4v4h4" />
						<path d="M4 13a8 8 0 0 0 14 5l2-2" />
						<path d="M16 16h4v4" />
					</svg>

					<span>
						{syncing === 'library' ? 'Syncing library...' : 'Sync Library'}
					</span>
				</button>

				<button
					type="button"
					class="nav-link w-full cursor-pointer text-left disabled:cursor-wait disabled:opacity-50"
					disabled={syncing !== null}
					onclick={() => sync('history')}
				>
					<svg
						width="17"
						height="17"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.7"
						stroke-linecap="round"
						stroke-linejoin="round"
						class:animate-spin={syncing === 'history'}
						aria-hidden="true"
					>
						<path d="M20 11a8 8 0 0 0-14-5L4 8" />
						<path d="M4 4v4h4" />
						<path d="M4 13a8 8 0 0 0 14 5l2-2" />
						<path d="M16 16h4v4" />
					</svg>

					<span>
						{syncing === 'history' ? 'Syncing history...' : 'Sync History'}
					</span>
				</button>
			</div>

			{#if syncMessage}
				<div
					role="status"
					aria-live="polite"
					class={`mt-3 rounded-lg border px-3 py-2 text-[11px] leading-relaxed break-words ${
						syncError
							? 'border-red-400/20 bg-red-400/5 text-red-300'
							: 'border-emerald-400/15 bg-emerald-400/5 text-emerald-300'
					}`}
				>
					{syncMessage}
				</div>
			{/if}
		</div>

		<!-- Footer -->
		<div class="border-t border-white/5 px-5 py-4">
			<p class="text-[11px] text-slate-500">Local installation</p>
		</div>
	</aside>

	<!-- Main content -->
	<main class="app-main min-h-0 min-w-0 flex-1 overflow-hidden">
		<div class="app-main-content flex h-full min-h-0 flex-col overflow-hidden p-4 xl:p-5">
			{@render children()}
		</div>
	</main>
</div>
