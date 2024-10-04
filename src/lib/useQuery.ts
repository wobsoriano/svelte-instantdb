import {
	coerceQuery,
	type Query,
	type Exactly,
	type InstantClient,
	type LifecycleSubscriptionState,
	type InstaQLQueryParams,
	type InstantGraph
} from '@instantdb/core';

import { readable, type Readable } from 'svelte/store';
import { browser } from '$app/environment';

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
	_query: null | Q
): {
	state: Readable<LifecycleSubscriptionState<Q, Schema, WithCardinalityInference>>;
	query: any;
} {
	const query = _query ? coerceQuery(_query) : null;

	const state = readable<LifecycleSubscriptionState<Q, Schema, WithCardinalityInference>>(
		stateForResult(_core._reactor.getPreviousResult(query)),
		(set) => {
			if (browser) {
				return _core.subscribeQuery<Q>(query, (result) => {
					set(stateForResult(result));
				});
			}
		}
	);

	return {
		state,
		query
	};
}
