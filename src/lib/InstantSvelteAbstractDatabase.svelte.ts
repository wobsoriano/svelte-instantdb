import {
	// types
	Auth,
	Storage,
	txInit,
	type AuthState,
	type ConnectionStatus,
	type TransactionChunk,
	type PresenceResponse,
	type RoomSchemaShape,
	type InstantConfig,
	type PageInfoResponse,
	InstantCoreDatabase,
	init as core_init,
	type InstaQLLifecycleState,
	type InstaQLResponse,
	type RoomsOf,
	type InstantSchemaDef,
	type IInstantDatabase,
	type InstaQLOptions,
	InstantError,
	type ValidQuery,
	type User
} from '@instantdb/core';
import { useQueryInternal } from './useQuery.svelte.js';
import { toValue, type MaybeGetter, type ReactiveValue } from './utils.js';
import { untrack } from 'svelte';
import { InstantSvelteRoom } from './InstantSvelteRoom.svelte.js';

export type PresenceHandle<PresenceShape, Keys extends keyof PresenceShape> = PresenceResponse<
	PresenceShape,
	Keys
> & {
	publishPresence: (data: Partial<PresenceShape>) => void;
};

export type TypingIndicatorOpts = {
	timeout?: number | null;
	stopOnEnter?: boolean;
	// Perf opt - `active` will always be an empty array
	writeOnly?: boolean;
};

export type TypingIndicatorHandle<PresenceShape> = {
	active: PresenceShape[];
	setActive(active: boolean): void;
	inputProps: {
		onkeydown: (e: KeyboardEvent) => void;
		onblur: () => void;
	};
};

export const defaultActivityStopTimeout = 1_000;

export default abstract class InstantSvelteAbstractDatabase<
	Schema extends InstantSchemaDef<any, any, any>,
	Config extends InstantConfig<Schema, boolean> = InstantConfig<Schema, false>,
	Rooms extends RoomSchemaShape = RoomsOf<Schema>
