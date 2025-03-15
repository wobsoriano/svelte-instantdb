---
'svelte-instantdb': patch
---

Add `useLocalId()` helper, a wrapper around `getLocalId` promise that returns a reactive state. Initially returns `null` and then loads the `localId`.
