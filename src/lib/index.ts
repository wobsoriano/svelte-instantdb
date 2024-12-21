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
	type InstantEntity,
	type InstantSchemaDatabase,
	type IInstantDatabase,
	type User,
	type AuthState,
	type Query,
	type Config,
	type InstaQLParams,
	type ConnectionStatus,

	// schema types
	type AttrsDefs,
	type CardinalityKind,
	type DataAttrDef,
	type EntitiesDef,
	type EntitiesWithLinks,
	type EntityDef,
	type InstantGraph,
	type LinkAttrDef,
	type LinkDef,
	type LinksDef,
	type ResolveAttrs,
	type ValueTypes,
	type InstaQLEntity,
	type InstaQLResult,
	type InstantUnknownSchema,
	type InstantSchemaDef,
	type BackwardsCompatibleSchema,
	type InstantRules
} from '@instantdb/core';

import InstantSvelteAbstractDatabase from './InstantSvelteAbstractDatabase.svelte.js';
import InstantSvelteWebDatabase from './InstantSvelteWebDatabase.js';
import { init, init_experimental } from './init.js';
import Cursors from './Cursors.svelte';

export {
	id,
	tx,
	lookup,
	init,
	init_experimental,
	InstantSvelteWebDatabase,
	Cursors,
	i,

	// internal
	InstantSvelteAbstractDatabase,

	// types
	type Config,
	type Query,
	type QueryResponse,
	type InstantObject,
	type User,
	type AuthState,
	type ConnectionStatus,
	type InstantQuery,
	type InstantQueryResult,
	type InstantSchema,
	type InstantEntity,
	type InstantSchemaDatabase,
	type IInstantDatabase,
	type InstaQLParams,

	// schema types
	type AttrsDefs,
	type CardinalityKind,
	type DataAttrDef,
	type EntitiesDef,
	type EntitiesWithLinks,
	type EntityDef,
	type InstantGraph,
	type LinkAttrDef,
	type LinkDef,
	type LinksDef,
	type ResolveAttrs,
	type ValueTypes,
	type InstaQLEntity,
	type InstaQLResult,
	type InstantUnknownSchema,
	type InstantSchemaDef,
	type BackwardsCompatibleSchema,
	type InstantRules
};
