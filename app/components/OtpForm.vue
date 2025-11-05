<script setup lang="ts">
import { ref } from "vue"
import { MoveLeft } from 'lucide-vue-next';
import { PinInput, PinInputGroup, PinInputSlot } from "@/components/ui/pin-input"

const supabase = useSupabaseClient()

const value = ref<string[]>([])

const props = defineProps<{
  email: string
}>()

const handleComplete = async (e: string[]) => {
  const token = e.join('')
  const { error } = await supabase.auth.verifyOtp({ email: props.email, token, type: 'email' })
  
  if (error) {
    console.error(error.message)
    return
  } else {
    return navigateTo('/')
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="w-full">
      <h2 class="text-4xl font-bold mb-2">Vérification</h2>
      <span class="text-sm text-zinc-600 dark:text-zinc-400">
        Un code de vérification a été envoyé à
        <span class="font-bold text-zinc-900 dark:text-zinc-100">
          {{ props.email }}
        </span>
        <br>
        Entrez le ci-dessous pour vous connecter
      </span>
      <PinInput
        id="pin-input"
        v-model="value"
        placeholder="○"
        @complete="handleComplete"
        class="mt-6"
      >
        <PinInputGroup>
          <PinInputSlot
            v-for="(id, index) in 6"
            :key="id"
            :index="index"
          />
        </PinInputGroup>
      </PinInput>

      <div 
        class="flex gap-2 text-primary items-center text-sm mt-6 border-b border-primary w-fit cursor-pointer"
        @click="navigateTo('/login')"
      >
        <MoveLeft class="size-3.5" />
        <span>Retour</span>
      </div>
    </div>
  </div>
</template>