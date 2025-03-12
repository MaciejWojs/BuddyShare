// https://nuxt.com/docs/api/configuration/nuxt-config

import vuetify, { transformAssetUrls } from "vite-plugin-vuetify";

export default defineNuxtConfig({
  //...
  build: {
    transpile: ["vuetify"],
  },

  runtimeConfig: {
    public: {
      SALT: process.env.SALT,
      PEPPER: process.env.PEPPER,
      BACK_PORT: process.env.BACK_PORT,
    },
  },

  modules: [
    (_options, nuxt) => {
      nuxt.hooks.hook("vite:extendConfig", (config) => {
        // @ts-expect-error
        config.plugins.push(vuetify({ autoImport: true }));
      });
    },
    //...
  ],

  vite: {
    vue: {
      template: {
        transformAssetUrls,
      },
    },
  },

  compatibilityDate: "2025-03-10",
  devtools: { enabled: true },
});
