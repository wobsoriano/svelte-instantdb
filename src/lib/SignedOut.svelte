<script lang="ts">
	import type { InstantSchemaDef } from '@instantdb/core';
	import type InstantSvelteWebDatabase from './InstantSvelteWebDatabase.js';
	import type { Snippet } from 'svelte';

	const {
		children,
		db
	}: { db: InstantSvelteWebDatabase<InstantSchemaDef<any, any, any>>; children: Snippet } =
		$props();

	const auth = db.useAuth();
</script>

{#if !auth.current.isLoading && !auth.current.error && !auth.current.user}
	{@render children()}
{/if}
