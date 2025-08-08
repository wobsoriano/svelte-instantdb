# svelte-instantdb

Unofficial [Instant](http://instantdb.com/) SDK for Svelte 5.

## Installation

```bash
npm install svelte-instantdb
```

## Usage

### Reading and Writing Data

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

### Reactive variables

To make the helpers return reactive state, pass a function that returns a state instead:

```ts
let todoId = $state(null);

const todoState = db.useQuery(() =>
  todoId
    ? {
        todos: {
          $: {
            where: {
              id: todoId
            }
          }
        }
      }
    : null
);

todoId = 'some_id';
```

### Cursors

```svelte
<Cursors {room} userCursorColor="tomato">Move your cursor around! ✨</Cursors>
```

Custom cursors

```svelte
<Cursors {room} userCursorColor="tomato">
  Move your cursor around! ✨

  {#snippet cursor({ color, presence })}
    <CustomCursor {color} name={presence.name} />
  {/snippet}
</Cursors>
```

### Typing indicator

```svelte
<script lang="ts">
  // Init schema and db
  // ...

  const room = db.room('chat', 'main');

  // 1. Publish your presence in the room
  const presence = room.usePresence({
    peers: [],
    user: false
  });

  onMount(() => {
    presence.current.publishPresence({ name: 'your_username' });
  });

  // 2. Use the typing indicator
  const typing = room.useTypingIndicator('chat');

  function typingInfo(users) {
    if (users.length === 0) return null;
    if (users.length === 1) return `${users[0].name} is typing...`;
    if (users.length === 2) return `${users[0].name} and ${users[1].name} are typing...`;

    return `${users[0].name} and ${users.length - 1} others are typing...`;
  }
</script>

<div class="flex h-screen gap-3 p-2">
  <div class="flex flex-1 flex-col justify-end">
    <textarea
      {...typing.current.inputProps}
      placeholder="Compose your message here..."
      class="w-full rounded-md border-gray-300 p-2 text-sm"
    />
    <div class="truncate text-xs text-gray-500">
      {typing.current.active.length ? typingInfo(typing.current.active) : <>&nbsp;</>}
    </div>
  </div>
</div>
```

## License

MIT
