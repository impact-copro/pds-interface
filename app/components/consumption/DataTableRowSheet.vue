<script lang="ts" setup>
// Components
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { DropletOff } from "lucide-vue-next"
import IndexChart from './DataTableIndexChart.vue'
import QminChart from './DataTableQminChart.vue'

// Utils
import { formatDate } from '@/utils/formatDate'

// Types
import type { Index } from '../../../shared/types/index'
import type { Qmin } from '../../../shared/types/qmin'
import type { pdsData } from '../../../shared/types/pdsData'

const supabase = useSupabaseClient()

const indexList = ref<Index[]>([])
const qminList = ref<Qmin[]>([])

const props = defineProps<{
  pds: pdsData | null
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void
  (e: 'refresh'): void
}>()

const openProxy = computed({
  get: () => props.isOpen,
  set: (value: boolean) => emit('update:isOpen', value),
})

const preventSheetCloseOnTableClick = (event: any) => {
  const originalEvent = event?.detail?.originalEvent as PointerEvent | MouseEvent | undefined
  const target = originalEvent?.target as HTMLElement | undefined
  const clickedTable = target?.closest('[data-role="org-table-row"]')
  if (clickedTable) {
    event.preventDefault()
  }
}

const getIndexs = async () => {
  if (!props.pds) return []

  const { data } = await supabase
  .from('indexs')
  .select(`
    date_index,
    index,
    clients (
      pds
    )
  `)
  .eq('pds', props.pds.consumption.pds)
  .limit(1000)
  .order('date_index', { ascending: false })

  return data ? data as unknown as Index[] : []
}

const getQmins = async () => {
  if (!props.pds) return []
  
  const { data } = await supabase.from('qmins').select(`
    reference_date,
    qmin,
    clients (
      pds
    )
  `)
  .eq('pds', props.pds.consumption.pds)
  .limit(1000)
  .order('reference_date', { ascending: false })

  return data ? data as unknown as Qmin[] : []
}

watch(() => props.pds, async (newPds) => {
  if (!newPds) {
    indexList.value = []
    qminList.value = []
    return
  }
  
  const [indexs, qmins] = await Promise.all([
    getIndexs(),
    getQmins()
  ])

  indexList.value = indexs ?? []
  qminList.value = qmins ?? []

}, { immediate: true })

const indexDailyDiffClass = computed(() => {
  if (props.pds?.consumption?.last_index == null || props.pds?.consumption?.index_daily_differential == null) {
    return ''
  }
  const diff = props.pds.consumption.last_index - props.pds.consumption.index_daily_differential
  if (diff >= 50) return 'text-red-500'
  if (diff <= -50) return 'text-green-500'
  return ''
})

const qminDailyDiffClass = computed(() => {
  if (props.pds?.consumption?.last_qmin == null || props.pds?.consumption?.qmin_daily_differential == null) {
    return ''
  }
  const diff = props.pds.consumption.last_qmin - props.pds.consumption.qmin_daily_differential
  if (diff >= 50) return 'text-red-500'
  if (diff <= -50) return 'text-green-500'
  return ''
})

const indexWeeklyDiffClass = computed(() => {
  if (props.pds?.consumption?.last_index == null || props.pds?.consumption?.index_weekly_differential == null) {
    return ''
  }
  const diff = props.pds.consumption.last_index - props.pds.consumption.index_weekly_differential
  if (diff >= 50) return 'text-red-500'
  if (diff <= -50) return 'text-green-500'
  return ''
})

const qminWeeklyDiffClass = computed(() => {
  if (props.pds?.consumption?.last_qmin == null || props.pds?.consumption?.qmin_weekly_differential == null) {
    return ''
  }
  const diff = props.pds.consumption.last_qmin - props.pds.consumption.qmin_weekly_differential
  if (diff >= 50) return 'text-red-500'
  if (diff <= -50) return 'text-green-500'
  return ''
})
</script>

