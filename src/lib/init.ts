import type { InstantConfig, InstantSchemaDef, InstantUnknownSchema } from '@instantdb/core';

import InstantSvelteWebDatabase from './InstantSvelteWebDatabase.js';
import VERSION from './version.js';

/**
 *
 * The first step: init your application!
 *
 * Visit https://instantdb.com/dash to get your `appId` :)
 *
 * @example
 *  import { init } from "@instantdb/react"
 *
 *  const db = init({ appId: "my-app-id" })
 *
 *  // You can also provide a schema for type safety and editor autocomplete!
 *
 *  import { init } from "@instantdb/react"
 *  import schema from ""../instant.schema.ts";
 *
 *  const db = init({ appId: "my-app-id", schema })
 *
 *  // To learn more: https://instantdb.com/docs/modeling-data
 */
export function init<Schema extends InstantSchemaDef<any, any, any> = InstantUnknownSchema>(
	config: InstantConfig<Schema>
) {
	return new InstantSvelteWebDatabase<Schema>(config, {
		'svelte-instantdb': VERSION
	});
}

/**
 * @deprecated
 * `init_experimental` is deprecated. You can replace it with `init`.
 *
 * @example
 *
 * // Before
 * import { init_experimental } from "svelte-instantdb"
 * const db = init_experimental({  ...  });
 *
 * // After
 * import { init } from "svelte-instantdb"
 * const db = init({ ...  });
 */
export const init_experimental = init;
