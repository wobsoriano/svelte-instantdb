import { type Readable, get } from 'svelte/store';

type ReadableValue<T> = T extends Readable<infer U> ? U : never;

export function toStateRune<T extends Readable<unknown>>(store: T) {
	let current = $state(get(store) as ReadableValue<T>);

	$effect.pre(() => {
		return store.subscribe((v) => {
			current = v as ReadableValue<T>;
		});
	});

	return {
		get current() {
			return current;
		}
	};
}
