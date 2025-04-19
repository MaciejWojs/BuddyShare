<template>
    <div>
      <h1>User Dashboard</h1>
      <p>Welcome to your dashboard, {{ displayName }}!</p>
      
      <section>
        <h2>User Statistics</h2>
        <!-- Placeholder for user statistics component -->
        <user-statistics :username="displayName" />
      </section>
  
      <section>
        <h2>Links</h2>
        <ul>
          <li><nuxt-link :to="`/user/${displayName}/dashboard/stream`">View Stream</nuxt-link></li>
          <li><nuxt-link :to="`/user/${displayName}/settings`">Account Settings</nuxt-link></li>
          <li><nuxt-link :to="`/user/${displayName}/activity`">Recent Activity</nuxt-link></li>
        </ul>
      </section>
    </div>
  </template>
  
  <script setup lang="ts">
    import { useRoute } from 'vue-router';
    const route = useRoute();
  const displayName = route.params.displayname;
  </script>
  
  <style scoped>
  /* Add any specific styles for the dashboard here */
  </style>