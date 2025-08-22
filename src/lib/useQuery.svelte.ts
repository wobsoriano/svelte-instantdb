import {
	weakHash,
	coerceQuery,
	type InstaQLParams,
	InstantCoreDatabase,
	type InstaQLLifecycleState,
	type InstantSchemaDef,
	type InstaQLOptions,
	type ValidQuery
} from '@instantdb/core';

import { toValue, type MaybeGetter, type ReactiveValue } from './utils.js';

function stateForResult(result: any) {
	return {
		isLoading: !result,
		data: undefined,
		pageInfo: undefined,
		error: undefined,
		...(result ? result : {})
	};
}

export function useQueryInternal<
	Q extends ValidQuery<Q, Schema>,
	Schema extends InstantSchemaDef<any, any, any>,
	UseDates extends boolean
>(
	_core: InstantCoreDatabase<Schema, UseDates>,
	_query: MaybeGetter<null | Q>,
	_opts?: InstaQLOptions
): ReactiveValue<{
	state: InstaQLLifecycleState<Schema, Q, UseDates>;
	query: any;
}> {
	const query = $derived.by(() => {
		let finalQuery = toValue(_query);
		if (finalQuery && _opts && 'ruleParams' in _opts) {
			finalQuery = { $$ruleParams: _opts['ruleParams'], ...finalQuery };
		}
		return finalQuery ? coerceQuery(finalQuery) : null;
	});
	const queryHash = $derived(weakHash(query));

	const state = $state<InstaQLLifecycleState<Schema, Q, UseDates>>(
		stateForResult(_core._reactor.getPreviousResult(query))
	);

	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		queryHash;

		// Don't subscribe if query is null
		if (!query) {
			return () => {};
		}

		const unsubscribe = _core.subscribeQuery<Q, UseDates>(query, (result) => {
			state.isLoading = !result;
			state.data = result.data;
			state.pageInfo = result.pageInfo;
			state.error = result.error;
		});

		return () => {
			unsubscribe();
		};
	});

	return {
		get current() {
			return {
				state,
				query
			};
		}
	};
}
