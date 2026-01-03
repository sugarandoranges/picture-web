import { supabase } from '../lib/supabase'

export const useLikes = () => {
  const toggleLike = async (imageId, userId, isLiked) => {
    try {
      if (isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('image_id', imageId)
          .eq('user_id', userId)

        if (error) throw error

        const { error: updateError } = await supabase
          .from('images')
          .update({ likes_count: supabase.rpc('decrement_likes') })
          .eq('id', imageId)

        if (updateError) throw updateError
      } else {
        const { error } = await supabase
          .from('likes')
          .insert([{ image_id: imageId, user_id: userId }])

        if (error && error.code !== 'PGRST116') throw error

        const { error: updateError } = await supabase
          .from('images')
          .update({ likes_count: supabase.rpc('increment_likes') })
          .eq('id', imageId)

        if (updateError) throw updateError
      }
      return { error: null }
    } catch (error) {
      return { error: error.message }
    }
  }

  const checkUserLike = async (imageId, userId) => {
    try {
      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('image_id', imageId)
        .eq('user_id', userId)
        .maybeSingle()

      if (error) throw error
      return { isLiked: !!data, error: null }
    } catch (error) {
      return { isLiked: false, error: error.message }
    }
  }

  return {
    toggleLike,
    checkUserLike,
  }
}
