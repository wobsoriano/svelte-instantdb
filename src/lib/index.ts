import {
	id,
	tx,
	lookup,
	i,

	// types
	type QueryResponse,
	type InstantQuery,
	type InstantQueryResult,
	type InstantSchema,
	type InstantObject,
	type User,
	type AuthState,
	type Query,
	type Config,
	type InstaQLQueryParams
} from '@instantdb/core';

import { InstantSvelte } from './InstantSvelte.js';
import { InstantSvelteWeb } from './InstantSvelteWeb.js';
import { init, init_experimental } from './init.js';
import Cursors from './Cursors.svelte';

export {
	id,
	tx,
	lookup,
	init,
	init_experimental,
	InstantSvelteWeb,
	Cursors,
	i,

	// internal
	InstantSvelte,

	// types
	type Config,
	type Query,
	type QueryResponse,
	type InstantObject,
	type User,
	type AuthState,
	type InstantQuery,
	type InstantQueryResult,
	type InstantSchema,
	type InstaQLQueryParams
};
