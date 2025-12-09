import { useState, useEffect } from 'react'
import { 
  LayoutDashboard, 
  DollarSign,
  Wallet,
  CreditCard,
  Calendar,
  Settings,
  User,
  Shield
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import './Sidebar.css'

function Sidebar({ isOpen, setIsOpen, activeView, setActiveView, menuItems, sublimationItems, customersItems, transactionsItems, reportsItems, productionItems, settingsItems, currentView, onMenuClick }) {
  const { user } = useAuth()
  const isManager = user?.role === 'manager'
  const [showAccessModal, setShowAccessModal] = useState(false)
  const [accessCode, setAccessCode] = useState('')
  const [accessError, setAccessError] = useState('')

  const MANAGER_ACCESS_CODE = '050123'
  
  // Use custom menu items if provided, otherwise use default
  const useCustomMenu = menuItems !== undefined

  useEffect(() => {
    if (showAccessModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showAccessModal])

  const handleSettingsClick = () => {
    if (isManager) {
      setActiveView('settings')
    } else {
      setShowAccessModal(true)
      setAccessCode('')
      setAccessError('')
    }
  }

  const handleAccessSubmit = () => {
    if (accessCode === MANAGER_ACCESS_CODE) {
      setActiveView('settings')
      setShowAccessModal(false)
      setAccessCode('')
      setAccessError('')
    } else {
      setAccessError('Invalid access code')
    }
  }

  const handleAccessKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAccessSubmit()
    }
  }
  const defaultMenuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'salary', icon: DollarSign, label: 'Salary Counter' },
    ...(isManager ? [{ id: 'payroll', icon: Wallet, label: 'Payroll' }] : []),
    { id: 'cashadvance', icon: CreditCard, label: 'Cash Advance Records' },
    ...(isManager ? [{ id: 'dayoff', icon: Calendar, label: 'Day Off Management' }] : []),
  ]

  const bottomItems = [
    { id: 'settings', icon: Settings, label: 'Settings' },
  ]
  
  const finalMenuItems = useCustomMenu ? menuItems : defaultMenuItems
  const finalActiveView = useCustomMenu ? currentView : activeView
  const finalSetActiveView = useCustomMenu ? onMenuClick : setActiveView

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <div className="logo-container">
          <img 
            src="/ironwolf-logo.png" 
            alt="IRONWOLF Digital Printing" 
            className="logo-image"
          />
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul className="menu-list">
          {finalMenuItems.map(item => (
            <li key={item.id}>
              <button
                className={`menu-item ${finalActiveView === item.id ? 'active' : ''}`}
                onClick={() => finalSetActiveView(item.id)}
                title={!isOpen ? item.label : ''}
              >
                <item.icon size={18} />
                {isOpen && <span>{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>

        {sublimationItems && sublimationItems.length > 0 && (
          <>
            <div className="sidebar-divider"></div>
            {isOpen && <div className="sidebar-category">Sublimation</div>}
            <ul className="menu-list">
              {sublimationItems.map(item => (
                <li key={item.id}>
                  <button
                    className={`menu-item ${finalActiveView === item.id ? 'active' : ''}`}
                    onClick={() => finalSetActiveView(item.id)}
                    title={!isOpen ? item.label : ''}
                  >
                    <item.icon size={18} />
                    {isOpen && <span>{item.label}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {customersItems && customersItems.length > 0 && (
          <>
            <div className="sidebar-divider"></div>
            {isOpen && <div className="sidebar-category">Customers</div>}
            <ul className="menu-list">
              {customersItems.map(item => (
                <li key={item.id}>
                  <button
                    className={`menu-item ${finalActiveView === item.id ? 'active' : ''}`}
                    onClick={() => finalSetActiveView(item.id)}
                    title={!isOpen ? item.label : ''}
                  >
                    <item.icon size={18} />
                    {isOpen && <span>{item.label}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {transactionsItems && transactionsItems.length > 0 && (
          <>
            <div className="sidebar-divider"></div>
            {isOpen && <div className="sidebar-category">Transactions</div>}
            <ul className="menu-list">
              {transactionsItems.map(item => (
                <li key={item.id}>
                  <button
                    className={`menu-item ${finalActiveView === item.id ? 'active' : ''}`}
                    onClick={() => finalSetActiveView(item.id)}
                    title={!isOpen ? item.label : ''}
                  >
                    <item.icon size={18} />
                    {isOpen && <span>{item.label}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {reportsItems && reportsItems.length > 0 && (
          <>
            <div className="sidebar-divider"></div>
            {isOpen && <div className="sidebar-category">Reports</div>}
            <ul className="menu-list">
              {reportsItems.map(item => (
                <li key={item.id}>
                  <button
                    className={`menu-item ${finalActiveView === item.id ? 'active' : ''}`}
                    onClick={() => finalSetActiveView(item.id)}
                    title={!isOpen ? item.label : ''}
                  >
                    <item.icon size={18} />
                    {isOpen && <span>{item.label}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {productionItems && productionItems.length > 0 && (
          <>
            <div className="sidebar-divider"></div>
            {isOpen && <div className="sidebar-category">Production</div>}
            <ul className="menu-list">
              {productionItems.map(item => (
                <li key={item.id}>
                  <button
                    className={`menu-item ${finalActiveView === item.id ? 'active' : ''}`}
                    onClick={() => finalSetActiveView(item.id)}
                    title={!isOpen ? item.label : ''}
                  >
                    <item.icon size={18} />
                    {isOpen && <span>{item.label}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {settingsItems && settingsItems.length > 0 && (
          <>
            <div className="sidebar-divider"></div>
            {isOpen && <div className="sidebar-category">Settings</div>}
            <ul className="menu-list">
              {settingsItems.map(item => (
                <li key={item.id}>
                  <button
                    className={`menu-item ${finalActiveView === item.id ? 'active' : ''}`}
                    onClick={() => finalSetActiveView(item.id)}
                    title={!isOpen ? item.label : ''}
                  >
                    <item.icon size={18} />
                    {isOpen && <span>{item.label}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {!useCustomMenu && (
          <>
            <div className="sidebar-divider"></div>
            <ul className="menu-list">
              {bottomItems.map(item => (
                <li key={item.id}>
                  <button
                    className={`menu-item ${finalActiveView === item.id ? 'active' : ''}`}
                    onClick={() => item.id === 'settings' ? handleSettingsClick() : finalSetActiveView(item.id)}
                    title={!isOpen ? item.label : ''}
                  >
                    <item.icon size={18} />
                    {isOpen && <span>{item.label}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>

      {/* User Info Section at Bottom */}
      {user && (
        <div 
          className="sidebar-user-info"
          title={!isOpen ? `${user.employeeName || user.email?.split('@')[0] || user.roleTitle || 'User'} - ${user.roleTitle || user.role}` : ''}
        >
          <div className="user-avatar">
            <User size={isOpen ? 20 : 18} />
          </div>
          {isOpen && (
            <div className="user-details">
              <div className="user-name-label">Logged in as:</div>
              <div className="user-name">
                {user.employeeName || user.email?.split('@')[0] || user.roleTitle || 'User'}
              </div>
              <div className="user-role-badge">
                <Shield size={12} />
                <span>{user.roleTitle || user.role}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {showAccessModal && (
        <div className="access-modal-overlay" onClick={() => setShowAccessModal(false)}>
          <div className="access-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Manager Access Required</h3>
            <p>Settings require manager access. Please enter the access code.</p>
            <input
              type="password"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              onKeyPress={handleAccessKeyPress}
              placeholder="Enter access code"
              maxLength="6"
              autoFocus
            />
            {accessError && <div className="access-error">{accessError}</div>}
            <div className="access-modal-actions">
              <button 
                className="access-btn cancel-btn" 
                onClick={() => {
                  setShowAccessModal(false)
                  setAccessCode('')
                  setAccessError('')
                }}
              >
                Cancel
              </button>
              <button 
                className="access-btn confirm-btn" 
                onClick={handleAccessSubmit}
                disabled={!accessCode}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

export default Sidebar
