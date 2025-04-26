<script lang="ts" setup>
definePageMeta({
  middleware: ["user-exists"],
});
import { ref, computed } from "vue";

const config = useRuntimeConfig();
const BACK_HOST = config.public.BACK_HOST;
const route = useRoute();
const displayName = route.params.displayname;
const headers = {};

const {
  data: followersReqData,
  status: followersReqStatus,
  error: followersReqError,
} = await useFetch(`http://${BACK_HOST}/users/${displayName}/followers`, {
  method: "GET",
  headers: {
    ...headers,
    Accept: "application/json",
  },
  credentials: "include",
});

// Search and filter functionality
const searchQuery = ref("");

// Filter users by username
const filteredUsers = computed(() => {
  if (!followersReqData.value) return [];

  if (!searchQuery.value) {
    return followersReqData.value;
  }

  const query = searchQuery.value.toLowerCase();
  return followersReqData.value.filter((item) =>
    item.follower.userInfo.username.toLowerCase().includes(query)
  );
});

// Format date function if needed
const formatDate = (dateInput) => {
  if (!dateInput) return "N/A";
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  return date.toLocaleDateString();
};

const isLoading = computed(() => followersReqStatus.value === "pending");
</script>

<template>
  <v-container
    fluid
    class="followers-page pa-4"
  >
    <v-card
      class="mx-auto"
      max-width="900px"
    >
      <!-- Header with title and search -->
      <v-toolbar
        flat
        color="primary"
        dark
      >
        <v-toolbar-title>Your Followers</v-toolbar-title>
        <v-spacer />
        <v-text-field
          v-model="searchQuery"
          density="compact"
          placeholder="Search users..."
          variant="outlined"
          hide-details
          prepend-inner-icon="mdi-magnify"
          class="mx-2"
          style="max-width: 250px"
          bg-color="primary-lighten-1"
        />
      </v-toolbar>

      <!-- User List -->
      <v-card-text class="pa-0">
        <!-- Loading state -->
        <div
          v-if="isLoading"
          class="pa-4"
        >
          <v-skeleton-loader
            v-for="n in 5"
            :key="`skeleton-${n}`"
            type="list-item-avatar"
            class="mb-3"
          />
        </div>

        <!-- Users list -->
        <v-list
          v-else
          class="py-0"
        >
          <v-list-item
            v-for="item in filteredUsers"
            :key="item.followerId"
            :to="`/user/${item.follower.userInfo.username}`"
            class="py-2"
          >
            <template #prepend>
              <v-avatar
                size="40"
                color="grey-lighten-1"
              >
                <v-img
                  v-if="item.follower.userInfo.profilePicture"
                  :src="item.follower.userInfo.profilePicture"
                  alt="Profile"
                />
                <v-icon
                  v-else
                  icon="mdi-account"
                />
              </v-avatar>
            </template>

            <v-list-item-title class="text-subtitle-1 font-weight-medium">
              {{ item.follower.userInfo.username }}
            </v-list-item-title>
          </v-list-item>

          <!-- Empty state -->
          <v-list-item v-if="filteredUsers.length === 0">
            <v-list-item-title class="text-center py-4">
              <v-icon
                icon="mdi-account-off"
                size="large"
                class="mb-2"
              />
              <p class="text-h6 mb-1">No users found</p>
              <p
                class="text-body-2 text-grey"
                v-if="searchQuery"
              >
                Try a different search term
              </p>
              <p
                class="text-body-2 text-grey"
                v-else
              >
                {{ displayName }} doesn't have any followers yet
              </p>
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<style lang="scss" scoped>
.followers-page {
  min-height: 100vh;
}

.v-list-item {
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(var(--v-theme-primary), 0.05);
  }
}

:deep(.v-skeleton-loader__list-item) {
  background-color: rgba(0, 0, 0, 0.05);
}
</style>
