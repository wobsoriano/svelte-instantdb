import { i, type RoomSchemaShape } from '@instantdb/core';
import { InstantSvelte } from './InstantSvelte.js';

export class InstantSvelteWeb<
	Schema extends i.InstantGraph<any, any> | {} = {},
	RoomSchema extends RoomSchemaShape = {},
	WithCardinalityInference extends boolean = false
> extends InstantSvelte<Schema, RoomSchema, WithCardinalityInference> {}
