import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv, type Plugin} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

function localAiChatDevPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'local-ai-chat-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/ai-chat', async (req, res, next) => {
        try {
          const method = (req.method || 'GET').toUpperCase();
          const fnPath = path.resolve(import.meta.dirname, 'functions/api/ai-chat.js');
          const mod = (await import(`file://${fnPath}?t=${Date.now()}`)) as {
            onRequestOptions?: (ctx: unknown) => Promise<Response>;
            onRequestGet?: (ctx: unknown) => Promise<Response>;
            onRequestPost?: (ctx: unknown) => Promise<Response>;
            onRequest?: (ctx: unknown) => Promise<Response>;
          };

          const rawBody =
            method === 'POST' || method === 'PUT' || method === 'PATCH'
              ? await new Promise<string>((resolve, reject) => {
                  const chunks: Buffer[] = [];
                  req.on('data', (chunk: Buffer) => chunks.push(chunk));
                  req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
                  req.on('error', reject);
                })
              : undefined;

          const host = req.headers.host || 'localhost:3000';
          const fullUrl = `http://${host}${req.originalUrl || '/api/ai-chat'}`;
          const headers = new Headers();
          for (const [k, v] of Object.entries(req.headers)) {
            if (typeof v === 'string') headers.set(k, v);
            else if (Array.isArray(v)) headers.set(k, v.join(', '));
          }

          const webRequest = new Request(fullUrl, {
            method,
            headers,
            body: rawBody,
          });

          const context = {
            request: webRequest,
            env: {
              GROQ_API_KEY: env.GROQ_API_KEY || process.env.GROQ_API_KEY || '',
              GROQ_MODEL: env.GROQ_MODEL || process.env.GROQ_MODEL || '',
              GEMINI_API_KEY: env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '',
            },
          };

          let webResponse: Response | null = null;
          if (method === 'OPTIONS' && mod.onRequestOptions) {
            webResponse = await mod.onRequestOptions(context);
          } else if (method === 'GET' && mod.onRequestGet) {
            webResponse = await mod.onRequestGet(context);
          } else if (method === 'POST' && mod.onRequestPost) {
            webResponse = await mod.onRequestPost(context);
          } else if (mod.onRequest) {
            webResponse = await mod.onRequest(context);
          }

          if (!webResponse) {
            next();
            return;
          }

          res.statusCode = webResponse.status;
          webResponse.headers.forEach((value, key) => {
            res.setHeader(key, value);
          });
          const text = await webResponse.text();
          res.end(text);
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(
            JSON.stringify({
              ok: false,
              reply: `خطای داخلی سرور محلی دستیار هوشمند: ${err instanceof Error ? err.message : String(err)}`,
            }),
          );
        }
      });
    },
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      localAiChatDevPlugin(env),
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'icon.svg',
          'apple-touch-icon.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-512x512.png',
          'sw-notifications.js',
        ],
        manifest: {
          id: '/',
          name: 'سامانه جامع خدمات دانشجویی - دانشگاه فرهنگیان',
          short_name: 'خدمات دانشجو',
          description:
            'سامانه جامع خدمات دانشجویی دانشگاه فرهنگیان - سراهای دانشجویی، آموزش، مالی، فرهنگی، کتابخانه و هوشمندسازی',
          lang: 'fa',
          dir: 'rtl',
          theme_color: '#0d9488',
          background_color: '#f8fafc',
          display: 'standalone',
          display_override: ['standalone', 'minimal-ui'],
          orientation: 'any',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          importScripts: ['/sw-notifications.js'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          navigateFallbackDenylist: [/^\/api\//, /^\/functions\//],
          runtimeCaching: [
            {
              urlPattern: ({url}) => url.pathname.startsWith('/api/'),
              handler: 'NetworkOnly',
              method: 'GET',
            },
            {
              urlPattern: ({url}) => url.pathname.startsWith('/api/'),
              handler: 'NetworkOnly',
              method: 'POST',
            },
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
              handler: 'NetworkOnly',
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
      dedupe: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-is',
      ],
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-is',
        'lucide-react',
        'recharts',
        'xlsx',
        'canvas-confetti',
      ],
    },
    build: {
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules/xlsx')) {
              return 'vendor-xlsx';
            }
            if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
              return 'vendor-charts';
            }
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-icons';
            }
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-is/') ||
              id.includes('node_modules/scheduler/')
            ) {
              return 'vendor-react';
            }
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
