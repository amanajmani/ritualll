import { supabaseAdmin } from '../supabase'
import type { Subscription } from '@/types'

export async function insertSubscriptions(
  userId: string,
  subscriptions: Array<{
    id: string
    title: string
    thumbnail_url: string
    category?: string
  }>
): Promise<boolean> {
  try {
    const subscriptionData = subscriptions.map((sub) => ({
      ...sub,
      user_id: userId,
      added_at: new Date().toISOString(),
    }))

    const { error } = await supabaseAdmin
      .from('subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'id,user_id',
      })

    if (error) {
      console.error('Error inserting subscriptions:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error inserting subscriptions:', error)
    return false
  }
}

export async function getUserSubscriptions(userId: string): Promise<Subscription[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching subscriptions:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return []
  }
}

export async function deleteUserSubscriptions(userId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting subscriptions:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting subscriptions:', error)
    return false
  }
}