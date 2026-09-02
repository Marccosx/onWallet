
import { Navigate, Route, Routes } from 'react-router-dom'
import { Accounts } from './pages/Accounts'
import { Categories } from './pages/Categories'
import { Transactions } from './pages/Transactions';

function App() {
  return (
    <>
     <Routes>
      <Route path="/transactions/*" element={<Transactions/>}></Route>
      <Route path="/accounts/*" element={<Accounts />} />
      <Route path="/categories/*" element={<Categories/>}/>
      <Route path="/" element={<Navigate to="/accounts" />} />
     </Routes>
    </>
  )
}

export default App
