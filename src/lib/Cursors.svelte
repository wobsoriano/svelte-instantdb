<script lang="ts" generics="RoomSchema extends RoomSchemaShape">
	import { InstantSvelteRoom } from './InstantSvelte.js';
	import { type RoomSchemaShape } from '@instantdb/core';
	import Cursor from './Cursor.svelte';

	type RoomType = keyof RoomSchema;

	export let as: string | undefined = 'div';
	export let room: InstantSvelteRoom<any, RoomSchema, RoomType>;
	export let propagate: boolean | undefined = undefined;
	export let userCursorColor: string | undefined = undefined;
	export let zIndex: number | undefined = undefined;
	export let spaceId: string | undefined = undefined;
	export let className: string | undefined = undefined;
	export let style: string | undefined = undefined;

	const _spaceId = spaceId || `cursors-space-default--${String(room.type)}-${room.id}`;

	const cursorsPresence = room.usePresence({
		keys: [_spaceId]
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
			[_spaceId]: {
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
			[_spaceId]: undefined
		} as RoomSchema[RoomType]['presence']);
	}

	const absStyles = 'position: absolute; top: 0; left: 0; bottom: 0; right: 0;';
	const inertStyles = 'overflow: hidden; pointer-events: none; user-select: none;';

	const defaultZ = 99999;
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<svelte:element
	this={as}
	on:mousemove={onMouseMove}
	on:mouseout={onMouseOut}
	style="position: relative; {style}"
	class={className}
>
	<slot />
	<div style="{absStyles} {inertStyles} z-index: {zIndex !== undefined ? zIndex : defaultZ};">
		{#each Object.entries($cursorsPresence.peers) as [id, presence]}
			{#if presence[_spaceId]}
				{@const cursor = presence[_spaceId]}
				<div
					style="
                        {absStyles}
                        transform: translate({cursor.xPercent}%, {cursor.yPercent}%);
                        transform-origin: 0 0;
                        transition: transform 100ms;
                    "
				>
					<slot name="renderCursor" presence={fullPresence.peers[id]} color={cursor.color}>
						<Cursor {...cursor} />
					</slot>
				</div>
			{/if}
		{/each}
	</div>
</svelte:element>
