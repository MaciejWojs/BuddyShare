<template>
    <div>
        <h1>Twoje subskrypcje</h1>
        <ul>
            <li v-for="sub in subscriptions" :key="sub.subscriberId">
                {{ sub.streamerUsername }}
                <button @click="remove(sub.streamerUsername)">Usuń</button>
            </li>
        </ul>
        <div v-if="!subscriptions.length">Brak subskrypcji.</div>
    </div>
</template>

<script setup lang="ts">
import { useSubscriptionsStore } from '~/stores/subscriptions'
import { onMounted } from 'vue'

const store = useSubscriptionsStore()
const subscriptions = computed(() => store.subscriptions)

const remove = async (username: string) => {
    await store.removeSubscription(username)
}
</script>
