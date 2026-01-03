import { useState, useEffect } from 'react'
import { ImageCard } from './ImageCard'
import { DailyTasks } from '../DailyTasks/DailyTasks'
import { useImages } from '../../hooks/useImages'
import { usePoints } from '../../hooks/usePoints'
import { useAuthContext } from '../../context/AuthContext'

export const ImageGallery = ({ searchQuery, category }) => {
  const { images, loading, fetchImages, deleteImage } = useImages()
  const { user } = useAuthContext()
  const { userPoints } = usePoints(user?.id)
  const [filters, setFilters] = useState({})

  useEffect(() => {
    const newFilters = {}
    if (searchQuery) newFilters.search = searchQuery
    if (category) newFilters.category = category
    setFilters(newFilters)
  }, [searchQuery, category])

  useEffect(() => {
    fetchImages(filters)
  }, [filters, fetchImages])

  const handleDelete = async (imageId) => {
    if (confirm('确定要删除这张图片吗?')) {
      await deleteImage(imageId)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <DailyTasks />
        </div>
        {user && userPoints && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 h-fit">
            <p className="text-xs text-slate-600 mb-2 font-medium">当前积分</p>
            <p className="text-slate-700">
              <span className="font-semibold text-blue-600 text-2xl">{userPoints.points_balance}</span>
              <span className="text-slate-600 ml-2">积分</span>
            </p>
          </div>
        )}
      </div>

      {images.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-600 text-lg">
            {searchQuery ? '没有找到匹配的图片' : '还没有图片。成为第一个上传的人!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {images.map((image) => (
            <ImageCard
              key={image.id}
              image={image}
              onDelete={handleDelete}
              isOwnImage={user?.id === image.user_id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
