import type { Readable } from 'svelte/store';

export type StoreOrVal<T> = T | Readable<T>;

export function isSvelteStore<T extends object>(obj: StoreOrVal<T>): obj is Readable<T> {
	return 'subscribe' in obj && typeof obj.subscribe === 'function';
}
