import type { InstantConfig, InstantSchemaDef } from '@instantdb/core';
import InstantSvelteAbstractDatabase from './InstantSvelteAbstractDatabase.svelte.js';

export default class InstantSvelteWebDatabase<
	Schema extends InstantSchemaDef<any, any, any>,
	Config extends InstantConfig<Schema, boolean> = InstantConfig<Schema, false>
> extends InstantSvelteAbstractDatabase<Schema, Config> {}
