<script lang="ts" generics="RoomSchema extends RoomSchemaShape">
	import { InstantSvelteRoom } from './InstantSvelte.svelte.js';
	import { type RoomSchemaShape } from '@instantdb/core';
	import type { Snippet } from 'svelte';
	import { toValue } from './utils.js';

	type RoomType = keyof RoomSchema;

	type Props = {
		as?: string;
		room: InstantSvelteRoom<any, RoomSchema, RoomType>;
		propagate?: boolean;
		userCursorColor?: string;
		zIndex?: number;
		spaceId?: string;
		class?: string;
		style?: string;
		children?: Snippet;
		cursor?: Snippet<
			[
				{
					presence: RoomSchema[RoomType]['presence'];
					color: string;
				}
			]
		>;
	};

	const {
		as = 'div',
		room,
		propagate,
		style,
		userCursorColor,
		zIndex,
		spaceId: _spaceId,
		class: className,
		children,
		cursor
	}: Props = $props();

	const spaceId = $derived(_spaceId || `cursors-space-default--${String(room.type)}-${room.id}`);

	const cursorsPresence = room.usePresence(() => ({
		keys: [spaceId]
	}));

	$inspect(cursorsPresence.peers)

	const fullPresence = room._core._reactor.getPresence(toValue(room.type), toValue(room.id));

	function publishCursor(rect: DOMRect, touch: { clientX: number; clientY: number }) {
		const x = touch.clientX;
		const y = touch.clientY;
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

	function onmousemove(e: MouseEvent) {
		if (!propagate) {
			e.stopPropagation();
		}

		const rect = (e.currentTarget as HTMLInputElement).getBoundingClientRect();
		publishCursor(rect, e);
	}

	function onmouseout(_e: MouseEvent) {
		cursorsPresence.publishPresence({
			[spaceId]: undefined
		} as RoomSchema[RoomType]['presence']);
	}

	function ontouchmove(e: TouchEvent) {
		if (e.touches.length !== 1) {
			return;
		}

		const touch = e.touches[0];

		if (touch.target instanceof Element) {
			if (!propagate) {
				e.stopPropagation();
			}
			const rect = touch.target.getBoundingClientRect();
			publishCursor(rect, touch);
		}
	}

	function ontouchend(_e: TouchEvent) {
		cursorsPresence.publishPresence({
			[spaceId]: undefined
		} as RoomSchema[RoomType]['presence']);
	}

	const absStyles = 'position: absolute; top: 0; left: 0; bottom: 0; right: 0;';
	const inertStyles = 'overflow: hidden; pointer-events: none; user-select: none;';

	const defaultZ = 99999;
	const size = 35;
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_mouse_events_have_key_events -->
<svelte:element
	this={as}
	{onmousemove}
	{onmouseout}
	{ontouchend}
	{ontouchmove}
	style="position: relative; {style}"
	class={className}
>
	{@render children?.()}
	<div style="{absStyles} {inertStyles} z-index: {zIndex !== undefined ? zIndex : defaultZ};">
		{#each Object.entries(cursorsPresence.peers) as [id, presence]}
			{#if presence[_spaceId]}
				{@const _cursor = presence[_spaceId]}

				<div
					style="
                        {absStyles}
                        transform: translate({_cursor.xPercent}%, {_cursor.yPercent}%);
                        transform-origin: 0 0;
                        transition: transform 100ms;
                    "
				>
					{#if cursor}
						{@render cursor({ presence: fullPresence.peers[id], color: _cursor.color })}
					{:else}
						{@render cursorElement(_cursor.color)}
					{/if}
				</div>
			{/if}
		{/each}
	</div>
</svelte:element>

{#snippet cursorElement(color)}
	<svg
		style="height: {size}; width: {size}"
		viewBox="0 0 {size} {size}"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<g
			fill="rgba(0,0,0,.2)"
			transform="matrix(1, 0, 0, 1, -11.999999046325684, -8.406899452209473)"
		>
			<path d="m12 24.4219v-16.015l11.591 11.619h-6.781l-.411.124z" />
			<path d="m21.0845 25.0962-3.605 1.535-4.682-11.089 3.686-1.553z" />
		</g>
		<g fill="white" transform="matrix(1, 0, 0, 1, -11.999999046325684, -8.406899452209473)">
			<path d="m12 24.4219v-16.015l11.591 11.619h-6.781l-.411.124z" />
			<path d="m21.0845 25.0962-3.605 1.535-4.682-11.089 3.686-1.553z" />
		</g>
		<g fill={color} transform="matrix(1, 0, 0, 1, -11.999999046325684, -8.406899452209473)">
			<path d="m19.751 24.4155-1.844.774-3.1-7.374 1.841-.775z" />
			<path d="m13 10.814v11.188l2.969-2.866.428-.139h4.768z" />
		</g>
	</svg>
{/snippet}
