import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import Alert from './Alert'
import { fetchCashAdvanceRecords, fetchTimeRecords, fetchDayOffRecords, createCashAdvanceRecord, fetchCustomers, fetchCustomerById, createCustomer, updateCustomer, fetchCustomerOrders, createOrder, fetchOrders } from '../lib/supabase'
import { 
  LayoutDashboard, 
  Plus, 
  Clock, 
  Package, 
  Palette,
  List,
  CheckCircle,
  CreditCard,
  Calendar,
  Coffee,
  Sticker,
  FileText,
  Image,
  Scissors,
  Wrench,
  Monitor,
  User,
  Phone,
  Maximize2,
  RotateCw,
  Hash,
  Mail,
  Building2,
  PartyPopper,
  CalendarCheck,
  Truck,
  Paintbrush,
  Type,
  FileEdit,
  MapPin,
  Package2,
  MessageSquare,
  Users,
  Wallet,
  DollarSign,
  AlertCircle,
  Briefcase,
  ArrowLeft,
  Search,
  X,
  Calculator
} from 'lucide-react'
import './GraphicArtistDashboard.css'

function GraphicArtistDashboard({ user }) {
  const [currentView, setCurrentView] = useState('dashboard')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [cashAdvanceBalance, setCashAdvanceBalance] = useState(0)

  // Fetch cash advance balance for the logged-in employee
  useEffect(() => {
    const fetchCashAdvanceBalance = async () => {
      if (!user?.employeeName) return
      
      try {
        const records = await fetchCashAdvanceRecords()
        // Filter records for this specific employee and only include records with outstanding balance
        const employeeRecords = records.filter(record => 
          record.employeeName?.toLowerCase() === user.employeeName.toLowerCase() &&
          Number(record.balance) > 0  // Only include records with outstanding balance
        )
        
        // Calculate total balance using the balance field (not amount - paid)
        const totalBalance = employeeRecords.reduce((sum, record) => {
          const balance = Number(record.balance) || 0
          return sum + balance
        }, 0)
        
        setCashAdvanceBalance(totalBalance)
      } catch (error) {
        console.error('Error fetching cash advance:', error)
        setCashAdvanceBalance(0)
      }
    }

    fetchCashAdvanceBalance()
  }, [user?.employeeName])

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      id: 'employee-dashboard',
      label: 'Employee Dashboard',
      icon: Users
    },
    {
      id: 'create-order',
      label: 'Create Order',
      icon: Plus
    },
    {
      id: 'order-tracking',
      label: 'Order Tracking',
      icon: Package
    }
  ]

  const sublimationItems = [
    {
      id: 'sublimation-orders',
      label: 'Sublimation Orders',
      icon: Palette
    },
    {
      id: 'sublimation-listing',
      label: 'Sublimation Listing',
      icon: List
    }
  ]

  const customersItems = [
    {
      id: 'customer-profile',
      label: 'Customer Profile',
      icon: User
    },
    {
      id: 'customer-reports',
      label: 'Customer Reports',
      icon: FileText
    }
  ]

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView cashAdvanceBalance={cashAdvanceBalance} user={user} />
      case 'employee-dashboard':
        return <EmployeeDashboardView user={user} />
      case 'create-order':
        return <CreateOrderView user={user} onOrderCreated={() => setCurrentView('order-tracking')} />
      case 'order-tracking':
        return <OrderTrackingView user={user} />
      case 'sublimation-orders':
        return <SublimationOrdersView />
      case 'sublimation-listing':
        return <SublimationListingView />
      case 'customer-profile':
        return <CustomerProfileView />
      case 'customer-reports':
        return <CustomerReportsView />
      default:
        return <DashboardView cashAdvanceBalance={cashAdvanceBalance} />
    }
  }

  return (
    <div className="graphic-artist-dashboard">
      <Sidebar 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        menuItems={menuItems}
        sublimationItems={sublimationItems}
        customersItems={customersItems}
        currentView={currentView}
        onMenuClick={setCurrentView}
      />
      <div className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Header 
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
        <main className="dashboard-content">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}

