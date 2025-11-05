<script setup lang="ts">
// Types
import type { Qmin } from '../../shared/types/qmin'
import type { ChartData } from '../../shared/types/chartData'

// Props
const props = defineProps<{
  data: Qmin[]
}>()

// Data
const data: ChartData[] = props.data.map((item) => ({
  metering: item.qmin,
  date: item.reference_date
})).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

// Chart configuration
const categories: Record<string, BulletLegendItemInterface> = {
  metering: {
    name: 'Qmin',
    color: 'var(--primary)',
  }
}

const meteringValues = data.map(d => d.metering)
const minValue = meteringValues.length > 0 ? Math.min(...meteringValues) : 0
const maxValue = meteringValues.length > 0 ? Math.max(...meteringValues) : 100
const yDomain: [number, number] = [minValue, maxValue]

const xFormatter = (i: number) => {
  const dateStr = data[i]?.date
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('fr-FR', { month: 'short', year: '2-digit' }).charAt(0).toUpperCase() + date.toLocaleString('fr-FR', { month: 'short', year: '2-digit' }).slice(1)
}

</script>

<template>
  <LineChart
    :data="data"
    :height="240"
    :categories="categories"
    :y-num-ticks="4"
    :x-num-ticks="4"
    :x-formatter="xFormatter"
    :hide-legend="true"
    :x-grid-line='false'
    :y-grid-line="true"
    :hide-tooltip='false'
    :x-domain-line='true'
    :y-domain-line='true'
    :x-tick-line='true'
    :y-tick-line='true'
    :y-domain="yDomain"
  >
    <template #tooltip="{ values }">
      <div class="flex flex-col items-start juystify-center gap-.5 rounded bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <span class="py-1 px-2 w-full text-red-6O0 text-sm">
          {{ values?.date ? new Date(values.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '' }}
        </span>
        <div class="w-full h-[1px] bg-zinc-200 dark:bg-zinc-800"></div>
        <div class="flex gap-2 items-center py-1 px-2 w-full text-sm">
          <!-- tailwind-safelist hidden -->
          <div class="w-2 h-2 rounded-full bg-primary"></div>
          Qmin - {{ values?.metering }}
        </div>
      </div>
    </template>
  </LineChart>

</template>
