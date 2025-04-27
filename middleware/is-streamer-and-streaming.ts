export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return;
  const authStore = useAuthStore();
  const streamsStore = useStreamsStore();
  const streamerParams = to.params.displayname as string;
  const streamerAndStreamingStatus = useState<Boolean>(
    "streamerAndStreamingStatus",
    () => false
  );

  if (!streamerParams) {
    return;
  }
  if (!authStore.authenticated) {
    return;
  }
  const currentUserUsername = authStore.userName;
  if (!currentUserUsername) {
    console.error("EXITING MIDDLEWARE : currentUserUsername is null");
    return;
  }
  if (currentUserUsername !== streamerParams) {
    return;
  }

  if (!streamsStore.getStreamByStreamerName(streamerParams)) {
    console.error("EXITING MIDDLEWARE : User is not streaming");
    return;
  }

  streamerAndStreamingStatus.value = true;
});
