<script lang="ts" setup>
import { ref } from "vue";

const config = useRuntimeConfig();
const BACK_HOST = config.public.BACK_HOST;
const route = useRoute();

const displayName = route.params.displayname;

const { users, streamers } = useApi();

const streamerName = displayName as string;
</script>

<template>
  <button
    class="subscribe-button"
    @click="streamers.subscribe(streamerName)"
  >
    <span class="button-text">Sub</span>
  </button>
</template>

<style lang="scss" scoped>
.subscribe-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  border-radius: 50px;
  font-weight: bold;
  font-size: 14px;
  transition: all 0.3s ease;
  cursor: pointer;
  border: none;
  background-color: #6441a5; // Kolor Twitcha jako domyślny
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 140px;
  height: 40px;

  &:hover {
    background-color: #7d5bbe;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(1px);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .button-text {
    font-weight: 600;
  }
}
</style>
