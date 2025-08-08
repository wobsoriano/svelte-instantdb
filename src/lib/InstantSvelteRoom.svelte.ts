import {
	type PresenceOpts,
	type PresenceResponse,
	type RoomSchemaShape,
	InstantCoreDatabase,
	type InstantSchemaDef
} from '@instantdb/core';
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
	_core: InstantCoreDatabase<Schema, boolean>;
	type: MaybeGetter<RoomType>;
	id: MaybeGetter<string>;

	constructor(
		_core: InstantCoreDatabase<Schema, boolean>,
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
	): ((data: RoomSchema[RoomType]['topics'][Topic]) => void) => {
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
				isLoading: !!presence.isLoading
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
