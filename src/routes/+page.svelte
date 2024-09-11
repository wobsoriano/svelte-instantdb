<script lang="ts">
	import { init, tx, id } from '$lib/index.js';

	const APP_ID = '371c8307-e5a5-46d3-9f62-d8d2a02bd0c3';

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

	const state = db.useQuery({ todos: {} });

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
	<ul>
		{#each $state.data.todos as todo}
			<li>{todo.text}</li>
		{/each}
	</ul>
{/if}
