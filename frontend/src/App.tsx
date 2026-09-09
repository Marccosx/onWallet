
import { Navigate, Route, Routes } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { Accounts } from './pages/Accounts'
import { Categories } from './pages/Categories'
import { Transactions } from './pages/Transactions';
import { Budgets } from './pages/Budgets';
import { Dashboard } from './pages/Dashboard';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-12">
      <Navbar />
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/budgets/*" element={<Budgets/>}/>
        <Route path="/transactions/*" element={<Transactions/>}/>
        <Route path="/accounts/*" element={<Accounts />} />
        <Route path="/categories/*" element={<Categories/>}/>
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </div>
  )
}

export default App
