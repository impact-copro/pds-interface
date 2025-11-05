<script lang="ts" setup>
import { Sun, Moon, ChevronLeft } from 'lucide-vue-next'
import { motion } from "motion-v"

const colorMode = useColorMode()
const isDark = computed(() => colorMode.preference === 'dark')
const expanded = ref(false)

watch(() => colorMode.preference, (newPreference: string | undefined) => {
  if(newPreference) {
    expanded.value = !expanded.value
  }
})
</script>

<template>
  <motion.div
    class="relative rounded-full bg-zinc-100 w-[48px] dark:bg-zinc-900 p-1 py-2 flex items-center gap-0.5 hover:outline-1 outline-offset-2 outline-zinc-200 dark:outline-zinc-800"
    :animate="{ width: expanded ? 74 : 48 }"
  >
    <motion.div
      :animate="{ rotate: expanded ? 180 : 0 }"
      @click="expanded = !expanded"
    >
      <ChevronLeft class="size-3.5 text-zinc-700 dark:text-zinc-300 cursor-pointer"/>
    </motion.div>

    <motion.div
      :animate="{ translateX: expanded ? -26 : 0 }"
      class="flex absolute top-1/2 -translate-y-1/2 right-1 items-center justify-center bg-zinc-200 dark:bg-zinc-800 p-1 rounded-full transition-colors duration-200 ease-in-out"
      :class="[isDark ? 'z-20' : 'z-0', expanded ? 'cursor-pointer hover:bg-zinc-300 dark:hover:bg-zinc-700' : '']"
      @click="colorMode.preference = 'dark'"
    >
      <Moon  class="size-3.5 text-zinc-700 dark:text-zinc-200" />
    </motion.div>
    <motion.div
      class="flex absolute top-1/2 -translate-y-1/2 right-1 items-center justify-center bg-zinc-200 dark:bg-zinc-800 p-1 rounded-full transition-colors duration-200 ease-in-out"
      :class="[isDark ? 'z-0' : 'z-20', expanded ? 'cursor-pointer hover:bg-zinc-300 dark:hover:bg-zinc-700' : '']"
      @click="colorMode.preference = 'light'"
    >
      <Sun class="size-3.5 text-zinc-700 dark:text-zinc-300" />
    </motion.div>
  </motion.div>
</template>