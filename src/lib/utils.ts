export type MaybeGetter<T> = T | (() => T);

export function toValue<T>(value: MaybeGetter<T>): T {
	return typeof value === 'function' ? (value as () => T)() : value;
}