// Dashboard View Component
function DashboardView({ cashAdvanceBalance = 0, user }) {
  const [currentOrdersTab, setCurrentOrdersTab] = useState('payment')
  const [productionStatusTab, setProductionStatusTab] = useState('design')
  const [ordersForPayment, setOrdersForPayment] = useState([])
  const [ordersPending, setOrdersPending] = useState([])
  const [ordersForDesign, setOrdersForDesign] = useState([])
  const [ordersForSublimation, setOrdersForSublimation] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch and filter orders assigned to the logged-in user
  useEffect(() => {
    const loadOrders = async () => {
      if (!user?.employeeName) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const allOrders = await fetchOrders()
        
        // Filter orders assigned to the logged-in user
        const assignedOrders = allOrders.filter(order => {
          const orderData = order.orderData || {}
          const assignedArtist = orderData.assignedArtist || ''
          return assignedArtist.toLowerCase() === user.employeeName.toLowerCase()
        })

        // Categorize orders
        const forPayment = []
        const pending = []
        const forDesign = []
        const forSublimation = []

        assignedOrders.forEach(order => {
          const orderData = order.orderData || {}
          const status = order.status?.toLowerCase() || 'pending'
          
          // Calculate quantity based on order type
          let quantity = '1'
          if (order.orderType === 'Sublimation' && orderData.cartItems && Array.isArray(orderData.cartItems)) {
            // For Sublimation, sum all quantities from cart items
            const totalQty = orderData.cartItems.reduce((sum, item) => {
              if (item.sizes && Array.isArray(item.sizes)) {
                return sum + item.sizes.reduce((sizeSum, size) => sizeSum + (parseInt(size.quantity) || 0), 0)
              }
              return sum + (parseInt(item.quantity) || 0)
            }, 0)
            quantity = totalQty > 0 ? totalQty.toString() : '1'
          } else {
            quantity = orderData.quantity || '1'
          }

          // Transform order to match table format
          const transformedOrder = {
            id: order.id,
            customer: order.customerName || 'N/A',
            product: order.orderType || 'N/A',
            quantity: quantity,
            amount: parseFloat(order.totalAmount || 0),
            date: order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
            progress: typeof orderData.progress === 'number' ? orderData.progress : (parseInt(orderData.progress) || 0),
            deadline: orderData.preferredDeliveryDate || orderData.pickupDate || orderData.eventDate || 'N/A',
            originalOrder: order // Keep original order for reference
          }
          
          // Orders for payment (status: pending, balance > 0)
          if (status === 'pending' && parseFloat(order.balance || 0) > 0) {
            forPayment.push(transformedOrder)
          }
          
          // Pending orders (status: pending, balance = 0 or no balance)
          if (status === 'pending' && parseFloat(order.balance || 0) === 0) {
            pending.push(transformedOrder)
          }
          
          // Orders in design process (status: in-progress or in-design)
          if (status === 'in-progress' || status === 'in-design' || status === 'design') {
            forDesign.push(transformedOrder)
          }
          
          // Orders in sublimation (status: in-sublimation or sublimation)
          if (status === 'in-sublimation' || status === 'sublimation') {
            forSublimation.push(transformedOrder)
          }
        })

        setOrdersForPayment(forPayment)
        setOrdersPending(pending)
        setOrdersForDesign(forDesign)
        setOrdersForSublimation(forSublimation)
      } catch (error) {
        console.error('Error loading orders:', error)
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [user?.employeeName])

  // Format peso amount
  const formatPeso = (amount) => {
    return `₱${Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  
  // Get current orders based on active tab
  const getCurrentOrders = () => {
    return currentOrdersTab === 'payment' ? ordersForPayment : ordersPending
  }
  
  // Get production orders based on active tab
  const getProductionOrders = () => {
    return productionStatusTab === 'design' ? ordersForDesign : ordersForSublimation
  }

  // Calculate next payroll date
  const getNextPayrollDate = () => {
    const today = new Date()
    const currentDay = today.getDate()
    let nextPayrollDate
    
    if (currentDay >= 1 && currentDay < 15) {
      nextPayrollDate = new Date(today.getFullYear(), today.getMonth(), 15)
    } else {
      nextPayrollDate = new Date(today.getFullYear(), today.getMonth() + 1, 0) // Last day of month
    }
    
    return nextPayrollDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="view-container">
      <div className="view-header">
        <div className="header-content">
          <div className="header-icon-wrapper">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h1>Graphic Artist Dashboard</h1>
            <p>Welcome to your workspace</p>
          </div>
        </div>
      </div>
      
      {/* Remastered Stats Cards */}
      <div className="dashboard-stats">
        <div className="stat-card primary-card">
          <div className="stat-card-header">
            <div className="stat-card-icon">
              <Package size={20} />
            </div>
            <span className="stat-card-label">Pending Orders</span>
          </div>
          <div className="stat-card-value">0</div>
          <div className="stat-card-footer">Active work items</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon">
              <CheckCircle size={20} />
            </div>
            <span className="stat-card-label">Completed</span>
          </div>
          <div className="stat-card-value">0</div>
          <div className="stat-card-footer">Total completed</div>
        </div>
        
        <div className="stat-card highlight-card">
          <div className="stat-card-header">
            <div className="stat-card-icon">
              <CreditCard size={20} />
            </div>
            <span className="stat-card-label">Cash Advance</span>
          </div>
          <div className="stat-card-value">{formatPeso(cashAdvanceBalance)}</div>
          <div className="stat-card-footer">{cashAdvanceBalance > 0 ? 'Outstanding balance' : 'No balance'}</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon">
              <Calendar size={20} />
            </div>
            <span className="stat-card-label">Next Payroll</span>
          </div>
          <div className="stat-card-value">{getNextPayrollDate()}</div>
          <div className="stat-card-footer">Upcoming date</div>
        </div>
      </div>

      {/* Orders Tables - Remastered */}
      <div className="tables-container">
        {/* Current Orders Table - Remastered */}
        <div className="table-section remastered-table">
          <div className="table-header remastered-header">
            <div className="table-header-content">
              <div className="table-header-icon">
                <Package size={20} />
              </div>
              <div>
                <h2>Current Orders</h2>
                <p className="table-subtitle">Payment and pending orders</p>
              </div>
            </div>
          </div>
          <div className="table-tabs remastered-tabs">
            <button 
              className={`tab-btn remastered-tab ${currentOrdersTab === 'payment' ? 'active' : ''}`}
              onClick={() => setCurrentOrdersTab('payment')}
            >
              <CreditCard size={14} />
              <span>For Payment</span>
              <span className="tab-count">{ordersForPayment.length}</span>
            </button>
            <button 
              className={`tab-btn remastered-tab ${currentOrdersTab === 'pending' ? 'active' : ''}`}
              onClick={() => setCurrentOrdersTab('pending')}
            >
              <Clock size={14} />
              <span>Pending</span>
              <span className="tab-count">{ordersPending.length}</span>
            </button>
          </div>
          <div className="table-wrapper remastered-wrapper">
            <table className="orders-table remastered-orders-table">
              <thead>
                <tr>
                  <th>
                    <div className="th-content">
                      <Hash size={12} />
                      <span>Order ID</span>
                    </div>
                  </th>
                  <th>
                    <div className="th-content">
                      <User size={12} />
                      <span>Customer</span>
                    </div>
                  </th>
                  <th>
                    <div className="th-content">
                      <Package2 size={12} />
                      <span>Product</span>
                    </div>
                  </th>
                  <th>
                    <div className="th-content">
                      <span>Quantity</span>
                    </div>
                  </th>
                  <th>
                    <div className="th-content">
                      <DollarSign size={12} />
                      <span>Amount</span>
                    </div>
                  </th>
                  <th>
                    <div className="th-content">
                      <Calendar size={12} />
                      <span>Date</span>
                    </div>
                  </th>
                  <th>
                    <div className="th-content">
                      <span>Status</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="empty-table remastered-empty">
                      <div className="empty-state">
                        <div className="empty-icon-wrapper">
                          <Package size={48} />
                        </div>
                        <h3>Loading orders...</h3>
                        <p>Please wait while we fetch your assigned orders</p>
                      </div>
                    </td>
                  </tr>
                ) : getCurrentOrders().length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-table remastered-empty">
                      <div className="empty-state">
                        <div className="empty-icon-wrapper">
                          <Package size={48} />
                        </div>
                        <h3>{currentOrdersTab === 'payment' ? 'No Orders for Payment' : 'No Pending Orders'}</h3>
                        <p>{currentOrdersTab === 'payment' 
                          ? 'All orders have been processed or no new orders are available'
                          : 'No pending orders at this time'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  getCurrentOrders().map(order => (
                    <tr key={order.id} className="remastered-row">
                      <td className="order-id-cell">
                        <span className="order-id-badge">#{order.id}</span>
                      </td>
                      <td className="customer-cell">
                        <div className="cell-content">
                          <div className="cell-icon">
                            <User size={14} />
                          </div>
                          <span>{order.customer}</span>
                        </div>
                      </td>
                      <td className="product-cell">
                        <div className="cell-content">
                          <div className="cell-icon">
                            <Package2 size={14} />
                          </div>
                          <span>{order.product}</span>
                        </div>
                      </td>
                      <td className="quantity-cell">
                        <span className="quantity-badge">{order.quantity}</span>
                      </td>
                      <td className="amount-cell">
                        <span className="amount-value">{formatPeso(order.amount)}</span>
                      </td>
                      <td className="date-cell">
                        <div className="cell-content">
                          <div className="cell-icon">
                            <Calendar size={14} />
                          </div>
                          <span>{order.date}</span>
                        </div>
                      </td>
                      <td className="status-cell">
                        <span className={`status-badge remastered-badge ${currentOrdersTab === 'payment' ? 'for-payment' : 'pending'}`}>
                          {currentOrdersTab === 'payment' ? <CreditCard size={10} /> : <Clock size={10} />}
                          <span>{currentOrdersTab === 'payment' ? 'For Payment' : 'Pending'}</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Production Status Table - Remastered */}
        <div className="table-section remastered-table">
          <div className="table-header remastered-header">
            <div className="table-header-content">
              <div className="table-header-icon">
                <Palette size={20} />
              </div>
              <div>
                <h2>Production Status</h2>
                <p className="table-subtitle">Design and sublimation progress</p>
              </div>
            </div>
          </div>
          <div className="table-tabs remastered-tabs">
            <button 
              className={`tab-btn remastered-tab ${productionStatusTab === 'design' ? 'active' : ''}`}
              onClick={() => setProductionStatusTab('design')}
            >
              <Paintbrush size={14} />
              <span>Design Process</span>
              <span className="tab-count">{ordersForDesign.length}</span>
            </button>
            <button 
              className={`tab-btn remastered-tab ${productionStatusTab === 'sublimation' ? 'active' : ''}`}
              onClick={() => setProductionStatusTab('sublimation')}
            >
              <Image size={14} />
              <span>Sublimation</span>
              <span className="tab-count">{ordersForSublimation.length}</span>
            </button>
          </div>
          <div className="table-wrapper remastered-wrapper">
            <table className="orders-table remastered-orders-table">
              <thead>
                <tr>
                  <th>
                    <div className="th-content">
                      <Hash size={12} />
                      <span>Order ID</span>
                    </div>
                  </th>
                  <th>
                    <div className="th-content">
                      <User size={12} />
                      <span>Customer</span>
                    </div>
                  </th>
                  <th>
                    <div className="th-content">
                      <Package2 size={12} />
                      <span>Product</span>
                    </div>
                  </th>
                  <th>
                    <div className="th-content">
                      <span>Quantity</span>
                    </div>
                  </th>
                  <th>
                    <div className="th-content">
                      <RotateCw size={12} />
                      <span>Progress</span>
                    </div>
                  </th>
                  <th>
                    <div className="th-content">
                      <CalendarCheck size={12} />
                      <span>Deadline</span>
                    </div>
                  </th>
                  <th>
                    <div className="th-content">
                      <span>Status</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="empty-table remastered-empty">
                      <div className="empty-state">
                        <div className="empty-icon-wrapper">
                          {productionStatusTab === 'design' ? <Palette size={48} /> : <Image size={48} />}
                        </div>
                        <h3>Loading orders...</h3>
                        <p>Please wait while we fetch your assigned orders</p>
                      </div>
                    </td>
                  </tr>
                ) : getProductionOrders().length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-table remastered-empty">
                      <div className="empty-state">
                        <div className="empty-icon-wrapper">
                          {productionStatusTab === 'design' ? <Palette size={48} /> : <Image size={48} />}
                        </div>
                        <h3>{productionStatusTab === 'design' ? 'No Orders in Design' : 'No Orders in Sublimation'}</h3>
                        <p>{productionStatusTab === 'design' 
                          ? 'All design orders are complete or no orders are in the design queue'
                          : 'All sublimation orders are complete or no orders are in the sublimation queue'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  getProductionOrders().map(order => (
                    <tr key={order.id} className="remastered-row">
                      <td className="order-id-cell">
                        <span className="order-id-badge">#{order.id}</span>
                      </td>
                      <td className="customer-cell">
                        <div className="cell-content">
                          <div className="cell-icon">
                            <User size={14} />
                          </div>
                          <span>{order.customer}</span>
                        </div>
                      </td>
                      <td className="product-cell">
                        <div className="cell-content">
                          <div className="cell-icon">
                            <Package2 size={14} />
                          </div>
                          <span>{order.product}</span>
                        </div>
                      </td>
                      <td className="quantity-cell">
                        <span className="quantity-badge">{order.quantity}</span>
                      </td>
                      <td className="progress-cell">
                        <div className="progress-container">
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${order.progress || 0}%` }}></div>
                          </div>
                          <span className="progress-text">{order.progress || 0}%</span>
                        </div>
                      </td>
                      <td className="deadline-cell">
                        <div className="cell-content">
                          <div className="cell-icon">
                            <CalendarCheck size={14} />
                          </div>
                          <span>{order.deadline}</span>
                        </div>
                      </td>
                      <td className="status-cell">
                        <span className={`status-badge remastered-badge ${productionStatusTab === 'design' ? 'in-design' : 'in-sublimation'}`}>
                          {productionStatusTab === 'design' ? <Paintbrush size={10} /> : <Image size={10} />}
                          <span>{productionStatusTab === 'design' ? 'In Design' : 'In Sublimation'}</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

// Employee Dashboard View Component
function EmployeeDashboardView({ user }) {
  const [employees, setEmployees] = useState([])
  const [timeRecords, setTimeRecords] = useState([])
  const [cashAdvanceRecords, setCashAdvanceRecords] = useState([])
  const [dayOffRecords, setDayOffRecords] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [showCashAdvanceModal, setShowCashAdvanceModal] = useState(false)
  const [cashAdvanceForm, setCashAdvanceForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  })
  
  // Get the logged-in employee
  const loggedInEmployee = employees.find(emp => 
    emp.name?.toLowerCase() === user?.employeeName?.toLowerCase()
  )
  
  // Filter to only show logged-in employee
  const displayEmployees = loggedInEmployee ? [loggedInEmployee] : []

  // Format peso amount
  const formatPeso = (amount) => {
    return `₱${Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Fetch all data
  useEffect(() => {
    const loadData = async () => {
      try {
        const { fetchEmployees, fetchTimeRecords, fetchCashAdvanceRecords, fetchDayOffRecords } = await import('../lib/supabase')
        const [emps, timeRecs, cashRecs, dayOffs] = await Promise.all([
          fetchEmployees(),
          fetchTimeRecords(),
          fetchCashAdvanceRecords(),
          fetchDayOffRecords()
        ])
        setEmployees(emps)
        setTimeRecords(timeRecs)
        setCashAdvanceRecords(cashRecs)
        setDayOffRecords(dayOffs)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }
    loadData()
  }, [])

  // Get latest payroll for employee
  const getLatestPayroll = (employeeId) => {
    const records = timeRecords.filter(r => r.employeeId === employeeId)
    if (records.length === 0) return null
    return records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
  }

  // Get cash advance balance for employee
  const getCashAdvanceBalance = (employeeId, employeeName) => {
    const records = cashAdvanceRecords.filter(r => 
      r.employeeId === employeeId || 
      (r.employeeName && r.employeeName.toLowerCase() === employeeName.toLowerCase())
    )
    return records.reduce((sum, r) => sum + (Number(r.balance) || 0), 0)
  }

  // Get upcoming day offs for employee
  const getUpcomingDayOffs = (employeeId, employeeName) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const records = dayOffRecords.filter(r => {
      const isEmployee = r.employeeId === employeeId || 
        (r.employeeName && r.employeeName.toLowerCase() === employeeName.toLowerCase())
      if (!isEmployee) return false
      
      const recordDate = new Date(r.date)
      recordDate.setHours(0, 0, 0, 0)
      return recordDate >= today
    })
    
    return records.sort((a, b) => new Date(a.date) - new Date(b.date))
  }

  // Handle cash advance request
  const handleRequestCashAdvance = async () => {
    if (!selectedEmployee || !cashAdvanceForm.amount) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const { createCashAdvanceRecord } = await import('../lib/supabase')
      const amount = Number(cashAdvanceForm.amount)
      const newRecord = {
        employeeId: selectedEmployee.id,
        employeeName: selectedEmployee.name,
        amount: amount,
        date: cashAdvanceForm.date,
        notes: cashAdvanceForm.notes || '',
        balance: amount,
        payments: []
      }
      
      await createCashAdvanceRecord(newRecord)
      
      // Reload cash advance records
      const { fetchCashAdvanceRecords } = await import('../lib/supabase')
      const updated = await fetchCashAdvanceRecords()
      setCashAdvanceRecords(updated)
      
      // Reset form
      setShowCashAdvanceModal(false)
      setSelectedEmployee(null)
      setCashAdvanceForm({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      })
      
      alert('Cash advance request submitted successfully!')
    } catch (error) {
      console.error('Error creating cash advance:', error)
      alert('Failed to submit cash advance request. Please try again.')
    }
  }

  const [showDTRRecords, setShowDTRRecords] = useState(false)
  const [dtrRecords, setDtrRecords] = useState([])

  // Fetch DTR records
  const fetchDTRRecords = async (employeeId, employeeName) => {
    try {
      const { supabase } = await import('../lib/supabase')
      const { data, error } = await supabase
        .from('dtr_records')
        .select('*')
        .eq('employee_id', employeeId)
        .order('date', { ascending: false })
        .limit(30)
      
      if (error) throw error
      setDtrRecords((data || []).map(record => ({
        id: record.id,
        date: record.date,
        am_in: record.am_in,
        am_out: record.am_out,
        pm_in: record.pm_in,
        pm_out: record.pm_out,
        ot_in: record.ot_in,
        ot_out: record.ot_out
      })))
      setShowDTRRecords(true)
    } catch (error) {
      console.error('Error fetching DTR records:', error)
      alert('Failed to load DTR records')
    }
  }

  return (
    <div className="view-container employee-dashboard-full">
      {!showDTRRecords ? (
        <>
          <div className="view-header">
            <div className="header-content">
              <div className="header-icon-wrapper">
                <Users size={24} />
              </div>
              <div>
                <h1>Employee Dashboard</h1>
                <p>View your employee information and status</p>
              </div>
            </div>
          </div>

          <div className="employee-dashboard-main">
            {!user?.employeeName ? (
              <div className="empty-state-container">
                <div className="empty-state">
                  <div className="empty-icon-wrapper">
                    <AlertCircle size={48} />
                  </div>
                  <h3>Not Logged In</h3>
                  <p>Please log in to view your employee information</p>
                </div>
              </div>
            ) : displayEmployees.length === 0 ? (
              <div className="empty-state-container">
                <div className="empty-state">
                  <div className="empty-icon-wrapper">
                    <Users size={48} />
                  </div>
                  <h3>Employee Not Found</h3>
                  <p>No employee record found for {user.employeeName}</p>
                </div>
              </div>
            ) : (
              displayEmployees.map(employee => {
                const latestPayroll = getLatestPayroll(employee.id)
                const cashAdvanceBalance = getCashAdvanceBalance(employee.id, employee.name)
                const upcomingDayOffs = getUpcomingDayOffs(employee.id, employee.name)
                
                // Calculate additional stats
                const allPayrollRecords = timeRecords.filter(r => r.employeeId === employee.id)
                const totalPayrollCount = allPayrollRecords.length
                const totalEarnings = allPayrollRecords.reduce((sum, r) => sum + (Number(r.netPay) || 0), 0)
                const recentPayrolls = allPayrollRecords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3)
                
                // Calculate attendance stats
                const thisMonthRecords = allPayrollRecords.filter(r => {
                  const recordDate = new Date(r.createdAt)
                  const now = new Date()
                  return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear()
                })
                
                return (
                  <div key={employee.id} className="employee-dashboard-wrapper">
                    {/* Enhanced Profile Hero Section */}
                    <div className="employee-profile-hero">
                      <div className="profile-hero-background"></div>
                      <div className="profile-hero-content">
                        <div className="profile-avatar-section">
                          <div className="employee-avatar-hero">
                            <User size={40} />
                          </div>
                          <div className="profile-status-indicator"></div>
                        </div>
                        <div className="profile-hero-info">
                          <h1 className="profile-hero-name">{employee.name}</h1>
                          <div className="profile-hero-badges">
                            <span className="hero-badge employee-id-badge">
                              <Hash size={14} />
                              ID: #{employee.id}
                            </span>
                            <span className={`hero-badge shift-badge-hero ${employee.shiftType === 'first' ? 'first-shift' : 'second-shift'}`}>
                              <Clock size={14} />
                              {employee.shiftType === 'first' ? 'First Shift' : 'Second Shift'}
                            </span>
                            <span className="hero-badge rate-badge-hero">
                              <DollarSign size={14} />
                              {formatPeso(employee.ratePer9Hours || 0)}/9hrs
                            </span>
                          </div>
                        </div>
                        <div className="profile-hero-actions">
                          <button
                            className="btn-hero-action primary"
                            onClick={() => fetchDTRRecords(employee.id, employee.name)}
                          >
                            <FileText size={18} />
                            <span>DTR Records</span>
                          </button>
                          <button
                            className="btn-hero-action"
                            onClick={() => {
                              setSelectedEmployee(employee)
                              setShowCashAdvanceModal(true)
                            }}
                          >
                            <Plus size={18} />
                            <span>Cash Advance</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats Row */}
                    <div className="quick-stats-row">
                      <div className="quick-stat-card">
                        <div className="quick-stat-icon payroll">
                          <DollarSign size={20} />
                        </div>
                        <div className="quick-stat-content">
                          <span className="quick-stat-label">Total Earnings</span>
                          <span className="quick-stat-value">{formatPeso(totalEarnings)}</span>
                        </div>
                      </div>
                      <div className="quick-stat-card">
                        <div className="quick-stat-icon payroll-count">
                          <Briefcase size={20} />
                        </div>
                        <div className="quick-stat-content">
                          <span className="quick-stat-label">Payroll Records</span>
                          <span className="quick-stat-value">{totalPayrollCount}</span>
                        </div>
                      </div>
                      <div className="quick-stat-card">
                        <div className="quick-stat-icon cash-advance">
                          <Wallet size={20} />
                        </div>
                        <div className="quick-stat-content">
                          <span className="quick-stat-label">Cash Advance</span>
                          <span className={`quick-stat-value ${cashAdvanceBalance > 0 ? 'warning' : 'success'}`}>
                            {formatPeso(cashAdvanceBalance)}
                          </span>
                        </div>
                      </div>
                      <div className="quick-stat-card">
                        <div className="quick-stat-icon day-offs">
                          <Calendar size={20} />
                        </div>
                        <div className="quick-stat-content">
                          <span className="quick-stat-label">Upcoming Days Off</span>
                          <span className="quick-stat-value">{upcomingDayOffs.length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="employee-content-grid">
                      {/* Left Column */}
                      <div className="employee-left-column">
                        {/* Latest Payroll Card */}
                        <div className="employee-feature-card payroll-card">
                          <div className="feature-card-header">
                            <div className="feature-card-icon payroll">
                              <DollarSign size={24} />
                            </div>
                            <div>
                              <h3>Latest Payroll</h3>
                              <p>Your most recent payment details</p>
                            </div>
                          </div>
                          <div className="feature-card-body">
                            {latestPayroll ? (
                              <>
                                <div className="payroll-amount-display">
                                  <span className="payroll-label">Net Pay</span>
                                  <span className="payroll-amount">{formatPeso(latestPayroll.netPay || 0)}</span>
                                </div>
                                <div className="payroll-details-grid">
                                  <div className="payroll-detail-item">
                                    <span className="detail-label">Period</span>
                                    <span className="detail-value">{latestPayroll.month} {latestPayroll.year}</span>
                                  </div>
                                  <div className="payroll-detail-item">
                                    <span className="detail-label">Pay Period</span>
                                    <span className="detail-value">{latestPayroll.payPeriod || 'N/A'}</span>
                                  </div>
                                  <div className="payroll-detail-item">
                                    <span className="detail-label">Gross Pay</span>
                                    <span className="detail-value">{formatPeso(latestPayroll.grossPay || 0)}</span>
                                  </div>
                                  <div className="payroll-detail-item">
                                    <span className="detail-label">Date</span>
                                    <span className="detail-value">{formatDate(latestPayroll.createdAt)}</span>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="empty-state-feature">
                                <DollarSign size={48} />
                                <p>No payroll records available</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Recent Payroll History */}
                        {recentPayrolls.length > 0 && (
                          <div className="employee-feature-card history-card">
                            <div className="feature-card-header">
                              <div className="feature-card-icon history">
                                <Clock size={24} />
                              </div>
                              <div>
                                <h3>Recent Payroll History</h3>
                                <p>Last 3 payroll records</p>
                              </div>
                            </div>
                            <div className="feature-card-body">
                              <div className="payroll-history-list">
                                {recentPayrolls.map((payroll, idx) => (
                                  <div key={idx} className="payroll-history-item">
                                    <div className="history-item-date">
                                      <Calendar size={16} />
                                      <span>{formatDate(payroll.createdAt)}</span>
                                    </div>
                                    <div className="history-item-details">
                                      <span className="history-period">{payroll.month} {payroll.year} ({payroll.payPeriod})</span>
                                      <span className="history-amount">{formatPeso(payroll.netPay || 0)}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Cash Advance Card */}
                        <div className="employee-feature-card cash-advance-card">
                          <div className="feature-card-header">
                            <div className="feature-card-icon cash-advance">
                              <Wallet size={24} />
                            </div>
                            <div>
                              <h3>Cash Advance</h3>
                              <p>Manage your advance requests</p>
                            </div>
                          </div>
                          <div className="feature-card-body">
                            <div className="cash-advance-display">
                              <span className="cash-advance-label">Current Balance</span>
                              <span className={`cash-advance-amount ${cashAdvanceBalance > 0 ? 'warning' : 'success'}`}>
                                {formatPeso(cashAdvanceBalance)}
                              </span>
                            </div>
                            <button
                              className="btn-feature-action"
                              onClick={() => {
                                setSelectedEmployee(employee)
                                setShowCashAdvanceModal(true)
                              }}
                            >
                              <Plus size={18} />
                              <span>Request Cash Advance</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="employee-right-column">
                        {/* Upcoming Day Offs */}
                        <div className="employee-feature-card day-offs-card">
                          <div className="feature-card-header">
                            <div className="feature-card-icon day-offs">
                              <Calendar size={24} />
                            </div>
                            <div>
                              <h3>Upcoming Day Offs</h3>
                              <p>{upcomingDayOffs.length} scheduled days off</p>
                            </div>
                          </div>
                          <div className="feature-card-body">
                            {upcomingDayOffs.length > 0 ? (
                              <div className="day-offs-list-enhanced">
                                {upcomingDayOffs.slice(0, 6).map((dayOff, idx) => (
                                  <div key={idx} className="day-off-item-enhanced">
                                    <div className="day-off-icon-wrapper">
                                      <CalendarCheck size={18} />
                                    </div>
                                    <div className="day-off-content">
                                      <span className="day-off-date-enhanced">{formatDate(dayOff.date)}</span>
                                      {dayOff.isQualified && (
                                        <span className="qualified-badge-enhanced">Qualified</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                                {upcomingDayOffs.length > 6 && (
                                  <div className="more-day-offs-enhanced">
                                    <span>+{upcomingDayOffs.length - 6} more days off</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="empty-state-feature">
                                <Calendar size={48} />
                                <p>No upcoming day offs scheduled</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Access Information */}
                        <div className="employee-feature-card access-card">
                          <div className="feature-card-header">
                            <div className="feature-card-icon access">
                              <Hash size={24} />
                            </div>
                            <div>
                              <h3>Access Information</h3>
                              <p>Your access codes and credentials</p>
                            </div>
                          </div>
                          <div className="feature-card-body">
                            <div className="access-info-enhanced">
                              <div className="access-item-enhanced">
                                <div className="access-item-header-enhanced">
                                  <Package2 size={18} />
                                  <span>Access Code</span>
                                </div>
                                <div className="access-value-enhanced">
                                  <code>{employee.accessCode || 'N/A'}</code>
                                  <button className="btn-copy-code" title="Copy to clipboard">
                                    <Hash size={14} />
                                  </button>
                                </div>
                              </div>
                              <div className="access-item-enhanced">
                                <div className="access-item-header-enhanced">
                                  <Package2 size={18} />
                                  <span>Barcode</span>
                                </div>
                                <div className="access-value-enhanced">
                                  <code>{employee.barcode || 'N/A'}</code>
                                  <button className="btn-copy-code" title="Copy to clipboard">
                                    <Hash size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Employee Information */}
                        <div className="employee-feature-card info-card">
                          <div className="feature-card-header">
                            <div className="feature-card-icon info">
                              <User size={24} />
                            </div>
                            <div>
                              <h3>Employee Information</h3>
                              <p>Your profile details</p>
                            </div>
                          </div>
                          <div className="feature-card-body">
                            <div className="employee-info-list">
                              <div className="info-list-item">
                                <span className="info-item-label">Employee ID</span>
                                <span className="info-item-value">#{employee.id}</span>
                              </div>
                              <div className="info-list-item">
                                <span className="info-item-label">Shift Type</span>
                                <span className={`info-item-value badge ${employee.shiftType === 'first' ? 'first-shift' : 'second-shift'}`}>
                                  {employee.shiftType === 'first' ? 'First Shift' : 'Second Shift'}
                                </span>
                              </div>
                              <div className="info-list-item">
                                <span className="info-item-label">Rate per 9 Hours</span>
                                <span className="info-item-value">{formatPeso(employee.ratePer9Hours || 0)}</span>
                              </div>
                              <div className="info-list-item">
                                <span className="info-item-label">Total Payrolls</span>
                                <span className="info-item-value">{totalPayrollCount}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </>
      ) : (
        /* DTR Records View */
        <div className="dtr-records-view">
          <div className="dtr-header">
            <button
              className="btn-back-dtr"
              onClick={() => setShowDTRRecords(false)}
            >
              <ArrowLeft size={20} />
              <span>Back to Dashboard</span>
            </button>
            <h2>DTR Records</h2>
          </div>
          <div className="dtr-table-container">
            <table className="dtr-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>AM In</th>
                  <th>AM Out</th>
                  <th>PM In</th>
                  <th>PM Out</th>
                  <th>OT In</th>
                  <th>OT Out</th>
                </tr>
              </thead>
              <tbody>
                {dtrRecords.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-dtr">
                      <div className="empty-state">
                        <FileText size={48} />
                        <p>No DTR records found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  dtrRecords.map(record => (
                    <tr key={record.id}>
                      <td>{formatDate(record.date)}</td>
                      <td>{record.am_in || '-'}</td>
                      <td>{record.am_out || '-'}</td>
                      <td>{record.pm_in || '-'}</td>
                      <td>{record.pm_out || '-'}</td>
                      <td>{record.ot_in || '-'}</td>
                      <td>{record.ot_out || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cash Advance Request Modal */}
      {showCashAdvanceModal && selectedEmployee && (
        <div className="modal-overlay" onClick={() => {
          setShowCashAdvanceModal(false)
          setSelectedEmployee(null)
          setCashAdvanceForm({
            amount: '',
            date: new Date().toISOString().split('T')[0],
            notes: ''
          })
        }}>
          <div className="modal-content employee-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Request Cash Advance</h2>
              <p>Employee: {selectedEmployee.name}</p>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Amount *</label>
                <input
                  type="number"
                  value={cashAdvanceForm.amount}
                  onChange={(e) => setCashAdvanceForm({ ...cashAdvanceForm, amount: e.target.value })}
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  value={cashAdvanceForm.date}
                  onChange={(e) => setCashAdvanceForm({ ...cashAdvanceForm, date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={cashAdvanceForm.notes}
                  onChange={(e) => setCashAdvanceForm({ ...cashAdvanceForm, notes: e.target.value })}
                  placeholder="Optional notes"
                  rows="3"
                />
              </div>
              <div className="current-balance-info">
                <span>Current Balance: </span>
                <strong>{formatPeso(getCashAdvanceBalance(selectedEmployee.id, selectedEmployee.name))}</strong>
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => {
                  setShowCashAdvanceModal(false)
                  setSelectedEmployee(null)
                  setCashAdvanceForm({
                    amount: '',
                    date: new Date().toISOString().split('T')[0],
                    notes: ''
                  })
                }}
              >
                Cancel
              </button>
              <button
                className="btn-submit"
                onClick={handleRequestCashAdvance}
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Create Order View
function CreateOrderView({ user, onOrderCreated }) {
  const [step, setStep] = useState(1)
  const [orderType, setOrderType] = useState('')
  const [repairData, setRepairData] = useState({
    customerName: '',
    contactNumber: '',
    email: '',
    deviceType: '',
    deviceBrand: '',
    deviceModel: '',
    problems: [],
    additionalNotes: '',
    techAssigned: ''
  })
  const [tarpaulinData, setTarpaulinData] = useState({
    customerName: '',
    contactNumber: '',
    email: '',
    address: '',
    businessName: '',
    eventDate: '',
    eventType: '',
    preferredDeliveryDate: '',
    pickupMethod: 'Pickup',
    specialInstructions: '',
    referralSource: '',
    width: '',
    height: '',
    orientation: 'Landscape',
    backgroundColor: '',
    textColor: '',
    quantity: '1',
    designNotes: '',
    paymentMethod: 'Cash',
    downPayment: '',
    isPahabol: false,
    assignedArtist: '',
    rushOrder: false
  })
  const [sublimationData, setSublimationData] = useState({
    customerName: '',
    contactNumber: '',
    email: '',
    address: '',
    businessName: '',
    pickupDate: '',
    priorityLevel: 'Normal',
    productCategory: '',
    deliveryMethod: 'Pickup',
    assignedArtist: '',
    productType: '',
    size: '',
    quantity: '1',
    designNotes: '',
    rushOrder: false,
    paymentMethod: 'Cash',
    downPayment: ''
  })
  const [showCalendar, setShowCalendar] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [artistSearch, setArtistSearch] = useState('')
  const [showArtistDropdown, setShowArtistDropdown] = useState(false)
  const [tarpaulinArtistSearch, setTarpaulinArtistSearch] = useState('')
  const [showTarpaulinArtistDropdown, setShowTarpaulinArtistDropdown] = useState(false)
  const [employees, setEmployees] = useState([])
  const [cartItems, setCartItems] = useState([])
  const [cartIdCounter, setCartIdCounter] = useState(1)
  const [showProductSelection, setShowProductSelection] = useState(false)
  const [selectedProductType, setSelectedProductType] = useState(null)
  const [productSelectionData, setProductSelectionData] = useState({
    productType: '',
    sizes: {
      XS: 0,
      S: 0,
      M: 0,
      L: 0,
      XL: 0,
      '2XL': 0,
      '3XL': 0,
      '4XL': 0
    },
    customSizes: []
  })

  // Predefined product types with prices
  const productTypes = [
    { id: 'tshirt', name: 'T-Shirt', icon: '👕', price: 350 },
    { id: 'tshirt-vneck', name: 'T-Shirt V-Neck', icon: '👕', price: 400 },
    { id: 'longsleeve', name: 'Longsleeve', icon: '👔', price: 450 },
    { id: 'longsleeve-hoodie', name: 'Longsleeve Hoodie', icon: '🧶', price: 500 },
    { id: 'polo-shirt', name: 'Polo Shirt', icon: '👕', price: 450 },
    { id: 'polo-longsleeve', name: 'Polo Longsleeve', icon: '👔', price: 500 },
    { id: 'esport-shirt', name: 'Esport Shirt', icon: '🎮', price: 475 },
    { id: 'esport-longsleeve', name: 'Esport Longsleeve', icon: '🎮', price: 525 },
    { id: 'chinese-collar', name: 'Chinese Collar', icon: '👔', price: 500 },
    { id: 'jersey-up', name: 'Jersey Up', icon: '🏀', price: 450 },
    { id: 'jersey-shorts', name: 'Jersey Shorts', icon: '🩳', price: 450 },
    { id: 'jogging-pants', name: 'Jogging Pants', icon: '👖', price: 600 },
    { id: 'jacket-hoodie', name: 'Jacket with Hoodie', icon: '🧥', price: 900 },
    { id: 'jacket-turtleneck', name: 'Jacket Turtle Neck', icon: '🧥', price: 950 },
    { id: 'jacket-bomber', name: 'Jacket Bomber Neck', icon: '🧥', price: 850 },
    { id: 'jersey-set', name: 'Jersey Set', icon: '🏀', price: 800 }
  ]
  
  // Customer search and management
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [customers, setCustomers] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [customerOrders, setCustomerOrders] = useState([])
  const [isNewCustomer, setIsNewCustomer] = useState(true)
  
  // Alert state
  const [alert, setAlert] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  })
  
  const showAlert = (type, title, message) => {
    setAlert({
      isOpen: true,
      type,
      title,
      message
    })
  }
  
  const closeAlert = () => {
    setAlert({
      isOpen: false,
      type: 'success',
      title: '',
      message: ''
    })
  }
  
  // Load employees from database
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const { fetchEmployees } = await import('../lib/supabase')
        const employeeList = await fetchEmployees()
        console.log('Loaded employees:', employeeList)
        setEmployees(employeeList || [])
      } catch (error) {
        console.error('Error loading employees:', error)
        setEmployees([])
      }
    }
    loadEmployees()
  }, [])
  
  // Filter artists based on search (for Sublimation)
  const filteredArtists = artistSearch.trim() === ''
    ? employees
    : employees.filter(employee =>
        employee.name.toLowerCase().includes(artistSearch.toLowerCase())
      )
  
  // Filter artists based on search (for Tarpaulin)
  const filteredTarpaulinArtists = tarpaulinArtistSearch.trim() === ''
    ? employees
    : employees.filter(employee =>
        employee.name.toLowerCase().includes(tarpaulinArtistSearch.toLowerCase())
      )
  
  const handleArtistSelect = (artistName) => {
    handleSublimationInputChange('assignedArtist', artistName)
    setArtistSearch(artistName)
    setShowArtistDropdown(false)
  }
  
  const handleTarpaulinArtistSelect = (artistName) => {
    setTarpaulinData(prev => ({
      ...prev,
      assignedArtist: artistName
    }))
    setTarpaulinArtistSearch(artistName)
    setShowTarpaulinArtistDropdown(false)
  }
  
  const getArtistStatus = (artistName) => {
    // For now, assume all employees are available
    // You can add availability logic later based on workload or other criteria
    return 'Available'
  }

  // Get selected employee data for Tarpaulin or Sublimation
  const getSelectedTarpaulinEmployee = () => {
    const assignedArtist = orderType === 'Tarpaulin' 
      ? tarpaulinData.assignedArtist 
      : orderType === 'Sublimation'
      ? sublimationData.assignedArtist
      : null
    if (!assignedArtist) return null
    return employees.find(emp => emp.name === assignedArtist)
  }

  // Count orders assigned to an employee
  const getEmployeeOrderCount = async (employeeName) => {
    if (!employeeName) return 0
    try {
      const allOrders = await fetchOrders()
      return allOrders.filter(order => {
        const orderData = order.orderData || {}
        return orderData.assignedArtist === employeeName
      }).length
    } catch (error) {
      console.error('Error counting employee orders:', error)
      return 0
    }
  }

  const [selectedEmployeeOrderCount, setSelectedEmployeeOrderCount] = useState(0)

  // Update order count when artist is selected
  useEffect(() => {
    const updateOrderCount = async () => {
      const assignedArtist = orderType === 'Tarpaulin' 
        ? tarpaulinData.assignedArtist 
        : orderType === 'Sublimation'
        ? sublimationData.assignedArtist
        : null
      if (assignedArtist) {
        const count = await getEmployeeOrderCount(assignedArtist)
        setSelectedEmployeeOrderCount(count)
      } else {
        setSelectedEmployeeOrderCount(0)
      }
    }
    updateOrderCount()
  }, [tarpaulinData.assignedArtist, sublimationData.assignedArtist, orderType])

  const handleAddToCart = () => {
    if (!sublimationData.productType || !sublimationData.size || !sublimationData.quantity) {
      alert('Please fill in Product Type, Size, and Quantity')
      return
    }

    const newItem = {
      id: cartIdCounter,
      productType: sublimationData.productType,
      size: sublimationData.size,
      quantity: parseInt(sublimationData.quantity),
      assignedArtist: sublimationData.assignedArtist || 'Not Assigned'
    }

    setCartItems([...cartItems, newItem])
    setCartIdCounter(cartIdCounter + 1)
    
    // Clear product fields
    setSublimationData(prev => ({
      ...prev,
      productType: '',
      size: '',
      quantity: '1'
    }))
  }

  const handleClearCart = () => {
    if (cartItems.length === 0) return
    if (window.confirm('Are you sure you want to clear all items from the cart?')) {
      setCartItems([])
      setCartIdCounter(1)
    }
  }

  const handleRemoveFromCart = (itemId) => {
    setCartItems(cartItems.filter(item => item.id !== itemId))
  }

  const handleShowProductSelection = () => {
    setShowProductSelection(true)
    setSelectedProductType(null)
  }

  const handleCancelProductSelection = () => {
    setShowProductSelection(false)
    setSelectedProductType(null)
    setProductSelectionData({
      productType: '',
      sizes: {
        XS: 0,
        S: 0,
        M: 0,
        L: 0,
        XL: 0,
        '2XL': 0,
        '3XL': 0,
        '4XL': 0
      },
      customSizes: []
    })
  }

  const handleSelectProductType = (productType) => {
    setSelectedProductType(productType)
    setProductSelectionData(prev => ({
      ...prev,
      productType: productType.name
    }))
  }

  const handleBackToProductSelection = () => {
    setSelectedProductType(null)
    setProductSelectionData(prev => ({
      ...prev,
      productType: '',
      sizes: {
        XS: 0,
        S: 0,
        M: 0,
        L: 0,
        XL: 0,
        '2XL': 0,
        '3XL': 0,
        '4XL': 0
      },
      customSizes: []
    }))
  }

  const handleProductTypeChange = (value) => {
    setProductSelectionData(prev => ({ ...prev, productType: value }))
  }

  const handleSizeQuantityChange = (size, quantity) => {
    setProductSelectionData(prev => ({
      ...prev,
      sizes: {
        ...prev.sizes,
        [size]: parseInt(quantity) || 0
      }
    }))
  }

  const handleAddCustomSize = () => {
    setProductSelectionData(prev => ({
      ...prev,
      customSizes: [...prev.customSizes, { size: '', quantity: 0 }]
    }))
  }

  const handleCustomSizeChange = (index, field, value) => {
    const newCustomSizes = [...productSelectionData.customSizes]
    newCustomSizes[index][field] = field === 'quantity' ? (parseInt(value) || 0) : value
    setProductSelectionData(prev => ({ ...prev, customSizes: newCustomSizes }))
  }

  const handleRemoveCustomSize = (index) => {
    setProductSelectionData(prev => ({
      ...prev,
      customSizes: prev.customSizes.filter((_, i) => i !== index)
    }))
  }

  const handleAddProductToCart = () => {
    if (!productSelectionData.productType) {
      showAlert('error', 'Missing Product Type', 'Please select a product type')
      return
    }

    // Get the selected product type to get the price
    const selectedProduct = productTypes.find(p => p.name === productSelectionData.productType)
    const productPrice = selectedProduct ? selectedProduct.price : 0

    // Check if at least one size has quantity > 0
    const hasStandardSizes = Object.values(productSelectionData.sizes).some(qty => qty > 0)
    const hasCustomSizes = productSelectionData.customSizes.some(cs => cs.size && cs.quantity > 0)

    if (!hasStandardSizes && !hasCustomSizes) {
      showAlert('error', 'Missing Quantities', 'Please enter at least one quantity for any size')
      return
    }

    // Add standard sizes to cart
    Object.entries(productSelectionData.sizes).forEach(([size, quantity]) => {
      if (quantity > 0) {
        const newItem = {
          id: cartIdCounter,
          productType: productSelectionData.productType,
          size: size,
          quantity: quantity,
          price: productPrice,
          totalPrice: productPrice * quantity,
          assignedArtist: sublimationData.assignedArtist || 'Not Assigned'
        }
        setCartItems(prev => [...prev, newItem])
        setCartIdCounter(prev => prev + 1)
      }
    })

    // Add custom sizes to cart
    productSelectionData.customSizes.forEach(({ size, quantity }) => {
      if (size && quantity > 0) {
        const newItem = {
          id: cartIdCounter,
          productType: productSelectionData.productType,
          size: size,
          quantity: quantity,
          price: productPrice,
          totalPrice: productPrice * quantity,
          assignedArtist: sublimationData.assignedArtist || 'Not Assigned'
        }
        setCartItems(prev => [...prev, newItem])
        setCartIdCounter(prev => prev + 1)
      }
    })

    // Reset and go back to cart view
    handleCancelProductSelection()
  }

  const handleDateSelect = (date) => {
    setSelectedDate(date)
    handleSublimationInputChange('pickupDate', date.toISOString().split('T')[0])
    setShowCalendar(false)
  }

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    return { daysInMonth, startingDayOfWeek, year, month }
  }

  const changeMonth = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + direction)
      return newDate
    })
  }

  const handleTypeSelect = (type) => {
    setOrderType(type)
    setStep(2)
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
      if (step === 2) {
        setOrderType('')
        setRepairData({
          customerName: '',
          contactNumber: '',
          email: '',
          deviceType: '',
          deviceBrand: '',
          deviceModel: '',
          problems: [],
          additionalNotes: '',
          techAssigned: ''
        })
        setTarpaulinData({
          customerName: '',
          contactNumber: '',
          email: '',
          width: '',
          height: '',
          orientation: 'Landscape',
          material: '',
          quantity: '1',
          designNotes: '',
          rushOrder: false,
          paymentMethod: 'Cash',
          amountPaid: '',
          downPayment: ''
        })
      }
    }
  }

  const handleRepairInputChange = (field, value) => {
    setRepairData(prev => ({ ...prev, [field]: value }))
  }

  const handleTarpaulinInputChange = (field, value) => {
    setTarpaulinData(prev => ({ ...prev, [field]: value }))
  }

  const handleSublimationInputChange = (field, value) => {
    setSublimationData(prev => ({ ...prev, [field]: value }))
  }

  // Customer search and selection handlers
  const handleCustomerSearch = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setCustomers([])
      return
    }
    
    try {
      const results = await fetchCustomers(searchTerm)
      setCustomers(results)
    } catch (error) {
      console.error('Error searching customers:', error)
      setCustomers([])
    }
  }

  const handleCustomerSelect = async (customer) => {
    setSelectedCustomer(customer)
    setIsNewCustomer(false)
    setShowCustomerDropdown(false)
    setCustomerSearch('')
    
    // Populate form with customer data based on order type
    if (orderType === 'Tarpaulin') {
      setTarpaulinData(prev => ({
        ...prev,
        customerName: customer.name,
        contactNumber: customer.contactNumber || '',
        email: customer.email || '',
        address: customer.address || '',
        businessName: customer.businessName || ''
      }))
    } else if (orderType === 'Sublimation') {
      setSublimationData(prev => ({
        ...prev,
        customerName: customer.name,
        contactNumber: customer.contactNumber || '',
        email: customer.email || '',
        address: customer.address || '',
        businessName: customer.businessName || ''
      }))
    }
    
    // Fetch customer orders
    try {
      const orders = await fetchCustomerOrders(customer.id)
      setCustomerOrders(orders)
    } catch (error) {
      console.error('Error fetching customer orders:', error)
    }
  }

  // Load customers on mount
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const allCustomers = await fetchCustomers('')
        // Only show if there are customers
        if (allCustomers.length > 0) {
          // Optionally pre-populate if needed
        }
      } catch (error) {
        console.error('Error loading customers:', error)
      }
    }
    loadCustomers()
  }, [])

  const handleProblemToggle = (problem) => {
    setRepairData(prev => ({
      ...prev,
      problems: prev.problems.includes(problem)
        ? prev.problems.filter(p => p !== problem)
        : [...prev.problems, problem]
    }))
  }

  const handleNextStep = () => {
    const maxStep = orderType === 'Tarpaulin' ? 4 : orderType === 'Sublimation' ? 5 : 3
    if (step < maxStep) {
      setStep(step + 1)
    }
  }

  const handleSubmitOrder = async () => {
    try {
      if (orderType === 'Tarpaulin') {
        // Validate required fields
        if (!tarpaulinData.customerName || !tarpaulinData.contactNumber) {
          showAlert('error', 'Missing Information', 'Please fill in all required customer information')
          return
        }

        let customerId = null

        // Handle customer - create new or use existing
        if (isNewCustomer && selectedCustomer === null) {
          // Create new customer
          const newCustomer = await createCustomer({
            name: tarpaulinData.customerName,
            contactNumber: tarpaulinData.contactNumber,
            email: tarpaulinData.email || null,
            address: tarpaulinData.address || null,
            businessName: tarpaulinData.businessName || null
          })
          customerId = newCustomer.id
        } else if (selectedCustomer) {
          // Use existing customer
          customerId = selectedCustomer.id
          
          // Update customer info if changed
          if (tarpaulinData.email || tarpaulinData.address || tarpaulinData.businessName) {
            await updateCustomer(selectedCustomer.id, {
              email: tarpaulinData.email || selectedCustomer.email || null,
              address: tarpaulinData.address || selectedCustomer.address || null,
              businessName: tarpaulinData.businessName || selectedCustomer.businessName || null
            })
          }
        }

        // Calculate order amounts
        const width = parseFloat(tarpaulinData.width) || 0
        const height = parseFloat(tarpaulinData.height) || 0
        const quantity = parseFloat(tarpaulinData.quantity) || 1
        const pricePerSqft = 12 // Price per square foot
        const area = width * height
        const totalAmount = area * quantity * pricePerSqft
        const downPayment = parseFloat(tarpaulinData.downPayment || 0) || 0
        const amountPaid = downPayment
        const balance = totalAmount - downPayment

        // Prepare order data object
        const orderData = {
          customerName: tarpaulinData.customerName.trim(),
          customerContact: tarpaulinData.contactNumber.trim(),
          orderType: 'Tarpaulin',
          status: 'pending',
          totalAmount: totalAmount,
          amountPaid: amountPaid,
          balance: balance,
          isPahabol: tarpaulinData.isPahabol === true,
          rushOrder: tarpaulinData.rushOrder === true,
          receivedBy: user?.employeeName || 'Unknown',
          orderData: {
            ...tarpaulinData,
            // Include all tarpaulin data in orderData JSONB field
          }
        }

        // Only include customerId if it exists (not null)
        if (customerId !== null && customerId !== undefined) {
          orderData.customerId = customerId
        }

        const createdOrder = await createOrder(orderData)

        // Auto-print to xprinter
        printTarpaulinReceipt(createdOrder, tarpaulinData)

        // Show success message
        showAlert('success', 'Order Created', 'Tarpaulin order created successfully!')

        // Redirect to order tracking after a short delay
        setTimeout(() => {
          if (onOrderCreated) {
            onOrderCreated()
          }
        }, 2000)
      } else if (orderType === 'Sublimation') {
        // Validate required fields
        if (!sublimationData.customerName || !sublimationData.contactNumber) {
          showAlert('error', 'Missing Information', 'Please fill in all required customer information')
          return
        }

        // Validate cart items
        if (cartItems.length === 0) {
          showAlert('error', 'Missing Products', 'Please add at least one product to the cart')
          return
        }

        let customerId = null

        // Handle customer - create new or use existing
        if (isNewCustomer && selectedCustomer === null) {
          // Create new customer
          const newCustomer = await createCustomer({
            name: sublimationData.customerName,
            contactNumber: sublimationData.contactNumber,
            email: sublimationData.email || null,
            address: sublimationData.address || null,
            businessName: sublimationData.businessName || null
          })
          customerId = newCustomer.id
        } else if (selectedCustomer) {
          // Use existing customer
          customerId = selectedCustomer.id
          
          // Update customer info if changed
          if (sublimationData.email || sublimationData.address || sublimationData.businessName) {
            await updateCustomer(selectedCustomer.id, {
              email: sublimationData.email || selectedCustomer.email || null,
              address: sublimationData.address || selectedCustomer.address || null,
              businessName: sublimationData.businessName || selectedCustomer.businessName || null
            })
          }
        }

        // Calculate order amounts from cart items
        const totalAmount = cartItems.reduce((sum, item) => sum + (parseFloat(item.totalPrice) || 0), 0)
        const downPayment = parseFloat(sublimationData.downPayment || 0) || 0
        const amountPaid = downPayment
        const balance = totalAmount - downPayment

        // Prepare order data object
        const orderData = {
          customerName: sublimationData.customerName.trim(),
          customerContact: sublimationData.contactNumber.trim(),
          orderType: 'Sublimation',
          status: 'pending',
          totalAmount: totalAmount,
          amountPaid: amountPaid,
          balance: balance,
          rushOrder: sublimationData.rushOrder === true,
          receivedBy: user?.employeeName || 'Unknown',
          orderData: {
            ...sublimationData,
            cartItems: cartItems, // Include cart items in orderData
            // Include all sublimation data in orderData JSONB field
          }
        }

        // Only include customerId if it exists (not null)
        if (customerId !== null && customerId !== undefined) {
          orderData.customerId = customerId
        }

        // Log order data before creation for debugging
        console.log('Creating Sublimation order with data:', {
          customerName: orderData.customerName,
          customerContact: orderData.customerContact,
          orderType: orderData.orderType,
          totalAmount: orderData.totalAmount,
          cartItemsCount: cartItems.length,
          hasCustomerId: !!orderData.customerId
        })

        const createdOrder = await createOrder(orderData)

        // Log successful creation
        console.log('Sublimation order created successfully:', {
          orderId: createdOrder.id,
          orderType: createdOrder.orderType,
          status: createdOrder.status
        })

        // Auto-print receipt
        printSublimationReceipt(createdOrder, sublimationData, cartItems)

        // Show success message
        showAlert('success', 'Order Created', `Sublimation order #${createdOrder.id} created successfully!`)

        // Redirect to order tracking after a short delay
        setTimeout(() => {
          if (onOrderCreated) {
            onOrderCreated()
          }
        }, 2000)
      } else if (orderType === 'Repairs') {
        // Submit order logic here
        console.log('Order submitted:', { orderType, repairData })
        
        // Generate and print repair receipt
        printRepairReceipt()
        
        alert('Repair order created successfully! Receipt is ready to print.')
      }
    } catch (error) {
      console.error('Error submitting order:', error)
      const errorMessage = error?.message || error?.error?.message || 'Unknown error occurred'
      showAlert('error', 'Error', `Error creating order: ${errorMessage}`)
    }
  }

  const printTarpaulinReceipt = async (order, orderData) => {
    const currentDate = new Date().toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })

    const orderId = order.id ? order.id.toString() : Date.now().toString()
    const receiptNo = order.id ? `25-200-${order.id.toString().padStart(6, '0')}` : `25-200-${Date.now().toString().slice(-6)}`

    // Generate proper Code 128 barcode SVG with actual bars
    // Code 128 uses bar/space widths: each digit in pattern = width in modules (1-4)
    const generateCode128BarcodeSVG = (data) => {
      // Code 128 Code B patterns - each pattern is [bar1, space1, bar2, space2, bar3, space3, bar4]
      // Values represent module widths (1-4)
      const code128B = {
        ' ': [2,1,1,2,2,2,2], '!': [2,1,2,2,2,1,2], '"': [2,2,2,1,2,1,2], '#': [1,1,2,2,1,2,2],
        '$': [1,1,2,2,2,2,1], '%': [1,2,2,1,1,2,2], '&': [1,2,2,1,2,2,1], "'": [1,2,2,2,2,1,1],
        '(': [1,1,1,2,2,1,2], ')': [1,1,1,2,2,2,1], '*': [1,2,1,1,2,2,2], '+': [1,2,1,2,2,1,2],
        ',': [1,2,2,2,1,1,2], '-': [1,1,2,1,2,2,2], '.': [1,1,2,2,2,1,2], '/': [1,1,1,2,1,2,2],
        '0': [2,2,1,2,1,1,2], '1': [2,2,1,2,1,2,1], '2': [2,2,1,1,2,1,2], '3': [2,1,2,2,1,1,2],
        '4': [2,1,2,2,1,2,1], '5': [2,1,1,2,2,1,2], '6': [2,1,1,1,2,2,2], '7': [2,1,2,1,1,2,2],
        '8': [2,1,2,1,2,2,1], '9': [2,2,2,1,1,1,2], ':': [1,1,2,1,2,1,2], ';': [1,1,2,1,2,2,1],
        '<': [1,1,2,2,1,2,1], '=': [1,2,1,1,1,2,2], '>': [1,2,1,2,1,1,2], '?': [1,2,1,2,2,1,1],
        '@': [1,1,1,2,1,1,2], 'A': [1,1,1,2,1,2,1], 'B': [1,1,1,1,2,1,2], 'C': [1,2,1,1,1,1,2],
        'D': [1,2,1,1,1,2,1], 'E': [1,2,1,1,2,1,1], 'F': [1,1,1,2,2,1,1], 'G': [1,2,1,2,1,1,1],
        'H': [1,1,2,1,1,1,2], 'I': [1,1,2,1,1,2,1], 'J': [1,1,2,1,2,1,1], 'K': [1,2,2,2,1,1,1],
        'L': [1,1,1,1,1,2,2], 'M': [1,1,1,1,2,2,1], 'N': [1,1,1,2,1,1,1], 'O': [1,2,2,1,1,1,1],
        'P': [1,1,2,2,1,1,1], 'Q': [2,1,1,1,1,1,2], 'R': [2,1,1,1,1,2,1], 'S': [2,1,1,1,2,1,1],
        'T': [2,1,1,2,1,1,1], 'U': [2,2,1,1,1,1,1], 'V': [1,1,2,2,2,1,1], 'W': [1,1,1,1,1,1,2],
        'X': [1,1,1,1,1,2,1], 'Y': [1,1,1,1,2,1,1], 'Z': [2,1,2,1,1,1,1]
      }
      
      // Start code B (value 104)
      const startPattern = [2,1,1,2,2,2,2]
      
      // Calculate checksum
      let checksum = 104
      const dataStr = data.toString().toUpperCase()
      const charKeys = Object.keys(code128B)
      
      let bars = []
      
      // Add start pattern
      for (let i = 0; i < startPattern.length; i++) {
        if (i % 2 === 0) {
          bars.push({ type: 'bar', width: startPattern[i] })
        } else {
          bars.push({ type: 'space', width: startPattern[i] })
        }
      }
      
      // Process data characters
      for (let i = 0; i < dataStr.length; i++) {
        const char = dataStr[i]
        if (code128B[char]) {
          const pattern = code128B[char]
          const charValue = charKeys.indexOf(char)
          if (charValue >= 0) {
            checksum += charValue * (i + 1)
          }
          
          // Add character pattern
          for (let j = 0; j < pattern.length; j++) {
            if (j % 2 === 0) {
              bars.push({ type: 'bar', width: pattern[j] })
            } else {
              bars.push({ type: 'space', width: pattern[j] })
            }
          }
        }
      }
      
      // Add checksum character
      checksum = checksum % 103
      const checkChar = charKeys[checksum] || '0'
      if (code128B[checkChar]) {
        const checkPattern = code128B[checkChar]
        for (let j = 0; j < checkPattern.length; j++) {
          if (j % 2 === 0) {
            bars.push({ type: 'bar', width: checkPattern[j] })
          } else {
            bars.push({ type: 'space', width: checkPattern[j] })
          }
        }
      }
      
      // Stop pattern: [2,3,3,1,1,1,2]
      const stopPattern = [2,3,3,1,1,1,2]
      for (let j = 0; j < stopPattern.length; j++) {
        if (j % 2 === 0) {
          bars.push({ type: 'bar', width: stopPattern[j] })
        } else {
          bars.push({ type: 'space', width: stopPattern[j] })
        }
      }
      
      // Generate SVG optimized for thermal receipt printers (80mm paper)
      // Thermal printers need larger module widths and proper sizing
      const moduleWidth = 2.5 // Increased for thermal printer readability
      const barHeight = 50 // Height in mm (good for thermal printers)
      const quietZoneModules = 10 // Quiet zone in modules
      const quietZone = quietZoneModules * moduleWidth
      
      // Calculate total width
      let totalWidth = quietZone * 2
      bars.forEach(bar => {
        totalWidth += bar.width * moduleWidth
      })
      
      // Ensure barcode fits on 80mm paper (approximately 300px at 96dpi)
      const maxWidth = 280 // Leave margin for 80mm paper
      let scale = 1
      if (totalWidth > maxWidth) {
        scale = maxWidth / totalWidth
      }
      
      const scaledModuleWidth = moduleWidth * scale
      const scaledBarHeight = barHeight * scale
      const scaledQuietZone = quietZoneModules * scaledModuleWidth
      
      // Recalculate with scale
      let scaledTotalWidth = scaledQuietZone * 2
      bars.forEach(bar => {
        scaledTotalWidth += bar.width * scaledModuleWidth
      })
      
      let svg = `<svg width="${scaledTotalWidth}" height="${scaledBarHeight + 25}" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: 0 auto; background: white;">`
      let x = scaledQuietZone
      
      // Draw bars and spaces with crisp edges
      bars.forEach(bar => {
        const width = bar.width * scaledModuleWidth
        if (bar.type === 'bar') {
          // Use pure black and ensure crisp rendering
          svg += `<rect x="${Math.round(x)}" y="0" width="${Math.round(width)}" height="${Math.round(scaledBarHeight)}" fill="#000000" stroke="none"/>`
        }
        x += width
      })
      
      // Add text below barcode
      svg += `<text x="${scaledTotalWidth / 2}" y="${scaledBarHeight + 18}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${12 * scale}" font-weight="bold" fill="black">${data}</text>`
      svg += '</svg>'
      
      return svg
    }

    const barcodeSVG = generateCode128BarcodeSVG(receiptNo)

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tarpaulin Order - ${orderData.customerName}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            padding: 10px;
            background: white;
            color: #000;
            line-height: 1.5;
          }
          .receipt {
            max-width: 80mm;
            margin: 0 auto;
            background: white;
            padding: 0;
          }
          .header {
            text-align: center;
            padding: 18px 0 12px 0;
            margin-bottom: 15px;
            border-bottom: 3px solid #000;
            position: relative;
          }
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 60px;
            height: 3px;
            background: #000;
          }
          .header .logo-text {
            font-size: 36px;
            font-weight: 900;
            letter-spacing: 4px;
            margin-bottom: 4px;
            text-transform: uppercase;
            line-height: 1.1;
          }
          .header .store-name {
            font-size: 18px;
            font-weight: 700;
            letter-spacing: 1.5px;
            margin-bottom: 10px;
            text-transform: uppercase;
            color: #333;
            line-height: 1.3;
          }
          .header .address {
            font-size: 13px;
            margin-bottom: 5px;
            line-height: 1.5;
            color: #555;
            font-weight: 500;
          }
          .transaction-info {
            margin: 15px 0;
            font-size: 13px;
            line-height: 1.7;
            background: #f9f9f9;
            padding: 10px 12px;
            border-left: 3px solid #000;
          }
          .transaction-info .receipt-no {
            font-weight: 700;
            margin-bottom: 4px;
            font-size: 14px;
            color: #000;
          }
          .transaction-info .date-time {
            margin-bottom: 4px;
            color: #333;
          }
          .transaction-info > div:last-child {
            color: #555;
          }
          .divider {
            text-align: center;
            margin: 15px 0;
            font-size: 16px;
            letter-spacing: 2px;
            border-top: 2px solid #000;
            border-bottom: 2px solid #000;
            padding: 8px 0;
            font-weight: bold;
          }
          .section {
            margin-bottom: 15px;
            padding-bottom: 12px;
            border-bottom: 1px solid #ddd;
          }
          .section:last-of-type {
            border-bottom: 2px solid #000;
            margin-bottom: 15px;
            padding-bottom: 15px;
          }
          .section-title {
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding-bottom: 5px;
            border-bottom: 2px solid #000;
            color: #000;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 7px;
            font-size: 14px;
            line-height: 1.6;
            padding: 3px 0;
          }
          .info-row .label {
            font-weight: 600;
            text-align: left;
            min-width: 45%;
            color: #333;
          }
          .info-row .value {
            text-align: right;
            flex: 1;
            word-break: break-word;
            color: #000;
            font-weight: 500;
          }
          .badge {
            display: inline-block;
            padding: 3px 8px;
            background: #000;
            color: #fff;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-radius: 2px;
          }
          .barcode-section {
            text-align: center;
            margin: 20px 0 10px 0;
            padding: 10px 0;
          }
          .barcode-container {
            display: block;
            margin: 10px auto;
            text-align: center;
            background: white;
            padding: 5px 0;
          }
          .barcode-svg {
            display: block;
            margin: 0 auto;
            max-width: 100%;
            height: auto;
            image-rendering: crisp-edges;
            image-rendering: -webkit-optimize-contrast;
            image-rendering: pixelated;
          }
          .barcode-number {
            font-size: 16px;
            font-weight: bold;
            letter-spacing: 1px;
            margin-top: 8px;
            font-family: 'Arial', sans-serif;
          }
          @media print {
            .barcode-svg {
              image-rendering: auto;
            }
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 2px solid #000;
          }
          .footer .thank-you {
            font-size: 15px;
            font-weight: 700;
            margin-bottom: 8px;
            letter-spacing: 0.5px;
            color: #000;
          }
          .footer .system-info {
            font-size: 10px;
            color: #666;
            margin-top: 8px;
            font-weight: 500;
          }
          @media print {
            body {
              padding: 5px;
            }
            .receipt {
              max-width: 100%;
            }
            .barcode-svg {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              color-adjust: exact;
            }
            .barcode-svg rect {
              fill: #000000 !important;
              stroke: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="logo-text">IRONWOLF</div>
            <div class="store-name">DIGITAL PRINTING</div>
            <div class="address">D' Flores Street<br>7302 Lamitan</div>
          </div>

          <div class="transaction-info">
            <div class="receipt-no">Receipt No.: ${receiptNo}</div>
            <div class="date-time">${currentDate}</div>
            <div>User: ${user?.employeeName || 'System'}</div>
          </div>

          <div class="divider">━━━━━━━━━━━━━━━━</div>

          <div class="section">
            <div class="section-title">Customer Information</div>
            <div class="info-row">
              <span class="label">Name:</span>
              <span class="value">${orderData.customerName || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Contact:</span>
              <span class="value">${orderData.contactNumber || 'N/A'}</span>
            </div>
            ${orderData.email ? `
            <div class="info-row">
              <span class="label">Email:</span>
              <span class="value">${orderData.email}</span>
            </div>
            ` : ''}
            ${orderData.address ? `
            <div class="info-row">
              <span class="label">Address:</span>
              <span class="value">${orderData.address}</span>
            </div>
            ` : ''}
          </div>

          <div class="section">
            <div class="section-title">Order Details</div>
            ${orderData.width && orderData.height ? `
            <div class="info-row">
              <span class="label">Size:</span>
              <span class="value">${orderData.width} × ${orderData.height} ft</span>
            </div>
            ` : ''}
            ${orderData.orientation ? `
            <div class="info-row">
              <span class="label">Orientation:</span>
              <span class="value">${orderData.orientation}</span>
            </div>
            ` : ''}
            <div class="info-row">
              <span class="label">Quantity:</span>
              <span class="value">${orderData.quantity || '1'} pc(s)</span>
            </div>
            ${orderData.isPahabol ? `
            <div class="info-row">
              <span class="label">Order Type:</span>
              <span class="value"><span class="badge">PAHABOL</span></span>
            </div>
            ` : ''}
            ${orderData.rushOrder ? `
            <div class="info-row">
              <span class="label">Priority:</span>
              <span class="value"><span class="badge">RUSH ORDER</span></span>
            </div>
            ` : ''}
          </div>

          ${orderData.assignedArtist ? `
          <div class="section">
            <div class="section-title">Assigned Artist</div>
            <div class="info-row">
              <span class="label">Artist:</span>
              <span class="value">${orderData.assignedArtist}</span>
            </div>
          </div>
          ` : ''}

          <div class="section">
            <div class="section-title">Payment Information</div>
            <div class="info-row">
              <span class="label">Payment Method:</span>
              <span class="value">${orderData.paymentMethod || 'Cash'}</span>
            </div>
            ${orderData.downPayment ? `
            <div class="info-row">
              <span class="label">Down Payment:</span>
              <span class="value">₱${parseFloat(orderData.downPayment).toFixed(2)}</span>
            </div>
            ` : ''}
          </div>

          <div class="divider">━━━━━━━━━━━━━━━━</div>

          <div class="barcode-section">
            <div class="barcode-container">
              ${barcodeSVG}
            </div>
            <div class="barcode-number">${receiptNo}</div>
          </div>

          <div class="footer">
            <div class="thank-you">Thank you for your business!</div>
            <div class="thank-you" style="font-size: 13px; margin-top: 5px;">Please come again</div>
            <div class="system-info">IRONWOLF DIGITAL PRINTING SYSTEM v1.2.1</div>
          </div>
        </div>
      </body>
      </html>
    `

    // Try to print to xprinter via network API
    try {
      // Method 1: Send to backend API for network printing
      const printResponse = await fetch('http://localhost:3001/api/print', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          printerName: 'xprinter', // or the exact network printer name/IP
          printerIP: '192.168.1.100', // Replace with actual xprinter IP
          html: receiptHTML,
          orderId: order.id
        })
      })

      if (printResponse.ok) {
        const result = await printResponse.json()
        console.log('Print job sent to xprinter successfully:', result)
        return
      } else {
        const errorData = await printResponse.json().catch(() => ({}))
        console.warn('Print server returned error:', errorData)
      }
    } catch (error) {
      console.warn('Network printing failed, falling back to browser print:', error)
    }

    // Fallback: Use browser print (will show print dialog)
    const receiptWindow = window.open('', '_blank', 'width=800,height=600')
    receiptWindow.document.write(receiptHTML)
    receiptWindow.document.close()
    
    // Auto-print after a short delay
    setTimeout(() => {
      receiptWindow.focus()
      receiptWindow.print()
    }, 500)
  }

  const printSublimationReceipt = async (order, orderData, cartItems) => {
    const currentDate = new Date().toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })

    const orderId = order.id ? order.id.toString() : Date.now().toString()
    const receiptNo = order.id ? `25-300-${order.id.toString().padStart(6, '0')}` : `25-300-${Date.now().toString().slice(-6)}`

    // Generate proper Code 128 barcode SVG with actual bars
    // Code 128 uses bar/space widths: each digit in pattern = width in modules (1-4)
    const generateCode128BarcodeSVG = (data) => {
      // Code 128 Code B patterns - each pattern is [bar1, space1, bar2, space2, bar3, space3, bar4]
      // Values represent module widths (1-4)
      const code128B = {
        ' ': [2,1,1,2,2,2,2], '!': [2,1,2,2,2,1,2], '"': [2,2,2,1,2,1,2], '#': [1,1,2,2,1,2,2],
        '$': [1,1,2,2,2,2,1], '%': [1,2,2,1,1,2,2], '&': [1,2,2,1,2,2,1], "'": [1,2,2,2,2,1,1],
        '(': [1,1,1,2,2,1,2], ')': [1,1,1,2,2,2,1], '*': [1,2,1,1,2,2,2], '+': [1,2,1,2,2,1,2],
        ',': [1,2,2,2,1,1,2], '-': [1,1,2,1,2,2,2], '.': [1,1,2,2,2,1,2], '/': [1,1,1,2,1,2,2],
        '0': [2,2,1,2,1,1,2], '1': [2,2,1,2,1,2,1], '2': [2,2,1,1,2,1,2], '3': [2,1,2,2,1,1,2],
        '4': [2,1,2,2,1,2,1], '5': [2,1,1,2,2,1,2], '6': [2,1,1,1,2,2,2], '7': [2,1,2,1,1,2,2],
        '8': [2,1,2,1,2,2,1], '9': [2,2,2,1,1,1,2], ':': [1,1,2,1,2,1,2], ';': [1,1,2,1,2,2,1],
        '<': [1,1,2,2,1,2,1], '=': [1,2,1,1,1,2,2], '>': [1,2,1,2,1,1,2], '?': [1,2,1,2,2,1,1],
        '@': [1,1,1,2,1,1,2], 'A': [1,1,1,2,1,2,1], 'B': [1,1,1,1,2,1,2], 'C': [1,2,1,1,1,1,2],
        'D': [1,2,1,1,1,2,1], 'E': [1,2,1,1,2,1,1], 'F': [1,1,1,2,2,1,1], 'G': [1,2,1,2,1,1,1],
        'H': [1,1,2,1,1,1,2], 'I': [1,1,2,1,1,2,1], 'J': [1,1,2,1,2,1,1], 'K': [1,2,2,2,1,1,1],
        'L': [1,1,1,1,1,2,2], 'M': [1,1,1,1,2,2,1], 'N': [1,1,1,2,1,1,1], 'O': [1,2,2,1,1,1,1],
        'P': [1,1,2,2,1,1,1], 'Q': [2,1,1,1,1,1,2], 'R': [2,1,1,1,1,2,1], 'S': [2,1,1,1,2,1,1],
        'T': [2,1,1,2,1,1,1], 'U': [2,2,1,1,1,1,1], 'V': [1,1,2,2,2,1,1], 'W': [1,1,1,1,1,1,2],
        'X': [1,1,1,1,1,2,1], 'Y': [1,1,1,1,2,1,1], 'Z': [2,1,2,1,1,1,1]
      }
      
      // Start code B (value 104)
      const startPattern = [2,1,1,2,2,2,2]
      
      // Calculate checksum
      let checksum = 104
      const dataStr = data.toString().toUpperCase()
      const charKeys = Object.keys(code128B)
      
      let bars = []
      
      // Add start pattern
      for (let i = 0; i < startPattern.length; i++) {
        if (i % 2 === 0) {
          bars.push({ type: 'bar', width: startPattern[i] })
        } else {
          bars.push({ type: 'space', width: startPattern[i] })
        }
      }
      
      // Process data characters
      for (let i = 0; i < dataStr.length; i++) {
        const char = dataStr[i]
        if (code128B[char]) {
          const pattern = code128B[char]
          const charValue = charKeys.indexOf(char)
          if (charValue >= 0) {
            checksum += charValue * (i + 1)
          }
          
          // Add character pattern
          for (let j = 0; j < pattern.length; j++) {
            if (j % 2 === 0) {
              bars.push({ type: 'bar', width: pattern[j] })
            } else {
              bars.push({ type: 'space', width: pattern[j] })
            }
          }
        }
      }
      
      // Add checksum character
      checksum = checksum % 103
      const checkChar = charKeys[checksum] || '0'
      if (code128B[checkChar]) {
        const checkPattern = code128B[checkChar]
        for (let j = 0; j < checkPattern.length; j++) {
          if (j % 2 === 0) {
            bars.push({ type: 'bar', width: checkPattern[j] })
          } else {
            bars.push({ type: 'space', width: checkPattern[j] })
          }
        }
      }
      
      // Stop pattern: [2,3,3,1,1,1,2]
      const stopPattern = [2,3,3,1,1,1,2]
      for (let j = 0; j < stopPattern.length; j++) {
        if (j % 2 === 0) {
          bars.push({ type: 'bar', width: stopPattern[j] })
        } else {
          bars.push({ type: 'space', width: stopPattern[j] })
        }
      }
      
      // Generate SVG optimized for thermal receipt printers (80mm paper)
      // Thermal printers need larger module widths and proper sizing
      const moduleWidth = 2.5 // Increased for thermal printer readability
      const barHeight = 50 // Height in mm (good for thermal printers)
      const quietZoneModules = 10 // Quiet zone in modules
      const quietZone = quietZoneModules * moduleWidth
      
      // Calculate total width
      let totalWidth = quietZone * 2
      bars.forEach(bar => {
        totalWidth += bar.width * moduleWidth
      })
      
      // Ensure barcode fits on 80mm paper (approximately 300px at 96dpi)
      const maxWidth = 280 // Leave margin for 80mm paper
      let scale = 1
      if (totalWidth > maxWidth) {
        scale = maxWidth / totalWidth
      }
      
      const scaledModuleWidth = moduleWidth * scale
      const scaledBarHeight = barHeight * scale
      const scaledQuietZone = quietZoneModules * scaledModuleWidth
      
      // Recalculate with scale
      let scaledTotalWidth = scaledQuietZone * 2
      bars.forEach(bar => {
        scaledTotalWidth += bar.width * scaledModuleWidth
      })
      
      let svg = `<svg width="${scaledTotalWidth}" height="${scaledBarHeight + 25}" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: 0 auto; background: white;">`
      let x = scaledQuietZone
      
      // Draw bars and spaces with crisp edges
      bars.forEach(bar => {
        const width = bar.width * scaledModuleWidth
        if (bar.type === 'bar') {
          // Use pure black and ensure crisp rendering
          svg += `<rect x="${Math.round(x)}" y="0" width="${Math.round(width)}" height="${Math.round(scaledBarHeight)}" fill="#000000" stroke="none"/>`
        }
        x += width
      })
      
      // Add text below barcode
      svg += `<text x="${scaledTotalWidth / 2}" y="${scaledBarHeight + 18}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${12 * scale}" font-weight="bold" fill="black">${data}</text>`
      svg += '</svg>'
      
      return svg
    }

    const barcodeSVG = generateCode128BarcodeSVG(receiptNo)

    // Calculate totals from cart items
    const totalAmount = cartItems.reduce((sum, item) => sum + (parseFloat(item.totalPrice) || 0), 0)
    const downPayment = parseFloat(orderData.downPayment || 0) || 0
    const balance = totalAmount - downPayment

    // Generate cart items HTML
    const cartItemsHTML = cartItems.map(item => {
      const sizes = item.sizes && item.sizes.length > 0 
        ? item.sizes.map(s => `${s.size}: ${s.quantity}`).join(', ')
        : 'N/A'
      return `
        <div class="cart-item">
          <div class="cart-item-header">
            <span class="cart-item-name">${item.productType || 'N/A'}</span>
            <span class="cart-item-price">₱${parseFloat(item.totalPrice || 0).toFixed(2)}</span>
          </div>
          ${sizes !== 'N/A' ? `<div class="cart-item-sizes">Sizes: ${sizes}</div>` : ''}
          ${item.quantity ? `<div class="cart-item-qty">Qty: ${item.quantity} pc(s)</div>` : ''}
        </div>
      `
    }).join('')

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sublimation Order - ${orderData.customerName}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            padding: 10px;
            background: white;
            color: #000;
            line-height: 1.5;
          }
          .receipt {
            max-width: 80mm;
            margin: 0 auto;
            background: white;
            padding: 0;
          }
          .header {
            text-align: center;
            padding: 18px 0 12px 0;
            margin-bottom: 15px;
            border-bottom: 3px solid #000;
            position: relative;
          }
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 60px;
            height: 3px;
            background: #000;
          }
          .header .logo-text {
            font-size: 36px;
            font-weight: 900;
            letter-spacing: 4px;
            margin-bottom: 4px;
            text-transform: uppercase;
            line-height: 1.1;
          }
          .header .store-name {
            font-size: 18px;
            font-weight: 700;
            letter-spacing: 1.5px;
            margin-bottom: 10px;
            text-transform: uppercase;
            color: #333;
            line-height: 1.3;
          }
          .header .address {
            font-size: 13px;
            margin-bottom: 5px;
            line-height: 1.5;
            color: #555;
            font-weight: 500;
          }
          .transaction-info {
            margin: 15px 0;
            font-size: 13px;
            line-height: 1.7;
            background: #f9f9f9;
            padding: 10px 12px;
            border-left: 3px solid #000;
          }
          .transaction-info .receipt-no {
            font-weight: 700;
            margin-bottom: 4px;
            font-size: 14px;
            color: #000;
          }
          .transaction-info .date-time {
            margin-bottom: 4px;
            color: #333;
          }
          .transaction-info > div:last-child {
            color: #555;
          }
          .divider {
            text-align: center;
            margin: 15px 0;
            font-size: 16px;
            letter-spacing: 2px;
            border-top: 2px solid #000;
            border-bottom: 2px solid #000;
            padding: 8px 0;
            font-weight: bold;
          }
          .section {
            margin-bottom: 15px;
            padding-bottom: 12px;
            border-bottom: 1px solid #ddd;
          }
          .section:last-of-type {
            border-bottom: 2px solid #000;
            margin-bottom: 15px;
            padding-bottom: 15px;
          }
          .section-title {
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding-bottom: 5px;
            border-bottom: 2px solid #000;
            color: #000;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 7px;
            font-size: 14px;
            line-height: 1.6;
            padding: 3px 0;
          }
          .info-row .label {
            font-weight: 600;
            text-align: left;
            min-width: 45%;
            color: #333;
          }
          .info-row .value {
            text-align: right;
            flex: 1;
            word-break: break-word;
            color: #000;
            font-weight: 500;
          }
          .badge {
            display: inline-block;
            padding: 3px 8px;
            background: #000;
            color: #fff;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-radius: 2px;
          }
          .cart-item {
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px dashed #ccc;
          }
          .cart-item:last-child {
            border-bottom: none;
          }
          .cart-item-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
          }
          .cart-item-name {
            font-weight: 600;
            font-size: 14px;
            color: #000;
          }
          .cart-item-price {
            font-weight: 700;
            font-size: 14px;
            color: #000;
          }
          .cart-item-sizes {
            font-size: 12px;
            color: #555;
            margin-top: 2px;
          }
          .cart-item-qty {
            font-size: 12px;
            color: #555;
            margin-top: 2px;
          }
          .barcode-section {
            text-align: center;
            margin: 20px 0 10px 0;
            padding: 10px 0;
          }
          .barcode-container {
            display: block;
            margin: 10px auto;
            text-align: center;
            background: white;
            padding: 5px 0;
          }
          .barcode-svg {
            display: block;
            margin: 0 auto;
            max-width: 100%;
            height: auto;
            image-rendering: crisp-edges;
            image-rendering: -webkit-optimize-contrast;
            image-rendering: pixelated;
          }
          .barcode-number {
            font-size: 16px;
            font-weight: bold;
            letter-spacing: 1px;
            margin-top: 8px;
            font-family: 'Arial', sans-serif;
          }
          @media print {
            .barcode-svg {
              image-rendering: auto;
            }
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 2px solid #000;
          }
          .footer .thank-you {
            font-size: 15px;
            font-weight: 700;
            margin-bottom: 8px;
            letter-spacing: 0.5px;
            color: #000;
          }
          .footer .system-info {
            font-size: 10px;
            color: #666;
            margin-top: 8px;
            font-weight: 500;
          }
          @media print {
            body {
              padding: 5px;
            }
            .receipt {
              max-width: 100%;
            }
            .barcode-svg {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              color-adjust: exact;
            }
            .barcode-svg rect {
              fill: #000000 !important;
              stroke: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="logo-text">IRONWOLF</div>
            <div class="store-name">DIGITAL PRINTING</div>
            <div class="address">D' Flores Street<br>7302 Lamitan</div>
          </div>

          <div class="transaction-info">
            <div class="receipt-no">Receipt No.: ${receiptNo}</div>
            <div class="date-time">${currentDate}</div>
            <div>User: ${user?.employeeName || 'System'}</div>
          </div>

          <div class="divider">━━━━━━━━━━━━━━━━</div>

          <div class="section">
            <div class="section-title">Customer Information</div>
            <div class="info-row">
              <span class="label">Name:</span>
              <span class="value">${orderData.customerName || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Contact:</span>
              <span class="value">${orderData.contactNumber || 'N/A'}</span>
            </div>
            ${orderData.email ? `
            <div class="info-row">
              <span class="label">Email:</span>
              <span class="value">${orderData.email}</span>
            </div>
            ` : ''}
            ${orderData.address ? `
            <div class="info-row">
              <span class="label">Address:</span>
              <span class="value">${orderData.address}</span>
            </div>
            ` : ''}
          </div>

          <div class="section">
            <div class="section-title">Order Items</div>
            ${cartItemsHTML}
          </div>

          ${orderData.rushOrder ? `
          <div class="section">
            <div class="info-row">
              <span class="label">Priority:</span>
              <span class="value"><span class="badge">RUSH ORDER</span></span>
            </div>
          </div>
          ` : ''}

          ${orderData.assignedArtist ? `
          <div class="section">
            <div class="section-title">Assigned Artist</div>
            <div class="info-row">
              <span class="label">Artist:</span>
              <span class="value">${orderData.assignedArtist}</span>
            </div>
          </div>
          ` : ''}

          <div class="section">
            <div class="section-title">Payment Information</div>
            <div class="info-row">
              <span class="label">Total Amount:</span>
              <span class="value">₱${totalAmount.toFixed(2)}</span>
            </div>
            <div class="info-row">
              <span class="label">Payment Method:</span>
              <span class="value">${orderData.paymentMethod || 'Cash'}</span>
            </div>
            ${downPayment > 0 ? `
            <div class="info-row">
              <span class="label">Down Payment:</span>
              <span class="value">₱${downPayment.toFixed(2)}</span>
            </div>
            <div class="info-row">
              <span class="label">Balance:</span>
              <span class="value">₱${balance.toFixed(2)}</span>
            </div>
            ` : ''}
          </div>

          <div class="divider">━━━━━━━━━━━━━━━━</div>

          <div class="barcode-section">
            <div class="barcode-container">
              ${barcodeSVG}
            </div>
            <div class="barcode-number">${receiptNo}</div>
          </div>

          <div class="footer">
            <div class="thank-you">Thank you for your business!</div>
            <div class="thank-you" style="font-size: 13px; margin-top: 5px;">Please come again</div>
            <div class="system-info">IRONWOLF DIGITAL PRINTING SYSTEM v1.2.1</div>
          </div>
        </div>
      </body>
      </html>
    `

    // Try to print to xprinter via network API
    try {
      // Method 1: Send to backend API for network printing
      const printResponse = await fetch('http://localhost:3001/api/print', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          printerName: 'xprinter', // or the exact network printer name/IP
          printerIP: '192.168.1.100', // Replace with actual xprinter IP
          html: receiptHTML,
          orderId: order.id
        })
      })

      if (printResponse.ok) {
        const result = await printResponse.json()
        console.log('Print job sent to xprinter successfully:', result)
        return
      } else {
        const errorData = await printResponse.json().catch(() => ({}))
        console.warn('Print server returned error:', errorData)
      }
    } catch (error) {
      console.warn('Network printing failed, falling back to browser print:', error)
    }

    // Fallback: Use browser print (will show print dialog)
    const receiptWindow = window.open('', '_blank', 'width=800,height=600')
    receiptWindow.document.write(receiptHTML)
    receiptWindow.document.close()
    
    // Auto-print after a short delay
    setTimeout(() => {
      receiptWindow.focus()
      receiptWindow.print()
    }, 500)
  }

  const printRepairReceipt = () => {
    const receiptWindow = window.open('', '_blank', 'width=800,height=600')
    const currentDate = new Date().toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
    
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Repair Receipt - ${repairData.customerName}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Courier New', monospace;
            padding: 20px;
            background: white;
            color: black;
          }
          .receipt {
            max-width: 400px;
            margin: 0 auto;
            border: 2px dashed #000;
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
            margin-bottom: 15px;
          }
          .header h1 {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .header h2 {
            font-size: 18px;
            margin-bottom: 10px;
          }
          .section {
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px dashed #000;
          }
          .section:last-child {
            border-bottom: none;
          }
          .section-title {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 8px;
            text-decoration: underline;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 12px;
          }
          .label {
            font-weight: bold;
          }
          .problems-list {
            margin-top: 8px;
          }
          .problem-item {
            font-size: 11px;
            margin-left: 10px;
            margin-bottom: 3px;
          }
          .problem-item:before {
            content: "✓ ";
            font-weight: bold;
          }
          .notes-box {
            background: #f5f5f5;
            padding: 10px;
            margin-top: 8px;
            font-size: 11px;
            border: 1px solid #000;
            min-height: 60px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 2px solid #000;
            font-size: 10px;
          }
          .barcode {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            letter-spacing: 2px;
            margin: 15px 0;
          }
          .status-box {
            border: 2px solid #000;
            padding: 10px;
            margin: 15px 0;
            text-align: center;
          }
          .status-box h3 {
            font-size: 16px;
            margin-bottom: 5px;
          }
          @media print {
            body {
              padding: 0;
            }
            .receipt {
              border: 2px dashed #000;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h1>IRONWOLF DIGITAL PRINTING</h1>
            <h2>REPAIR ORDER</h2>
            <div style="font-size: 11px; margin-top: 5px;">
              ${currentDate}
            </div>
          </div>

          <div class="barcode">
            *${Date.now().toString().slice(-8)}*
          </div>

          <div class="section">
            <div class="section-title">CUSTOMER INFORMATION</div>
            <div class="info-row">
              <span class="label">Name:</span>
              <span>${repairData.customerName || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Contact:</span>
              <span>${repairData.contactNumber || 'N/A'}</span>
            </div>
            ${repairData.email ? `
            <div class="info-row">
              <span class="label">Email:</span>
              <span>${repairData.email}</span>
            </div>
            ` : ''}
          </div>

          <div class="section">
            <div class="section-title">DEVICE INFORMATION</div>
            <div class="info-row">
              <span class="label">Type:</span>
              <span>${repairData.deviceType || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Brand:</span>
              <span>${repairData.deviceBrand || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Model:</span>
              <span>${repairData.deviceModel || 'N/A'}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">ASSIGNED TECHNICIAN</div>
            <div class="info-row">
              <span class="label">Tech:</span>
              <span>${repairData.techAssigned || 'N/A'}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">REPORTED PROBLEMS (${repairData.problems.length})</div>
            <div class="problems-list">
              ${repairData.problems.length > 0 
                ? repairData.problems.map(problem => `<div class="problem-item">${problem}</div>`).join('')
                : '<div class="problem-item">No problems selected</div>'
              }
            </div>
          </div>

          ${repairData.additionalNotes ? `
          <div class="section">
            <div class="section-title">ADDITIONAL NOTES</div>
            <div class="notes-box">${repairData.additionalNotes}</div>
          </div>
          ` : ''}

          <div class="status-box">
            <h3>STATUS: PENDING REPAIR</h3>
            <div style="font-size: 11px; margin-top: 5px;">
              Date Received: ${new Date().toLocaleDateString()}
            </div>
          </div>

          <div class="footer">
            <div style="margin-bottom: 5px;">
              <strong>IRONWOLF DIGITAL PRINTING SYSTEM v1.2.1</strong>
            </div>
            <div>
              Keep this receipt for your records
            </div>
            <div style="margin-top: 10px; font-size: 9px;">
              Order ID: ${Date.now().toString().slice(-8)}
            </div>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `
    
    receiptWindow.document.write(receiptHTML)
    receiptWindow.document.close()
  }

  const steps = orderType === 'Repairs' 
    ? [
        { number: 1, title: 'Select Type', description: 'Choose product category' },
        { number: 2, title: 'Customer Details', description: 'Enter information' },
        { number: 3, title: 'Problem Checklist', description: 'Identify issues' }
      ]
    : orderType === 'Tarpaulin'
    ? [
        { number: 1, title: 'Select Type', description: 'Choose product category' },
        { number: 2, title: 'Customer Info', description: 'Enter details' },
        { number: 3, title: 'Order Details', description: 'Size & design' },
        { number: 4, title: 'Payment', description: 'Review & pay' }
      ]
    : orderType === 'Sublimation'
    ? [
        { number: 1, title: 'Select Type', description: 'Choose product category' },
        { number: 2, title: 'Customer Info', description: 'Enter details' },
        { number: 3, title: 'Assign Artist', description: 'Select graphic artist' },
        { number: 4, title: 'Add Products', description: 'Add clothes & sizes' },
        { number: 5, title: 'Payment', description: 'Review & pay' }
      ]
    : [
        { number: 1, title: 'Select Type', description: 'Choose product category' },
        { number: 2, title: 'Order Details', description: 'Enter information' },
        { number: 3, title: 'Review', description: 'Confirm order' }
      ]

  return (
    <div className="view-container create-order-container">
      {/* Enhanced Header with Progress */}
      <div className="create-order-header">
        <div className="header-top">
          <div className="header-content">
            <div className="header-icon-wrapper">
              {step === 1 ? (
                <Plus size={22} />
              ) : orderType === 'Repairs' ? (
                <Wrench size={22} />
              ) : (
                <Package size={22} />
              )}
            </div>
            <div className="header-text">
              <h1>
                {step === 1 && 'Create New Order'}
                {step === 2 && orderType === 'Repairs' && 'Customer & Device Details'}
                {step === 2 && orderType === 'Tarpaulin' && 'Customer Information'}
                {step === 2 && orderType === 'Sublimation' && 'Customer Information'}
                {step === 2 && orderType !== 'Repairs' && orderType !== 'Tarpaulin' && orderType !== 'Sublimation' && `${orderType} - Order Details`}
                {step === 3 && orderType === 'Repairs' && 'Problem Checklist'}
                {step === 3 && orderType === 'Tarpaulin' && 'Tarpaulin Order Details'}
                {step === 3 && orderType === 'Sublimation' && 'Assign Graphic Artist'}
                {step === 3 && orderType !== 'Repairs' && orderType !== 'Tarpaulin' && orderType !== 'Sublimation' && 'Review Order'}
                {step === 4 && orderType === 'Tarpaulin' && 'Review & Payment'}
                {step === 4 && orderType === 'Sublimation' && 'Add Products'}
                {step === 5 && orderType === 'Sublimation' && 'Review & Payment'}
              </h1>
              <p>
                {step === 1 && 'Select the product category that best fits your project needs'}
                {step === 2 && orderType === 'Repairs' && 'Enter customer information and device details'}
                {step === 2 && orderType === 'Tarpaulin' && 'Enter customer contact information'}
                {step === 2 && orderType === 'Sublimation' && 'Enter customer contact information'}
                {step === 2 && orderType !== 'Repairs' && orderType !== 'Tarpaulin' && orderType !== 'Sublimation' && `Provide the necessary information for your ${orderType.toLowerCase()} order`}
                {step === 3 && orderType === 'Repairs' && 'Check all issues reported by the customer'}
                {step === 3 && orderType === 'Tarpaulin' && 'Review order details and assigned graphic artist'}
                {step === 3 && orderType === 'Sublimation' && 'Assign a graphic artist to handle this order'}
                {step === 3 && orderType !== 'Repairs' && orderType !== 'Tarpaulin' && orderType !== 'Sublimation' && 'Double-check all details before submitting your order'}
                {step === 4 && orderType === 'Tarpaulin' && 'Review order summary and process payment'}
                {step === 4 && orderType === 'Sublimation' && 'Add products with different types and sizes'}
                {step === 5 && orderType === 'Sublimation' && 'Review order summary and process payment'}
              </p>
            </div>
          </div>
          <div className="header-actions">
            {step > 1 && (
              <button className="back-btn" onClick={handleBack}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back
              </button>
            )}
            {step === 2 && orderType === 'Repairs' && (
              <button className="btn-next" onClick={handleNextStep}>
                Next: Problem Checklist →
              </button>
            )}
            {step === 2 && orderType === 'Tarpaulin' && (
              <button className="btn-next" onClick={handleNextStep}>
                Next: Order Details →
              </button>
            )}
            {step === 2 && orderType === 'Sublimation' && (
              <button className="btn-next" onClick={handleNextStep}>
                Next: Order Details →
              </button>
            )}
            {step === 3 && orderType === 'Tarpaulin' && (
              <button className="btn-next" onClick={handleNextStep}>
                Next: Payment →
              </button>
            )}
            {step === 3 && orderType === 'Sublimation' && (
              <button className="btn-next" onClick={handleNextStep}>
                Next: Add Products →
              </button>
            )}
            {step === 3 && orderType === 'Repairs' && (
              <button className="btn-submit" onClick={handleSubmitOrder}>
                <CheckCircle size={18} />
                Process Repair Order
              </button>
            )}
            {step === 4 && orderType === 'Tarpaulin' && (
              <button className="btn-submit" onClick={handleSubmitOrder}>
                <CheckCircle size={18} />
                Process Tarpaulin Order
              </button>
            )}
            {step === 4 && orderType === 'Sublimation' && (
              <button className="btn-next" onClick={handleNextStep}>
                Next: Payment →
              </button>
            )}
            {step === 5 && orderType === 'Sublimation' && (
              <button className="btn-submit" onClick={handleSubmitOrder}>
                <CheckCircle size={18} />
                Process Sublimation Order
              </button>
            )}
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="progress-stepper">
          {steps.map((s, index) => (
            <div key={s.number} className="stepper-item-wrapper">
              <div className={`stepper-item ${step >= s.number ? 'active' : ''} ${step > s.number ? 'completed' : ''}`}>
                <div className="stepper-circle">
                  {step > s.number ? (
                    <CheckCircle size={18} />
                  ) : (
                    <span>{s.number}</span>
                  )}
                </div>
                <div className="stepper-text">
                  <div className="stepper-title">{s.title}</div>
                  <div className="stepper-description">{s.description}</div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`stepper-line ${step > s.number ? 'completed' : ''}`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content with Sidebar Layout */}
      <div className={`create-order-layout ${step > 1 ? 'with-sidebar' : ''}`}>
        <div className="main-order-content">
      {/* Step Content */}
      {step === 1 && (
        <div className="order-type-selection-enhanced">
          <div className="order-type-grid-enhanced">
            <div className="order-type-card-enhanced" onClick={() => handleTypeSelect('Tarpaulin')}>
              <div className="card-header-enhanced">
                <div className="card-badge-enhanced popular">Popular</div>
                <div className="card-header-main">
                  <div className="order-type-icon-enhanced">
                    <Package size={24} />
                  </div>
                  <h3>Tarpaulin</h3>
                </div>
              </div>
              <div className="card-body-enhanced">
                <p className="card-description">Banners, posters, and outdoor signage for events and advertising</p>
                <div className="card-features">
                  <div className="feature-item">
                    <CheckCircle size={14} />
                    <span>Weather-resistant materials</span>
                  </div>
                  <div className="feature-item">
                    <CheckCircle size={14} />
                    <span>Custom sizes available</span>
                  </div>
                </div>
              </div>
              <div className="card-footer-enhanced">
                <span className="card-action-text">Select Tarpaulin</span>
                <div className="card-arrow-enhanced">→</div>
              </div>
            </div>

            <div className="order-type-card-enhanced" onClick={() => handleTypeSelect('Sublimation')}>
              <div className="card-header-enhanced">
                <div className="card-badge-enhanced premium">Premium</div>
                <div className="card-header-main">
                  <div className="order-type-icon-enhanced">
                    <Palette size={24} />
                  </div>
                  <h3>Sublimation</h3>
                </div>
              </div>
              <div className="card-body-enhanced">
                <p className="card-description">Custom prints on shirts, phone cases, mugs, and various products</p>
                <div className="card-features">
                  <div className="feature-item">
                    <CheckCircle size={14} />
                    <span>Vibrant, long-lasting prints</span>
                  </div>
                  <div className="feature-item">
                    <CheckCircle size={14} />
                    <span>Multiple product options</span>
                  </div>
                </div>
              </div>
              <div className="card-footer-enhanced">
                <span className="card-action-text">Select Sublimation</span>
                <div className="card-arrow-enhanced">→</div>
              </div>
            </div>

            <div className="order-type-card-enhanced" onClick={() => handleTypeSelect('Mugs')}>
              <div className="card-header-enhanced">
                <div className="card-header-main">
                  <div className="order-type-icon-enhanced">
                    <Coffee size={24} />
                  </div>
                  <h3>Mugs</h3>
                </div>
              </div>
              <div className="card-body-enhanced">
                <p className="card-description">Personalized mugs with custom designs and text</p>
                <div className="card-features">
                  <div className="feature-item">
                    <CheckCircle size={14} />
                    <span>Dishwasher safe options</span>
                  </div>
                  <div className="feature-item">
                    <CheckCircle size={14} />
                    <span>Multiple size options</span>
                  </div>
                </div>
              </div>
              <div className="card-footer-enhanced">
                <span className="card-action-text">Select Mugs</span>
                <div className="card-arrow-enhanced">→</div>
              </div>
            </div>

            <div className="order-type-card-enhanced" onClick={() => handleTypeSelect('Stickers')}>
              <div className="card-header-enhanced">
                <div className="card-header-main">
                  <div className="order-type-icon-enhanced">
                    <Sticker size={24} />
                  </div>
                  <h3>Stickers</h3>
                </div>
              </div>
              <div className="card-body-enhanced">
                <p className="card-description">Custom stickers in various sizes, shapes, and finishes</p>
                <div className="card-features">
                  <div className="feature-item">
                    <CheckCircle size={14} />
                    <span>Vinyl and paper options</span>
                  </div>
                  <div className="feature-item">
                    <CheckCircle size={14} />
                    <span>Waterproof available</span>
                  </div>
                </div>
              </div>
              <div className="card-footer-enhanced">
                <span className="card-action-text">Select Stickers</span>
                <div className="card-arrow-enhanced">→</div>
              </div>
            </div>

            <div className="order-type-card-enhanced" onClick={() => handleTypeSelect('Document Print')}>
              <div className="card-header-enhanced">
                <div className="card-header-main">
                  <div className="order-type-icon-enhanced">
                    <FileText size={24} />
                  </div>
                  <h3>Document Print</h3>
                </div>
              </div>
              <div className="card-body-enhanced">
                <p className="card-description">Professional document printing services for business and personal use</p>
                <div className="card-features">
                  <div className="feature-item">
                    <CheckCircle size={14} />
                    <span>High-quality paper options</span>
                  </div>
                  <div className="feature-item">
                    <CheckCircle size={14} />
                    <span>Binding services available</span>
                  </div>
                </div>
              </div>
              <div className="card-footer-enhanced">
                <span className="card-action-text">Select Document Print</span>
                <div className="card-arrow-enhanced">→</div>
              </div>
            </div>

            <div className="order-type-card-enhanced" onClick={() => handleTypeSelect('Photo Print')}>
              <div className="card-header-enhanced">
                <div className="card-header-main">
                  <div className="order-type-icon-enhanced">
                    <Image size={24} />
                  </div>
                  <h3>Photo Print</h3>
                </div>
              </div>
              <div className="card-body-enhanced">
                <p className="card-description">High-quality photo printing in any size with professional finishing</p>
                <div className="card-features">
                  <div className="feature-item">
                    <CheckCircle size={14} />
                    <span>Premium photo paper</span>
                  </div>
                  <div className="feature-item">
                    <CheckCircle size={14} />
                    <span>Multiple size formats</span>
                  </div>
                </div>
              </div>
              <div className="card-footer-enhanced">
                <span className="card-action-text">Select Photo Print</span>
                <div className="card-arrow-enhanced">→</div>
              </div>
            </div>

            <div className="order-type-card-enhanced" onClick={() => handleTypeSelect('Embroidery')}>
              <div className="card-header-enhanced">
                <div className="card-header-main">
                  <div className="order-type-icon-enhanced">
                    <Scissors size={24} />
                  </div>
                  <h3>Embroidery</h3>
                </div>
              </div>
              <div className="card-body-enhanced">
                <p className="card-description">Custom embroidery on clothing, fabrics, and accessories</p>
                <div className="card-features">
                  <div className="feature-item">
                    <CheckCircle size={14} />
                    <span>Professional thread quality</span>
                  </div>
                  <div className="feature-item">
                    <CheckCircle size={14} />
                    <span>Custom logo designs</span>
                  </div>
                </div>
              </div>
              <div className="card-footer-enhanced">
                <span className="card-action-text">Select Embroidery</span>
                <div className="card-arrow-enhanced">→</div>
              </div>
            </div>

            <div className="order-type-card-enhanced" onClick={() => handleTypeSelect('Repairs')}>
              <div className="card-header-enhanced">
                <div className="card-header-main">
                  <div className="order-type-icon-enhanced">
                    <Wrench size={24} />
                  </div>
                  <h3>Repairs</h3>
                </div>
              </div>
              <div className="card-body-enhanced">
                <p className="card-description">Equipment and device repair services with warranty</p>
                <div className="card-features">
                  <div className="feature-item">
                    <CheckCircle size={14} />
                    <span>Expert technicians</span>
                  </div>
                  <div className="feature-item">
                    <CheckCircle size={14} />
                    <span>Warranty on repairs</span>
                  </div>
                </div>
              </div>
              <div className="card-footer-enhanced">
                <span className="card-action-text">Select Repairs</span>
                <div className="card-arrow-enhanced">→</div>
              </div>
            </div>

            <div className="order-type-card-enhanced" onClick={() => handleTypeSelect('Software Installation')}>
              <div className="card-header-enhanced">
                <div className="card-header-main">
                  <div className="order-type-icon-enhanced">
                    <Monitor size={24} />
                  </div>
                  <h3>Software Installation</h3>
                </div>
              </div>
              <div className="card-body-enhanced">
                <p className="card-description">Professional software setup, installation, and configuration</p>
                <div className="card-features">
                  <div className="feature-item">
                    <CheckCircle size={14} />
                    <span>Licensed software only</span>
                  </div>
                  <div className="feature-item">
                    <CheckCircle size={14} />
                    <span>System optimization</span>
                  </div>
                </div>
              </div>
              <div className="card-footer-enhanced">
                <span className="card-action-text">Select Software Installation</span>
                <div className="card-arrow-enhanced">→</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && orderType === 'Repairs' && (
        <div className="order-form-step">
          <div className="repair-form">
            <div className="form-section">
              <h3 className="form-section-title">Customer Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Customer Name *</label>
                  <input
                    type="text"
                    placeholder="Enter customer name"
                    value={repairData.customerName}
                    onChange={(e) => handleRepairInputChange('customerName', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Contact Number *</label>
                  <input
                    type="tel"
                    placeholder="Enter contact number"
                    value={repairData.contactNumber}
                    onChange={(e) => handleRepairInputChange('contactNumber', e.target.value)}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="Enter email address (optional)"
                    value={repairData.email}
                    onChange={(e) => handleRepairInputChange('email', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">Device Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Device Type *</label>
                  <select
                    value={repairData.deviceType}
                    onChange={(e) => handleRepairInputChange('deviceType', e.target.value)}
                  >
                    <option value="">Select device type</option>
                    <option value="Laptop">Laptop</option>
                    <option value="PC">PC (Desktop)</option>
                    <option value="Printer">Printer</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Brand</label>
                  <input
                    type="text"
                    placeholder="e.g., HP, Dell, Canon"
                    value={repairData.deviceBrand}
                    onChange={(e) => handleRepairInputChange('deviceBrand', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Model</label>
                  <input
                    type="text"
                    placeholder="Device model"
                    value={repairData.deviceModel}
                    onChange={(e) => handleRepairInputChange('deviceModel', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Assign Tech *</label>
                  <select
                    value={repairData.techAssigned}
                    onChange={(e) => handleRepairInputChange('techAssigned', e.target.value)}
                  >
                    <option value="">Select technician</option>
                    <option value="Tech 1">Tech 1</option>
                    <option value="Tech 2">Tech 2</option>
                    <option value="Tech 3">Tech 3</option>
                  </select>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {step === 2 && orderType === 'Tarpaulin' && (
        <div className="order-form-step-tarpaulin">
          <div className="tarpaulin-form-compact">
            {/* Customer Search Section */}
            <div className="form-section-compact customer-search-section">
              <div className="section-header-compact">
                <div className="section-icon-compact">
                  <Search size={18} />
                </div>
                <h3>Find Existing Customer</h3>
              </div>
              <div className="customer-search-wrapper">
                <div className="customer-search-input-wrapper">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search by name, phone, or email..."
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value)
                      setShowCustomerDropdown(true)
                      if (e.target.value) {
                        handleCustomerSearch(e.target.value)
                      } else {
                        setCustomers([])
                      }
                    }}
                    onFocus={() => {
                      if (customerSearch) {
                        setShowCustomerDropdown(true)
                      }
                    }}
                  />
                  {customerSearch && (
                    <button
                      type="button"
                      className="clear-search-btn"
                      onClick={() => {
                        setCustomerSearch('')
                        setCustomers([])
                        setShowCustomerDropdown(false)
                        setSelectedCustomer(null)
                        setIsNewCustomer(true)
                        setCustomerOrders([])
                      }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                {showCustomerDropdown && customers.length > 0 && (
                  <div className="customer-dropdown">
                    {customers.map((customer) => (
                      <div
                        key={customer.id}
                        className="customer-dropdown-item"
                        onClick={() => handleCustomerSelect(customer)}
                      >
                        <div className="customer-item-main">
                          <div className="customer-item-name">{customer.name}</div>
                          <div className="customer-item-details">
                            {customer.contactNumber && <span>{customer.contactNumber}</span>}
                            {customer.email && <span>{customer.email}</span>}
                          </div>
                        </div>
                        <div className="customer-item-stats">
                          <div className="customer-stat">
                            <span className="stat-label">Orders:</span>
                            <span className="stat-value">{customer.totalOrders || 0}</span>
                          </div>
                          <div className="customer-stat">
                            <span className="stat-label">Balance:</span>
                            <span className="stat-value">₱{parseFloat(customer.totalBalance || 0).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Customer Information Section */}
            <div className="form-section-compact">
              <div className="section-header-compact">
                <div className="section-icon-compact">
                  <User size={18} />
                </div>
                <h3>{isNewCustomer ? 'New Customer Information' : 'Customer Information'}</h3>
              </div>
              <div className="form-grid-compact">
                <div className="form-field-compact">
                  <label>Customer Name *</label>
                  <div className="field-input-wrapper">
                    <User size={16} className="field-icon" />
                    <input
                      type="text"
                      placeholder="Enter customer name"
                      value={tarpaulinData.customerName}
                      onChange={(e) => handleTarpaulinInputChange('customerName', e.target.value)}
                      disabled={!isNewCustomer}
                    />
                  </div>
                </div>
                
                <div className="form-field-compact">
                  <label>Contact Number *</label>
                  <div className="field-input-wrapper">
                    <Phone size={16} className="field-icon" />
                    <input
                      type="tel"
                      placeholder="Enter contact number"
                      value={tarpaulinData.contactNumber}
                      onChange={(e) => handleTarpaulinInputChange('contactNumber', e.target.value)}
                      disabled={!isNewCustomer}
                    />
                  </div>
                </div>
                
                <div className="form-field-compact">
                  <label>Email Address</label>
                  <div className="field-input-wrapper">
                    <Mail size={16} className="field-icon" />
                    <input
                      type="email"
                      placeholder="Enter email (optional)"
                      value={tarpaulinData.email}
                      onChange={(e) => handleTarpaulinInputChange('email', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="form-field-compact">
                  <label>Business Name</label>
                  <div className="field-input-wrapper">
                    <Building2 size={16} className="field-icon" />
                    <input
                      type="text"
                      placeholder="Enter business name (optional)"
                      value={tarpaulinData.businessName}
                      onChange={(e) => handleTarpaulinInputChange('businessName', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Event & Preferences Section */}
            <div className="form-section-compact event-preferences-section">
              <div className="section-header-compact">
                <div className="section-icon-compact">
                  <Calendar size={18} />
                </div>
                <h3>Event & Preferences</h3>
              </div>
              <div className="form-grid-compact">
                <div className="form-field-compact">
                  <label>Event Type</label>
                  <div className="field-input-wrapper">
                    <PartyPopper size={16} className="field-icon" />
                    <input
                      type="text"
                      placeholder="e.g., Birthday, Wedding"
                      value={tarpaulinData.eventType}
                      onChange={(e) => handleTarpaulinInputChange('eventType', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="form-field-compact">
                  <label>Event Date</label>
                  <div className="field-input-wrapper">
                    <CalendarCheck size={16} className="field-icon" />
                    <input
                      type="text"
                      placeholder="Select date"
                      value={tarpaulinData.eventDate ? new Date(tarpaulinData.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                      onFocus={(e) => {
                        e.target.blur();
                        e.target.type = 'date';
                        setTimeout(() => e.target.showPicker?.(), 0);
                      }}
                      onChange={(e) => {
                        handleTarpaulinInputChange('eventDate', e.target.value);
                        e.target.type = 'text';
                      }}
                      onBlur={(e) => {
                        if (!tarpaulinData.eventDate) {
                          e.target.type = 'text';
                        }
                      }}
                    />
                  </div>
                </div>
                
                <div className="form-field-compact">
                  <label>Preferred Pickup Date</label>
                  <div className="field-input-wrapper">
                    <Truck size={16} className="field-icon" />
                    <input
                      type="text"
                      placeholder="Select date"
                      value={tarpaulinData.preferredDeliveryDate ? new Date(tarpaulinData.preferredDeliveryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                      onFocus={(e) => {
                        e.target.blur();
                        e.target.type = 'date';
                        e.target.min = new Date().toISOString().split('T')[0];
                        setTimeout(() => e.target.showPicker?.(), 0);
                      }}
                      onChange={(e) => {
                        handleTarpaulinInputChange('preferredDeliveryDate', e.target.value);
                        e.target.type = 'text';
                      }}
                      onBlur={(e) => {
                        if (!tarpaulinData.preferredDeliveryDate) {
                          e.target.type = 'text';
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Rush Order Toggle */}
                <div className="form-field-compact rush-order-field">
                  <label>Rush Order</label>
                  <div className="rush-order-toggle-wrapper">
                    <div className="rush-order-toggle-content">
                      <div className="rush-order-toggle-icon">
                        <Clock size={16} />
                      </div>
                      <div className="rush-order-toggle-info">
                        <div className="rush-order-toggle-title">Priority Processing</div>
                        <div className="rush-order-toggle-description">Urgent order handling</div>
                      </div>
                    </div>
                    <label className="rush-order-toggle-switch">
                      <input
                        type="checkbox"
                        checked={tarpaulinData.rushOrder}
                        onChange={(e) => handleTarpaulinInputChange('rushOrder', e.target.checked)}
                      />
                      <span className="rush-order-toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && orderType === 'Sublimation' && (
        <div className="order-form-step-tarpaulin">
          <div className="tarpaulin-form-compact">
            {/* Customer Search Section */}
            <div className="form-section-compact customer-search-section">
              <div className="section-header-compact">
                <div className="section-icon-compact">
                  <Search size={18} />
                </div>
                <h3>Find Existing Customer</h3>
              </div>
              <div className="customer-search-wrapper">
                <div className="customer-search-input-wrapper">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search by name, phone, or email..."
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value)
                      setShowCustomerDropdown(true)
                      if (e.target.value) {
                        handleCustomerSearch(e.target.value)
                      } else {
                        setCustomers([])
                      }
                    }}
                    onFocus={() => {
                      if (customerSearch) {
                        setShowCustomerDropdown(true)
                      }
                    }}
                  />
                  {customerSearch && (
                    <button
                      type="button"
                      className="clear-search-btn"
                      onClick={() => {
                        setCustomerSearch('')
                        setCustomers([])
                        setShowCustomerDropdown(false)
                        setSelectedCustomer(null)
                        setIsNewCustomer(true)
                        setCustomerOrders([])
                      }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                {showCustomerDropdown && customers.length > 0 && (
                  <div className="customer-dropdown">
                    {customers.map((customer) => (
                      <div
                        key={customer.id}
                        className="customer-dropdown-item"
                        onClick={() => handleCustomerSelect(customer)}
                      >
                        <div className="customer-item-main">
                          <div className="customer-item-name">{customer.name}</div>
                          <div className="customer-item-details">
                            {customer.contactNumber && <span>{customer.contactNumber}</span>}
                            {customer.email && <span>{customer.email}</span>}
                          </div>
                        </div>
                        <div className="customer-item-stats">
                          <div className="customer-stat">
                            <span className="stat-label">Orders:</span>
                            <span className="stat-value">{customer.totalOrders || 0}</span>
                          </div>
                          <div className="customer-stat">
                            <span className="stat-label">Balance:</span>
                            <span className="stat-value">₱{parseFloat(customer.totalBalance || 0).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Customer Information Section */}
            <div className="form-section-compact">
              <div className="section-header-compact">
                <div className="section-icon-compact">
                  <User size={18} />
                </div>
                <h3>{isNewCustomer ? 'New Customer Information' : 'Customer Information'}</h3>
              </div>
              <div className="form-grid-compact">
                <div className="form-field-compact">
                  <label>Customer Name *</label>
                  <div className="field-input-wrapper">
                    <User size={16} className="field-icon" />
                    <input
                      type="text"
                      placeholder="Enter customer name"
                      value={sublimationData.customerName}
                      onChange={(e) => handleSublimationInputChange('customerName', e.target.value)}
                      disabled={!isNewCustomer}
                    />
                  </div>
                </div>
                
                <div className="form-field-compact">
                  <label>Contact Number *</label>
                  <div className="field-input-wrapper">
                    <Phone size={16} className="field-icon" />
                    <input
                      type="tel"
                      placeholder="Enter contact number"
                      value={sublimationData.contactNumber}
                      onChange={(e) => handleSublimationInputChange('contactNumber', e.target.value)}
                      disabled={!isNewCustomer}
                    />
                  </div>
                </div>
                
                <div className="form-field-compact">
                  <label>Email Address</label>
                  <div className="field-input-wrapper">
                    <Mail size={16} className="field-icon" />
                    <input
                      type="email"
                      placeholder="Enter email (optional)"
                      value={sublimationData.email}
                      onChange={(e) => handleSublimationInputChange('email', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="form-field-compact">
                  <label>Business Name</label>
                  <div className="field-input-wrapper">
                    <Building2 size={16} className="field-icon" />
                    <input
                      type="text"
                      placeholder="Enter business name (optional)"
                      value={sublimationData.businessName}
                      onChange={(e) => handleSublimationInputChange('businessName', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Event & Preferences Section */}
            <div className="form-section-compact event-preferences-section">
              <div className="section-header-compact">
                <div className="section-icon-compact">
                  <Calendar size={18} />
                </div>
                <h3>Order & Preferences</h3>
              </div>
              <div className="form-grid-compact">
                <div className="form-field-compact">
                  <label>Pickup Date</label>
                  <div className="field-input-wrapper">
                    <Truck size={16} className="field-icon" />
                    <input
                      type="text"
                      placeholder="Select date"
                      value={sublimationData.pickupDate ? new Date(sublimationData.pickupDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                      onFocus={(e) => {
                        e.target.blur();
                        e.target.type = 'date';
                        e.target.min = new Date().toISOString().split('T')[0];
                        setTimeout(() => e.target.showPicker?.(), 0);
                      }}
                      onChange={(e) => {
                        handleSublimationInputChange('pickupDate', e.target.value);
                        e.target.type = 'text';
                      }}
                      onBlur={(e) => {
                        if (!sublimationData.pickupDate) {
                          e.target.type = 'text';
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Rush Order Toggle */}
                <div className="form-field-compact rush-order-field">
                  <label>Rush Order</label>
                  <div className="rush-order-toggle-wrapper">
                    <div className="rush-order-toggle-content">
                      <div className="rush-order-toggle-icon">
                        <Clock size={16} />
                      </div>
                      <div className="rush-order-toggle-info">
                        <div className="rush-order-toggle-title">Priority Processing</div>
                        <div className="rush-order-toggle-description">Urgent order handling</div>
                      </div>
                    </div>
                    <label className="rush-order-toggle-switch">
                      <input
                        type="checkbox"
                        checked={sublimationData.rushOrder}
                        onChange={(e) => handleSublimationInputChange('rushOrder', e.target.checked)}
                      />
                      <span className="rush-order-toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && orderType !== 'Repairs' && orderType !== 'Tarpaulin' && orderType !== 'Sublimation' && (
        <div className="order-form-step">
          <div className="content-placeholder">
            <Plus size={48} />
            <p>Order details form coming soon</p>
          </div>
        </div>
      )}

      {step === 3 && orderType === 'Repairs' && (
        <div className="order-form-step">
          <div className="repair-form">
            <div className="form-section">
              <h3 className="form-section-title">Common Issues - {repairData.deviceType || 'Select Device Type'}</h3>
              <div className="checklist-grid">
                {(() => {
                  let problemsList = [];
                  
                  if (repairData.deviceType === 'Laptop') {
                    problemsList = [
                      'Won\'t turn on',
                      'Slow performance',
                      'Overheating',
                      'Blue screen error',
                      'No display',
                      'Battery issues',
                      'Keyboard not working',
                      'Touchpad issues',
                      'No sound',
                      'WiFi not working',
                      'Charging problems',
                      'Software issues',
                      'Virus/Malware',
                      'Hard drive failure',
                      'RAM issues',
                      'Screen damage',
                      'Hinge broken',
                      'Water damage',
                      'USB ports not working',
                      'Webcam issues',
                      'Fan noise',
                      'Missing keys'
                    ];
                  } else if (repairData.deviceType === 'PC') {
                    problemsList = [
                      'Won\'t turn on',
                      'Slow performance',
                      'Overheating',
                      'Blue screen error',
                      'No display',
                      'No sound',
                      'WiFi not working',
                      'Software issues',
                      'Virus/Malware',
                      'Hard drive failure',
                      'RAM issues',
                      'Graphics card issues',
                      'Power supply failure',
                      'Motherboard issues',
                      'CPU overheating',
                      'USB ports not working',
                      'DVD/CD drive issues',
                      'Network card issues',
                      'BIOS issues',
                      'Water damage',
                      'Fan noise',
                      'Case damage'
                    ];
                  } else if (repairData.deviceType === 'Printer') {
                    problemsList = [
                      'Printer not printing',
                      'Paper jam',
                      'Print quality issues',
                      'Scanner not working',
                      'Won\'t turn on',
                      'Slow printing',
                      'WiFi connection issues',
                      'USB not recognized',
                      'Ink cartridge error',
                      'Toner issues',
                      'Paper feed problems',
                      'Streaks on prints',
                      'Faded prints',
                      'Blank pages',
                      'Error messages',
                      'Driver issues',
                      'Printing wrong colors',
                      'Double feed',
                      'Noisy operation',
                      'Offline status',
                      'Spooler errors',
                      'Network printing issues'
                    ];
                  } else {
                    problemsList = ['Please select a device type in Step 2'];
                  }
                  
                  return problemsList.map((problem) => (
                    <label key={problem} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={repairData.problems.includes(problem)}
                        onChange={() => handleProblemToggle(problem)}
                        disabled={!repairData.deviceType}
                      />
                      <span>{problem}</span>
                    </label>
                  ));
                })()}
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">Additional Notes</h3>
              <div className="form-group full-width">
                <textarea
                  placeholder="Describe any additional issues or customer requests..."
                  rows="4"
                  value={repairData.additionalNotes}
                  onChange={(e) => handleRepairInputChange('additionalNotes', e.target.value)}
                />
              </div>
            </div>

            <div className="form-section summary-section">
              <h3 className="form-section-title">Order Summary</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">Customer:</span>
                  <span className="summary-value">{repairData.customerName || '-'}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Contact:</span>
                  <span className="summary-value">{repairData.contactNumber || '-'}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Device:</span>
                  <span className="summary-value">{repairData.deviceType || '-'}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Tech Assigned:</span>
                  <span className="summary-value">{repairData.techAssigned || '-'}</span>
                </div>
                <div className="summary-item full-width">
                  <span className="summary-label">Problems:</span>
                  <span className="summary-value">{repairData.problems.length} issue(s) selected</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {step === 3 && orderType === 'Tarpaulin' && (
        <div className="order-form-step-tarpaulin">
          <div className="tarpaulin-form-compact">
            {/* Row Container for Order Dimensions and Assigned Graphic Artist */}
            <div className="step3-sections-row">
              {/* Order Dimensions Section */}
              <div className="form-section-compact">
                <div className="section-header-compact">
                  <div className="section-icon-compact">
                    <Maximize2 size={18} />
                  </div>
                  <h3>Order Dimensions</h3>
                </div>
                <div className="form-grid-compact">
                  <div className="form-field-compact">
                    <label>Width (ft) *</label>
                    <div className="field-input-wrapper">
                      <Maximize2 size={16} className="field-icon" />
                      <input
                        type="number"
                        placeholder="0.0"
                        value={tarpaulinData.width}
                        onChange={(e) => handleTarpaulinInputChange('width', e.target.value)}
                        min="1"
                        step="0.5"
                      />
                      <span className="field-unit">ft</span>
                    </div>
                  </div>
                  
                  <div className="form-field-compact">
                    <label>Height (ft) *</label>
                    <div className="field-input-wrapper">
                      <Maximize2 size={16} className="field-icon" />
                      <input
                        type="number"
                        placeholder="0.0"
                        value={tarpaulinData.height}
                        onChange={(e) => handleTarpaulinInputChange('height', e.target.value)}
                        min="1"
                        step="0.5"
                      />
                      <span className="field-unit">ft</span>
                    </div>
                  </div>
                  
                  <div className="form-field-compact">
                    <label>Orientation *</label>
                    <div className="field-input-wrapper">
                      <RotateCw size={16} className="field-icon" />
                      <select
                        value={tarpaulinData.orientation}
                        onChange={(e) => handleTarpaulinInputChange('orientation', e.target.value)}
                      >
                        <option value="Landscape">Landscape</option>
                        <option value="Portrait">Portrait</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-field-compact">
                    <label>Quantity *</label>
                    <div className="field-input-wrapper">
                      <Hash size={16} className="field-icon" />
                      <input
                        type="number"
                        placeholder="1"
                        value={tarpaulinData.quantity}
                        onChange={(e) => handleTarpaulinInputChange('quantity', e.target.value)}
                        min="1"
                      />
                      <span className="field-unit">pc(s)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Graphic Artist Selection Section */}
              <div className="form-section-compact artist-section-compact">
                <div className="section-header-compact">
                  <div className="section-icon-compact">
                    <User size={18} />
                  </div>
                  <h3>Assigned Graphic Artist</h3>
                </div>
                <div className="form-grid-compact">
                  <div className="form-field-compact full-width">
                    <label>Select Artist/Employee *</label>
                    <div className="field-input-wrapper" style={{ position: 'relative' }}>
                      <User size={16} className="field-icon" />
                      <input
                        type="text"
                        placeholder="Type to search employee..."
                        value={tarpaulinArtistSearch}
                        onChange={(e) => {
                          setTarpaulinArtistSearch(e.target.value)
                          setShowTarpaulinArtistDropdown(true)
                        }}
                        onFocus={() => setShowTarpaulinArtistDropdown(true)}
                        style={{ paddingRight: '40px' }}
                      />
                      
                      {/* Custom Dropdown */}
                      {showTarpaulinArtistDropdown && (
                        <>
                          <div 
                            className="artist-dropdown-backdrop" 
                            onClick={() => setShowTarpaulinArtistDropdown(false)}
                          />
                          <div className="artist-dropdown">
                            {employees.length === 0 ? (
                              <div className="artist-dropdown-item" style={{ padding: '12px', textAlign: 'center', color: '#999999' }}>
                                Loading employees...
                              </div>
                            ) : filteredTarpaulinArtists.length > 0 ? (
                              filteredTarpaulinArtists.map((employee) => (
                                <div
                                  key={employee.id}
                                  className="artist-dropdown-item"
                                  onClick={() => handleTarpaulinArtistSelect(employee.name)}
                                >
                                  <div className="artist-dropdown-info">
                                    <span className="artist-dropdown-name">{employee.name}</span>
                                    <span className="artist-dropdown-workload">Employee ID: {employee.id}</span>
                                  </div>
                                  <span className="artist-dropdown-status available">
                                    Available
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="artist-dropdown-item" style={{ padding: '12px', textAlign: 'center', color: '#999999' }}>
                                No employees found
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    {tarpaulinData.assignedArtist && (
                      <div style={{ marginTop: '6px', padding: '6px', background: '#1a1a1a', borderRadius: '4px', fontSize: '11px' }}>
                        <strong>Selected:</strong> {tarpaulinData.assignedArtist}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Graphic Artist Profile Section */}
            {tarpaulinData.assignedArtist && getSelectedTarpaulinEmployee() && (
              <div className="form-section-compact artist-profile-section-compact">
                <div className="section-header-compact">
                  <div className="section-icon-compact">
                    <User size={18} />
                  </div>
                  <h3>Artist Profile</h3>
                </div>
                <div className="artist-header-compact">
                  <div className="artist-avatar-compact">
                    <User size={32} />
                  </div>
                  <div className="artist-main-info-compact">
                    <h3 className="artist-name-compact">{getSelectedTarpaulinEmployee()?.name}</h3>
                    <p className="artist-role-compact">Graphic Artist</p>
                  </div>
                  <div className="artist-status-compact">
                    <CheckCircle size={14} />
                    <span>Available</span>
                  </div>
                </div>
                
                <div className="artist-details-compact">
                  <div className="artist-detail-item-compact">
                    <div className="artist-detail-icon-compact">
                      <Hash size={14} />
                    </div>
                    <div className="artist-detail-content-compact">
                      <div className="artist-detail-label-compact">Employee ID</div>
                      <div className="artist-detail-value-compact">#{getSelectedTarpaulinEmployee()?.id}</div>
                    </div>
                  </div>
                  
                  <div className="artist-detail-item-compact">
                    <div className="artist-detail-icon-compact">
                      <Package size={14} />
                    </div>
                    <div className="artist-detail-content-compact">
                      <div className="artist-detail-label-compact">Current Workload</div>
                      <div className="artist-detail-value-compact">
                        {selectedEmployeeOrderCount} Active Order{selectedEmployeeOrderCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  
                  <div className="artist-detail-item-compact">
                    <div className="artist-detail-icon-compact">
                      <CheckCircle size={14} />
                    </div>
                    <div className="artist-detail-content-compact">
                      <div className="artist-detail-label-compact">Status</div>
                      <div className="artist-detail-value-compact">Available</div>
                    </div>
                  </div>
                  
                  <div className="artist-detail-item-compact">
                    <div className="artist-detail-icon-compact">
                      <Paintbrush size={14} />
                    </div>
                    <div className="artist-detail-content-compact">
                      <div className="artist-detail-label-compact">Specialization</div>
                      <div className="artist-detail-value-compact">Graphic Design</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {step === 3 && orderType === 'Sublimation' && (
        <div className="order-form-step-tarpaulin">
          <div className="tarpaulin-form-compact">
            {/* Assigned Graphic Artist Section - Full Width */}
            <div className="form-section-compact artist-section-compact" style={{ width: '100%' }}>
              <div className="section-header-compact">
                <div className="section-icon-compact">
                  <User size={18} />
                </div>
                <h3>Assigned Graphic Artist</h3>
              </div>
                  <div className="form-grid-compact">
                <div className="form-field-compact full-width">
                  <label>Select Artist/Employee *</label>
                  <div className="field-input-wrapper" style={{ position: 'relative' }}>
                    <User size={16} className="field-icon" />
                    <input
                      type="text"
                      placeholder="Type to search employee..."
                      value={artistSearch}
                      onChange={(e) => {
                        setArtistSearch(e.target.value)
                        setShowArtistDropdown(true)
                      }}
                      onFocus={() => setShowArtistDropdown(true)}
                      style={{ paddingRight: '40px' }}
                    />
                    
                    {/* Custom Dropdown */}
                    {showArtistDropdown && (
                      <>
                        <div 
                          className="artist-dropdown-backdrop" 
                          onClick={() => setShowArtistDropdown(false)}
                        />
                        <div className="artist-dropdown">
                          {employees.length === 0 ? (
                            <div className="artist-dropdown-item" style={{ padding: '12px', textAlign: 'center', color: '#999999' }}>
                              Loading employees...
                            </div>
                          ) : filteredArtists.length > 0 ? (
                            filteredArtists.map((employee) => (
                              <div
                                key={employee.id}
                                className="artist-dropdown-item"
                                onClick={() => handleArtistSelect(employee.name)}
                              >
                                <div className="artist-dropdown-info">
                                  <span className="artist-dropdown-name">{employee.name}</span>
                                  <span className="artist-dropdown-workload">Employee ID: {employee.id}</span>
                                </div>
                                <span className="artist-dropdown-status available">
                                  Available
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="artist-dropdown-item" style={{ padding: '12px', textAlign: 'center', color: '#999999' }}>
                              No employees found
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  {sublimationData.assignedArtist && (
                    <div style={{ marginTop: '6px', padding: '6px', background: '#1a1a1a', borderRadius: '4px', fontSize: '11px' }}>
                      <strong>Selected:</strong> {sublimationData.assignedArtist}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Graphic Artist Profile Section */}
            {sublimationData.assignedArtist && getSelectedTarpaulinEmployee() && (
              <div className="form-section-compact artist-profile-section-compact">
                <div className="section-header-compact">
                  <div className="section-icon-compact">
                    <User size={18} />
                  </div>
                  <h3>Artist Profile</h3>
                </div>
                <div className="artist-header-compact">
                  <div className="artist-avatar-compact">
                    <User size={32} />
                  </div>
                  <div className="artist-main-info-compact">
                    <h3 className="artist-name-compact">{getSelectedTarpaulinEmployee()?.name}</h3>
                    <p className="artist-role-compact">Graphic Artist</p>
                  </div>
                  <div className="artist-status-compact">
                    <CheckCircle size={14} />
                    <span>Available</span>
                  </div>
                </div>
                
                <div className="artist-details-compact">
                  <div className="artist-detail-item-compact">
                    <div className="artist-detail-icon-compact">
                      <Hash size={14} />
                    </div>
                    <div className="artist-detail-content-compact">
                      <div className="artist-detail-label-compact">Employee ID</div>
                      <div className="artist-detail-value-compact">#{getSelectedTarpaulinEmployee()?.id}</div>
                    </div>
                  </div>
                  
                  <div className="artist-detail-item-compact">
                    <div className="artist-detail-icon-compact">
                      <Package size={14} />
                    </div>
                    <div className="artist-detail-content-compact">
                      <div className="artist-detail-label-compact">Current Workload</div>
                      <div className="artist-detail-value-compact">
                        {selectedEmployeeOrderCount} Active Order{selectedEmployeeOrderCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  
                  <div className="artist-detail-item-compact">
                    <div className="artist-detail-icon-compact">
                      <CheckCircle size={14} />
                    </div>
                    <div className="artist-detail-content-compact">
                      <div className="artist-detail-label-compact">Status</div>
                      <div className="artist-detail-value-compact">Available</div>
                    </div>
                  </div>
                  
                  <div className="artist-detail-item-compact">
                    <div className="artist-detail-icon-compact">
                      <Paintbrush size={14} />
                    </div>
                    <div className="artist-detail-content-compact">
                      <div className="artist-detail-label-compact">Specialization</div>
                      <div className="artist-detail-value-compact">Graphic Design</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {step === 4 && orderType === 'Tarpaulin' && (
        <div className="order-form-step-tarpaulin">
          <div className="tarpaulin-form-compact">
            {/* Payment Method & Details and Order Cart Row */}
            <div className="step4-sections-row">
              {/* Payment Method and Details Section */}
              <div className="form-section-compact payment-method-details-section">
                <div className="section-header-compact">
                  <div className="section-icon-compact">
                    <Wallet size={18} />
                  </div>
                  <h3>Payment Method & Details</h3>
                </div>
                <div className="payment-method-details-content">
                  {/* Payment Method */}
                  <div className="form-field-compact full-width">
                    <label>Payment Method *</label>
                    <div className="payment-methods-compact">
                      <button
                        type="button"
                        className={`payment-method-compact ${tarpaulinData.paymentMethod === 'Cash' ? 'active' : ''}`}
                        onClick={() => handleTarpaulinInputChange('paymentMethod', 'Cash')}
                      >
                        <Wallet size={14} />
                        <span>Cash</span>
                      </button>
                      <button
                        type="button"
                        className={`payment-method-compact ${tarpaulinData.paymentMethod === 'GCash' ? 'active' : ''}`}
                        onClick={() => handleTarpaulinInputChange('paymentMethod', 'GCash')}
                      >
                        <CreditCard size={14} />
                        <span>GCash</span>
                      </button>
                      <button
                        type="button"
                        className={`payment-method-compact ${tarpaulinData.paymentMethod === 'Bank Transfer' ? 'active' : ''}`}
                        onClick={() => handleTarpaulinInputChange('paymentMethod', 'Bank Transfer')}
                      >
                        <CreditCard size={14} />
                        <span>Bank</span>
                      </button>
                      <button
                        type="button"
                        className={`payment-method-compact ${tarpaulinData.paymentMethod === 'Credit Card' ? 'active' : ''}`}
                        onClick={() => handleTarpaulinInputChange('paymentMethod', 'Credit Card')}
                      >
                        <CreditCard size={14} />
                        <span>Card</span>
                      </button>
                    </div>
                  </div>

                  {/* Down Payment */}
                  <div className="form-field-compact full-width">
                    <label>Down Payment</label>
                    <div className="field-input-wrapper">
                      <DollarSign size={16} className="field-icon" />
                      <input
                        type="number"
                        placeholder="0.00"
                        value={tarpaulinData.downPayment}
                        onChange={(e) => handleTarpaulinInputChange('downPayment', e.target.value)}
                        min="0"
                        step="0.01"
                      />
                      <span className="field-unit">₱</span>
                    </div>
                  </div>

                  {/* Payment Breakdown */}
                  <div className="payment-breakdown-detailed">
                    <div className="breakdown-header">
                      <Calculator size={16} />
                      <h4>Payment Breakdown</h4>
                    </div>
                    <div className="breakdown-content">
                      {(() => {
                        const width = parseFloat(tarpaulinData.width) || 0;
                        const height = parseFloat(tarpaulinData.height) || 0;
                        const quantity = parseFloat(tarpaulinData.quantity) || 1;
                        const pricePerSqft = 12;
                        const area = width * height;
                        const subtotal = area * quantity * pricePerSqft;
                        const downPayment = parseFloat(tarpaulinData.downPayment) || 0;
                        const balance = subtotal - downPayment;

                        return (
                          <>
                            <div className="breakdown-row">
                              <span className="breakdown-label">Dimensions:</span>
                              <span className="breakdown-value">
                                {width > 0 && height > 0 
                                  ? `${width} ft × ${height} ft` 
                                  : width > 0 
                                    ? `${width} ft (Width only)`
                                    : height > 0
                                      ? `${height} ft (Height only)`
                                      : 'Not specified'}
                              </span>
                            </div>
                            {width > 0 && height > 0 && (
                              <>
                                <div className="breakdown-row">
                                  <span className="breakdown-label">Area per piece:</span>
                                  <span className="breakdown-value">{area.toFixed(2)} sqft</span>
                                </div>
                                <div className="breakdown-row">
                                  <span className="breakdown-label">Quantity:</span>
                                  <span className="breakdown-value">{quantity} pc(s)</span>
                                </div>
                                <div className="breakdown-row">
                                  <span className="breakdown-label">Total Area:</span>
                                  <span className="breakdown-value">{(area * quantity).toFixed(2)} sqft</span>
                                </div>
                                <div className="breakdown-row">
                                  <span className="breakdown-label">Price per sqft:</span>
                                  <span className="breakdown-value">₱{pricePerSqft.toFixed(2)}</span>
                                </div>
                                <div className="breakdown-divider"></div>
                                <div className="breakdown-row breakdown-subtotal">
                                  <span className="breakdown-label">Subtotal:</span>
                                  <span className="breakdown-value">₱{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="breakdown-row">
                                  <span className="breakdown-label">Down Payment:</span>
                                  <span className="breakdown-value">₱{downPayment.toFixed(2)}</span>
                                </div>
                                <div className="breakdown-divider"></div>
                                <div className="breakdown-row breakdown-total">
                                  <span className="breakdown-label">Balance:</span>
                                  <span className="breakdown-value">₱{balance.toFixed(2)}</span>
                                </div>
                              </>
                            )}
                            {(!width || !height) && (
                              <div className="breakdown-empty">
                                <span>Enter dimensions to calculate breakdown</span>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Cart Section */}
              <div className="form-section-compact order-cart-section">
                <div className="section-header-compact">
                  <div className="section-icon-compact">
                    <Package size={18} />
                  </div>
                  <h3>Order Cart</h3>
                </div>
                <div className="order-cart-compact">
                  <div className="cart-item-compact">
                    <div className="cart-item-header-compact">
                      <div className="cart-item-icon-compact">
                        <Package size={20} />
                      </div>
                      <div className="cart-item-info-compact">
                        <h4 className="cart-item-name-compact">Tarpaulin</h4>
                        <p className="cart-item-type-compact">
                          {tarpaulinData.width && tarpaulinData.height 
                            ? `${tarpaulinData.width} × ${tarpaulinData.height} ft` 
                            : tarpaulinData.width 
                              ? `${tarpaulinData.width} ft (Width)` 
                              : tarpaulinData.height
                                ? `${tarpaulinData.height} ft (Height)`
                                : 'Size not specified'}
                        </p>
                      </div>
                    </div>
                    <div className="cart-item-details-compact">
                      <div className="cart-detail-row-compact">
                        <span className="cart-detail-label-compact">Orientation:</span>
                        <span className="cart-detail-value-compact">{tarpaulinData.orientation || 'Not specified'}</span>
                      </div>
                      <div className="cart-detail-row-compact">
                        <span className="cart-detail-label-compact">Quantity:</span>
                        <span className="cart-detail-value-compact">{tarpaulinData.quantity || '1'} pc(s)</span>
                      </div>
                      {tarpaulinData.isPahabol && (
                        <div className="cart-detail-row-compact">
                          <span className="cart-detail-label-compact">Type:</span>
                          <span className="cart-detail-value-compact pahabol-badge-compact">Pahabol</span>
                        </div>
                      )}
                    </div>
                    <div className="cart-item-footer-compact">
                      <div className="cart-item-price-compact">
                        <span className="price-label-compact">Total Amount:</span>
                        <span className="price-value-compact">
                          ₱{tarpaulinData.downPayment ? parseFloat(tarpaulinData.downPayment).toFixed(2) : '0.00'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 4 && orderType === 'Sublimation' && (
        <div className="order-form-step-tarpaulin" style={{ overflow: 'visible' }}>
          <div className="tarpaulin-form-compact" style={{ overflow: 'visible' }}>
            {!showProductSelection ? (
              <>
                {/* Product Management and Order Cart Row */}
                <div className="step4-sections-row">
                  {/* Product Management Section */}
                  <div className="form-section-compact product-management-section">
                    <div className="section-header-compact product-management-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        <div className="section-icon-compact">
                          <Package size={18} />
                        </div>
                        <h3>Product Management</h3>
                      </div>
                      <div className="product-management-buttons">
                        <button 
                          type="button" 
                          className="btn-add-product-header"
                          onClick={handleShowProductSelection}
                        >
                          <Plus size={16} />
                          ADD PRODUCT
                        </button>
                        <button 
                          type="button" 
                          className="btn-clear-order-header"
                          onClick={handleClearCart}
                          disabled={cartItems.length === 0}
                        >
                          CLEAR ORDER
                        </button>
                      </div>
                    </div>
                    <div className="product-type-list">
                      {(() => {
                        // Group items by product type
                        const grouped = cartItems.reduce((acc, item) => {
                          if (!acc[item.productType]) {
                            acc[item.productType] = {}
                          }
                          if (!acc[item.productType][item.size]) {
                            acc[item.productType][item.size] = 0
                          }
                          acc[item.productType][item.size] += parseInt(item.quantity) || 0
                          return acc
                        }, {})
                        
                        return Object.keys(grouped).length === 0 ? (
                          <div style={{
                            padding: '40px 20px',
                            textAlign: 'center',
                            color: '#666666',
                            fontSize: '13px'
                          }}>
                            No products added yet
                          </div>
                        ) : (
                          Object.entries(grouped).map(([productType, sizes]) => {
                            const sizeList = Object.entries(sizes)
                              .filter(([_, qty]) => qty > 0)
                              .map(([size, qty]) => `${size}(${qty})`)
                              .join(', ')
                            const totalQty = Object.values(sizes).reduce((sum, qty) => sum + qty, 0)
                            
                        return (
                          <div key={productType} className="product-type-item">
                            <div className="product-type-name">{productType}</div>
                            <div className="product-type-sizes">
                              {Object.entries(sizes)
                                .filter(([_, qty]) => qty > 0)
                                .map(([size, qty], idx, arr) => (
                                  <span key={size} className="size-badge">
                                    <span className="size-label">{size}</span>
                                    <span className="size-quantity">{qty}</span>
                                  </span>
                                ))}
                            </div>
                            <div className="product-type-footer">
                              <span className="product-type-total">{totalQty} {totalQty === 1 ? 'item' : 'items'} total</span>
                              <span className="product-type-count">{Object.keys(sizes).filter(s => sizes[s] > 0).length} {Object.keys(sizes).filter(s => sizes[s] > 0).length === 1 ? 'size' : 'sizes'}</span>
                            </div>
                          </div>
                        )
                          })
                        )
                      })()}
                    </div>
                  </div>

                  {/* Order Cart Section */}
                  <div className="form-section-compact order-cart-section">
                    <div className="section-header-compact">
                      <div className="section-icon-compact">
                        <Package size={18} />
                      </div>
                      <h3>Order Cart ({cartItems.length} items)</h3>
                    </div>
                    {cartItems.length === 0 ? (
                      <div style={{
                        padding: '60px 20px',
                        textAlign: 'center',
                        color: '#666666',
                        marginTop: '16px'
                      }}>
                        <Package size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <p style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>No items in cart</p>
                        <span style={{ fontSize: '13px' }}>Add products to get started</span>
                      </div>
                    ) : (
                      <div style={{
                        marginTop: '0',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 0,
                        background: '#0f0f0f',
                        border: 'none',
                        borderTop: '1px solid #1a1a1a',
                        borderRadius: '0',
                        overflow: 'hidden',
                        width: '100%'
                      }}>
                        <div style={{
                          flex: 1,
                          overflowY: 'auto',
                          overflowX: 'hidden',
                          minHeight: 0
                        }}>
                          <table style={{
                            width: '100%',
                            borderCollapse: 'collapse'
                          }}>
                          <thead>
                            <tr style={{
                              background: '#0a0a0a',
                              borderBottom: '2px solid #1a1a1a',
                              position: 'sticky',
                              top: 0,
                              zIndex: 10
                            }}>
                              <th style={{
                                padding: '12px 16px',
                                textAlign: 'left',
                                fontSize: '11px',
                                fontWeight: '700',
                                color: '#888888',
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                              }}>#</th>
                              <th style={{
                                padding: '12px 16px',
                                textAlign: 'left',
                                fontSize: '11px',
                                fontWeight: '700',
                                color: '#888888',
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                              }}>PRODUCT TYPE</th>
                              <th style={{
                                padding: '12px 16px',
                                textAlign: 'left',
                                fontSize: '11px',
                                fontWeight: '700',
                                color: '#888888',
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                              }}>SIZE</th>
                              <th style={{
                                padding: '12px 16px',
                                textAlign: 'left',
                                fontSize: '11px',
                                fontWeight: '700',
                                color: '#888888',
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                              }}>QUANTITY</th>
                              <th style={{
                                padding: '12px 16px',
                                textAlign: 'left',
                                fontSize: '11px',
                                fontWeight: '700',
                                color: '#888888',
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                              }}>PRICE</th>
                              <th style={{
                                padding: '12px 16px',
                                textAlign: 'left',
                                fontSize: '11px',
                                fontWeight: '700',
                                color: '#888888',
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                              }}>TOTAL</th>
                              <th style={{
                                padding: '12px 16px',
                                textAlign: 'center',
                                fontSize: '11px',
                                fontWeight: '700',
                                color: '#888888',
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                              }}>ACTION</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cartItems.map((item, index) => (
                              <tr key={item.id} style={{
                                borderBottom: '1px solid #1a1a1a',
                                transition: 'background 0.2s ease'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#141414'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                              <td style={{ padding: '14px 16px', fontSize: '13px', color: '#aaaaaa' }}>{index + 1}</td>
                              <td style={{ padding: '14px 16px', fontSize: '13px', color: '#ffffff', fontWeight: '600' }}>{item.productType}</td>
                              <td style={{ padding: '14px 16px', fontSize: '13px', color: '#aaaaaa' }}>{item.size}</td>
                              <td style={{ padding: '14px 16px', fontSize: '13px', color: '#aaaaaa' }}>{item.quantity}</td>
                              <td style={{ padding: '14px 16px', fontSize: '13px', color: '#aaaaaa' }}>₱{item.price ? item.price.toFixed(2) : '0.00'}</td>
                              <td style={{ padding: '14px 16px', fontSize: '13px', color: '#ffffff', fontWeight: '600' }}>₱{item.totalPrice ? item.totalPrice.toFixed(2) : '0.00'}</td>
                                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                  <button 
                                    className="btn-remove-item"
                                    onClick={() => handleRemoveFromCart(item.id)}
                                    title="Remove item"
                                    style={{
                                      background: 'transparent',
                                      border: '1px solid #2a2a2a',
                                      borderRadius: '6px',
                                      color: '#ffffff',
                                      width: '28px',
                                      height: '28px',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      transition: 'all 0.2s ease',
                                      fontSize: '16px',
                                      lineHeight: '1'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = '#1a1a1a'
                                      e.currentTarget.style.borderColor = '#3a3a3a'
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = 'transparent'
                                      e.currentTarget.style.borderColor = '#2a2a2a'
                                    }}
                                  >
                                    ✕
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        </div>
                        <div style={{
                          padding: '16px',
                          background: '#0a0a0a',
                          borderTop: '2px solid #1a1a1a',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div style={{ fontSize: '13px', color: '#888888', marginBottom: '8px' }}>
                            <strong style={{ color: '#ffffff' }}>Total Items:</strong> {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                          </div>
                          <div style={{ fontSize: '13px', color: '#888888', marginBottom: '8px' }}>
                            <strong style={{ color: '#ffffff' }}>Total Products:</strong> {cartItems.length}
                          </div>
                          <div style={{
                            fontSize: '14px',
                            color: '#ffffff',
                            fontWeight: '700',
                            paddingTop: '12px',
                            borderTop: '2px solid #1a1a1a'
                          }}>
                            <strong>Grand Total:</strong> <span style={{ fontSize: '16px', marginLeft: '8px' }}>₱{cartItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                {!selectedProductType ? (
                  <>
                    {/* Product Type Selection View */}
                    <div style={{ width: '100%', padding: '0', display: 'flex', flexDirection: 'column', overflow: 'visible' }}>
                      <div className="section-header-compact" style={{ marginBottom: '20px', flexShrink: 0 }}>
                        <div className="section-icon-compact">
                          <Package size={18} />
                        </div>
                        <h3>Select Product Type</h3>
                      </div>
                      <div className="order-type-grid-enhanced" style={{ 
                        marginTop: 0, 
                        flex: 1, 
                        minHeight: 0, 
                        overflow: 'visible',
                        paddingBottom: '20px'
                      }}>
                        {productTypes.map((product) => (
                          <div
                            key={product.id}
                            className="order-type-card-enhanced"
                            onClick={() => handleSelectProductType(product)}
                            style={{ cursor: 'pointer', overflow: 'visible' }}
                          >
                            <div className="card-header-enhanced">
                              <div className="card-header-main">
                                <div className="order-type-icon-enhanced">
                                  <span style={{ fontSize: '24px', display: 'block' }}>{product.icon}</span>
                                </div>
                                <h3 style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{product.name}</h3>
                              </div>
                            </div>
                            <div className="card-body-enhanced">
                              <p className="card-description" style={{ marginBottom: '8px' }}>
                                Custom sublimation printing
                              </p>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginTop: 'auto',
                                paddingTop: '8px',
                                borderTop: '1px solid #222222',
                                flexWrap: 'wrap'
                              }}>
                                <span style={{
                                  fontSize: '18px',
                                  fontWeight: '700',
                                  color: '#ffffff',
                                  whiteSpace: 'nowrap'
                                }}>
                                  ₱{product.price.toFixed(2)}
                                </span>
                                <span style={{
                                  fontSize: '10px',
                                  color: '#999999',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  whiteSpace: 'nowrap'
                                }}>
                                  per piece
                                </span>
                              </div>
                            </div>
                            <div className="card-footer-enhanced">
                              <span className="card-action-text" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>Select {product.name}</span>
                              <div className="card-arrow-enhanced">→</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                      {/* Size Selection - Standard Sizes */}
                      <div className="form-section-compact standard-sizes-section" style={{ width: '100%' }}>
                        <div className="section-header-compact standard-sizes-header">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                            <button
                              type="button"
                              onClick={handleBackToProductSelection}
                              className="back-button-enhanced"
                            >
                              <ArrowLeft size={16} />
                            </button>
                            <div className="section-icon-compact">
                              <Maximize2 size={18} />
                            </div>
                            <h3 style={{ margin: 0 }}>{selectedProductType.name} - Standard Sizes</h3>
                          </div>
                          <div className="standard-sizes-header-buttons">
                            <button 
                              type="button" 
                              onClick={handleCancelProductSelection}
                              className="btn-cancel-standard"
                            >
                              CANCEL
                            </button>
                            <button 
                              type="button" 
                              onClick={handleAddProductToCart}
                              className="btn-add-to-cart-standard"
                            >
                              ADD TO CART
                            </button>
                          </div>
                        </div>
                        <div className="standard-sizes-grid">
                          {Object.keys(productSelectionData.sizes).map((size) => {
                            const sizeNames = {
                              'XS': 'Extra Small',
                              'S': 'Small',
                              'M': 'Medium',
                              'L': 'Large',
                              'XL': 'Extra Large',
                              '2XL': '2X Large',
                              '3XL': '3X Large',
                              '4XL': '4X Large'
                            };
                            const fullSizeName = sizeNames[size] || size;
                            
                            return (
                              <div key={size} className="size-input-card">
                                <div className="size-indicator">
                                  <span className="size-indicator-code">{size}</span>
                                  <span className="size-indicator-name">{fullSizeName}</span>
                                </div>
                                <input
                                  type="number"
                                  min="0"
                                  value={productSelectionData.sizes[size] || ''}
                                  onChange={(e) => {
                                    const value = e.target.value === '' ? '' : e.target.value;
                                    handleSizeQuantityChange(size, value);
                                  }}
                                  onFocus={(e) => {
                                    if (e.target.value === '0') {
                                      e.target.value = '';
                                    }
                                  }}
                                  placeholder=""
                                  className="size-input-enhanced"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Custom Sizes */}
                      <div className="form-section-compact custom-sizes-section" style={{ width: '100%' }}>
                        <div className="custom-sizes-header">
                          <div className="section-header-compact" style={{ margin: 0, padding: 0 }}>
                            <div className="section-icon-compact">
                              <Maximize2 size={18} />
                            </div>
                            <h3>Custom Sizes</h3>
                          </div>
                          <button 
                            type="button" 
                            onClick={handleAddCustomSize}
                            className="btn-add-custom-size-enhanced"
                          >
                            <Plus size={16} />
                            ADD CUSTOM SIZE
                          </button>
                        </div>
                        {productSelectionData.customSizes.length > 0 && (
                          <div className="custom-sizes-list-enhanced">
                            {productSelectionData.customSizes.map((customSize, index) => (
                              <div key={index} className="custom-size-row-enhanced">
                                <input
                                  type="text"
                                  placeholder="Size name (e.g., 4XL, Baby)"
                                  value={customSize.size}
                                  onChange={(e) => handleCustomSizeChange(index, 'size', e.target.value)}
                                  className="custom-size-name-input-enhanced"
                                />
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="Quantity"
                                  value={customSize.quantity}
                                  onChange={(e) => handleCustomSizeChange(index, 'quantity', e.target.value)}
                                  className="custom-size-qty-input-enhanced"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCustomSize(index)}
                                  className="btn-remove-custom-size-enhanced"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </>
                  )}
                </>
              )}
          </div>
        </div>
      )}

      {step === 5 && orderType === 'Sublimation' && (
        <div className="order-form-step-tarpaulin">
          <div className="tarpaulin-form-compact">
            {/* Payment Method & Details and Order Cart Row */}
            <div className="step4-sections-row">
              {/* Payment Method and Details Section */}
              <div className="form-section-compact payment-method-details-section">
                <div className="section-header-compact">
                  <div className="section-icon-compact">
                    <Wallet size={18} />
                  </div>
                  <h3>Payment Method & Details</h3>
                </div>
                <div className="payment-method-details-content">
                  {/* Payment Method */}
                  <div className="form-field-compact full-width">
                    <label>Payment Method *</label>
                    <div className="payment-methods-compact">
                      <button
                        type="button"
                        className={`payment-method-compact ${sublimationData.paymentMethod === 'Cash' ? 'active' : ''}`}
                        onClick={() => handleSublimationInputChange('paymentMethod', 'Cash')}
                      >
                        <Wallet size={14} />
                        <span>Cash</span>
                      </button>
                      <button
                        type="button"
                        className={`payment-method-compact ${sublimationData.paymentMethod === 'GCash' ? 'active' : ''}`}
                        onClick={() => handleSublimationInputChange('paymentMethod', 'GCash')}
                      >
                        <CreditCard size={14} />
                        <span>GCash</span>
                      </button>
                      <button
                        type="button"
                        className={`payment-method-compact ${sublimationData.paymentMethod === 'Bank Transfer' ? 'active' : ''}`}
                        onClick={() => handleSublimationInputChange('paymentMethod', 'Bank Transfer')}
                      >
                        <CreditCard size={14} />
                        <span>Bank</span>
                      </button>
                      <button
                        type="button"
                        className={`payment-method-compact ${sublimationData.paymentMethod === 'Credit Card' ? 'active' : ''}`}
                        onClick={() => handleSublimationInputChange('paymentMethod', 'Credit Card')}
                      >
                        <CreditCard size={14} />
                        <span>Card</span>
                      </button>
                    </div>
                  </div>

                  {/* Down Payment */}
                  <div className="form-field-compact full-width">
                    <label>Down Payment</label>
                    <div className="field-input-wrapper">
                      <DollarSign size={16} className="field-icon" />
                      <input
                        type="number"
                        placeholder="0.00"
                        value={sublimationData.downPayment}
                        onChange={(e) => handleSublimationInputChange('downPayment', e.target.value)}
                        min="0"
                        step="0.01"
                      />
                      <span className="field-unit">₱</span>
                    </div>
                  </div>

                  {/* Payment Breakdown */}
                  <div className="payment-breakdown-detailed">
                    <div className="breakdown-header">
                      <Calculator size={16} />
                      <h4>Payment Breakdown</h4>
                    </div>
                    <div className="breakdown-content">
                      {(() => {
                        const totalItems = cartItems.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
                        const totalProducts = cartItems.length;
                        const subtotal = cartItems.reduce((sum, item) => sum + (parseFloat(item.totalPrice) || 0), 0);
                        const downPayment = parseFloat(sublimationData.downPayment) || 0;
                        const balance = subtotal - downPayment;

                        return (
                          <>
                            <div className="breakdown-row">
                              <span className="breakdown-label">Total Products:</span>
                              <span className="breakdown-value">{totalProducts} {totalProducts === 1 ? 'product' : 'products'}</span>
                            </div>
                            <div className="breakdown-row">
                              <span className="breakdown-label">Total Items:</span>
                              <span className="breakdown-value">{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
                            </div>
                            {cartItems.length > 0 && (
                              <>
                                <div className="breakdown-divider"></div>
                                <div className="breakdown-row breakdown-subtotal">
                                  <span className="breakdown-label">Subtotal:</span>
                                  <span className="breakdown-value">₱{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="breakdown-row">
                                  <span className="breakdown-label">Down Payment:</span>
                                  <span className="breakdown-value">₱{downPayment.toFixed(2)}</span>
                                </div>
                                <div className="breakdown-divider"></div>
                                <div className="breakdown-row breakdown-total">
                                  <span className="breakdown-label">Balance:</span>
                                  <span className="breakdown-value">₱{balance.toFixed(2)}</span>
                                </div>
                              </>
                            )}
                            {cartItems.length === 0 && (
                              <div className="breakdown-empty">
                                <span>Add products to see breakdown</span>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Cart Section */}
              <div className="form-section-compact order-cart-section">
                <div className="section-header-compact">
                  <div className="section-icon-compact">
                    <Package size={18} />
                  </div>
                  <h3>Order Cart ({cartItems.length} items)</h3>
                </div>
                {cartItems.length === 0 ? (
                  <div style={{
                    padding: '60px 20px',
                    textAlign: 'center',
                    color: '#666666',
                    marginTop: '16px'
                  }}>
                    <Package size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                    <p style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>No items in cart</p>
                    <span style={{ fontSize: '13px' }}>Add products to get started</span>
                  </div>
                ) : (
                  <div style={{
                    marginTop: '0',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                    background: '#0f0f0f',
                    border: 'none',
                    borderTop: '1px solid #1a1a1a',
                    borderRadius: '0',
                    overflow: 'hidden',
                    width: '100%'
                  }}>
                    <div style={{
                      flex: 1,
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      minHeight: 0
                    }}>
                      <table style={{
                        width: '100%',
                        borderCollapse: 'collapse'
                      }}>
                        <thead>
                          <tr style={{
                            background: '#0a0a0a',
                            borderBottom: '2px solid #1a1a1a',
                            position: 'sticky',
                            top: 0,
                            zIndex: 10
                          }}>
                            <th style={{
                              padding: '12px 16px',
                              textAlign: 'left',
                              fontSize: '11px',
                              fontWeight: '700',
                              color: '#888888',
                              textTransform: 'uppercase',
                              letterSpacing: '1px'
                            }}>#</th>
                            <th style={{
                              padding: '12px 16px',
                              textAlign: 'left',
                              fontSize: '11px',
                              fontWeight: '700',
                              color: '#888888',
                              textTransform: 'uppercase',
                              letterSpacing: '1px'
                            }}>PRODUCT TYPE</th>
                            <th style={{
                              padding: '12px 16px',
                              textAlign: 'left',
                              fontSize: '11px',
                              fontWeight: '700',
                              color: '#888888',
                              textTransform: 'uppercase',
                              letterSpacing: '1px'
                            }}>SIZE</th>
                            <th style={{
                              padding: '12px 16px',
                              textAlign: 'left',
                              fontSize: '11px',
                              fontWeight: '700',
                              color: '#888888',
                              textTransform: 'uppercase',
                              letterSpacing: '1px'
                            }}>QUANTITY</th>
                            <th style={{
                              padding: '12px 16px',
                              textAlign: 'left',
                              fontSize: '11px',
                              fontWeight: '700',
                              color: '#888888',
                              textTransform: 'uppercase',
                              letterSpacing: '1px'
                            }}>PRICE</th>
                            <th style={{
                              padding: '12px 16px',
                              textAlign: 'left',
                              fontSize: '11px',
                              fontWeight: '700',
                              color: '#888888',
                              textTransform: 'uppercase',
                              letterSpacing: '1px'
                            }}>TOTAL</th>
                            <th style={{
                              padding: '12px 16px',
                              textAlign: 'center',
                              fontSize: '11px',
                              fontWeight: '700',
                              color: '#888888',
                              textTransform: 'uppercase',
                              letterSpacing: '1px'
                            }}>ACTION</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cartItems.map((item, index) => (
                            <tr key={item.id} style={{
                              borderBottom: '1px solid #1a1a1a',
                              transition: 'background 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#141414'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <td style={{ padding: '14px 16px', fontSize: '13px', color: '#aaaaaa' }}>{index + 1}</td>
                              <td style={{ padding: '14px 16px', fontSize: '13px', color: '#ffffff', fontWeight: '600' }}>{item.productType}</td>
                              <td style={{ padding: '14px 16px', fontSize: '13px', color: '#aaaaaa' }}>{item.size}</td>
                              <td style={{ padding: '14px 16px', fontSize: '13px', color: '#aaaaaa' }}>{item.quantity}</td>
                              <td style={{ padding: '14px 16px', fontSize: '13px', color: '#aaaaaa' }}>₱{item.price ? item.price.toFixed(2) : '0.00'}</td>
                              <td style={{ padding: '14px 16px', fontSize: '13px', color: '#ffffff', fontWeight: '600' }}>₱{item.totalPrice ? item.totalPrice.toFixed(2) : '0.00'}</td>
                              <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                <button 
                                  className="btn-remove-item"
                                  onClick={() => handleRemoveFromCart(item.id)}
                                  title="Remove item"
                                  style={{
                                    background: 'transparent',
                                    border: '1px solid #2a2a2a',
                                    borderRadius: '6px',
                                    color: '#ffffff',
                                    width: '28px',
                                    height: '28px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease',
                                    fontSize: '16px',
                                    lineHeight: '1'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#1a1a1a'
                                    e.currentTarget.style.borderColor = '#3a3a3a'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent'
                                    e.currentTarget.style.borderColor = '#2a2a2a'
                                  }}
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div style={{
                      padding: '16px',
                      background: '#0a0a0a',
                      borderTop: '2px solid #1a1a1a',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}>
                        <div style={{
                          fontSize: '12px',
                          color: '#888888'
                        }}>
                          Total Items: <strong style={{ color: '#ffffff' }}>{cartItems.reduce((sum, item) => sum + item.quantity, 0)}</strong>
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#888888'
                        }}>
                          Total Products: <strong style={{ color: '#ffffff' }}>{cartItems.length}</strong>
                        </div>
                      </div>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '800',
                        color: '#ffffff'
                      }}>
                        Grand Total: <strong style={{ fontSize: '18px' }}>₱{cartItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0).toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 3 && orderType !== 'Repairs' && orderType !== 'Tarpaulin' && orderType !== 'Sublimation' && (
        <div className="order-form-step">
          <div className="content-placeholder">
            <CheckCircle size={48} />
            <p>Order review coming soon</p>
          </div>
        </div>
      )}
        </div>

        {/* Right Sidebar - Only visible after selecting type */}
        {step > 1 && (
          <div className="order-sidebar-redesigned">
            <div className="sidebar-header-redesigned">
              <div className="sidebar-header-icon">
                {orderType === 'Repairs' && <Wrench size={18} />}
                {orderType === 'Tarpaulin' && <Package size={18} />}
                {orderType !== 'Repairs' && orderType !== 'Tarpaulin' && <Package size={18} />}
              </div>
              <div className="sidebar-header-text">
                <h3>Order Summary</h3>
                <p>Step {step} of {steps.length}</p>
              </div>
            </div>
            
            <div className="sidebar-content-redesigned">
              {/* Category Badge */}
              <div className="sidebar-category-badge">
                <div className="category-badge-icon">
                  {orderType === 'Repairs' && <Wrench size={16} />}
                  {orderType === 'Tarpaulin' && <Package size={16} />}
                  {orderType !== 'Repairs' && orderType !== 'Tarpaulin' && <Package size={16} />}
                </div>
                <span className="category-badge-text">{orderType}</span>
              </div>

              {/* Selected Customer Info - For Tarpaulin and Sublimation Step 2 */}
              {(orderType === 'Tarpaulin' || orderType === 'Sublimation') && step === 2 && selectedCustomer && (
                <div className="selected-customer-info">
                  <div className="selected-customer-header">
                    <div className="selected-customer-badge">
                      <User size={14} />
                      <span>{selectedCustomer.name}</span>
                      <button
                        type="button"
                        className="remove-customer-btn"
                        onClick={() => {
                          setSelectedCustomer(null)
                          setIsNewCustomer(true)
                          setCustomerOrders([])
                          if (orderType === 'Tarpaulin') {
                            setTarpaulinData(prev => ({
                              ...prev,
                              customerName: '',
                              contactNumber: '',
                              email: '',
                              address: '',
                              businessName: ''
                            }))
                          } else if (orderType === 'Sublimation') {
                            setSublimationData(prev => ({
                              ...prev,
                              customerName: '',
                              contactNumber: '',
                              email: '',
                              address: '',
                              businessName: ''
                            }))
                          }
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="customer-balance-info">
                      <div className="balance-item">
                        <span className="balance-label">Total Balance:</span>
                        <span className="balance-amount">₱{parseFloat(selectedCustomer.totalBalance || 0).toFixed(2)}</span>
                      </div>
                      <div className="balance-item">
                        <span className="balance-label">Total Orders:</span>
                        <span className="balance-amount">{selectedCustomer.totalOrders || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pahabol Toggle - Only for Tarpaulin Step 2 */}
              {orderType === 'Tarpaulin' && step === 2 && !isNewCustomer && selectedCustomer && (
                <div className="form-section-compact pahabol-toggle-section">
                  <div className="pahabol-toggle-wrapper">
                    <div className="pahabol-toggle-content">
                      <div className="pahabol-toggle-icon">
                        <Clock size={20} />
                      </div>
                      <div className="pahabol-toggle-info">
                        <div className="pahabol-toggle-title">Pahabol Order</div>
                        <div className="pahabol-toggle-description">Mark this as a rush/pahabol order</div>
                      </div>
                    </div>
                    <label className="pahabol-toggle-switch">
                      <input
                        type="checkbox"
                        checked={tarpaulinData.isPahabol}
                        onChange={(e) => handleTarpaulinInputChange('isPahabol', e.target.checked)}
                      />
                      <span className="pahabol-toggle-slider"></span>
                    </label>
                  </div>
                </div>
              )}

              {/* Repairs Information */}
              {orderType === 'Repairs' && (
                  <>
                    {/* Customer Section */}
                    <div className="sidebar-group-redesigned">
                      <div className="sidebar-group-title">
                        <User size={12} />
                        <span>Customer</span>
                      </div>
                      <div className="sidebar-group-content">
                        <div className="sidebar-info-item">
                          <span className="info-label">Name</span>
                          <span className="info-value">{repairData.customerName || 'Not provided'}</span>
                        </div>
                        <div className="sidebar-info-item">
                          <span className="info-label">Contact</span>
                          <span className="info-value">{repairData.contactNumber || 'Not provided'}</span>
                        </div>
                        {repairData.email && (
                          <div className="sidebar-info-item">
                            <span className="info-label">Email</span>
                            <span className="info-value">{repairData.email}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Device Section */}
                    {(repairData.deviceType || repairData.deviceBrand || repairData.deviceModel) && (
                      <div className="sidebar-group-redesigned">
                        <div className="sidebar-group-title">
                          <Monitor size={12} />
                          <span>Device</span>
                        </div>
                        <div className="sidebar-group-content">
                          {repairData.deviceType && (
                            <div className="sidebar-info-item">
                              <span className="info-label">Type</span>
                              <span className="info-value">{repairData.deviceType}</span>
                            </div>
                          )}
                          {repairData.deviceBrand && (
                            <div className="sidebar-info-item">
                              <span className="info-label">Brand</span>
                              <span className="info-value">{repairData.deviceBrand}</span>
                            </div>
                          )}
                          {repairData.deviceModel && (
                            <div className="sidebar-info-item">
                              <span className="info-label">Model</span>
                              <span className="info-value">{repairData.deviceModel}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Technician & Issues */}
                    {(repairData.techAssigned || (step === 3 && repairData.problems.length > 0)) && (
                      <div className="sidebar-group-redesigned">
                        <div className="sidebar-group-title">
                          <Wrench size={12} />
                          <span>Service</span>
                        </div>
                        <div className="sidebar-group-content">
                          {repairData.techAssigned && (
                            <div className="sidebar-info-item">
                              <span className="info-label">Technician</span>
                              <span className="info-value">{repairData.techAssigned}</span>
                            </div>
                          )}
                          {step === 3 && repairData.problems.length > 0 && (
                            <div className="sidebar-info-item">
                              <span className="info-label">Issues</span>
                              <span className="info-value">{repairData.problems.length} problem(s)</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
              )}

              {/* Tarpaulin Information */}
              {orderType === 'Tarpaulin' && (
                  <>
                    {/* Customer Section */}
                    <div className="sidebar-group-redesigned">
                      <div className="sidebar-group-title">
                        <User size={12} />
                        <span>Customer</span>
                      </div>
                      <div className="sidebar-group-content">
                        <div className="sidebar-info-item">
                          <span className="info-label">Name</span>
                          <span className="info-value">{tarpaulinData.customerName || 'Not provided'}</span>
                        </div>
                        <div className="sidebar-info-item">
                          <span className="info-label">Contact</span>
                          <span className="info-value">{tarpaulinData.contactNumber || 'Not provided'}</span>
                        </div>
                        {tarpaulinData.email && (
                          <div className="sidebar-info-item">
                            <span className="info-label">Email</span>
                            <span className="info-value">{tarpaulinData.email}</span>
                          </div>
                        )}
                        {tarpaulinData.businessName && (
                          <div className="sidebar-info-item">
                            <span className="info-label">Business</span>
                            <span className="info-value">{tarpaulinData.businessName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Event Section */}
                    <div className="sidebar-group-redesigned">
                      <div className="sidebar-group-title">
                        <Calendar size={12} />
                        <span>Event & Dates</span>
                      </div>
                      <div className="sidebar-group-content">
                        <div className="sidebar-info-item">
                          <span className="info-label">Event Type</span>
                          <span className="info-value">{tarpaulinData.eventType || 'Not provided'}</span>
                        </div>
                        <div className="sidebar-info-item">
                          <span className="info-label">Event Date</span>
                          <span className="info-value">
                            {tarpaulinData.eventDate 
                              ? new Date(tarpaulinData.eventDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })
                              : 'Not provided'}
                          </span>
                        </div>
                        <div className="sidebar-info-item">
                          <span className="info-label">Pickup Date</span>
                          <span className="info-value">
                            {tarpaulinData.preferredDeliveryDate
                              ? new Date(tarpaulinData.preferredDeliveryDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })
                              : 'Not provided'}
                          </span>
                        </div>
                        {tarpaulinData.rushOrder && (
                          <div className="sidebar-info-item">
                            <span className="info-label">Rush Order</span>
                            <span className="info-value rush-order-badge">Priority Processing</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Assigned Artist Section */}
                    <div className="sidebar-group-redesigned">
                      <div className="sidebar-group-title">
                        <User size={12} />
                        <span>Assigned Artist</span>
                      </div>
                      <div className="sidebar-group-content">
                        <div className="sidebar-info-item">
                          <span className="info-label">Artist</span>
                          <span className="info-value">{tarpaulinData.assignedArtist || 'Not assigned'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Order Details Section */}
                    <div className="sidebar-group-redesigned">
                      <div className="sidebar-group-title">
                        <Package size={12} />
                        <span>Order Details</span>
                      </div>
                      <div className="sidebar-group-content">
                        <div className="sidebar-info-item">
                          <span className="info-label">Dimensions</span>
                          <span className="info-value">
                            {tarpaulinData.width && tarpaulinData.height 
                              ? `${tarpaulinData.width} x ${tarpaulinData.height} ft` 
                              : tarpaulinData.width 
                                ? `${tarpaulinData.width} ft (W)` 
                                : tarpaulinData.height
                                  ? `${tarpaulinData.height} ft (H)`
                                  : 'Not provided'}
                          </span>
                        </div>
                        <div className="sidebar-info-item">
                          <span className="info-label">Orientation</span>
                          <span className="info-value">{tarpaulinData.orientation || 'Not provided'}</span>
                        </div>
                        <div className="sidebar-info-item">
                          <span className="info-label">Quantity</span>
                          <span className="info-value">{tarpaulinData.quantity || 'Not provided'} pc(s)</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Section */}
                    <div className="sidebar-group-redesigned">
                      <div className="sidebar-group-title">
                        <Wallet size={12} />
                        <span>Payment</span>
                      </div>
                      <div className="sidebar-group-content">
                        <div className="sidebar-info-item">
                          <span className="info-label">Payment Method</span>
                          <span className="info-value">{tarpaulinData.paymentMethod || 'Not selected'}</span>
                        </div>
                        <div className="sidebar-info-item">
                          <span className="info-label">Down Payment</span>
                          <span className="info-value">
                            ₱{tarpaulinData.downPayment ? parseFloat(tarpaulinData.downPayment).toFixed(2) : '0.00'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Pahabol Badge */}
                    {tarpaulinData.isPahabol && (
                      <div className="sidebar-pahabol-badge">
                        <div className="pahabol-badge-icon">
                          <Clock size={12} />
                        </div>
                        <span className="pahabol-badge-text">Pahabol Order</span>
                      </div>
                    )}
                  </>
                )}

              {/* Sublimation Information */}
              {orderType === 'Sublimation' && (
                  <>
                    {/* Customer Section */}
                    <div className="sidebar-group-redesigned">
                      <div className="sidebar-group-title">
                        <User size={12} />
                        <span>Customer</span>
                      </div>
                      <div className="sidebar-group-content">
                        <div className="sidebar-info-item">
                          <span className="info-label">Name</span>
                          <span className="info-value">{sublimationData.customerName || 'Not provided'}</span>
                        </div>
                        <div className="sidebar-info-item">
                          <span className="info-label">Contact</span>
                          <span className="info-value">{sublimationData.contactNumber || 'Not provided'}</span>
                        </div>
                        {sublimationData.email && (
                          <div className="sidebar-info-item">
                            <span className="info-label">Email</span>
                            <span className="info-value">{sublimationData.email}</span>
                          </div>
                        )}
                        {sublimationData.businessName && (
                          <div className="sidebar-info-item">
                            <span className="info-label">Business</span>
                            <span className="info-value">{sublimationData.businessName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Section */}
                    <div className="sidebar-group-redesigned">
                      <div className="sidebar-group-title">
                        <Calendar size={12} />
                        <span>Order & Dates</span>
                      </div>
                      <div className="sidebar-group-content">
                        <div className="sidebar-info-item">
                          <span className="info-label">Pickup Date</span>
                          <span className="info-value">
                            {sublimationData.pickupDate 
                              ? new Date(sublimationData.pickupDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })
                              : 'Not provided'}
                          </span>
                        </div>
                        {sublimationData.rushOrder && (
                          <div className="sidebar-info-item">
                            <span className="info-label">Rush Order</span>
                            <span className="info-value rush-order-badge">Priority Processing</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Assigned Artist Section */}
                    {step >= 3 && (
                      <div className="sidebar-group-redesigned">
                        <div className="sidebar-group-title">
                          <User size={12} />
                          <span>Assigned Artist</span>
                        </div>
                        <div className="sidebar-group-content">
                          <div className="sidebar-info-item">
                            <span className="info-label">Artist</span>
                            <span className="info-value">{sublimationData.assignedArtist || 'Not assigned'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Product Details Section */}
                    {step >= 3 && (
                      <div className="sidebar-group-redesigned">
                        <div className="sidebar-group-title">
                          <Package size={12} />
                          <span>Product Details</span>
                        </div>
                        <div className="sidebar-group-content">
                          <div className="sidebar-info-item">
                            <span className="info-label">Product Type</span>
                            <span className="info-value">{sublimationData.productType || 'Not provided'}</span>
                          </div>
                          <div className="sidebar-info-item">
                            <span className="info-label">Size</span>
                            <span className="info-value">{sublimationData.size || 'Not provided'}</span>
                          </div>
                          <div className="sidebar-info-item">
                            <span className="info-label">Quantity</span>
                            <span className="info-value">{sublimationData.quantity || '1'} pc(s)</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Payment Section */}
                    {step === 4 && (
                      <div className="sidebar-group-redesigned">
                        <div className="sidebar-group-title">
                          <Wallet size={12} />
                          <span>Payment</span>
                        </div>
                        <div className="sidebar-group-content">
                          <div className="sidebar-info-item">
                            <span className="info-label">Payment Method</span>
                            <span className="info-value">{sublimationData.paymentMethod || 'Not selected'}</span>
                          </div>
                          <div className="sidebar-info-item">
                            <span className="info-label">Down Payment</span>
                            <span className="info-value">
                              ₱{sublimationData.downPayment ? parseFloat(sublimationData.downPayment).toFixed(2) : '0.00'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
            </div>
          </div>
        )}
      </div>
      
      {/* Custom Alert Modal */}
      <Alert
        isOpen={alert.isOpen}
        onClose={closeAlert}
        type={alert.type}
        title={alert.title}
        message={alert.message}
      />
    </div>
  )
}

// Create Pahabol View
function CreatePahabolView() {
  return (
    <div className="view-container">
      <div className="view-header">
        <div className="header-content">
          <div className="header-icon-wrapper">
            <Clock size={24} />
          </div>
          <div>
            <h1>Create Pahabol</h1>
            <p>Create a rush/pahabol order</p>
          </div>
        </div>
      </div>
      <div className="content-placeholder">
        <Clock size={48} />
        <p>Create Pahabol form will be here</p>
      </div>
    </div>
  )
}

// Order Tracking View
function OrderTrackingView({ user }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all') // all, pending, in-progress, completed
  const [orderTypeFilter, setOrderTypeFilter] = useState('all') // all, Tarpaulin, Repairs, Sublimation
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [viewingOrder, setViewingOrder] = useState(false)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const allOrders = await fetchOrders()
      setOrders(allOrders)
    } catch (error) {
      console.error('Error loading orders:', error)
      alert('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const formatPeso = (amount) => {
    return `₱${Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateForInput = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toISOString().split('T')[0]
  }

  const clearFilters = () => {
    setStatusFilter('all')
    setOrderTypeFilter('all')
    setStartDate('')
    setEndDate('')
    setSearchTerm('')
  }

  const filteredOrders = orders.filter(order => {
    // Status filter
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    
    // Order type filter
    const matchesOrderType = orderTypeFilter === 'all' || order.orderType === orderTypeFilter
    
    // Date range filter
    let matchesDateRange = true
    if (startDate || endDate) {
      const orderDate = new Date(order.createdAt)
      orderDate.setHours(0, 0, 0, 0)
      
      if (startDate) {
        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        if (orderDate < start) {
          matchesDateRange = false
        }
      }
      
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        if (orderDate > end) {
          matchesDateRange = false
        }
      }
    }
    
    // Search filter
    const orderData = order.orderData || {}
    const assignedArtist = orderData.assignedArtist || ''
    const matchesSearch = !searchTerm || 
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerContact?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.receivedBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignedArtist.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesOrderType && matchesDateRange && matchesSearch
  })

  // If viewing a specific order, show the ViewOrderPage
  if (viewingOrder && selectedOrder) {
    return <ViewOrderPage 
      order={selectedOrder} 
      onBack={() => {
        setViewingOrder(false)
        setSelectedOrder(null)
      }} 
    />
  }

  return (
    <div className="view-container">
      <div className="view-header">
        <div className="header-content">
          <div className="header-icon-wrapper">
            <Package size={24} />
          </div>
          <div>
            <h1>Order Tracking</h1>
            <p>Track all orders</p>
          </div>
        </div>
      </div>

      <div className="order-tracking-content">
        {/* Filters and Search */}
        <div className="order-tracking-filters">
          <div className="filters-row">
            {/* Status Filter */}
            <div className="filter-group">
              <label className="filter-label">Status</label>
              <div className="filter-buttons">
                <button 
                  className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('all')}
                >
                  All
                </button>
                <button 
                  className={`filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('pending')}
                >
                  Pending
                </button>
                <button 
                  className={`filter-btn ${statusFilter === 'in-progress' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('in-progress')}
                >
                  In Progress
                </button>
                <button 
                  className={`filter-btn ${statusFilter === 'completed' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('completed')}
                >
                  Completed
                </button>
              </div>
            </div>

            {/* Order Type Filter */}
            <div className="filter-group">
              <label className="filter-label">Order Type</label>
              <select
                className="filter-select"
                value={orderTypeFilter}
                onChange={(e) => setOrderTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="Tarpaulin">Tarpaulin</option>
                <option value="Repairs">Repairs</option>
                <option value="Sublimation">Sublimation</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div className="filter-group">
              <label className="filter-label">Date Range</label>
              <div className="date-range-inputs">
                <div className="date-input-wrapper">
                  <Calendar size={14} />
                  <input
                    type="date"
                    className="date-input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="Start Date"
                  />
                </div>
                <span className="date-separator">to</span>
                <div className="date-input-wrapper">
                  <Calendar size={14} />
                  <input
                    type="date"
                    className="date-input"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="End Date"
                  />
                </div>
              </div>
            </div>

            {/* Clear Filters Button */}
            {(statusFilter !== 'all' || orderTypeFilter !== 'all' || startDate || endDate || searchTerm) && (
              <button className="clear-filters-btn" onClick={clearFilters}>
                <X size={14} />
                Clear Filters
              </button>
            )}
          </div>

          {/* Search */}
          <div className="search-wrapper">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by customer, contact, order type, received by, or assigned to..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="loading-placeholder">
            <p>Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="content-placeholder">
            <Package size={48} />
            <p>No orders found</p>
          </div>
        ) : (
          <div className="order-tracking-table-container">
            <table className="order-tracking-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Type</th>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Received By</th>
                  <th>Assigned To</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const orderData = order.orderData || {}
                  const assignedArtist = orderData.assignedArtist || 'Not Assigned'
                  return (
                            <tr
                              key={order.id}
                              onClick={() => {
                                setSelectedOrder(order)
                                setViewingOrder(true)
                              }}
                              style={{ cursor: 'pointer' }}
                            >
                      <td className="order-number-cell">
                        <div className="order-number-wrapper">
                          <span>#{order.id}</span>
                          {order.isPahabol && (
                            <span className="pahabol-badge-table" title="Pahabol (Rush)">
                              <Clock size={10} />
                              P
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="order-type-cell">
                        <div className="order-type-badge-table">
                          {order.orderType === 'Tarpaulin' && <Package size={14} />}
                          {order.orderType === 'Repairs' && <Wrench size={14} />}
                          {order.orderType !== 'Tarpaulin' && order.orderType !== 'Repairs' && <Package size={14} />}
                          <span>{order.orderType}</span>
                        </div>
                      </td>
                      <td>{order.customerName || '-'}</td>
                      <td>{order.customerContact || '-'}</td>
                      <td className="amount-cell">{formatPeso(order.totalAmount)}</td>
                      <td className="amount-cell">{formatPeso(order.amountPaid)}</td>
                      <td className={`amount-cell ${order.balance > 0 ? 'has-balance' : 'no-balance'}`}>
                        {formatPeso(order.balance)}
                      </td>
                      <td>
                        <span className={`status-badge-table status-${order.status}`}>
                          <span className={`status-dot status-${order.status}`}></span>
                          {order.status}
                        </span>
                      </td>
                      <td className="employee-cell">{order.receivedBy || '-'}</td>
                      <td className="employee-cell">{assignedArtist}</td>
                      <td className="date-cell">{formatDate(order.createdAt)}</td>
                    </tr>
                  )
                }                  )}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  )
}

// View Order Page Component
function ViewOrderPage({ order, onBack }) {
  const orderData = order.orderData || {}
  const formatPeso = (amount) => {
    return `₱${Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatDateShort = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="view-container employee-dashboard-full">
      <div className="view-header view-header-compact">
        <div className="header-content">
          <button className="btn-back-order-compact" onClick={onBack}>
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
          <div className="header-icon-wrapper">
            <Package size={24} />
          </div>
          <div>
            <h1>Order #{order.id} • {order.customerName || 'Customer'}</h1>
            <p>
              {order.orderType} • {order.isPahabol ? 'Rush Order' : 'Regular Order'} • {formatPeso(order.totalAmount)} • Status: {order.status}
            </p>
          </div>
        </div>
      </div>

      <div className="employee-dashboard-main">
        <div className="employee-dashboard-wrapper">

          {/* Quick Stats Row */}
          <div className="quick-stats-row">
            <div className="quick-stat-card">
              <div className="quick-stat-icon payroll">
                <DollarSign size={20} />
              </div>
              <div className="quick-stat-content">
                <span className="quick-stat-label">Total Amount</span>
                <span className="quick-stat-value">{formatPeso(order.totalAmount)}</span>
              </div>
            </div>
            <div className="quick-stat-card">
              <div className="quick-stat-icon payroll-count">
                <CreditCard size={20} />
              </div>
              <div className="quick-stat-content">
                <span className="quick-stat-label">Amount Paid</span>
                <span className="quick-stat-value">{formatPeso(order.amountPaid)}</span>
              </div>
            </div>
            <div className="quick-stat-card">
              <div className="quick-stat-icon cash-advance">
                <Wallet size={20} />
              </div>
              <div className="quick-stat-content">
                <span className="quick-stat-label">Balance</span>
                <span className={`quick-stat-value ${order.balance > 0 ? 'warning' : 'success'}`}>
                  {formatPeso(order.balance)}
                </span>
              </div>
            </div>
            <div className="quick-stat-card">
              <div className="quick-stat-icon day-offs">
                <Package size={20} />
              </div>
              <div className="quick-stat-content">
                <span className="quick-stat-label">Status</span>
                <span className="quick-stat-value">{order.status}</span>
              </div>
            </div>
          </div>

          {/* Order Information and Tarpaulin Specifications Grid */}
          <div className="order-specs-grid">
            {/* Order Information Card */}
            <div className="employee-feature-card payroll-card">
              <div className="feature-card-header">
                <div className="feature-card-icon payroll">
                  <Package size={24} />
                </div>
                <div>
                  <h3>Order Information</h3>
                  <p>Complete order details</p>
                </div>
              </div>
              <div className="feature-card-body">
                <div className="payroll-amount-display">
                  <span className="payroll-label">Order Type</span>
                  <span className="payroll-amount">{order.orderType}</span>
                </div>
                <div className="payroll-details-grid">
                  <div className="payroll-detail-item">
                    <span className="detail-label">Order Date</span>
                    <span className="detail-value">{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="payroll-detail-item">
                    <span className="detail-label">Last Updated</span>
                    <span className="detail-value">{formatDate(order.updatedAt || order.createdAt)}</span>
                  </div>
                  <div className="payroll-detail-item">
                    <span className="detail-label">Status</span>
                    <span className={`detail-value status-${order.status}`}>{order.status}</span>
                  </div>
                  <div className="payroll-detail-item">
                    <span className="detail-label">Received By</span>
                    <span className="detail-value">{order.receivedBy || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tarpaulin Specifications Card */}
            {order.orderType === 'Tarpaulin' && (
              <div className="employee-feature-card day-offs-card">
                <div className="feature-card-header">
                  <div className="feature-card-icon day-offs">
                    <Package size={24} />
                  </div>
                  <div>
                    <h3>Tarpaulin Specifications</h3>
                    <p>Product details and requirements</p>
                  </div>
                </div>
                <div className="feature-card-body">
                  <div className="employee-info-list">
                    {orderData.width && orderData.height && (
                      <div className="info-list-item">
                        <span className="info-item-label">Dimensions</span>
                        <span className="info-item-value">{orderData.width} × {orderData.height}</span>
                      </div>
                    )}
                    <div className="info-list-item">
                      <span className="info-item-label">Orientation</span>
                      <span className="info-item-value">{orderData.orientation || 'Landscape'}</span>
                    </div>
                    <div className="info-list-item">
                      <span className="info-item-label">Quantity</span>
                      <span className="info-item-value">{orderData.quantity || '1'} pc(s)</span>
                    </div>
                    {orderData.eventType && (
                      <div className="info-list-item">
                        <span className="info-item-label">Event Type</span>
                        <span className="info-item-value">{orderData.eventType}</span>
                      </div>
                    )}
                    {orderData.backgroundColor && (
                      <div className="info-list-item">
                        <span className="info-item-label">Background Color</span>
                        <span className="info-item-value">
                          <span style={{ display: 'inline-block', width: '16px', height: '16px', background: orderData.backgroundColor, borderRadius: '4px', marginRight: '8px', verticalAlign: 'middle' }}></span>
                          {orderData.backgroundColor}
                        </span>
                      </div>
                    )}
                    {orderData.textColor && (
                      <div className="info-list-item">
                        <span className="info-item-label">Text Color</span>
                        <span className="info-item-value">
                          <span style={{ display: 'inline-block', width: '16px', height: '16px', background: orderData.textColor, borderRadius: '4px', marginRight: '8px', verticalAlign: 'middle' }}></span>
                          {orderData.textColor}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Customer Information and Team Assignment Grid */}
          <div className="customer-team-grid">
            {/* Customer Information */}
            <div className="employee-feature-card history-card">
              <div className="feature-card-header">
                <div className="feature-card-icon history">
                  <User size={24} />
                </div>
                <div>
                  <h3>Customer Information</h3>
                  <p>Contact and business details</p>
                </div>
              </div>
              <div className="feature-card-body">
                <div className="employee-info-list">
                  <div className="info-list-item">
                    <span className="info-item-label">Customer Name</span>
                    <span className="info-item-value">{order.customerName || '-'}</span>
                  </div>
                  <div className="info-list-item">
                    <span className="info-item-label">Contact Number</span>
                    <span className="info-item-value">{order.customerContact || '-'}</span>
                  </div>
                  {orderData.email && (
                    <div className="info-list-item">
                      <span className="info-item-label">Email</span>
                      <span className="info-item-value">{orderData.email}</span>
                    </div>
                  )}
                  {orderData.businessName && (
                    <div className="info-list-item">
                      <span className="info-item-label">Business Name</span>
                      <span className="info-item-value">{orderData.businessName}</span>
                    </div>
                  )}
                  {orderData.address && (
                    <div className="info-list-item">
                      <span className="info-item-label">Address</span>
                      <span className="info-item-value">{orderData.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Team Assignment */}
            <div className="employee-feature-card access-card">
              <div className="feature-card-header">
                <div className="feature-card-icon access">
                  <Users size={24} />
                </div>
                <div>
                  <h3>Team Assignment</h3>
                  <p>Order assignment details</p>
                </div>
              </div>
              <div className="feature-card-body">
                <div className="access-info-enhanced">
                  <div className="access-item-enhanced">
                    <div className="access-item-header-enhanced">
                      <User size={18} />
                      <span>Received By</span>
                    </div>
                    <div className="access-value-enhanced">
                      <code>{order.receivedBy || 'N/A'}</code>
                    </div>
                  </div>
                  <div className="access-item-enhanced">
                    <div className="access-item-header-enhanced">
                      <Paintbrush size={18} />
                      <span>Assigned Artist</span>
                    </div>
                    <div className="access-value-enhanced">
                      <code>{orderData.assignedArtist || 'Not Assigned'}</code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Summary - Full Width */}
          <div className="payment-summary-full">
            <div className="employee-feature-card cash-advance-card">
              <div className="feature-card-header">
                <div className="feature-card-icon cash-advance">
                  <Wallet size={24} />
                </div>
                <div>
                  <h3>Payment Summary</h3>
                  <p>Payment details and timeline</p>
                </div>
              </div>
              <div className="feature-card-body">
                <div className="cash-advance-display">
                  <span className="cash-advance-label">Balance Due</span>
                  <span className={`cash-advance-amount ${order.balance > 0 ? 'warning' : 'success'}`}>
                    {formatPeso(order.balance)}
                  </span>
                </div>
                <div className="payroll-details-grid" style={{ marginTop: '12px' }}>
                  <div className="payroll-detail-item">
                    <span className="detail-label">Total Amount</span>
                    <span className="detail-value">{formatPeso(order.totalAmount)}</span>
                  </div>
                  <div className="payroll-detail-item">
                    <span className="detail-label">Amount Paid</span>
                    <span className="detail-value">{formatPeso(order.amountPaid)}</span>
                  </div>
                  <div className="payroll-detail-item">
                    <span className="detail-label">Payment Method</span>
                    <span className="detail-value">{orderData.paymentMethod || 'Cash'}</span>
                  </div>
                  <div className="payroll-detail-item">
                    <span className="detail-label">Payment Status</span>
                    <span className={`detail-value ${order.balance === 0 ? 'success' : order.amountPaid > 0 ? 'warning' : ''}`}>
                      {order.balance === 0 ? 'Fully Paid' : order.amountPaid > 0 ? 'Partially Paid' : 'Unpaid'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes & Instructions */}
          {(orderData.designNotes || orderData.specialInstructions) && (
            <div className="notes-instructions-full">
              <div className="employee-feature-card info-card">
                <div className="feature-card-header">
                  <div className="feature-card-icon info">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3>Notes & Instructions</h3>
                    <p>Design notes and special requirements</p>
                  </div>
                </div>
                <div className="feature-card-body">
                  {orderData.designNotes && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '11px', color: '#999', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Design Notes</div>
                      <div style={{ fontSize: '13px', color: '#fff', lineHeight: '1.6' }}>{orderData.designNotes}</div>
                    </div>
                  )}
                  {orderData.specialInstructions && (
                    <div>
                      <div style={{ fontSize: '11px', color: '#999', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Special Instructions</div>
                      <div style={{ fontSize: '13px', color: '#fff', lineHeight: '1.6' }}>{orderData.specialInstructions}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Sublimation Orders View
function SublimationOrdersView() {
  return (
    <div className="view-container">
      <div className="view-header">
        <div className="header-content">
          <div className="header-icon-wrapper">
            <Image size={24} />
          </div>
          <div>
            <h1>Sublimation Orders</h1>
            <p>Manage sublimation orders</p>
          </div>
        </div>
      </div>
      <div className="content-placeholder">
        <Palette size={48} />
        <p>Sublimation orders will be here</p>
      </div>
    </div>
  )
}

// Sublimation Listing View
function SublimationListingView() {
  return (
    <div className="view-container">
      <div className="view-header">
        <div className="header-content">
          <div className="header-icon-wrapper">
            <List size={24} />
          </div>
          <div>
            <h1>Sublimation Listing</h1>
            <p>View all sublimation products</p>
          </div>
        </div>
      </div>
      <div className="content-placeholder">
        <List size={48} />
        <p>Sublimation product listing will be here</p>
      </div>
    </div>
  )
}

// Customer Profile View
function CustomerProfileView() {
  return (
    <div className="view-container">
      <div className="view-header">
        <div className="header-content">
          <div className="header-icon-wrapper">
            <User size={24} />
          </div>
          <div>
            <h1>Customer Profile</h1>
            <p>Manage customer information and profiles</p>
          </div>
        </div>
      </div>
      <div className="content-placeholder">
        <User size={48} />
        <p>Customer profile management will be here</p>
      </div>
    </div>
  )
}

// Customer Reports View
function CustomerReportsView() {
  return (
    <div className="view-container">
      <div className="view-header">
        <div className="header-content">
          <div className="header-icon-wrapper">
            <FileText size={24} />
          </div>
          <div>
            <h1>Customer Reports</h1>
            <p>View and analyze customer reports</p>
          </div>
        </div>
      </div>
      <div className="content-placeholder">
        <FileText size={48} />
        <p>Customer reports and analytics will be here</p>
      </div>
    </div>
  )
}

export default GraphicArtistDashboard
