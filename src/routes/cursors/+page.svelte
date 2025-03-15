<script lang="ts">
	import { init, Cursors } from '$lib/index.js';
	import { PUBLIC_INSTANT_APP_ID } from '$env/static/public';

	const db = init({ appId: PUBLIC_INSTANT_APP_ID });

	const room = db.room('chat', 'main');

	const randomDarkColor =
		'#' +
		[0, 0, 0]
			.map(() =>
				Math.floor(Math.random() * 200)
					.toString(16)
					.padStart(2, '0')
			)
			.join('');
</script>

<Cursors class="cursors" {room} userCursorColor={randomDarkColor}>
	Move your cursor around! ✨
</Cursors>

<style>
	:global(.cursors) {
		display: flex;
		height: 100vh;
		width: 100vw;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		font-family:
			ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
			monospace;
		font-size: 0.875rem;
		color: #1f2937;
	}
</style>
