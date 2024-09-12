import {
	// types
	InstantClient,
	Auth,
	Storage,
	txInit,
	_init_internal,
	i,
	type AuthState,
	type Config,
	type Query,
	type Exactly,
	type TransactionChunk,
	type LifecycleSubscriptionState,
	type PresenceOpts,
	type PresenceResponse,
	type RoomSchemaShape,
	type InstaQLQueryParams,
	type ConfigWithSchema,
	type IDatabase
} from '@instantdb/core';
import { useQuery } from './useQuery.js';
import { useTimeout } from './useTimeout.js';
import { writable, type Readable } from 'svelte/store';
import { onMount } from 'svelte';

export type PresenceHandle<PresenceShape, Keys extends keyof PresenceShape> = Readable<
	PresenceResponse<PresenceShape, Keys>
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
		onKeyDown: (e: KeyboardEvent) => void;
		onBlur: () => void;
	};
};

export const defaultActivityStopTimeout = 1_000;

export class InstantSvelteRoom<
	Schema,
	RoomSchema extends RoomSchemaShape,
	RoomType extends keyof RoomSchema
> {
	_core: InstantClient<Schema, RoomSchema>;
	type: RoomType;
	id: string;

	constructor(_core: InstantClient<Schema, RoomSchema, any>, type: RoomType, id: string) {
		this._core = _core;
		this.type = type;
		this.id = id;
	}

	/**
	 * Listen for broadcasted events given a room and topic.
	 *
	 * @see https://instantdb.com/docs/presence-and-topics
	 * @example
	 * <script>
	 *   export let roomId;
	 *
	 *   db.room(roomType, roomId).useTopicEffect(topic, (message, peer) => {
	 *     console.log("New message", message, 'from', peer.name);
	 *   })
	 * </script>
	 */
	useTopicEffect = <TopicType extends keyof RoomSchema[RoomType]['topics']>(
		topic: TopicType,
		onEvent: (
			event: RoomSchema[RoomType]['topics'][TopicType],
			peer: RoomSchema[RoomType]['presence']
		) => any
	): void => {
		onMount(() => {
			return this._core._reactor.subscribeTopic(
				this.id,
				topic,
				(
					event: RoomSchema[RoomType]['topics'][TopicType],
					peer: RoomSchema[RoomType]['presence']
				) => {
					onEvent(event, peer);
				}
			);
		});
	};

	/**
	 * Broadcast an event to a room.
	 *
	 * @see https://instantdb.com/docs/presence-and-topics
	 * @example
	 * <script>
	 *   export let roomId;
	 *   const room = db.room(roomType, roomId);
	 *   const publishTopic = room.usePublishTopic("clicks");
	 *   function handleClick() {
	 *     publishTopic({ ts: Date.now() });
	 *   }
	 * </script>
	 *
	 * <button on:click={handleClick}>Click me</button>
	 */
	usePublishTopic = <Topic extends keyof RoomSchema[RoomType]['topics']>(
		topic: Topic
	): ((data: RoomSchema[RoomType]['topics'][Topic]) => void) => {
		onMount(() => this._core._reactor.joinRoom(this.id));

		const publishTopic = (data: any) => {
			this._core._reactor.publishTopic({
				roomType: this.type,
				roomId: this.id,
				topic,
				data
			});
		};

		return publishTopic;
	};

	/**
	 * Listen for peer's presence data in a room, and publish the current user's presence.
	 *
	 * @see https://instantdb.com/docs/presence-and-topics
	 * @example
	 * <script>
	 *   export let roomId;
	 *
	 *   const { peers, publishPresence } = db.room(roomType, roomId).usePresence({ keys: ["name", "avatar"] });
	 *
	 *   // ...
	 * </script>
	 */
	usePresence = <Keys extends keyof RoomSchema[RoomType]['presence']>(
		opts: PresenceOpts<RoomSchema[RoomType]['presence'], Keys> = {}
	): PresenceHandle<RoomSchema[RoomType]['presence'], Keys> => {
		const { subscribe, set } = writable<PresenceResponse<RoomSchema[RoomType]['presence'], Keys>>(
			this._core._reactor.getPresence(this.type, this.id, opts) ?? {
			  user: undefined,
				error: undefined,
				peers: {},
				isLoading: true
			}
		);

		onMount(() => {
			return this._core._reactor.subscribePresence(this.type, this.id, opts, (data) => {
				set(data);
			});
		});

		return {
			subscribe,
			publishPresence: (data) => {
				this._core._reactor.publishPresence(this.type, this.id, data);
			}
		};
	};

	/**
	 * Publishes presence data to a room
	 *
	 * @see https://instantdb.com/docs/presence-and-topics
	 * @example
	 * <script>
	 *   export let roomId;
	 *
	 *   db.room(roomType, roomId).useSyncPresence({ name, avatar, color });
	 * </script>
	 */
	useSyncPresence = (data: Partial<RoomSchema[RoomType]['presence']>): void => {
		onMount(() => {
			return this._core._reactor.publishPresence(this.type, this.id, data);
		});
	};

	/**
	 * Manage typing indicator state
	 *
	 * @see https://instantdb.com/docs/presence-and-topics
	 * @example
	 * <script>
	 *   export let roomId;
	 *
	 *   const {
	 *     active,
	 *     setActive,
	 *     inputProps,
	 *   } = db.room(roomType, roomId).useTypingIndicator("chat-input", opts);
	 * </script>
	 *
	 * <input {...$inputProps} />
	 */
	useTypingIndicator = (
		inputName: string,
		opts: TypingIndicatorOpts = {}
	): TypingIndicatorHandle<RoomSchema[RoomType]['presence']> => {
		const timeout = useTimeout();

		this.usePresence({
			keys: [inputName]
		});

		// TODO: Make this reactive
    const presenceSnapshot = this._core._reactor.getPresence(this.type, this.id);
    const active = opts?.writeOnly ? [] : Object.values(presenceSnapshot?.peers ?? {}).filter((p) => p[inputName] === true)

		const setActive = (isActive: boolean) => {
			this._core._reactor.publishPresence(this.type, this.id, {
				[inputName]: isActive
			} as unknown as Partial<RoomSchema[RoomType]>);

			if (!isActive) return;

			if (opts?.timeout === null || opts?.timeout === 0) return;

			timeout.set(opts?.timeout ?? defaultActivityStopTimeout, () => {
				this._core._reactor.publishPresence(this.type, this.id, {
					[inputName]: null
				} as Partial<RoomSchema[RoomType]>);
			});
		};

		return {
			active,
			setActive: (a: boolean) => {
				setActive(a);
			},
			inputProps: {
				onKeyDown: (e: KeyboardEvent) => {
					const isEnter = opts?.stopOnEnter && e.key === 'Enter';
					const isActive = !isEnter;

					setActive(isActive);
				},
				onBlur: () => {
					setActive(false);
				}
			}
		};
	};
}

