import { defineConfig } from 'vite';
import pkg from './package.json' assert { type: 'json' };

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
