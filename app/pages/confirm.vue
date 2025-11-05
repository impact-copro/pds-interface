<script setup lang="ts">
const route = useRoute()
const email = computed(() => route.query.email as string | undefined)
</script>

<template>
  <div class="w-screen h-screen flex items-center justify-center">
    <div class="max-w-lg w-full p-8 rounded-lg ">
      <OtpForm v-if="email" :email="email" />
    </div>
  </div>
</template>