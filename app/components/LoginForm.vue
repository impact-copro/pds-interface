<script setup lang="ts">
import { Droplet } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"

import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

// Types
import type { ServerResponse } from '../../shared/types/serverResponse'

const isDisabled = ref(false)

const zodSchema = z.object({
  email: z.string().email('Email invalide'),
})

const formSchema = toTypedSchema(zodSchema)

const form = useForm({
  validationSchema: formSchema,
})

const onSubmit = form.handleSubmit(async (values) => {
  authCheck(values)
})

const authCheck = async(values: z.infer<typeof zodSchema>) => {
  isDisabled.value = true

  try {
    const response = await $fetch<ServerResponse>('/api/otp', {
      method: 'POST',
      body: {
        email: values.email
      }
    })

    if (!response.success) {
      isDisabled.value = false
      return
    } else {
      navigateTo(`/confirm?email=${encodeURIComponent(values.email)}`)
    }
  } catch (error: any) {
    isDisabled.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <form @submit.prevent="onSubmit">
      <div class="flex flex-col gap-6">
        <div class="flex flex-col items-center">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg text-white bg-primary mb-2">
            <Droplet class="size-6" />
          </div>
          <span class="sr-only">Impact Copro</span>
          <h1 class="text-2xl font-bold">
            Interface consommation
          </h1>
          <div class="text-center text-sm text-zinc-600 dark:text-zinc-400">
            par Impact Copro
          </div>
        </div>
        <div class="flex flex-col gap-3">
          <FormField v-slot="{ componentField }" name="email">
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="m@example.com" v-bind="componentField" required/>
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
          
          <Button type="submit" class="w-full" :disabled="isDisabled">
            Se connecter
          </Button>
        </div>
      </div>
    </form>
    <div class="text-balance text-center text-xs text-zinc-600 dark:text-zinc-400 [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
      Cette interface est réservée aux utilisateurs autorisés.
    </div>
  </div>
</template>
