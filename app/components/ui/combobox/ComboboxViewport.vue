<script setup lang="ts">
import type { ComboboxViewportProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { ComboboxViewport, useForwardProps } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<ComboboxViewportProps & { class?: HTMLAttributes["class"] }>()

const delegatedProps = reactiveOmit(props, "class")

const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <ComboboxViewport
    data-slot="combobox-viewport"
    v-bind="forwarded"
    :class="cn('max-h-[300px] scroll-py-1 overflow-x-hidden overflow-y-auto rounded-xl p-1 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800', props.class)"
  >
    <slot />
  </ComboboxViewport>
</template>