// app.config.ts
export default defineAppConfig({
  icon: {
    size: '24px', // default <Icon> size applied
    class: 'icon', // default <Icon> class applied
    mode: 'scss', // default <Icon> mode applied
    aliases: {
      'nuxt': 'logos:nuxt-icon',
    }
  }
})
