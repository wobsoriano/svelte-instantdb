import {
	// types
	Auth,
	Storage,
	txInit,
	type AuthState,
	type ConnectionStatus,
	type TransactionChunk,
	type PresenceOpts,
	type PresenceResponse,
	type RoomSchemaShape,
	type InstaQLParams,
	type InstantConfig,
	type PageInfoResponse,
	InstantCoreDatabase,
	init as core_init,
	type InstaQLLifecycleState,
	type InstaQLResponse,
	type RoomsOf,
	type InstantSchemaDef,
	type IInstantDatabase
} from '@instantdb/core';
import { useQueryInternal } from './useQuery.svelte.js';
import { useTimeout } from './useTimeout.svelte.js';
import { toValue, type MaybeGetter, type ReactiveValue } from './utils.js';
import { untrack } from 'svelte';

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

export class InstantSvelteRoom<
	Schema extends InstantSchemaDef<any, any, any>,
	RoomSchema extends RoomSchemaShape,
	RoomType extends keyof RoomSchema
> {
	_core: InstantCoreDatabase<Schema>;
	type: MaybeGetter<RoomType>;
	id: MaybeGetter<string>;

	constructor(
		_core: InstantCoreDatabase<Schema>,
		type: MaybeGetter<RoomType>,
		id: MaybeGetter<string>
	) {
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
	 *   const { roomId } = $props()
	 *
	 *   db.room(roomType, roomId).useTopicEffect(topic, (message, peer) => {
	 *     console.log("New message", message, 'from', peer.name)
	 *   })
	 * </script>
	 */
	useTopicEffect = <TopicType extends keyof RoomSchema[RoomType]['topics']>(
		topic: MaybeGetter<TopicType>,
		onEvent: (
			event: RoomSchema[RoomType]['topics'][TopicType],
			peer: RoomSchema[RoomType]['presence']
		) => any
	): void => {
		$effect(() => {
			const unsubscribe = this._core._reactor.subscribeTopic(
				toValue(this.id),
				toValue(topic),
				(
					event: RoomSchema[RoomType]['topics'][TopicType],
					peer: RoomSchema[RoomType]['presence']
				) => {
					onEvent(event, peer);
				}
			);

			return unsubscribe;
		});
	};

	/**
	 * Broadcast an event to a room.
	 *
	 * @see https://instantdb.com/docs/presence-and-topics
	 * @example
	 * <script>
	 *   const { roomId } = $props()
	 *   const room = db.room(roomType, roomId);
	 *   const publishTopic = room.usePublishTopic("clicks");
	 *   function handleClick() {
	 *     publishTopic({ ts: Date.now() });
	 *   }
	 * </script>
	 *
	 * <button onclick={handleClick}>Click me</button>
	 */
	usePublishTopic = <Topic extends keyof RoomSchema[RoomType]['topics']>(
		topic: MaybeGetter<Topic>
	): (data: RoomSchema[RoomType]['topics'][Topic]) => void => {
		$effect(() => {
			const unsubscribe = this._core._reactor.joinRoom(toValue(this.id));

			return unsubscribe;
		});

		const publishTopic = (data: RoomSchema[RoomType]['topics'][Topic]) => {
			this._core._reactor.publishTopic({
				roomType: toValue(untrack(() => this.type)),
				roomId: toValue(this.id),
				topic: toValue(topic),
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
	 *   const { roomId } = $props()
	 *
	 *   const presence = db.room(roomType, roomId).usePresence({ keys: ["name", "avatar"] });
	 *   // presence.current.peers
	 *   // presence.current.publishPresence
	 *
	 *   // ...
	 * </script>
	 */
	usePresence = <Keys extends keyof RoomSchema[RoomType]['presence']>(
		opts: MaybeGetter<PresenceOpts<RoomSchema[RoomType]['presence'], Keys>> = {}
	): ReactiveValue<PresenceHandle<RoomSchema[RoomType]['presence'], Keys>> => {
		const getInitialState = (): PresenceResponse<RoomSchema[RoomType]['presence'], Keys> => {
			const presence = this._core._reactor.getPresence(
				toValue(this.type),
				toValue(this.id),
				toValue(opts)
			) ?? {
				peers: {},
				isLoading: true
			};

			return {
				peers: presence.peers,
				isLoading: !!presence.isLoading,
				user: presence.user,
				error: presence.error
			};
		};

		const state = $state<PresenceResponse<RoomSchema[RoomType]['presence'], Keys>>({
			peers: {},
			isLoading: true,
			user: undefined,
			error: undefined
		});

		$effect(() => {
			Object.entries(getInitialState()).forEach(([key, value]) => {
				state[key] = value;
			});

			const unsubscribe = this._core._reactor.subscribePresence(
				toValue(this.type),
				toValue(this.id),
				toValue(opts),
				(data) => {
					Object.entries(data).forEach(([key, value]) => {
						state[key] = value;
					});
				}
			);

			return unsubscribe;
		});

		const publishPresence = (data: Partial<RoomSchema[RoomType]['presence']>) => {
			this._core._reactor.publishPresence(toValue(this.type), toValue(this.id), data);
		};

		return {
			get current() {
				return {
					...state,
					publishPresence
				};
			}
		};
	};

	/**
	 * Publishes presence data to a room
	 *
	 * @see https://instantdb.com/docs/presence-and-topics
	 * @example
	 * <script>
	 *   const { roomId } = $props()
	 *
	 *   db.room(roomType, roomId).useSyncPresence({ name, avatar, color });
	 * </script>
	 */
	useSyncPresence = (data: MaybeGetter<Partial<RoomSchema[RoomType]['presence']>>): void => {
		$effect(() => {
			const unsubscribe = this._core._reactor.joinRoom(toValue(this.id));

			return unsubscribe;
		});

		$effect(() => {
			const unsubscribe = this._core._reactor.publishPresence(
				toValue(this.type),
				toValue(this.id),
				toValue(data)
			);

			return unsubscribe;
		});
	};

	/**
	 * Manage typing indicator state
	 *
	 * @see https://instantdb.com/docs/presence-and-topics
	 * @example
	 * <script>
	 *   const { roomId } = $props()
	 *
	 *   const typingIndicator = db.room(roomType, roomId).useTypingIndicator("chat-input", opts);
	 *   // typingIndicator.current.active
	 *   // typingIndicator.current.setActive
	 *  // typingIndicator.current.inputProps
	 * </script>
	 *
	 * <input {...typingIndicator.current.inputProps} />
	 */
	useTypingIndicator = (
		inputName: MaybeGetter<string>,
		opts: MaybeGetter<TypingIndicatorOpts> = {}
	): ReactiveValue<TypingIndicatorHandle<RoomSchema[RoomType]['presence']>> => {
		const timeout = useTimeout();

		const onservedPresence = this.usePresence(() => ({
			keys: [toValue(inputName)]
		}));

		const active = $derived.by(() => {
			const presenceSnapshot = this._core._reactor.getPresence(
				toValue(this.type),
				toValue(this.id)
			);
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			onservedPresence.current.peers;

			return toValue(opts)?.writeOnly
				? []
				: Object.values(presenceSnapshot?.peers ?? {}).filter(
						(p) => p[toValue(inputName)] === true
					);
		});

		const setActive = (isActive: boolean) => {
			const _opts = toValue(opts);
			const _inputName = toValue(inputName);
			const type = toValue(this.type);
			const id = toValue(this.id);
			this._core._reactor.publishPresence(type, id, {
				[_inputName]: isActive
			} as unknown as Partial<RoomSchema[RoomType]>);

			if (!isActive) return;

			if (_opts?.timeout === null || _opts?.timeout === 0) return;

			timeout.set(_opts?.timeout ?? defaultActivityStopTimeout, () => {
				this._core._reactor.publishPresence(type, id, {
					[_inputName]: null
				} as Partial<RoomSchema[RoomType]>);
			});
		};

		return {
			get current() {
				return {
					active,
					setActive,
					inputProps: {
						onkeydown: (e: KeyboardEvent) => {
							const isEnter = toValue(opts)?.stopOnEnter && e.key === 'Enter';
							const isActive = !isEnter;

							setActive(isActive);
						},
						onblur: () => {
							setActive(false);
						}
					}
				};
			}
		};
	};
}

export default abstract class InstantSvelteAbstractDatabase<
	Schema extends InstantSchemaDef<any, any, any>,
	Rooms extends RoomSchemaShape = RoomsOf<Schema>
> implements IInstantDatabase<Schema>
{
	public tx = txInit<Schema>();

	public auth: Auth;
	public storage: Storage;
	public _core: InstantCoreDatabase<Schema>;

	static Storage?: any;
	static NetworkListener?: any;

	constructor(config: InstantConfig<Schema>, versions?: { [key: string]: string }) {
		this._core = core_init<Schema>(
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
	useQuery = <Q extends InstaQLParams<Schema>>(
		query: MaybeGetter<null | Q>
	): ReactiveValue<InstaQLLifecycleState<Schema, Q>> => {
		const state = $derived(useQueryInternal(this._core, query).current.state);
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
	queryOnce = <Q extends InstaQLParams<Schema>>(
		query: Q
	): Promise<{
		data: InstaQLResponse<Schema, Q>;
		pageInfo: PageInfoResponse<Q>;
	}> => {
		return this._core.queryOnce(query);
	};
}
