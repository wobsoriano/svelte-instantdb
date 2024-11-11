---
'svelte-instantdb': minor
---

Fix state returned by functions by introducing a `current` getter.

```svelte
<script>
  import { init, tx, id } from 'svelte-instantdb';

  const db = init({
    appId: '__YOUR_APP_ID__'
  });

  const query = db.useQuery({ messages: {} });

  const addMessage = (message) => {
    db.transact(tx.messages[id()].update(message));
  };
</script>

{#if query.current.isLoading}
  <div>Fetching data...</div>
{:else if query.current.error}
  <div>Error fetching data: {query.current.error.message}</div>
{:else}
  <UI data={query.current.data} {addMessage} />
{/if}
```
