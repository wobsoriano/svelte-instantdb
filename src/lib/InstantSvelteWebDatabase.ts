import type { InstantSchemaDef } from '@instantdb/core';
import InstantSvelteAbstractDatabase from './InstantSvelteAbstractDatabase.svelte.js';

export default class InstantSvelteWebDatabase<
	Schema extends InstantSchemaDef<any, any, any>
> extends InstantSvelteAbstractDatabase<Schema> {}