<template>
 <Sheet v-model:open="openProxy" :modal="false">
    <SheetContent @pointer-down-outside="preventSheetCloseOnTableClick" class="overflow-y-auto">
      <SheetHeader class="p-0">
        <div class="flex flex-col gap-2 items-start">
          <SheetTitle class="text-2xl font-bold">{{ props.pds?.building?.name }}</SheetTitle>
          <SheetDescription>
            Numéro de compteur : <span class="font-bold text-primary">{{ props.pds?.consumption?.pds }}</span>
          </SheetDescription>
          <div class="flex flex-wrap gap-2">
            <TagBadge 
              v-if="props.pds?.building?.missions_status"
              v-for="status in props.pds?.building?.missions_status"
              field="missions_status"
              :value="status"
            />
          </div>
        </div>
      </SheetHeader>
      <div class="flex flex-col gap-2">
        <Table class="table-fixed flex-shrink-0 w-full mb-6">
          <TableHeader>
            <TableRow class="border-zinc-200 border-dashed dark:border-zinc-800">
              <TableHead>Type</TableHead>
              <TableHead>Index</TableHead>
              <TableHead>Qmin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow class="border-zinc-200 border-dashed dark:border-zinc-800">
              <TableCell class="text-start truncate">Date de la dernière mesure</TableCell>
              <TableCell class="text-start truncate">{{ formatDate(props.pds?.consumption?.last_index_date) }}</TableCell>
              <TableCell class="text-start truncate">{{ formatDate(props.pds?.consumption?.last_qmin_date) }}</TableCell>
            </TableRow>
            <TableRow class="border-zinc-200 border-dashed dark:border-zinc-800">
              <TableCell class="text-start truncate">Dernière mesure</TableCell>
              <TableCell class="text-start truncate">{{ props.pds?.consumption?.last_index }}</TableCell>
              <TableCell class="text-start truncate">{{ props.pds?.consumption?.last_qmin }}</TableCell>
            </TableRow>
            <TableRow class="border-zinc-200 border-dashed dark:border-zinc-800">
              <TableCell class="text-start truncate">Différentiel j-1</TableCell>
              <TableCell class="text-start truncate" :class="indexDailyDiffClass">
                {{ props.pds?.consumption?.last_index != null && props.pds?.consumption?.index_daily_differential != null ? (props.pds.consumption.last_index - props.pds.consumption.index_daily_differential).toFixed(2) : '' }}
              </TableCell>
              <TableCell class="text-start truncate" :class="qminDailyDiffClass">
                {{ props.pds?.consumption?.last_qmin != null && props.pds?.consumption?.qmin_daily_differential != null ? (props.pds.consumption.last_qmin - props.pds.consumption.qmin_daily_differential).toFixed(2) : '' }}
              </TableCell>
            </TableRow>
            <TableRow class="border-zinc-200 border-dashed dark:border-zinc-800">
              <TableCell class="text-start truncate">Différentiel j-7</TableCell>
              <TableCell class="text-start truncate" :class="indexWeeklyDiffClass">
                {{ props.pds?.consumption?.last_index != null && props.pds?.consumption?.index_weekly_differential != null ? (props.pds.consumption.last_index - props.pds.consumption.index_weekly_differential).toFixed(2) : '' }}
              </TableCell>
              <TableCell class="text-start truncate" :class="qminWeeklyDiffClass">
                {{ props.pds?.consumption.last_qmin != null && props.pds?.consumption?.qmin_weekly_differential != null ? (props.pds.consumption.last_qmin - props.pds.consumption.qmin_weekly_differential).toFixed(2) : '' }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <div 
          class="flex-shrink-0 min-w-0 max-lg:w-full rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden"
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
        <div 
          class="flex-shrink-0 min-w-0 max-lg:w-full rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden"
        >
          <h3 class="text-sm px-4 font-bold py-1.5 bg-zinc-50 dark:bg-zinc-950">Mesure Qmin</h3>
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
                Aucune donnée de Qmin n'est présente pour ce PDS en base de données.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>