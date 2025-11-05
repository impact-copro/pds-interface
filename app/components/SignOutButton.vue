<script setup lang="ts">
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-vue-next"
const supabase = useSupabaseClient()

const signOut = async () => {
  await supabase.auth.signOut()
  navigateTo('/login')
}
</script>

<template>
  <Button variant="secondary" size="icon-sm" @click="signOut">
    <LogOut class="size-4" />
  </Button>
</template>