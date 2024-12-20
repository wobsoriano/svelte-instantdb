import type { InstantGraph, RoomSchemaShape } from '@instantdb/core';
import { InstantSvelte } from './InstantSvelte.svelte.js';

export class InstantSvelteWeb<
	Schema extends InstantGraph<any, any> | {} = {},
	RoomSchema extends RoomSchemaShape = {},
	WithCardinalityInference extends boolean = false
> extends InstantSvelte<Schema, RoomSchema, WithCardinalityInference> {}
