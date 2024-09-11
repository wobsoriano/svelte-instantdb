import { onDestroy } from 'svelte';

export function useTimeout() {
	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	function set(delay: number, fn: () => void) {
		clear();
		timeoutId = setTimeout(fn, delay);
	}

	function clear() {
		if (timeoutId !== null) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}
	}

	onDestroy(clear);

	return { set, clear };
}
