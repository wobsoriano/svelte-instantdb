<script lang="ts">
	import { init, tx, id, Cursors } from '$lib/index.js';
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

	let q = {
		todos: {}
	};

	$: state = db.useQuery(q);

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
			q = {
				todos: {
					$: {
						where: {
							id: 'b20de635-b9ab-4cd6-ad24-366be1304bcf'
						}
					}
				}
			};
		}}>Update q</button
	>
	<ul>
		{#each $state.data.todos as todo}
			<li>{todo.text} - {todo.createdAt}</li>
		{/each}
	</ul>
{/if}
