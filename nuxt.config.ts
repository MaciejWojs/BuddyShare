// https://nuxt.com/docs/api/configuration/nuxt-config

import vuetify, { transformAssetUrls } from "vite-plugin-vuetify";

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
    (_options, nuxt) => {
      nuxt.hooks.hook("vite:extendConfig", (config) => {
        // @ts-expect-error
        config.plugins.push(vuetify({ autoImport: true }));
      });
    },
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
  },

  compatibilityDate: "2025-03-10",
  devtools: { enabled: true },

  pinia: {
    // autoImports: ['defineStore', 'acceptHMRUpdate'],
    // Dodaj opcję do obsługi problemów z hydratacją
    storesDirs: ['./stores/**'],
  },
});
