import { useState } from 'react'
import { useAuthContext } from '../../context/AuthContext'

export const Header = ({ onSearch, onCategoryChange }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const { user, signOut } = useAuthContext()

  const handleSearch = (value) => {
    setSearchQuery(value)
    onSearch?.(value)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <h1 className="text-2xl font-bold text-slate-900">shit之家</h1>
          </div>

          <div className="w-full sm:flex-1 sm:max-w-md">
            <input
              type="text"
              placeholder="搜索图片..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <>
                <span className="text-sm text-slate-700">
                  {user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm"
                >
                  登出
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
