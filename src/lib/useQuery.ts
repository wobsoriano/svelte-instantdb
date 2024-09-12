import {
	coerceQuery,
	type Query,
	type Exactly,
	InstantClient,
	type LifecycleSubscriptionState,
	type InstaQLQueryParams,
	i
} from '@instantdb/core';

import { writable, type Readable } from 'svelte/store';
import { onMount } from 'svelte';

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
	Q extends Schema extends i.InstantGraph<any, any>
		? InstaQLQueryParams<Schema>
		: Exactly<Query, Q>,
	Schema,
	WithCardinalityInference extends boolean
>(
	_core: InstantClient<Schema, any, WithCardinalityInference>,
	_query: null | Q
): {
	state: Readable<LifecycleSubscriptionState<Q, Schema, WithCardinalityInference>>;
	query: any;
} {
	const query = _query ? coerceQuery(_query) : null;
	const { subscribe, set } = writable<
		LifecycleSubscriptionState<Q, Schema, WithCardinalityInference>
	>(stateForResult(_core._reactor.getPreviousResult(query)));

	onMount(() => {
		return _core.subscribeQuery<Q>(query, (result) => {
			set(stateForResult(result));
		});
	});

	return {
		state: { subscribe },
		query
	};
}
