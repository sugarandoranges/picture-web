import { useState } from 'react'
import { AuthProvider } from './context/AuthContext'
import { Header } from './components/Header/Header'
import { ImageGallery } from './components/Gallery/ImageGallery'

function App() {
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('')

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Header onSearch={setSearchQuery} onCategoryChange={setCategory} />
        <ImageGallery searchQuery={searchQuery} category={category} />
      </div>
    </AuthProvider>
  )
}

export default App
