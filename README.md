# svelte-instantdb

Unofficial [Instant](http://instantdb.com/) SDK for Svelte.

## Installation

```bash
npm install svelte-instantdb
```

## Usage

```svelte
<script>
	import { init, tx, id } from 'svelte-instantdb';

	const db = init({
		appId: 'YOUR_APP_ID'
	});

	const query = db.useQuery({ messages: {} });

	const addMessage = (message) => {
		db.transact(tx.messages[id()].update(message));
	};
</script>

{#if $state.isLoading}
	<div>Fetching data...</div>
{:else if $state.error}
	<div>Error fetching data: {$state.error.message}</div>
{:else}
	<UI data={$state.data} {addMessage} />
{/if}
```

## License

MIT
