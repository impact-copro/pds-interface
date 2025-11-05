import { serverSupabaseClient } from '#supabase/server'
import type { ServerResponse } from '../../../shared/types/serverResponse'

export default defineEventHandler(async (event): Promise<ServerResponse> => {
  const body = await readBody(event)
  const { email } = body

  const client = await serverSupabaseClient(event)

  console.log('email', email)

  const { error } = await client.auth.signInWithOtp({
    email: email,
    options: {
      shouldCreateUser: false
    }
  })

  if (error) {
    console.error('Erreur OTP:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true }
})