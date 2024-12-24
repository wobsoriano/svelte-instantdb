import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import pkg from './package.json' assert { type: 'json' };

export default defineConfig({
	plugins: [sveltekit()],
	define: {
		__LIB_VERSION__: JSON.stringify(`v${pkg.version}`)
	}
});