export abstract class InstantSvelte<
	Schema extends i.InstantGraph<any, any> | {} = {},
	RoomSchema extends RoomSchemaShape = {},
	WithCardinalityInference extends boolean = false
> implements IDatabase<Schema, RoomSchema, WithCardinalityInference>
{
	public withCardinalityInference?: WithCardinalityInference;
	public tx = txInit<Schema extends i.InstantGraph<any, any> ? Schema : i.InstantGraph<any, any>>();

	public auth: Auth;
	public storage: Storage;
	public _core: InstantClient<Schema, RoomSchema, WithCardinalityInference>;

	static Storage?: any;
	static NetworkListener?: any;

	constructor(config: Config | ConfigWithSchema<any>) {
		this._core = _init_internal<Schema, RoomSchema, WithCardinalityInference>(
			config,
			// @ts-expect-error because TS can't resolve subclass statics
			this.constructor.Storage,
			// @ts-expect-error because TS can't resolve subclass statics
			this.constructor.NetworkListener
		);
		this.auth = this._core.auth;
		this.storage = this._core.storage;
	}

	getLocalId = (name: string) => {
		return this._core.getLocalId(name);
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
	room<RoomType extends keyof RoomSchema>(
		type: RoomType = '_defaultRoomType' as RoomType,
		id: string = '_defaultRoomId'
	) {
		return new InstantSvelteRoom<Schema, RoomSchema, RoomType>(this._core, type, id);
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
	useQuery = <
		Q extends Schema extends i.InstantGraph<any, any>
			? InstaQLQueryParams<Schema>
			: Exactly<Query, Q>
	>(
		query: null | Q
	): Readable<LifecycleSubscriptionState<Q, Schema, WithCardinalityInference>> => {
		return useQuery(this._core, query).state;
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
	 *  {#if $auth.isLoading}
	 *    <div>Loading...</div>
	 *  {:else if $auth.error}
	 *    <div>Uh oh! {$auth.error.message}</div>
	 *  {:else if $auth.user}
	 *    <Main user={$auth.user} />
	 *  {:else}
	 *    <Login />
	 *  {/if}
	 *
	 */
	useAuth = (): Readable<AuthState> => {
		const { subscribe, set } = writable<AuthState>(this._core._reactor._currentUserCached);

		onMount(() => {
			return this._core.subscribeAuth((auth) => {
				set({ isLoading: false, ...auth });
			});
		});

		return {
			subscribe
		};
	};
}
