import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import AR from './pages/AR'
import AppHeader from './components/widgets/AppHeader'
import ARSurfacePage from './pages/ARSurface'

function App() {
  return (
    <>
      <AppHeader />

      <main className='main'>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ar/:id" element={<AR />} />
          <Route path="/ar-surface/:id" element={<ARSurfacePage />} />
        </Routes>
      </main>
    </>
  )
}

export default App
