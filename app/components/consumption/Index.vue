<script setup lang="ts">
// Components
import DataTable from './DataTable.vue'

// Types
import type { pdsData } from '../../../shared/types/pdsData'
import type { Building } from '../../../shared/types/building'

// Utils
import { getPdsData } from "#shared/utils/getPdsData"
import { columns } from './columns'

const supabase = useSupabaseClient()
const data = ref<pdsData[]>([])

async function getData(): Promise<pdsData[]> {
  return getPdsData(supabase, async (pdsList: string[]) => {
    return await $fetch<Building[]>('/api/buildings', {
      method: 'POST',
      body: { pds: pdsList }
    })
  })
}

const isLoading = ref(false)

onMounted(async () => {
  isLoading.value = true
  try {
    const result = await getData()
    data.value = result
  } catch (error) {
    console.error('Failed to load consumption data:', error)
    data.value = []
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="h-full">
    <DataTable :columns="columns" :data="data" :isLoading="isLoading"/>
  </div>
</template>