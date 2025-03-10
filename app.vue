<script setup lang="ts">
/* useFetch() is auto-imported */
const { data, refresh, status } = await useFetch("http://localhost:5000/test");
function handleClick() {
  alert('Card clicked!');
}
</script>
<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <!-- <div v-if="status === 'success'">
      <pre>{{ data }}</pre>
    </div>
    <div v-else-if="status === 'loading'">Loading...</div>
    <div v-else>Error loading data.</div> -->
  </div>
  <!-- <div>
    <v-btn>
      Button
    </v-btn>
    <v-card title="Card title" subtitle="Subtitle" text="..." @click="handleClick">
    </v-card>
  </div> -->


</template>
