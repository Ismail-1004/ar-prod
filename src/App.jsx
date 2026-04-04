import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import AR from './pages/AR'
import AppHeader from './components/widgets/AppHeader'

function App() {
  return (
    <>
      <AppHeader />

      <main className='main'>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ar/:id" element={<AR />} />
        </Routes>
      </main>
    </>
  )
}

export default App
