import { supabaseAdmin } from './supabase'
import type { User } from '@/types'

export async function createUser(userData: {
  email: string
  google_id: string
  access_token: string
  refresh_token?: string
  timezone: string
}): Promise<User | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([userData])
      .select()
      .single()

    if (error) {
      console.error('Error creating user:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error creating user:', error)
    return null
  }
}

export async function getUserByGoogleId(googleId: string): Promise<User | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('google_id', googleId)
      .single()

    if (error) {
      console.error('Error fetching user:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}

export async function updateUserTokens(
  userId: string,
  accessToken: string,
  refreshToken?: string
): Promise<boolean> {
  try {
    const updateData: any = { access_token: accessToken }
    if (refreshToken) {
      updateData.refresh_token = refreshToken
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)

    if (error) {
      console.error('Error updating user tokens:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error updating user tokens:', error)
    return false
  }
}