> implements IInstantDatabase<Schema>
{
	public tx = txInit<Schema>();

	public auth: Auth;
	public storage: Storage;
	public _core: InstantCoreDatabase<Schema, Config['useDateObjects']>;

	static Storage?: any;
	static NetworkListener?: any;

	constructor(config: InstantConfig<Schema>, versions?: { [key: string]: string }) {
		this._core = core_init<Schema, Config['useDateObjects']>(
			config,
			// @ts-expect-error because TS can't resolve subclass statics
			this.constructor.Storage,
			// @ts-expect-error because TS can't resolve subclass statics
			this.constructor.NetworkListener,
			versions
		);
		this.auth = this._core.auth;
		this.storage = this._core.storage;
	}

	/**
	 * Returns a unique ID for a given `name`. It's stored in local storage,
	 * so you will get the same ID across sessions.
	 *
	 * This is useful for generating IDs that could identify a local device or user.
	 *
	 * @example
	 *  const deviceId = await db.getLocalId('device');
	 */
	getLocalId = (name: string): Promise<string> => {
		return this._core.getLocalId(name);
	};

	/**
	 * A function that returns a unique ID for a given `name`. localIds are
	 * stored in local storage, so you will get the same ID across sessions.
	 *
	 * Initially returns `null`, and then loads the localId.
	 *
	 * @example
	 * const deviceId = db.useLocalId('device');
	 * if (!deviceId) return null; // loading
	 * console.log('Device ID:', deviceId)
	 */
	useLocalId = (name: MaybeGetter<string>): ReactiveValue<string | null> => {
		let localId = $state<string | null>(null);

		$effect(() => {
			untrack(async () => {
				localId = await this.getLocalId(toValue(name));
			});
		});

		return {
		  get current() {
        return localId;
      }
		};
	};

	/**
	 * Obtain a handle to a room, which allows you to listen to topics and presence data
	 *
	 * If you don't provide a `type` or `id`, Instant will default to `_defaultRoomType` and `_defaultRoomId`
	 * as the room type and id, respectively.
	 *
	 * @see https://instantdb.com/docs/presence-and-topics
	 *
	 * @example
	 *  const {
	 *   useTopicEffect,
	 *   usePublishTopic,
	 *   useSyncPresence,
	 *   useTypingIndicator,
	 * } = db.room(roomType, roomId);
	 */
	room<RoomType extends keyof Rooms>(
		type: MaybeGetter<RoomType> = '_defaultRoomType' as RoomType,
		id: MaybeGetter<string> = '_defaultRoomId'
	) {
		return new InstantSvelteRoom<Schema, Rooms, RoomType>(this._core, type, id);
	}

	/**
	 * Use this to write data! You can create, update, delete, and link objects
	 *
	 * @see https://instantdb.com/docs/instaml
	 *
	 * @example
	 *   // Create a new object in the `goals` namespace
	 *   const goalId = id();
	 *   db.transact(tx.goals[goalId].update({title: "Get fit"}))
	 *
	 *   // Update the title
	 *   db.transact(tx.goals[goalId].update({title: "Get super fit"}))
	 *
	 *   // Delete it
	 *   db.transact(tx.goals[goalId].delete())
	 *
	 *   // Or create an association:
	 *   todoId = id();
	 *   db.transact([
	 *    tx.todos[todoId].update({ title: 'Go on a run' }),
	 *    tx.goals[goalId].link({todos: todoId}),
	 *  ])
	 */
	transact = (chunks: TransactionChunk<any, any> | TransactionChunk<any, any>[]) => {
		return this._core.transact(chunks);
	};

	/**
	 * Use this to query your data!
	 *
	 * @see https://instantdb.com/docs/instaql
	 *
	 * @example
	 *  // listen to all goals
	 *  db.useQuery({ goals: {} })
	 *
	 *  // goals where the title is "Get Fit"
	 *  db.useQuery({ goals: { $: { where: { title: "Get Fit" } } } })
	 *
	 *  // all goals, _alongside_ their todos
	 *  db.useQuery({ goals: { todos: {} } })
	 *
	 *  // skip if `user` is not logged in
	 *  db.useQuery(auth.user ? { goals: {} } : null)
	 */
	useQuery = <Q extends ValidQuery<Q, Schema>>(
		query: MaybeGetter<null | Q>,
		opts?: InstaQLOptions
	): ReactiveValue<InstaQLLifecycleState<Schema, Q, NonNullable<Config['useDateObjects']>>> => {
		const state = $derived(useQueryInternal(this._core, query, opts).current.state);
		return {
			get current() {
				return state;
			}
		};
	};

	/**
	 * Listen for the logged in state. This is useful
	 * for deciding when to show a login screen.
	 *
	 * Check out the docs for an example `Login` component too!
	 *
	 * @see https://instantdb.com/docs/auth
	 * @example
	 *  <script>
	 *    import { db } from './db';
	 *    import Main from './Main.svelte';
	 *    import Login from './Login.svelte';
	 *
	 *    const auth = db.useAuth();
	 *  </script>
	 *
	 *  {#if auth.current.isLoading}
	 *    <div>Loading...</div>
	 *  {:else if auth.current.error}
	 *    <div>Uh oh! {auth.error.message}</div>
	 *  {:else if auth.current.user}
	 *    <Main user={auth.user} />
	 *  {:else}
	 *    <Login />
	 *  {/if}
	 *
	 */
	useAuth = (): ReactiveValue<AuthState> => {
		let authState = $state(this._core._reactor._currentUserCached);

		$effect(() => {
			const unsubscribe = this._core.subscribeAuth((auth) => {
				authState = { isLoading: false, ...auth };
			});

			return unsubscribe;
		});

		return {
			get current() {
				return authState;
			}
		};
	};

	/**
	 * Subscribe to the currently logged in user.
	 * If the user is not logged in, this hook with throw an Error.
	 * You will want to protect any calls of this hook with a
	 * <SignedIn> component, or your own logic based on db.useAuth()
	 *
	 * @see https://instantdb.com/docs/auth
	 * @throws Error indicating user not signed in
	 * @example
	 * 	<script>
	 *    import { db } from './db';
	 *    import { SignedIn } from 'svelte-instantdb';
	 *
	 *    const user = db.useUser()
	 *  </script>
	 *
	 *  <SignedIn {db}>
	 *   <div>Logged in as: {user.email}</div>
	 *  </SignedIn>
	 *
	 */
	useUser = (): ReactiveValue<User> => {
		const auth = this.useAuth();

		if (auth.current.user) {
			throw new InstantError('useUser must be used within an auth-protected route');
		}

		return {
			get current() {
				return auth.current.user;
			}
		};
	};

	/**
	 * One time query for the logged in state. This is useful
	 * for scenarios where you want to know the current auth
	 * state without subscribing to changes.
	 *
	 * @see https://instantdb.com/docs/auth
	 * @example
	 *   const user = await db.getAuth();
	 *   console.log('logged in as', user.email)
	 */
	getAuth(): Promise<User | null> {
		return this._core.getAuth();
	}

	/**
	 * Listen for connection status changes to Instant. Use this for things like
	 * showing connection state to users
	 *
	 * @see https://www.instantdb.com/docs/patterns#connection-status
	 * @example
	 *  <script>
	 *    import { db } from './db';
	 *
	 *    const status = db.useConnectionStatus();
	 *
	 *    const connectionState = $derived.by(() => {
	 *      return status.current === 'connecting' || status.current === 'opened'
	 *        ? 'authenticating'
	 *        : status.current === 'authenticated'
	 *          ? 'connected'
	 *        : status.current === 'closed'
	 *          ? 'closed'
	 *        : status.current === 'errored'
	 *          ? 'errored'
	 *        : 'unexpected state'
	 *    });
	 *  </script>
	 *
	 *  <div>Connection state: {connectionState}</div>
	 */
	useConnectionStatus = (): ReactiveValue<ConnectionStatus> => {
		let status = $state<ConnectionStatus>(this._core._reactor.status as ConnectionStatus);

		$effect(() => {
			const unsubscribe = this._core.subscribeConnectionStatus((newStatus) => {
				if (newStatus !== status) {
					status = newStatus;
				}
			});

			return unsubscribe;
		});

		return {
			get current() {
				return status;
			}
		};
	};

	/**
	 * Use this for one-off queries.
	 * Returns local data if available, otherwise fetches from the server.
	 * Because we want to avoid stale data, this method will throw an error
	 * if the user is offline or there is no active connection to the server.
	 *
	 * @see https://instantdb.com/docs/instaql
	 *
	 * @example
	 *
	 *  const resp = await db.queryOnce({ goals: {} });
	 *  console.log(resp.data.goals)
	 */
	queryOnce = <Q extends ValidQuery<Q, Schema>>(
		query: Q
	): Promise<{
		data: InstaQLResponse<Schema, Q, Config['useDateObjects']>;
		pageInfo: PageInfoResponse<Q>;
	}> => {
		return this._core.queryOnce(query);
	};
}
