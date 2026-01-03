import { useState, useEffect } from 'react'
import { useLikes } from '../../hooks/useLikes'
import { usePoints } from '../../hooks/usePoints'
import { useAuthContext } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

export const ImageCard = ({ image, onDelete, isOwnImage }) => {
  const { user } = useAuthContext()
  const { toggleLike, checkUserLike } = useLikes()
  const { points } = usePoints(user?.id)
  const [isLiked, setIsLiked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pointsRequired, setPointsRequired] = useState(image.points_required || 0)
  const [editingPoints, setEditingPoints] = useState(false)

  useEffect(() => {
    if (user && image.id) {
      (async () => {
        const { isLiked: liked } = await checkUserLike(image.id, user.id)
        setIsLiked(liked)
      })()
    }
  }, [user, image.id, checkUserLike])

  const handleLike = async () => {
    if (!user) return
    setLoading(true)
    await toggleLike(image.id, user.id, isLiked)
    setIsLiked(!isLiked)
    setLoading(false)
  }

  const handleUpdatePoints = async () => {
    try {
      const { error } = await supabase
        .from('images')
        .update({ points_required: pointsRequired })
        .eq('id', image.id)
        .eq('user_id', user.id)

      if (error) throw error
      setEditingPoints(false)
    } catch (err) {
      console.error('Failed to update points:', err)
    }
  }

  const canDownload = !isOwnImage && image.points_required > 0
    ? points >= image.points_required
    : true

  return (
    <div className="card overflow-hidden group">
      <div className="relative overflow-hidden bg-slate-100 aspect-square">
        <img
          src={image.image_url}
          alt={image.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-slate-900 truncate">
          {image.title}
        </h3>

        <p className="text-sm text-slate-600 line-clamp-2 mt-1">
          {image.description}
        </p>

        {image.profiles && (
          <p className="text-xs text-slate-500 mt-2">
            by <span className="font-medium">{image.profiles.username}</span>
          </p>
        )}

        {image.points_required > 0 && !isOwnImage && (
          <div className={`mt-3 px-2 py-1 rounded-lg text-xs font-medium text-center ${
            canDownload ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
          }`}>
            {canDownload
              ? `需要 ${image.points_required} 积分 (您有 ${points})`
              : `需要 ${image.points_required} 积分 (您仅有 ${points})`
            }
          </div>
        )}

        {isOwnImage && editingPoints ? (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="15"
                value={pointsRequired}
                onChange={(e) => setPointsRequired(Math.min(15, Math.max(0, parseInt(e.target.value) || 0)))}
                className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm"
              />
              <span className="text-xs text-slate-500">最多15</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleUpdatePoints}
                className="flex-1 px-2 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
              >
                保存
              </button>
              <button
                onClick={() => setEditingPoints(false)}
                className="flex-1 px-2 py-1 bg-slate-200 text-slate-700 rounded text-sm font-medium hover:bg-slate-300"
              >
                取消
              </button>
            </div>
          </div>
        ) : isOwnImage ? (
          <button
            onClick={() => setEditingPoints(true)}
            className="w-full mt-3 px-3 py-1 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
          >
            {image.points_required > 0 ? `设置积分: ${image.points_required}` : '设置下载积分'}
          </button>
        ) : null}

        <div className="flex items-center justify-between mt-4">
          <button
            onClick={handleLike}
            disabled={loading || !user}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              isLiked
                ? 'bg-red-100 text-red-600'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            } disabled:opacity-50`}
          >
            <span>❤️</span>
            <span>{image.likes_count || 0}</span>
          </button>

          {user?.id === image.user_id && (
            <button
              onClick={() => onDelete?.(image.id)}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              删除
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
