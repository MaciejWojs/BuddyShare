import { useFollowsStore } from "~/stores/follows";

export default defineNuxtPlugin(async () => {
    const followStore = useFollowsStore();
    await followStore.initialize();
});
