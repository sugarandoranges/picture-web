import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      setLoading(false)
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const signUp = useCallback(async (email, password, username) => {
    try {
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) throw signUpError

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: user.id,
          email,
          username,
        }])

      if (profileError) throw profileError

      const { error: pointsError } = await supabase
        .from('user_points')
        .insert([{
          user_id: user.id,
          points_balance: 0,
        }])

      if (pointsError) throw pointsError

      return { user, error: null }
    } catch (error) {
      return { user: null, error: error.message }
    }
  }, [])

  const signIn = useCallback(async (email, password) => {
    try {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      return { user, error: null }
    } catch (error) {
      return { user: null, error: error.message }
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error: error.message }
    }
  }, [])

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  }
}
