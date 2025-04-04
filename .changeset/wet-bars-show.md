---
'svelte-instantdb': patch
---

Support params in queries and transactions

Use in queries:

```ts
db.useQuery({ docs: {} }, { secret: secret });
```

and transactions:

```ts
db.transact(db.tx.docs[id].ruleParams({ secret: secret }).update({ title: 'eat' }));
```
