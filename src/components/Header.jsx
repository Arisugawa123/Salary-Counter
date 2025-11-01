import { Menu, Search } from 'lucide-react'
import './Header.css'

function Header({ isSidebarOpen, setIsSidebarOpen }) {
  return (
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
          <span className="system-name">Salary Management System</span>
        </div>
      </div>
    </header>
  )
}

export default Header
