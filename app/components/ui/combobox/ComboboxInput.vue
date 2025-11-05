<script setup lang="ts">
import type { ComboboxInputEmits, ComboboxInputProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { SearchIcon } from "lucide-vue-next"
import { ComboboxInput, useForwardPropsEmits } from "reka-ui"
import { cn } from "@/lib/utils"

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<ComboboxInputProps & {
  class?: HTMLAttributes["class"]
}>()

const emits = defineEmits<ComboboxInputEmits>()

const delegatedProps = reactiveOmit(props, "class")

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <div
    data-slot="command-input-wrapper"
    class="flex items-center gap-2 w-full px-3 max-w-sm border border-zinc-200 dark:border-zinc-800 rounded-full bg-zinc-100 dark:bg-zinc-900 text-xs h-[30px] mb-1"
  >
    <SearchIcon class="size-3.5 shrink-0 opacity-50" />
    <ComboboxInput
      data-slot="command-input"
      :class="cn(
        'placeholder:text-zinc-700 dark:placeholder:text-zinc-300 flex h-[30px] w-full rounded-md bg-transparent py-3 text-xs outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
      )"

      v-bind="{ ...forwarded, ...$attrs }"
    >
      <slot />
    </ComboboxInput>
  </div>
</template>