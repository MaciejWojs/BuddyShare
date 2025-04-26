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
  data: followingReqData,
  status: followingReqStatus,
  error: followingReqError,
} = await useFetch(`http://${BACK_HOST}/users/${displayName}/following`, {
  method: "GET",
  headers: {
    ...headers,
    Accept: "application/json",
  },
  credentials: "include",
});

// Search and filter functionality
const searchQuery = ref("");

// Track which users are being unfollowed
const unfollowingUsers = ref(new Set());

// Function to unfollow a user
const unfollowUser = async (targetUsername) => {
  if (unfollowingUsers.value.has(targetUsername)) return; // Prevent duplicate requests

  unfollowingUsers.value.add(targetUsername);

  try {
    await $fetch(
      `http://${BACK_HOST}/users/${displayName}/followers/follow/${targetUsername}`,
      {
        method: "DELETE",
        headers,
        credentials: "include",
      }
    );

    // Update the following list after unfollowing
    followingReqData.value = followingReqData.value.filter(
      (item) => item.followed.userInfo.username !== targetUsername
    );
  } catch (error) {
    console.error("Error unfollowing user:", error);
  } finally {
    unfollowingUsers.value.delete(targetUsername);
  }
};

// Filter users by username
const filteredUsers = computed(() => {
  if (!followingReqData.value) return [];

  if (!searchQuery.value) {
    return followingReqData.value;
  }

  const query = searchQuery.value.toLowerCase();
  return followingReqData.value.filter((item) =>
    item.followed.userInfo.username.toLowerCase().includes(query)
  );
});

// Format date function if needed
const formatDate = (dateInput) => {
  if (!dateInput) return "N/A";
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  return date.toLocaleDateString();
};

const isLoading = computed(() => followingReqStatus.value === "pending");
</script>

<template>
  <v-container
    fluid
    class="following-page pa-4"
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
        <v-toolbar-title>Your Follows</v-toolbar-title>
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
            class="py-2"
          >
            <template #prepend>
              <v-avatar
                size="40"
                color="grey-lighten-1"
              >
                <v-img
                  v-if="item.followed.userInfo.profilePicture"
                  :src="item.followed.userInfo.profilePicture"
                  alt="Profile"
                />
                <v-icon
                  v-else
                  icon="mdi-account"
                />
              </v-avatar>
            </template>

            <v-list-item-title class="text-subtitle-1 font-weight-medium">
              <nuxt-link
                :to="`/user/${item.followed.userInfo.username}`"
                class="text-decoration-none"
              >
                {{ item.followed.userInfo.username }}
              </nuxt-link>
            </v-list-item-title>

            <!-- Add unfollow button -->
            <template #append>
              <v-btn
                density="compact"
                icon
                variant="text"
                color="error"
                @click="unfollowUser(item.followed.userInfo.username)"
                :loading="unfollowingUsers.has(item.followed.userInfo.username)"
                :disabled="
                  unfollowingUsers.has(item.followed.userInfo.username)
                "
              >
                <v-icon>mdi-account-remove</v-icon>
                <v-tooltip
                  activator="parent"
                  location="bottom"
                >
                  Unfollow user
                </v-tooltip>
              </v-btn>
            </template>
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
                {{ displayName }} is not following anyone
              </p>
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<style lang="scss" scoped>
.following-page {
  // background-color: #f5f5f5;
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
