<!-- pages/admin/users.vue -->
<template>
  <v-container
    fluid
    class="admin-panel pa-4 fill-height"
  >
    <v-row
      no-gutters
      class="fill-height"
    >
      <!-- Main Content Column -->
      <v-col cols="12">
        <v-card class="h-100">
          <!-- Admin Panel Header -->
          <v-card-title class="d-flex align-center py-3 px-4 bg-grey-darken-4">
            <h2 class="text-h5 font-weight-bold">User Management</h2>
            <v-spacer />
            <v-text-field
              v-model="searchQuery"
              density="compact"
              placeholder="Search users..."
              variant="outlined"
              hide-details
              prepend-inner-icon="mdi-magnify"
              class="ml-4"
              style="max-width: 300px"
            />
            <v-menu>
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon
                  variant="text"
                  class="ml-2"
                >
                  <v-icon>mdi-filter</v-icon>
                  <v-badge
                    v-if="selectedRoles.length > 0"
                    color="primary"
                    :content="selectedRoles.length"
                    dot
                  />
                </v-btn>
              </template>
              <v-card min-width="200px">
                <v-card-title class="text-subtitle-1"
                  >Filter by Role</v-card-title
                >
                <v-divider></v-divider>
                <v-card-text class="pt-2">
                  <v-checkbox
                    v-for="role in availableRoles"
                    :key="role"
                    v-model="selectedRoles"
                    :label="role"
                    :value="role"
                    density="compact"
                    hide-details
                    class="mb-1"
                  ></v-checkbox>
                </v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn
                    variant="text"
                    size="small"
                    @click="selectedRoles = []"
                  >
                    Clear
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-menu>
          </v-card-title>

          <!-- User List -->
          <v-card-text class="pa-0">
            <v-list
              lines="two"
              class="pt-0"
            >
              <v-list-item
                v-for="user in filteredUsers"
                :key="user.id"
                class="px-4 py-3"
              >
                <v-tooltip
                  v-if="authStore.authenticated"
                  location="bottom"
                  text="Your Profile"
                >
                  <template #activator="{ props }">
                    <Icon
                      name="ic:baseline-person-outline"
                      size="2em"
                      v-bind="props"
                      @click="navigateTo(`/user/${user.name}`)"
                      class="cursor-pointer transition-opacity hover:opacity-80"
                    />
                  </template>
                </v-tooltip>

                <div class="d-flex align-center">
                  <v-list-item-title class="font-weight-medium">
                    {{ user.name }}
                  </v-list-item-title>
                  <v-chip
                    size="small"
                    class="ml-2 px-2 text-caption"
                    variant="outlined"
                    label
                  >
                    {{ user.role }}
                  </v-chip>
                </div>
                <v-list-item-subtitle class="text-caption">
                  {{ user.email }}
                </v-list-item-subtitle>

                <template #append>
                  <div class="d-flex ga-2">
                    <v-btn
                      variant="tonal"
                      size="small"
                      color="primary"
                      prepend-icon="mdi-account-edit"
                    >
                      Edit
                    </v-btn>
                    <v-btn
                      variant="tonal"
                      size="small"
                      color="error"
                      prepend-icon="mdi-delete"
                    >
                      Delete
                    </v-btn>
                    <v-btn
                      variant="tonal"
                      size="small"
                      prepend-icon="mdi-shield-account"
                    >
                      Roles
                    </v-btn>
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
const authStore = useAuthStore();

const searchQuery = ref("");
const selectedRoles = ref([]);

// Sample user data
const users = ref([
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    avatar: "",
    role: "Admin",
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    avatar: "",
    role: "Moderator",
  },
  {
    id: 3,
    name: "Bob Johnson",
    email: "bob@example.com",
    avatar: "",
    role: "User",
  },
  // Add more sample users as needed
]);

// Extract unique roles for filter dropdown
const availableRoles = computed(() => {
  return [...new Set(users.value.map((user) => user.role))];
});

const filteredUsers = computed(() => {
  let filtered = users.value;

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query)
    );
  }

  // Filter by selected roles
  if (selectedRoles.value.length > 0) {
    filtered = filtered.filter((user) =>
      selectedRoles.value.includes(user.role)
    );
  }

  return filtered;
});
</script>

<style lang="scss" scoped>
.admin-panel {
  background: #1e1e1e;
  height: 100vh;
}

.v-list-item {
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
}

// Scrollable user list
.v-card-text {
  overflow-y: auto;
  max-height: calc(100vh - 96px);
  scrollbar-width: thin;
}
</style>
