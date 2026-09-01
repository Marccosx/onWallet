
import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { Accounts } from './pages/Accounts'
import { Categories } from './pages/Categories'

function App() {
  return (
    <>
     <Routes>
      <Route path="/accounts/*" element={<Accounts />} />
      <Route path="/categories/*" element={<Categories/>}/>
      <Route path="/" element={<Navigate to="/accounts" />} />
     </Routes>
    </>
  )
}

export default App
