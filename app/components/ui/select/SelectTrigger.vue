<script setup lang="ts">
import type { SelectTriggerProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { ChevronDown } from "lucide-vue-next"
import { SelectIcon, SelectTrigger, useForwardProps } from "reka-ui"
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<SelectTriggerProps & { class?: HTMLAttributes["class"], size?: "sm" | "default" }>(),
  { size: "default" },
)

const delegatedProps = reactiveOmit(props, "class", "size")
const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <SelectTrigger
    data-slot="select-trigger"
    :data-size="size"
    v-bind="forwardedProps"
    :class="cn(
      'rounded-full bg-zinc-100 dark:bg-zinc-900 py-2 px-3 text-sm h-[30px] gap-2 hover:outline-1 outline-offset-2 outline-zinc-200 dark:outline-zinc-800 flex items-center gap-2 justify-between text-[13px] text-zinc-700 dark:text-zinc-300 cursor-pointer',
      props.class,
    )"
  >
    <slot />
    <SelectIcon as-child>
      <ChevronDown class="size-3.5" />
    </SelectIcon>
  </SelectTrigger>
</template>