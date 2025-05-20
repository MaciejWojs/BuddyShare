<template>
  <v-container class="py-6" fluid>
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">
        <v-card elevation="2" class="pa-6">
          <!-- Sekcja: Obserwujesz -->
          <v-card-title class="text-h5">Obserwujesz</v-card-title>
          <v-row v-if="amFollowing.length">
            <v-col
              v-for="user in amFollowing"
              :key="user.followerId"
              cols="12"
              sm="6"
              md="4"
            >
              <v-card
                class="pa-4 d-flex flex-column align-center rounded-lg"
                color="grey darken-4"
              >
                <v-avatar size="64" class="mb-2">
                  <v-img :src="user.follower.userInfo.profilePicture || '/Buddyshare.svg'" />
                </v-avatar>
                <div class="text-center text-h6">
                  {{ user.follower.userInfo.username }}
                </div>
                <v-btn
                  color="primary"
                  variant="text"
                  :to="`/user/${user.follower.userInfo.username}`"
                  class="mt-2"
                >
                  Odwiedź profil
                </v-btn>
              </v-card>
            </v-col>
          </v-row>
          <div v-else class="text-center pa-4">Nie obserwujesz nikogo.</div>

          <v-divider class="my-8" />

          <!-- Sekcja: Obserwują Cię -->
          <v-card-title class="text-h5">Obserwują Cię</v-card-title>
          <v-row v-if="whoFollowsMe.length">
            <v-col
              v-for="user in whoFollowsMe"
              :key="user.followerId"
              cols="12"
              sm="6"
              md="4"
            >
              <v-card
                class="pa-4 d-flex flex-column align-center rounded-lg"
                color="grey darken-4"
              >
                <v-avatar size="64" class="mb-2">
                  <v-img :src="user.followed.userInfo.profilePicture || '/Buddyshare.svg'" />
                </v-avatar>
                <div class="text-center text-h6">
                  {{ user.followed.userInfo.username }}
                </div>
                <v-btn
                  color="primary"
                  variant="text"
                  :to="`/user/${user.followed.userInfo.username}`"
                  class="mt-2"
                >
                  Odwiedź profil
                </v-btn>
              </v-card>
            </v-col>
          </v-row>
          <div v-else class="text-center pa-4">Nikt Cię nie obserwuje.</div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed } from 'vue'
import { useFollowsStore } from '~/stores/follows'

const followstore = useFollowsStore()

const amFollowing   = computed(() => followstore.amFollowing)
const whoFollowsMe = computed(() => followstore.whoFollowsMe)
</script>
