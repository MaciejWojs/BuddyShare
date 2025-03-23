<template>
  <div>
    <p>Test</p>
    <p>Status: {{ status }}</p>
  </div>
</template>

<script setup lang="ts">
const headers = useRequestHeaders(["cookie"]);
import StatusCodes from "http-status-codes";
const config = useRuntimeConfig();
const status = ref();
const BACK_HOST = config.public.BACK_HOST;

const { data } = useFetch(`http://${BACK_HOST}/auth/test`, { headers });
status.value = data;
// console.log(data);
</script>
