import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
	externals: ['cloudflare:workers', '__STATIC_CONTENT_MANIFEST'],
});
