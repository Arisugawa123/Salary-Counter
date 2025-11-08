import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import CashierDashboard from './components/CashierDashboard'
import Login from './components/Login'
import './App.css'

function AppContent() {
  const { isAuthenticated, loading, user } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [activeView, setActiveView] = useState('dashboard')

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login />
  }

  // Cashier gets a different dashboard
  if (user?.role === 'cashier') {
    return (
      <div className="app">
        <div className="main-content sidebar-closed">
          <Header 
            isSidebarOpen={false}
            setIsSidebarOpen={setIsSidebarOpen}
          />
          <CashierDashboard />
        </div>
      </div>
    )
  }

  // Regular dashboard for accountant and manager
  return (
    <div className="app">
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
        activeView={activeView}
        setActiveView={setActiveView}
      />
      <div className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Header 
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
        <Dashboard activeView={activeView} setActiveView={setActiveView} />
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
