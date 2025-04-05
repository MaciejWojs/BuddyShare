import { defineNuxtPlugin } from '#app';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('LazyVideoPlayer', defineAsyncComponent(() => 
    import('~/components/stream/VideoPlayer.vue')
  ));
  
});