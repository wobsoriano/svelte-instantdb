<script lang="ts">
	import { init, tx, id } from '$lib/index.js'; // import {} from 'svelte-instantdb/stores'
	import { env } from '$env/dynamic/public';

	const APP_ID = env.PUBLIC_INSTANT_APP_ID;

	const db = init({ appId: APP_ID });

	const auth = db.useAuth();
	let sentEmail = $state('');
	let email = $state('');
	let code = $state('');

	function handleEmailSubmit(e: SubmitEvent) {
		console.log('sending code...', email);
		e.preventDefault();
		if (!email) return;
		console.log('hello');
		sentEmail = email;
		db.auth
			.sendMagicCode({ email })
			.then((x) => {
				console.log('result here', x);
			})
			.catch((err) => {
				alert('Uh oh :' + err.body?.message);
				sentEmail = '';
			});
	}

	function handleCodeSubmit(e: SubmitEvent) {
		e.preventDefault();
		db.auth
			.signInWithMagicCode({ email: sentEmail, code })
			.then((x) => {
				console.log('result here', x);
			})
			.catch((err) => {
				alert('Uh oh :' + err.body?.message);
				code = '';
			});
	}
</script>

{#if auth.current.isLoading}
	<div>Loading...</div>
{:else if auth.current.error}
	<div>Uh oh! {auth.current.error.message}</div>
{:else if auth.current.user}
	<div>Hello, {auth.current.user.email}!</div>
{:else}
	{@render login()}
{/if}

{#snippet login()}
	<div class="container">
		{#if !sentEmail}
			{@render emailForm()}
		{:else}
			{@render magicCodeForm()}
		{/if}
	</div>
{/snippet}

{#snippet emailForm()}
	<form onsubmit={handleEmailSubmit} class="form">
		<h2 style="color: #333; margin-bottom: 20px;">Let's log you in!</h2>
		<div>
			<input class="input" placeholder="Enter your email" type="email" bind:value={email} />
		</div>
		<div>
			<button type="submit" class="button"> Send Code </button>
		</div>
	</form>
{/snippet}

{#snippet magicCodeForm()}
	<form onsubmit={handleCodeSubmit} class="form">
		<h2 style="color: #333; margin-bottom: 20px;">
			Okay, we sent you an email! What was the code?
		</h2>
		<div>
			<input class="input" type="text" placeholder="123456..." bind:value={code} />
		</div>
		<button type="submit" class="button"> Verify </button>
	</form>
{/snippet}

<style>
	.container {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100vh;
	}

	.form {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100vh;
		font-family: Arial, sans-serif;
	}

	.input {
		padding: 10px;
		margin-bottom: 15px;
		border: 1px solid #ddd;
		border-radius: 5px;
		width: 300px;
	}

	.button {
		padding: 10px 20px;
		background-color: #007bff;
		color: white;
		border: none;
		border-radius: 5px;
		cursor: pointer;
	}
</style>
