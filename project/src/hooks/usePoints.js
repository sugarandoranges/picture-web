import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export const usePoints = (userId) => {
  const [points, setPoints] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchPoints = async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (fetchError) throw fetchError

      if (!data) {
        const { data: newData, error: createError } = await supabase
          .from('user_points')
          .insert([{ user_id: userId, points_balance: 10 }])
          .select()
          .maybeSingle()

        if (createError) throw createError
        setPoints(newData)
      } else {
        setPoints(data)
      }
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPoints()
  }, [userId])

  const addDailyReward = async () => {
    if (!userId || !points) return

    const today = new Date().toISOString().split('T')[0]
    if (points.last_daily_reward === today) {
      return false
    }

    try {
      const newBalance = points.points_balance + 10

      await supabase
        .from('user_points')
        .update({
          points_balance: newBalance,
          last_daily_reward: today,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

      await supabase
        .from('point_transactions')
        .insert([
          {
            user_id: userId,
            points_amount: 10,
            transaction_type: 'daily_reward',
            description: 'Daily reward',
          },
        ])

      setPoints({
        ...points,
        points_balance: newBalance,
        last_daily_reward: today,
      })

      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }

  const deductPoints = async (amount, imageId, description = 'Download') => {
    if (!userId || !points || amount > points.points_balance) {
      return false
    }

    try {
      const newBalance = Math.max(0, points.points_balance - amount)

      await supabase
        .from('user_points')
        .update({
          points_balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

      await supabase
        .from('point_transactions')
        .insert([
          {
            user_id: userId,
            points_amount: -amount,
            transaction_type: 'download',
            related_image_id: imageId,
            description,
          },
        ])

      setPoints({
        ...points,
        points_balance: newBalance,
      })

      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }

  const refund = async (amount, imageId) => {
    if (!userId || !points) return

    try {
      const newBalance = points.points_balance + amount

      await supabase
        .from('user_points')
        .update({
          points_balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

      await supabase
        .from('point_transactions')
        .insert([
          {
            user_id: userId,
            points_amount: amount,
            transaction_type: 'transfer',
            related_image_id: imageId,
            description: 'Refund',
          },
        ])

      setPoints({
        ...points,
        points_balance: newBalance,
      })

      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }

  return {
    points: points?.points_balance || 0,
    userPoints: points,
    loading,
    error,
    addDailyReward,
    deductPoints,
    refund,
    refetch: fetchPoints,
  }
}
