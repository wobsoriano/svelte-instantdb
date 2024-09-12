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

{#if $query.isLoading}
	<div>Fetching data...</div>
{:else if $query.error}
	<div>Error fetching data: {$query.error.message}</div>
{:else}
	<UI data={$query.data} {addMessage} />
{/if}
```

## Todo

- [ ] Cursors
- [ ] Typing Indicators

## License

MIT
