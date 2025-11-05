import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  runtimeConfig: {
    airtableAccessToken: process.env.AIRTABLE_ACCESS_TOKEN,
    googleCredentials: process.env.GOOGLE_CREDENTIALS,
    supabaseSecretKey: process.env.SUPABASE_SECRET_KEY,
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
    },
  },
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/supabase',
    'motion-v/nuxt',
    '@nuxtjs/color-mode',
    'nuxt-charts',
    'shadcn-nuxt',
  ],
  css: ['~/assets/css/tailwind.css'],
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  colorMode: {
    preference: 'system',
    fallback: 'system',
    hid: 'nuxt-color-mode-script',
    globalName: '__NUXT_COLOR_MODE__',
    componentName: 'ColorScheme',
    classPrefix: '',
    classSuffix: '',
    storage: 'localStorage',
    storageKey: 'nuxt-color-mode'
  },
  supabase: {
    redirectOptions: {
      login: '/login',
      cookieRedirect: false,
      callback: '/confirm',
    },
  },
  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * @default "./components/ui"
     */
    componentDir: './app/components/ui'
  },
})