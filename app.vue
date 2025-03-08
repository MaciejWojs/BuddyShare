<script setup lang="ts">
/* useFetch() is auto-imported */
const { data, refresh, status } = await useFetch("http://localhost:5000/test");
</script>
<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtPage />

    <div v-if="status === 'success'">
      <pre>{{ data }}</pre>
    </div>
    <div v-else-if="status === 'loading'">Loading...</div>
    <div v-else>Error loading data.</div>
  </div>
</template>
