<script lang="ts">
	import { init } from '$lib/index.js';
	import { PUBLIC_INSTANT_APP_ID } from '$env/static/public';

	const db = init<
		{},
		{
			'typing-indicator-example': {
				presence: {
					id: string;
					name: string;
					color: string;
				};
			};
		}
	>({
		appId: PUBLIC_INSTANT_APP_ID
	});

	const userId = Math.random().toString(36).slice(2, 6);
	const randomDarkColor =
		'#' +
		[0, 0, 0]
			.map(() =>
				Math.floor(Math.random() * 200)
					.toString(16)
					.padStart(2, '0')
			)
			.join('');
	const user = {
		id: userId,
		name: `${userId}`,
		color: randomDarkColor
	};

	const room = db.room('typing-indicator-example', '1234');

	room.useSyncPresence(user);

	const presence = room.usePresence();

	const typingIndicator = room.useTypingIndicator('chat');

	const peers = $derived(Object.values(presence.peers).filter((p) => p.id));
	const activeMap = $derived(
		Object.fromEntries(typingIndicator.active.map((activePeer) => [activePeer.id, activePeer]))
	);

	function typingInfo(typing: { name: string }[]) {
		if (typing.length === 0) return null;
		if (typing.length === 1) return `${typing[0].name} is typing...`;
		if (typing.length === 2) return `${typing[0].name} and ${typing[1].name} are typing...`;

		return `${typing[0].name} and ${typing.length - 1} others are typing...`;
	}
</script>

<div class="container">
	<div class="sidebar">
		{#each peers as peer (peer.id)}
			<div class="peer-avatar" style="border-color: {peer.color}">
				{peer.name?.slice(0, 1)}
				{#if activeMap[peer.id]}
					<div class="typing-indicator">⋯</div>
				{/if}
			</div>
		{/each}
	</div>

	<div class="main">
		<textarea
			class="textarea"
			placeholder="Compose your message here..."
			{...typingIndicator.inputProps}
		></textarea>
		<div class="typing-text">
			{#if typingIndicator.active.length}
				{typingInfo(typingIndicator.active)}
			{:else}
				&nbsp;
			{/if}
		</div>
	</div>
</div>

<style>
	.container {
		display: flex;
		height: 100vh;
		gap: 12px;
		padding: 8px;
	}

	.sidebar {
		display: flex;
		width: 40px;
		flex-direction: column;
		gap: 8px;
	}

	.peer-avatar {
		position: relative;
		display: flex;
		height: 40px;
		width: 40px;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		border-width: 4px;
		border-style: solid;
		background-color: white;
	}

	.typing-indicator {
		position: absolute;
		bottom: 0;
		right: -4px;
		background-color: black;
		padding: 0 4px;
		border-radius: 2px;
		line-height: 12px;
		color: white;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}

	.main {
		display: flex;
		flex: 1;
		flex-direction: column;
		justify-content: flex-end;
	}

	.textarea {
		width: 100%;
		border-radius: 6px;
		border: 1px solid #d1d5db;
		padding: 8px;
		font-size: 14px;
	}

	.typing-text {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 12px;
		color: #6b7280;
	}
</style>
