export default defineNuxtPlugin(async () => {
    const streamersStore = useStreamsStore();
    await streamersStore.fetchStreams();
});
