---
'svelte-instantdb': minor
---

Introduce `<SignedIn>` and `<SignedOut>` components

Usage:

```svelte
<script>
  import { db } from './db';
  import { SignedIn } from 'svelte-instantdb';

  const user = db.useUser()
</script>

<SignedIn {db}>
    <p>Logged in as: {user.email}</p>
</SignedIn>
```
