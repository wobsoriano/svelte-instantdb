<script lang="ts">
	import { init, tx, id } from '$lib/index.js';
	import { env } from '$env/dynamic/public';
	import { toStateRune } from '$lib/runes/index.js';

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

	let q = {
		todos: {}
	};

	const state = toStateRune(db.useQuery(q));

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

{#if state.current.isLoading}
	<div>Fetching data...</div>
{:else if state.current.error}
	<div>Error fetching data: {state.current.error.message}</div>
{:else}
	<h1>Todos</h1>
	<form on:submit={addTodo}>
		<input bind:value={newTodo} placeholder="What needs to be done?" type="text" />
	</form>
	<ul>
		{#each state.current.data.todos as todo}
			<li>{todo.text} - {todo.createdAt}</li>
		{/each}
	</ul>
{/if}
