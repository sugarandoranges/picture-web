import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export const useImages = () => {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchImages = useCallback(async (filters = {}) => {
    try {
      setLoading(true)
      let query = supabase
        .from('images')
        .select('*, profiles(username)')
        .order('created_at', { ascending: false })

      if (filters.category) {
        query = query.eq('category', filters.category)
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      const { data, error } = await query

      if (error) throw error
      setImages(data || [])
    } catch (error) {
      console.error('Failed to fetch images:', error)
      setImages([])
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteImage = async (imageId) => {
    try {
      const { error } = await supabase
        .from('images')
        .delete()
        .eq('id', imageId)

      if (error) throw error
      setImages(images.filter(img => img.id !== imageId))
      return { error: null }
    } catch (error) {
      return { error: error.message }
    }
  }

  return {
    images,
    loading,
    fetchImages,
    deleteImage,
  }
}
