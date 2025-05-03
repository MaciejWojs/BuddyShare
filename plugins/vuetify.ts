// import this after install `@mdi/font` package
import '@mdi/font/css/materialdesignicons.css'

import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { md3 } from 'vuetify/blueprints'
import 'vuetify/styles'

export default defineNuxtPlugin((app) => {
  const vuetify = createVuetify({
    // ... your configuration
    blueprint: md3,
    ssr: true,
    theme: {
      defaultTheme: 'dark',
      themes: {
        dark: {
          colors: {
            background: '#0D0D0D', // ciemne tło
            surface: '#1A1A1A',
            primary: '#9C27B0',   // fiolet
            secondary: '#7C4DFF',
          },
        },
      },
    },
  })
  app.vueApp.use(vuetify)
})
