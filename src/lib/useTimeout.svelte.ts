import { untrack } from 'svelte';

export function useTimeout() {
	let timeoutRef = $state<ReturnType<typeof setTimeout> | null>(null);

	$effect(() => {
		untrack(() => clear());
	});

	function set(delay: number, fn: () => void) {
		clearTimeout(timeoutRef);
		timeoutRef = setTimeout(fn, delay);
	}

	function clear() {
		clearTimeout(timeoutRef);
	}

	return { set, clear };
}
