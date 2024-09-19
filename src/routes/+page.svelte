<script lang="ts">
	import { init, tx, id } from '$lib/index.js';
	import { env } from '$env/dynamic/public';

	const APP_ID = env.PUBLIC_INSTANT_APP_ID;

	// Optional: Declare your schema for intellisense!
	type Schema = {
		todos: {
			id: string;
			text: string;
			done: boolean;
			createdAt: number;
		};
	};

	const db = init<Schema>({ appId: APP_ID });

	let todoId = '9cd88cf8-e2ac-45df-b683-ba7a025cd8dc';

	$: state = db.useQuery({
		todos: {
			$: {
				where: {
					id: todoId
				}
			}
		}
	});

	let newTodo = '';

	function addTodo(e: SubmitEvent) {
		e.preventDefault();
		db.transact(
			tx.todos[id()].update({
				text: newTodo,
				done: false,
				createdAt: Date.now()
			})
		);
		newTodo = '';
	}
</script>

{#if $state.isLoading}
	<div>Fetching data...</div>
{:else if $state.error}
	<div>Error fetching data: {$state.error.message}</div>
{:else}
	<h1>Todos</h1>
	<form on:submit={addTodo}>
		<input bind:value={newTodo} placeholder="What needs to be done?" type="text" />
	</form>
	<button
		on:click={() => {
			const ids = [
				'8877544a-6c99-41a4-85bf-328fa5cc3435',
				'3a938523-2db8-4ecd-8dc6-59a3453bf7d2',
				'6d0d8e51-702d-4f3b-bfb2-a0298c41f54a'
			];
			todoId = ids[Math.floor(Math.random() * ids.length)];
		}}>Update q</button
	>
	<ul>
		{#each $state.data.todos as todo}
			<li>{todo.text} - {todo.createdAt}</li>
		{/each}
	</ul>
	<a href="/cursors">Cursors page</a>
{/if}
