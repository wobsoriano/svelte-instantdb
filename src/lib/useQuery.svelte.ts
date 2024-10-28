import {
	coerceQuery,
	weakHash,
	type Query,
	type Exactly,
	type InstantClient,
	type LifecycleSubscriptionState,
	type InstaQLQueryParams,
	type InstantGraph
} from '@instantdb/core';

import { toValue, type MaybeGetter } from './utils.js';

function stateForResult(result: any) {
	return {
		isLoading: !result,
		data: undefined,
		pageInfo: undefined,
		error: undefined,
		...(result ? result : {})
	};
}

export function useQuery<
	Q extends Schema extends InstantGraph<any, any> ? InstaQLQueryParams<Schema> : Exactly<Query, Q>,
	Schema extends InstantGraph<any, any, any> | {},
	WithCardinalityInference extends boolean
>(
	_core: InstantClient<Schema, any, WithCardinalityInference>,
	_query: MaybeGetter<null | Q>
): {
	state: LifecycleSubscriptionState<Q, Schema, WithCardinalityInference>;
	query: any;
} {
	const query = $derived(toValue(_query) ? coerceQuery(toValue(_query)) : null);
	const queryHash = $derived(weakHash(query));

	const state = $state<LifecycleSubscriptionState<Q, Schema, WithCardinalityInference>>(
		stateForResult(_core._reactor.getPreviousResult(query))
	);

	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		queryHash;

		if (!query) {
			return () => {};
		}

		const unsubscribe = _core.subscribeQuery<Q>(query, (result) => {
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
		get state() {
			return state;
		},
		get query() {
			return query;
		}
	};
}
