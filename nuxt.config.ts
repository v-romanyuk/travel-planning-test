import { cpSync, realpathSync } from 'node:fs'
import { join } from 'node:path'
import {
  IconNamesGenerator,
  ModalsGenerator,
  autoImportConfig,
  pagesConfig,
  typeScriptConfig
} from './.config'

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@pinia/nuxt',
    ['@nuxtjs/supabase', {
      // Every page needs a session except the auth pages and the component reference
      redirectOptions: {
        login: '/login',
        callback: '/login',
        exclude: ['/signup', '/ui-kit'],
        saveRedirectToCookie: true
      }
    }],
    '@vueuse/nuxt'
  ],

  ssr: false,

  pages: pagesConfig,
  components: autoImportConfig.components,
  imports: autoImportConfig.scripts,
  devtools: { enabled: true },

  app: {
    head: {
      title: 'Trip Planner',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#1E5B3E' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
      ]
    }
  },

  css: [
    '@/assets/styles/main.css'
  ],

  colorMode: {
    preference: 'light'
  },

  ui: {
    theme: {
      // `rule` = hard constraints from the knowledge graph (they remove options); kept apart from `warning` on purpose
      colors: ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'rule']
    }
  },

  runtimeConfig: {
    databaseUrl: '',
    anthropicApiKey: '',
    agentModel: 'claude-sonnet-5-5',
    ruleModel: 'claude-haiku-5-5',
    agentRunTimeoutSeconds: 480,
    // Runs mostly wait on the model; the real ceiling is the Anthropic rate limit (lower to 2–3 on a low tier)
    agentWorkerConcurrency: 5,
    // Shows the "Seed catalogue" button and allows POST /api/catalogue/seed; off unless the deploy turns it on
    catalogueSeedEnabled: false,
    // WhatsApp via Twilio; all three empty (local dev) means runs finish with the notification `skipped`
    twilioAccountSid: '',
    twilioAuthToken: '',
    // "Whatsapp", not "WhatsApp": Nuxt maps camelCase to NUXT_TWILIO_WHATSAPP_FROM only with one word
    twilioWhatsappFrom: '',
    public: {
      appUrl: 'http://localhost:3000'
    }
  },

  experimental: {
    typedPages: true
  },
  compatibilityDate: '2025-07-15',

  // One always-on Fly machine: the queue worker lives in this process
  nitro: {
    preset: 'node-server',
    hooks: {
      // langgraph-sdk's dist imports deps vendored under dist/node_modules/.pnpm, which output tracing drops
      compiled (nitro) {
        if (nitro.options.dev) {
          return
        }
        const langgraph = realpathSync(join(nitro.options.rootDir, 'node_modules/@langchain/langgraph'))
        const vendored = 'langgraph-sdk/dist/node_modules'
        cpSync(join(langgraph, '..', vendored), join(nitro.options.output.serverDir, 'node_modules/@langchain', vendored), { recursive: true })
      }
    }
  },

  vite: {
    plugins: [
      ModalsGenerator(),
      IconNamesGenerator()
    ],
    resolve: {
      dedupe: ['vue-router']
    },
    optimizeDeps: {
      include: [
        'dayjs' // CJS
      ]
    }
  },

  typescript: typeScriptConfig,

  // `Icon` is our typed wrapper (app/features/platform/icons); Nuxt UI's UIcon imports NuxtIcon directly, so renaming is safe
  icon: {
    componentName: 'NuxtIcon',
    mode: 'svg',
    customCollections: [{ prefix: 'icon', dir: './app/features/platform/icons/assets' }]
  }
})
