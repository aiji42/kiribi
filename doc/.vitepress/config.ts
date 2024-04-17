import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: '🎇 Kiribi',
	description: 'A simple job management library consisting of the Cloudflare stack.',
	themeConfig: {
		// https://vitepress.dev/reference/default-theme-config
		nav: [{ text: 'Docs', link: '/top' }],

		sidebar: [
			{
				// text: 'Examples',
				items: [
					{ text: 'Overview', link: '/' },
					{ text: 'Getting Started', link: '/getting-started' },
					{ text: 'How to Use', link: '/how-to-use' },
					{ text: 'Client', link: '/client' },
				],
			},
		],

		socialLinks: [{ icon: 'github', link: 'https://github.com/aiji42/kiribi' }],
	},
});
