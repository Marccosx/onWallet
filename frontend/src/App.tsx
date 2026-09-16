
import { Navigate, Route, Routes } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { Accounts } from './pages/Accounts'
import { Categories } from './pages/Categories'
import { Transactions } from './pages/Transactions';
import { Budgets } from './pages/Budgets';
import { Dashboard } from './pages/Dashboard';
import { useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Profile } from './pages/Profile';
import { Users } from './pages/Users';

function App() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Carregando...</div>;
  if (!user) return <Login />;
  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-12">
      <Navbar />
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/budgets/*" element={<Budgets/>}/>
        <Route path="/transactions/*" element={<Transactions/>}/>
        <Route path="/accounts/*" element={<Accounts />} />
        <Route path="/categories/*" element={<Categories/>}/>
        <Route path="/profile" element={<Profile />} />
        {user.role === 'ADMIN' && <Route path="/users" element={<Users />} />}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </div>
  )
}

export default App
