import { 
  LayoutDashboard, 
  DollarSign, 
  Wallet,
  CreditCard,
  Calendar,
  Settings,
  ChevronLeft
} from 'lucide-react'
import './Sidebar.css'

function Sidebar({ isOpen, setIsOpen, activeView, setActiveView }) {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'salary', icon: DollarSign, label: 'Salary Counter' },
    { id: 'payroll', icon: Wallet, label: 'Payroll' },
    { id: 'cashadvance', icon: CreditCard, label: 'Cash Advance Records' },
    { id: 'dayoff', icon: Calendar, label: 'Day Off Management' },
  ]

  const bottomItems = [
    { id: 'settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon">
            <DollarSign size={24} />
          </div>
          {isOpen && <span className="logo-text">SalaryTrack</span>}
        </div>
        <button 
          className="toggle-button"
          onClick={() => setIsOpen(!isOpen)}
        >
          <ChevronLeft size={20} className={isOpen ? '' : 'rotated'} />
        </button>
      </div>

      <nav className="sidebar-nav">
        <ul className="menu-list">
          {menuItems.map(item => (
            <li key={item.id}>
              <button
                className={`menu-item ${activeView === item.id ? 'active' : ''}`}
                onClick={() => setActiveView(item.id)}
                title={!isOpen ? item.label : ''}
              >
                <item.icon size={20} />
                {isOpen && <span>{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>

        <div className="sidebar-divider"></div>

        <ul className="menu-list">
          {bottomItems.map(item => (
            <li key={item.id}>
              <button
                className={`menu-item ${activeView === item.id ? 'active' : ''}`}
                onClick={() => setActiveView(item.id)}
                title={!isOpen ? item.label : ''}
              >
                <item.icon size={20} />
                {isOpen && <span>{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar
