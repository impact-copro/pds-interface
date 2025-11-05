<script setup lang="ts">
// Utils
import { cn } from "@/lib/utils"

// Components
import { Check, ChevronDown, DropletOff } from "lucide-vue-next"
import { Combobox, ComboboxAnchor, ComboboxEmpty, ComboboxGroup, ComboboxInput, ComboboxItem, ComboboxItemIndicator, ComboboxList, ComboboxTrigger, ComboboxViewport } from "@/components/ui/combobox"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"

// Types
import type { Index } from '../../shared/types/index'
import type { Qmin } from '../../shared/types/qmin'
import type { Building } from '../../shared/types/building'

// Initalize Supabase
const supabase = useSupabaseClient()

// References
const indexList = ref<Index[]>([])
const qminList = ref<Qmin[]>([])
const selectedBuilding = ref<Building>()
const selectedPds = ref<string | null>(null)

// Data fetching
const { data: buildingList } = await useFetch('/api/buildings')

const getIndexs = async () => {
  if (!selectedPds.value) return

  const { data } = await supabase
  .from('indexs')
  .select(`
    daily_differential,
    date_index,
    index,
    clients (
      pds
    )
  `)
  .eq('pds', selectedPds.value)
  .limit(1000)
  .order('date_index', { ascending: false })

  console.log('fetching indexs', data)
  indexList.value = data ? data as unknown as Index[] : []
}

const getQmins = async () => {
  if (!selectedPds.value) return
  
  const { data } = await supabase.from('qmins').select(`
    reference_date,
    qmin,
    clients (
      pds
    )
  `)
  .eq('pds', selectedPds.value)
  .limit(1000)
  .order('reference_date', { ascending: false })

  qminList.value = data ? data as unknown as Qmin[] : []
}

// Watchers
watch(selectedBuilding, async (newValue: Building | undefined) => {
  if (newValue && newValue.pds.length > 0) {
    selectedPds.value = newValue.pds[0] as string
  }
  return
})

watch(selectedPds, async (newValue: string | null) => {
  if (newValue) {
    await Promise.all([
      getIndexs(),
      getQmins()
    ])
  }
})
</script>

<template>
  <div class="container mx-auto w-11/12 max-w-7xl">
    <div class="flex items-baseline gap-2">
      <h1 class="text-black dark:text-white font-bold text-3xl mt-10">
        Interface consommation
      </h1>
      <span class="font-medium text-primary">
        par Impact Copro
      </span>
    </div>

    <span class="text-zinc-700 dark:text-zinc-300 text-sm mt-2">
      Sélectionnez un immeuble pour suivre son niveau de consommation.
    </span>
    <div class="flex gap-2 items-center mt-6 w-full justify-between">

      <div class="flex gap-1">
        <Combobox v-model="selectedBuilding" by="name" class="flex-1">
          <ComboboxAnchor as-child class="w-fit min-w-[200px]">
            <ComboboxTrigger as-child>
              <div class="flex items-center justify-between cursor-pointer bg-zinc-100 dark:bg-zinc-900 py-2 px-3 rounded-full text-sm h-[30px] gap-2 hover:outline-1 outline-offset-2 outline-zinc-200 dark:outline-zinc-800">
                <span class="truncate w-fit text-zinc-700 dark:text-zinc-300 text-[13px]">
                  {{ selectedBuilding?.name ?? 'Sélectionner..' }}
                </span>
                <ChevronDown class="size-3.5 text-zinc-700 dark:text-zinc-300" />
              </div>
            </ComboboxTrigger>
          </ComboboxAnchor>

          <ComboboxList align="start" class="min-w-sm">
            <ComboboxInput placeholder="Rechercher.." class="h-full" />

            <ComboboxEmpty>
              Pas d'immeuble trouvé..
            </ComboboxEmpty>

            <ComboboxViewport>
              <ComboboxGroup>
                <ComboboxItem
                  v-for="building in buildingList || []"
                  :key="building.name as string"
                  :value="building"
                  class="cursor-pointer"
                >
                  {{ building.name }}
                  <ComboboxItemIndicator>
                    <Check :class="cn('ml-auto h-4 w-4')" />
                  </ComboboxItemIndicator>
                </ComboboxItem>
              </ComboboxGroup>
            </ComboboxViewport>
          </ComboboxList>
        </Combobox>

        <Select v-model="selectedPds">
          <SelectTrigger class="w-[180px]">
            <SelectValue placeholder="Sélectionner un PDS" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>N° PDS</SelectLabel>
              <SelectItem v-for="pds in selectedBuilding?.pds" :key="pds" :value="pds">
                {{ pds }}
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div class="flex items-center gap-2">
        <ThemeSelector />
        <SignOutButton />
      </div>
    </div>

    <div class="mt-6 flex flex-col w-full">
      <div
        v-if="selectedBuilding"
        :key="selectedPds ?? ''"
      >
        <h2 class="text-base mb-4 font-semibold">PDS N°{{ selectedPds }}</h2>
        <div class="flex max-lg:flex-col border rounded-xl overflow-hidden border-zinc-200 dark:border-zinc-800">
          <div 
            class="flex-1 min-w-0 max-lg:w-full"
          >
            <h3 class="text-sm px-4 font-bold py-1.5 bg-zinc-50 dark:bg-zinc-950">Mesure index</h3>
            <div class="w-full h-[1px] bg-zinc-200 dark:bg-zinc-800"></div>
            <IndexChart 
              v-if="indexList.length > 0"
              :data="indexList" 
              class="py-4 px-4"
            />
            <Empty v-else>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <DropletOff />
                </EmptyMedia>
                <EmptyTitle>Aucune donnée</EmptyTitle>
                <EmptyDescription>
                  Aucune donnée d'index n'est présente pour ce PDS en base de données.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>

          <div class="w-px shrink-0 self-stretch bg-zinc-200 dark:bg-zinc-800 max-lg:w-full max-lg:h-px max-lg:self-auto"></div>

          <div 
            class="flex-1 min-w-0 max-lg:w-full"
          >
            <h3 class="text-sm font-bold px-4 py-1.5 bg-zinc-50 dark:bg-zinc-950">Mesure Qmin</h3>
            <div class="w-full h-[1px] bg-zinc-200 dark:bg-zinc-800"></div>
            <QminChart 
              v-if="qminList.length > 0"
              :data="qminList" 
              class="py-4 px-4"
            />
            <Empty v-else>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <DropletOff />
                </EmptyMedia>
                <EmptyTitle>Aucune donnée</EmptyTitle>
                <EmptyDescription>
                  Aucune donnée qmin n'est présente pour ce PDS en base de données.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        </div>
      </div>
      <div v-else class="w-full rounded-xl from-zinc-200/50 dark:from-zinc-800/50 to-background h-full bg-gradient-to-b flex items-center justify-center p-6 min-h-[200px]">
        <span class="text-zinc-700 dark:text-zinc-300 text-sm">
          Veuillez sélectionner un immeuble..
        </span>
      </div>
    </div>
  </div>
</template>