import { useState } from 'react'
import { Menu, Search, LogOut, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import ConfirmModal from './ConfirmModal'
import './Header.css'

function Header({ isSidebarOpen, setIsSidebarOpen }) {
  const { user, logout } = useAuth()
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const handleLogout = () => {
    setShowLogoutModal(true)
  }

  const confirmLogout = () => {
    logout()
    setShowLogoutModal(false)
  }

  const cancelLogout = () => {
    setShowLogoutModal(false)
  }

  return (
    <>
      <header className="header">
        <div className="header-left">
          <button 
            className="icon-button menu-button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu size={20} />
          </button>
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search employees, records..." 
              className="search-input"
            />
          </div>
        </div>
        
        <div className="header-right">
          <div className="system-title">
            <span className="system-name">IRONWOLF SHOP SYSTEM</span>
            <span className="system-version">v1.2.1</span>
          </div>
          
          {user && (
            <div className="user-section">
              <div className="user-info">
                <User size={16} />
                <span className="user-role">{user.roleTitle}</span>
              </div>
              <button 
                className="logout-button"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </header>

      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={cancelLogout}
        onConfirm={confirmLogout}
        title="Logout Confirmation"
        message="Are you sure you want to logout? You will need to login again to access the system."
      />
    </>
  )
}

export default Header
