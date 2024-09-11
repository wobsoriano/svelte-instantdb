<script lang="ts">
	import { InstantSvelteRoom } from './InstantSvelte.js';
	import { type RoomSchemaShape } from '@instantdb/core';
	import Cursor from './Cursor.svelte';

	type RoomSchema = $$Generic<RoomSchemaShape>;
	type RoomType = keyof RoomSchema;

	interface $$Props {
		spaceId?: string;
		room: InstantSvelteRoom<any, RoomSchema, RoomType>;
		userCursorColor?: string;
		as?: string;
		propagate?: boolean;
		zIndex?: number;
	}

	export let as: string | undefined = 'div';
	export let room: InstantSvelteRoom<any, RoomSchema, RoomType>;
	export let propagate: boolean | undefined = undefined;
	export let userCursorColor: string | undefined = undefined;
	export let zIndex: number | undefined = undefined;
	export let spaceId: string | undefined = `cursors-space-default--${String(room.type)}-${room.id}`

	const cursorsPresence = room.usePresence({
		keys: [spaceId]
	});

	const fullPresence = room._core._reactor.getPresence(room.type, room.id);

	function onMouseMove(e: MouseEvent) {
		if (!propagate) {
			e.stopPropagation();
		}

		const rect = (e.currentTarget as any).getBoundingClientRect();
		const x = e.clientX;
		const y = e.clientY;
		const xPercent = ((x - rect.left) / rect.width) * 100;
		const yPercent = ((y - rect.top) / rect.height) * 100;
		cursorsPresence.publishPresence({
			[spaceId]: {
				x,
				y,
				xPercent,
				yPercent,
				color: userCursorColor
			}
		} as RoomSchema[RoomType]['presence']);
	}

	function onMouseOut() {
		cursorsPresence.publishPresence({
			[spaceId]: undefined
		} as RoomSchema[RoomType]['presence']);
	}

	const absStyles = {
		position: 'absolute',
		top: 0,
		left: 0,
		bottom: 0,
		right: 0
	};

	const inertStyles = {
		overflow: 'hidden',
		pointerEvents: 'none',
		userSelect: 'none'
	};

	const defaultZ = 99999;
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<svelte:element
  this={as}
  on:mousemove={onMouseMove}
  on:mouseout={onMouseOut}
  style="position: relative;"
>
  <slot />
  <div style="{absStyles} {inertStyles} z-index: {zIndex !== undefined ? zIndex : defaultZ};">
    {#each Object.entries($cursorsPresence.peers) as [id, presence]}
      {#if presence[spaceId]}
        {@const cursor = presence[spaceId]}
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          transform: translate({cursor.xPercent}%, {cursor.yPercent}%);
          transform-origin: 0 0;
          transition: transform 100ms;
        ">
          <slot
            name="renderCursor"
            props={{ color: cursor.color, presence: fullPresence.peers[id] }}
          >
            <Cursor {...cursor} />
          </slot>
        </div>
      {/if}
    {/each}
  </div>
</svelte:element>
