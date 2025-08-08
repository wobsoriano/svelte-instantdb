<script lang="ts">
	import { init, tx, i, id, type InstaQLEntity } from '$lib/index.js';
	import { PUBLIC_INSTANT_APP_ID } from '$env/static/public';

	const schema = i.schema({
		entities: {
			todos: i.entity({
				text: i.string(),
				done: i.boolean(),
				createdAt: i.number()
			})
		}
	});

	type Todo = InstaQLEntity<typeof schema, 'todos'>;

	const db = init({ appId: PUBLIC_INSTANT_APP_ID, schema });

	const query = db.useQuery({
		todos: {}
	});

	let newTodo = $state('');
	let selectedTodo: Todo | null = $state(null);

	// This is just a test code to test reactivity!
	const todoState = db.useQuery(() =>
		selectedTodo
			? {
					todos: {
						$: {
							where: {
								id: selectedTodo.id
							}
						}
					}
				}
			: null
	);
	$inspect(todoState);

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

	function deleteTodo(id: string) {
		db.transact(tx.todos[id].delete());
	}

	function toggleTodo(id: string) {
		const isDone = query.current.data.todos.find((i) => i.id === id).done;
		db.transact(tx.todos[id].update({ done: !isDone }));
	}

	function selectTodo(todo: Todo) {
		selectedTodo = todo;
	}

	function closePreview() {
		selectedTodo = null;
	}
</script>

<main>
	<h1>Svelte InstantDB Todo list</h1>

	<form onsubmit={addTodo}>
		<input bind:value={newTodo} placeholder="Enter a new task" />
		<button type="submit">Add</button>
	</form>

	<div class="todo-container">
		{#if query.current.isLoading}
			<div>Fetching data...</div>
		{:else if query.current.error}
			<div>Error fetching data: {query.current.error.message}</div>
		{:else}
			<ul>
				{#each query.current.data.todos as todo (todo.id)}
					<li class:done={todo.done}>
						<button class="todo-text" onclick={() => selectTodo(todo)}>
							{todo.text}
						</button>
						<div class="todo-actions">
							<button onclick={() => toggleTodo(todo.id)}>
								{todo.done ? 'Undo' : 'Done'}
							</button>
							<button onclick={() => deleteTodo(todo.id)}>Delete</button>
						</div>
					</li>
				{/each}
			</ul>
		{/if}

		{#if selectedTodo}
			<div class="todo-preview">
				<div class="preview-header">
					<h2>Todo Details</h2>
					<button class="close-button" onclick={closePreview}>×</button>
				</div>
				<p><strong>ID:</strong> {selectedTodo.id}</p>
				<p><strong>Text:</strong> {selectedTodo.text}</p>
				<p><strong>Done:</strong> {selectedTodo.done ? 'Yes' : 'No'}</p>
				<p><strong>Created At:</strong> {selectedTodo.createdAt.toLocaleString()}</p>
			</div>
		{/if}
	</div>
</main>

<style>
	main {
		font-family: Arial, sans-serif;
		max-width: 800px;
		margin: 0 auto;
		padding: 20px;
		background-color: #f8f8f8;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	h1,
	h2 {
		text-align: center;
		color: #333;
	}

	form {
		display: flex;
		margin-bottom: 20px;
	}

	input {
		flex-grow: 1;
		padding: 10px;
		font-size: 16px;
		border: 1px solid #ddd;
		border-radius: 4px 0 0 4px;
	}

	button {
		padding: 10px 20px;
		font-size: 16px;
		background-color: #333;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		transition:
			background-color 0.3s,
			color 0.3s;
	}

	button:hover {
		background-color: #555;
		color: white;
	}

	.todo-container {
		display: flex;
		gap: 20px;
	}

	ul {
		list-style-type: none;
		padding: 0;
		flex: 1;
	}

	li {
		background-color: white;
		margin-bottom: 10px;
		padding: 10px;
		border-radius: 4px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		transition: background-color 0.3s;
		border: 1px solid #ddd;
	}

	li.done .todo-text {
		text-decoration: line-through;
		opacity: 0.6;
	}

	.todo-text {
		background: none;
		border: none;
		color: #333;
		font-size: 16px;
		text-align: left;
		cursor: pointer;
		padding: 0;
		transition: color 0.3s;
	}

	.todo-text:hover {
		color: white;
	}

	.todo-actions {
		display: flex;
		gap: 10px;
	}

	.todo-actions button {
		padding: 5px 10px;
		font-size: 14px;
	}

	.todo-preview {
		flex: 1;
		background-color: white;
		padding: 20px;
		border-radius: 4px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		border: 1px solid #ddd;
	}

	.todo-preview p {
		margin: 10px 0;
	}

	.preview-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.close-button {
		background: none;
		border: none;
		font-size: 24px;
		cursor: pointer;
		color: #333;
		transition:
			color 0.3s,
			background-color 0.3s;
		border-radius: 50%;
		width: 30px;
		height: 30px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
	}

	.close-button:hover {
		color: white;
		background-color: #333;
	}
</style>
