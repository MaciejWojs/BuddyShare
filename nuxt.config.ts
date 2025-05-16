// https://nuxt.com/docs/api/configuration/nuxt-config

import vuetify, { transformAssetUrls } from "vite-plugin-vuetify";
import { L } from "vitest/dist/chunks/reporters.d.DG9VKi4m.js";
import { md3 } from 'vuetify/blueprints';

export default defineNuxtConfig({
  //...
  build: {
    transpile: ["vuetify"],
  },

  nitro: {
    preset: "bun",
  },

  runtimeConfig: {
    public: {
      SALT: process.env.SALT,
      PEPPER: process.env.PEPPER,
      // BACK_PORT: process.env.BACK_PORT,
      BACK_HOST: process.env.BACK_HOST,
    },
  },

  modules: [
    'vuetify-nuxt-module',
    "@nuxt/icon",
    "@nuxt/image",
    "@pinia/nuxt", // required
    "pinia-plugin-persistedstate/nuxt",
    'nuxt-echarts',

    // "@nuxtjs/color-mode",
    // "@nuxtjs/i18n",

    //...
  ],
  echarts: {
    ssr: true,
  },
  vite: {
    vue: {
      template: {
        transformAssetUrls,
      },
    },
    optimizeDeps: {
      include: [
        'vuetify',
        'echarts',
        'pinia',
        'socket.io-client',
        'dashjs',
        '@vueuse/core',
        'http-status-codes',
        'crypto-js'

      ],
    },
    cacheDir: '.nuxt/vite',
  },

  compatibilityDate: "2025-05-15",
  devtools: { enabled: true },
  vuetify: {
    vuetifyOptions: {
      blueprint: md3,
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
    },
  },

  pinia: {
    // autoImports: ['defineStore', 'acceptHMRUpdate'],
    // Dodaj opcję do obsługi problemów z hydratacją
    storesDirs: ['./stores/**'],
  },
});