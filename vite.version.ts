import { defineConfig } from 'vite';
import pkg from './package.json' with { type: 'json' };

// Why this extra Vite config? This is for adding the current library's version
// and pass it to the InstantSvelteWebDatabase class option

export default defineConfig({
	build: {
		emptyOutDir: false,
		lib: {
			entry: 'src/lib/version.ts',
			formats: ['es'],
			fileName: 'version'
		}
	},
	define: {
		__LIB_VERSION__: JSON.stringify(`v${pkg.version}`)
	}
});
