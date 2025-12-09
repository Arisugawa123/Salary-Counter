import { useState, useEffect, useCallback } from 'react'
import { 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  DollarSign,
  CreditCard,
  X,
  Calculator,
  Printer,
  CheckCircle,
  RotateCcw,
  Settings,
  Calendar,
  Clock,
  Users,
  Package,
  Undo2,
  Percent,
  Save,
  FileText,
  Lock,
  Scan,
  LayoutDashboard,
  History,
  Search,
  XCircle,
  Receipt,
  TrendingUp,
  BarChart3,
  Box,
  Database,
  Archive,
  FolderPlus,
  Warehouse,
  Timer
} from 'lucide-react'
import { fetchOrders, updateOrder } from '../lib/supabase'
import Sidebar from './Sidebar'
import Header from './Header'
import './CashierDashboard.css'

// Format number with commas and peso sign
const formatPeso = (amount) => {
  return `₱${Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function CashierDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [currentView, setCurrentView] = useState('pos')
  const [cart, setCart] = useState([])
  const [productInput, setProductInput] = useState('')
  const [priceInput, setPriceInput] = useState('')
  const [quantityInput, setQuantityInput] = useState(1)
  const [showSettings, setShowSettings] = useState(false)
  const [activeSettingsMenu, setActiveSettingsMenu] = useState('printer')
  const [customerPaid, setCustomerPaid] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [currentDateTime, setCurrentDateTime] = useState(new Date())
  const [customerCounter, setCustomerCounter] = useState(1)
  const [totalItemsSold, setTotalItemsSold] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showPaymentMode, setShowPaymentMode] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [discountAmount, setDiscountAmount] = useState('')
  const [discountAccessCode, setDiscountAccessCode] = useState('')
  const [discountUnlocked, setDiscountUnlocked] = useState(false)
  const [discountError, setDiscountError] = useState('')
  const [customDownpaymentOrder, setCustomDownpaymentOrder] = useState(null)
  
  // Settings
  const [selectedPrinter, setSelectedPrinter] = useState(localStorage.getItem('selectedPrinter') || 'default')
  const [autoPrint, setAutoPrint] = useState(localStorage.getItem('autoPrint') === 'true')
  const [taxRate, setTaxRate] = useState(localStorage.getItem('taxRate') || '0')
  const [receiptFooter, setReceiptFooter] = useState(localStorage.getItem('receiptFooter') || 'Thank you for your purchase!')
  
  // Cashier menu items - Main
  const cashierMenuItems = [
    { id: 'pos', icon: ShoppingCart, label: 'Point of Sale' }
  ]

  // Cashier menu items - Transactions
  const transactionsMenuItems = [
    { id: 'pending-payments', icon: CreditCard, label: 'Pending Payments' },
    { id: 'daily-sales', icon: TrendingUp, label: 'Daily Sales' }
  ]

  // Cashier menu items - Reports
  const reportsMenuItems = [
    { id: 'receipts', icon: Receipt, label: 'Receipts' },
    { id: 'reports', icon: BarChart3, label: 'Sales Reports' }
  ]

  // Cashier menu items - Production
  const productionMenuItems = [
    { id: 'add-production', icon: Plus, label: 'Add Production' },
    { id: 'production-storage', icon: Warehouse, label: 'Production Storage' },
    { id: 'production-history', icon: Archive, label: 'Production History' }
  ]

  // Cashier menu items - Settings
  const sidebarSettingsItems = [
    { id: 'settings', icon: Settings, label: 'Settings' }
  ]

  // Handle settings click from sidebar
  const handleMenuClick = (viewId) => {
    if (viewId === 'settings') {
      setShowSettings(true)
      setCurrentView('pos') // Keep current view as pos but show settings
    } else {
      setCurrentView(viewId)
      setShowSettings(false)
    }
  }

  // Settings menu items (for settings submenu)
  const settingsMenuItems = [
    { id: 'printer', icon: Printer, label: 'Printer Settings' },
    { id: 'general', icon: Settings, label: 'General Settings' },
    { id: 'receipt', icon: FileText, label: 'Receipt Settings' },
    { id: 'about', icon: Package, label: 'About System' }
  ]

  // Handle view change from sidebar
  useEffect(() => {
    if (currentView === 'pos') {
      setShowSettings(false)
    } else if (currentView === 'pending-payments' ||
               currentView === 'daily-sales' ||
               currentView === 'receipts' ||
               currentView === 'reports') {
      setShowSettings(false)
    }
    // Load orders when pending payments view is active
    if (currentView === 'pending-payments') {
      loadOrders()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView])

  // Shop orders from database
  const [shopOrders, setShopOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)

  // Session start time
  const [sessionStartTime] = useState(new Date())

  // Update date and time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Calculate session duration
  const getSessionDuration = () => {
    const now = new Date()
    const diff = now - sessionStartTime
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  // Load orders function
  const loadOrders = useCallback(async () => {
    try {
      setLoadingOrders(true)
      const orders = await fetchOrders()
      
      // Map database orders to shop orders format
      const mappedOrders = orders.map(order => {
        const orderData = order.orderData || {}
        return {
          id: order.id,
          orderNumber: `SO-${String(order.id).padStart(3, '0')}`,
          service: order.orderType || 'N/A',
          customer: order.customerName || 'N/A',
          status: order.status || 'Pending Payment',
          totalAmount: parseFloat(order.totalAmount || 0),
          paidAmount: parseFloat(order.amountPaid || 0),
          balance: parseFloat(order.balance || 0),
          date: order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          orderId: order.id, // Keep original ID for reference
          isPahabol: order.isPahabol || false,
          assignedArtist: orderData.assignedArtist || 'N/A',
          downPayment: parseFloat(orderData.downPayment || 0) // Extract down payment from orderData
        }
      })
      
      setShopOrders(mappedOrders)
    } catch (error) {
      console.error('Error loading orders:', error)
      if (currentView === 'pending-payments') {
        alert('Failed to load orders. Please try again.')
      }
    } finally {
      setLoadingOrders(false)
    }
  }, [currentView])

  // Fetch orders from database on mount and when shop orders view is shown
  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  // Add item to cart
  const addToCart = () => {
    if (!productInput || !priceInput || quantityInput <= 0) {
      alert('Please fill in all fields')
      return
    }

    const newItem = {
      id: Date.now(),
      name: productInput,
      price: parseFloat(priceInput),
      quantity: parseInt(quantityInput),
      total: parseFloat(priceInput) * parseInt(quantityInput)
    }

    setCart([...cart, newItem])
    setProductInput('')
    setPriceInput('')
    setQuantityInput(1)
  }

  // Remove item from cart
  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id))
  }

  // Update quantity
  const updateQuantity = (id, newQuantity) => {
    if (newQuantity <= 0) return
    setCart(cart.map(item => 
      item.id === id 
        ? { ...item, quantity: newQuantity, total: item.price * newQuantity }
        : item
    ))
  }

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
  
  // Calculate discount (amount only)
  const discount = discountAmount ? parseFloat(discountAmount) : 0
  
  // For custom downpayment, total is the amount paid (if entered), otherwise 0
  const total = customDownpaymentOrder 
    ? (customerPaid ? parseFloat(customerPaid) : 0)
    : Math.max(0, subtotal - discount)
  const change = customerPaid ? parseFloat(customerPaid) - total : 0
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Clear cart
  const clearCart = () => {
    if (cart.length > 0) {
      if (window.confirm('Clear all items from cart?')) {
        setCart([])
        setCustomerPaid('')
      }
    }
  }

  // Process payment - toggle payment mode
  const processPayment = () => {
    if (cart.length === 0) {
      alert('Cart is empty')
      return
    }
    setShowPaymentMode(true)
  }

  // Verify discount access code
  const verifyDiscountAccess = async () => {
    if (!discountAccessCode.trim()) {
      setDiscountError('Please enter access code')
      return
    }

    try {
      const { supabase } = await import('../lib/supabase')
      const { data, error } = await supabase
        .from('employees')
        .select('access_code')
        .eq('access_code', discountAccessCode.trim())
        .single()

      if (error || !data) {
        setDiscountError('Invalid access code')
        setDiscountAccessCode('')
        return
      }

      setDiscountUnlocked(true)
      setDiscountError('')
      setDiscountAccessCode('')
    } catch (err) {
      setDiscountError('Error verifying access code')
      console.error(err)
    }
  }

  // Cancel payment mode
  const cancelPayment = () => {
    setShowPaymentMode(false)
    setCustomerPaid('')
    setDiscountAmount('')
    setDiscountAccessCode('')
    setDiscountUnlocked(false)
    setDiscountError('')
    setCustomDownpaymentOrder(null)
  }

  // Complete transaction
  const completeTransaction = async () => {
    const paymentAmount = parseFloat(customerPaid || 0)
    
    if (!customerPaid || paymentAmount <= 0) {
      alert('Please enter payment amount')
      return
    }

    // For custom downpayment, validate against balance
    if (customDownpaymentOrder) {
      if (paymentAmount > customDownpaymentOrder.balance) {
        alert('Payment amount cannot exceed the balance')
        return
      }
    } else {
      // For regular payments, validate against total
      if (paymentAmount < total) {
        alert('Insufficient payment amount')
        return
      }
    }

    try {
      // Handle custom downpayment
      if (customDownpaymentOrder) {
        // Fetch the latest order data from database
        const { fetchOrders } = await import('../lib/supabase')
        const allOrders = await fetchOrders()
        const currentOrder = allOrders.find(o => o.id === customDownpaymentOrder.orderId)
        
        if (!currentOrder) {
          alert('Order not found')
          return
        }

        const currentAmountPaid = parseFloat(currentOrder.amountPaid || 0)
        const totalAmount = parseFloat(currentOrder.totalAmount || 0)
        const newPaidAmount = currentAmountPaid + paymentAmount
        const newBalance = totalAmount - newPaidAmount
        
        // Ensure balance doesn't go negative
        const finalBalance = Math.max(0, newBalance)
        const finalPaidAmount = finalBalance === 0 ? totalAmount : newPaidAmount
        
        await updateOrder(customDownpaymentOrder.orderId, {
          amountPaid: finalPaidAmount,
          balance: finalBalance,
          status: finalBalance > 0 ? 'Pending Payment' : 'Paid'
        })
      } else {
        // Update orders in Supabase if there are order items in cart
        const orderItems = cart.filter(item => item.orderId)
        
        for (const item of orderItems) {
          // Fetch the latest order data from database to ensure we have current values
          const { fetchOrders } = await import('../lib/supabase')
          const allOrders = await fetchOrders()
          const currentOrder = allOrders.find(o => o.id === item.orderId)
          
          if (!currentOrder) {
            console.error(`Order ${item.orderId} not found`)
            continue
          }

          const currentAmountPaid = parseFloat(currentOrder.amountPaid || 0)
          const currentBalance = parseFloat(currentOrder.balance || 0)
          const totalAmount = parseFloat(currentOrder.totalAmount || 0)

          if (item.isDownPayment) {
            // Process downpayment - add payment amount to current paid amount
            const paymentAmount = item.total
            const newPaidAmount = currentAmountPaid + paymentAmount
            const newBalance = totalAmount - newPaidAmount
            
            // Ensure balance doesn't go negative
            const finalBalance = Math.max(0, newBalance)
            const finalPaidAmount = finalBalance === 0 ? totalAmount : newPaidAmount
            
            await updateOrder(item.orderId, {
              amountPaid: finalPaidAmount,
              balance: finalBalance,
              status: finalBalance > 0 ? 'Pending Payment' : 'Paid'
            })
          } else {
            // Process full payment
            await updateOrder(item.orderId, {
              amountPaid: totalAmount,
              balance: 0,
              status: 'Paid'
            })
          }
        }
      }

      // Update statistics
      const itemsInTransaction = customDownpaymentOrder ? 0 : cart.reduce((sum, item) => sum + item.quantity, 0)
      setTotalItemsSold(prev => prev + itemsInTransaction)
      setCustomerCounter(prev => prev + 1)

      // Reload orders if we're in pending payments view
      if (currentView === 'pending-payments') {
        loadOrders()
      }

      const paymentType = customDownpaymentOrder || cart.some(item => item.isDownPayment) ? 'Down Payment' : 'Payment'
      alert(`Transaction completed!\n${paymentType}: ${formatPeso(paymentAmount)}\nPaid: ${formatPeso(customerPaid)}\nChange: ${formatPeso(change)}`)
      
      setCart([])
      setCustomerPaid('')
      setDiscountAmount('')
      setDiscountAccessCode('')
      setDiscountUnlocked(false)
      setDiscountError('')
      setCustomDownpaymentOrder(null)
      setShowPaymentMode(false)

      // Auto-print if enabled
      if (autoPrint) {
        setTimeout(() => {
          window.print()
        }, 500)
      }
    } catch (error) {
      console.error('Error completing transaction:', error)
      alert('Failed to complete transaction. Please try again.')
    }
  }

  // Format date and time
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
  }

  // Print receipt
  const printReceipt = () => {
    if (cart.length === 0) {
      alert('Cart is empty')
      return
    }
    
    // In kiosk mode with --kiosk-printing flag, this will auto-print to default printer
    window.print()
  }

  // Save settings
  const saveSettings = () => {
    localStorage.setItem('selectedPrinter', selectedPrinter)
    localStorage.setItem('autoPrint', autoPrint.toString())
    localStorage.setItem('taxRate', taxRate)
    localStorage.setItem('receiptFooter', receiptFooter)
    alert('Settings saved successfully!')
  }

  // Toggle settings view
  const toggleSettings = () => {
    setShowSettings(!showSettings)
    if (!showSettings) {
      setActiveSettingsMenu('printer')
    } else {
      setCurrentView('pos')
    }
  }

  // Add shop order to cart
  const addOrderToCart = (order, isDownPayment = false) => {
    if (order.balance <= 0) {
      alert('This order is already fully paid')
      return
    }

    const paymentAmount = isDownPayment && order.downPayment > 0 ? order.downPayment : order.balance
    const paymentType = isDownPayment ? 'downpayment' : 'full'

    const newItem = {
      id: Date.now(),
      name: `${order.service} - ${order.orderNumber}`,
      price: paymentAmount,
      quantity: 1,
      total: paymentAmount,
      orderReference: order.orderNumber,
      orderId: order.orderId,
      paymentType: paymentType,
      isDownPayment: isDownPayment
    }

    setCart([...cart, newItem])
    const amountText = isDownPayment ? `Down Payment: ${formatPeso(paymentAmount)}` : `Balance: ${formatPeso(paymentAmount)}`
    alert(`Added ${order.service} (${amountText}) to cart`)
  }

  // Handle full payment button click - add to cart and redirect to POS
  const handlePaymentButtonClick = (order) => {
    if (order.balance <= 0) {
      alert('This order is already fully paid')
      return
    }

    // Check if order is already in cart
    const existingInCart = cart.find(item => item.orderReference === order.orderNumber)
    if (existingInCart) {
      alert(`Order ${order.orderNumber} is already in the cart`)
      setCurrentView('pos')
      return
    }

    // Add order to cart for full payment
    addOrderToCart(order, false)
    
    // Redirect to Point of Sale
    setCurrentView('pos')
    setShowSettings(false)
  }

  // Handle downpayment button click - add to cart with downpayment amount and redirect to POS
  const handleDownpaymentButtonClick = (order) => {
    if (order.balance <= 0) {
      alert('This order is already fully paid')
      return
    }

    if (!order.downPayment || order.downPayment <= 0) {
      alert('No down payment amount specified for this order')
      return
    }

    // Check if order is already in cart
    const existingInCart = cart.find(item => item.orderReference === order.orderNumber)
    if (existingInCart) {
      alert(`Order ${order.orderNumber} is already in the cart`)
      setCurrentView('pos')
      return
    }

    // Add order to cart for downpayment
    addOrderToCart(order, true)
    
    // Redirect to Point of Sale
    setCurrentView('pos')
    setShowSettings(false)
  }

  // Handle submit downpayment button click - redirect to POS for custom amount entry
  const handleSubmitDownpaymentButtonClick = (order) => {
    if (order.balance <= 0) {
      alert('This order is already fully paid')
      return
    }

    // Check if order is already in cart
    const existingInCart = cart.find(item => item.orderReference === order.orderNumber)
    if (existingInCart) {
      alert(`Order ${order.orderNumber} is already in the cart`)
      setCurrentView('pos')
      return
    }

    // Set custom downpayment mode and redirect to POS
    setCustomDownpaymentOrder(order)
    setShowPaymentMode(true)
    setCurrentView('pos')
    setShowSettings(false)
  }

  // Process downpayment for Tarpaulin and Sublimation orders
  const processDownpayment = async (order) => {
    if (!order || order.balance <= 0) {
      alert('This order is already fully paid or invalid')
      return
    }

    const downpaymentAmount = prompt(
      `Enter downpayment amount for ${order.orderNumber}\n` +
      `Balance: ${formatPeso(order.balance)}\n` +
      `Total: ${formatPeso(order.totalAmount)}`
    )

    if (!downpaymentAmount || isNaN(parseFloat(downpaymentAmount)) || parseFloat(downpaymentAmount) <= 0) {
      return
    }

    const amount = parseFloat(downpaymentAmount)
    if (amount > order.balance) {
      alert('Downpayment amount cannot exceed the balance')
      return
    }

    try {
      const newPaidAmount = order.paidAmount + amount
      const newBalance = order.totalAmount - newPaidAmount
      
      await updateOrder(order.id, {
        amountPaid: newPaidAmount,
        balance: newBalance,
        status: newBalance > 0 ? 'Pending Payment' : 'Paid'
      })

      alert(`Downpayment of ${formatPeso(amount)} processed successfully!`)
      loadOrders() // Reload orders to reflect changes
    } catch (error) {
      console.error('Error processing downpayment:', error)
      alert('Failed to process downpayment. Please try again.')
    }
  }

  // Process full payment
  const processFullPayment = async (order) => {
    if (!order || order.balance <= 0) {
      alert('This order is already fully paid')
      return
    }

    const confirmPayment = window.confirm(
      `Process full payment for ${order.orderNumber}?\n` +
      `Total Amount: ${formatPeso(order.totalAmount)}\n` +
      `Already Paid: ${formatPeso(order.paidAmount)}\n` +
      `Balance: ${formatPeso(order.balance)}\n\n` +
      `This will mark the order as fully paid.`
    )

    if (!confirmPayment) {
      return
    }

    try {
      await updateOrder(order.id, {
        amountPaid: order.totalAmount,
        balance: 0,
        status: 'Paid'
      })

      alert(`Full payment processed successfully!`)
      loadOrders() // Reload orders to reflect changes
    } catch (error) {
      console.error('Error processing full payment:', error)
      alert('Failed to process payment. Please try again.')
    }
  }

  // Parse receipt number to extract order ID
  // Receipt format: 25-200-049243 (where 049243 is the padded order ID)
  const parseReceiptNumber = (receiptNo) => {
    // Remove any whitespace
    const cleaned = receiptNo.trim()
    
    // Check if it matches the format 25-200-XXXXXX
    const match = cleaned.match(/^25-200-(\d+)$/)
    if (match) {
      // Extract the order ID (remove leading zeros)
      const orderId = parseInt(match[1], 10)
      return orderId
    }
    
    // If it's just a number, try to use it directly
    const numericId = parseInt(cleaned, 10)
    if (!isNaN(numericId)) {
      return numericId
    }
    
    return null
  }

  // Handle search and barcode scan
  const handleSearchKeyPress = async (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault()
      
      // Check if it's a barcode format (25-200-XXXXXX)
      const orderId = parseReceiptNumber(searchQuery)
      
      if (orderId) {
        // It's a barcode, try to find and add order
        try {
          let order = shopOrders.find(o => o.orderId === orderId || o.id === orderId)
          
          if (!order) {
            const orders = await fetchOrders()
            const mappedOrders = orders.map(order => ({
              id: order.id,
              orderNumber: `SO-${String(order.id).padStart(3, '0')}`,
              service: order.orderType || 'N/A',
              customer: order.customerName || 'N/A',
              status: order.status || 'Pending Payment',
              totalAmount: parseFloat(order.totalAmount || 0),
              paidAmount: parseFloat(order.amountPaid || 0),
              balance: parseFloat(order.balance || 0),
              date: order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              orderId: order.id,
              isPahabol: order.isPahabol || false
            }))
            
            order = mappedOrders.find(o => o.orderId === orderId || o.id === orderId)
            setShopOrders(mappedOrders)
          }

          if (order && order.balance > 0) {
            const existingInCart = cart.find(item => item.orderReference === order.orderNumber)
            if (!existingInCart) {
              addOrderToCart(order)
              setSearchQuery('')
            } else {
              alert(`Order ${order.orderNumber} is already in the cart`)
            }
          } else if (order && order.balance <= 0) {
            alert('This order is already fully paid')
          } else {
            alert(`Order not found for barcode: ${searchQuery}`)
          }
        } catch (error) {
          console.error('Error processing barcode:', error)
          alert('Error processing barcode. Please try again.')
        }
      } else {
        // Regular search - filter products/orders
        // For now, just search in shop orders
        const filtered = shopOrders.filter(order => 
          order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.customer.toLowerCase().includes(searchQuery.toLowerCase())
        )
        setSearchResults(filtered.map(order => ({
          id: order.id,
          name: `${order.orderNumber} - ${order.service} (${formatPeso(order.balance)})`
        })))
      }
    }
  }

  return (
    <div className="cashier-dashboard-wrapper">
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        menuItems={cashierMenuItems}
        transactionsItems={transactionsMenuItems}
        reportsItems={reportsMenuItems}
        productionItems={productionMenuItems}
        settingsItems={sidebarSettingsItems}
        currentView={showSettings ? 'settings' : currentView}
        onMenuClick={handleMenuClick}
      />
      <div className={`cashier-main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Header 
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
        <div className="cashier-dashboard">
          {/* Main Content Area */}
          <div className={`cashier-content ${showSettings ? 'settings-active' : ''} ${currentView !== 'pos' ? 'view-mode' : ''}`}>
        {/* Left Panel - Cart or Settings Menu - Only show for POS or Settings */}
        {(currentView === 'pos' || showSettings) && (
        <div className={`cashier-left-panel ${showSettings ? 'settings-mode' : ''}`}>
          {showSettings ? (
            <>
              <div className="panel-header">
                <Settings size={24} />
                <h2>Settings</h2>
              </div>
              
              <div className="settings-menu">
                {settingsMenuItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      className={`settings-menu-item ${activeSettingsMenu === item.id ? 'active' : ''}`}
                      onClick={() => setActiveSettingsMenu(item.id)}
                    >
                      <Icon size={20} />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <>
              <div className="panel-header-modern">
                <div className="panel-header-content">
                  <div className="panel-header-left">
                    <div className="cart-icon-wrapper">
                      <ShoppingCart size={22} />
                    </div>
                    <div className="panel-header-text">
                      <h2>Cart</h2>
                      <span className="item-count-modern">{cart.length} {cart.length === 1 ? 'item' : 'items'}</span>
                    </div>
                  </div>
                  {cart.length > 0 && (
                    <button 
                      className="btn-clear-cart-modern"
                      onClick={clearCart}
                      title="Clear cart"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Modern Search Bar */}
              <div className="search-section-modern">
                <div className="search-input-wrapper-modern">
                  <Search size={20} className="search-icon-modern" />
                  <input
                    type="text"
                    placeholder="Search products, orders, or scan barcode..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      if (e.target.value.trim() === '') {
                        setSearchResults([])
                      }
                    }}
                    onKeyPress={handleSearchKeyPress}
                    className="search-input-modern"
                    autoFocus
                  />
                  {searchQuery && (
                    <button 
                      className="search-clear-btn"
                      onClick={() => setSearchQuery('')}
                    >
                      <XCircle size={18} />
                    </button>
                  )}
                </div>
                {searchQuery && searchResults.length > 0 && (
                  <div className="search-results-dropdown">
                    {searchResults.map((result) => {
                      const order = shopOrders.find(o => o.id === result.id)
                      return (
                        <div 
                          key={result.id} 
                          className="search-result-item"
                          onClick={() => {
                            if (order && order.balance > 0) {
                              addOrderToCart(order)
                              setSearchQuery('')
                              setSearchResults([])
                            }
                          }}
                        >
                          <div className="search-result-name">{result.name}</div>
                          {order && order.balance > 0 && (
                            <div className="search-result-action">
                              <ShoppingCart size={16} />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

          {/* Modern Cart Items List */}
          <div className="cart-items-container-modern">
            {cart.length === 0 ? (
              <div className="empty-cart-modern">
                <div className="empty-cart-icon-wrapper">
                  <ShoppingCart size={56} />
                </div>
                <h3>Your cart is empty</h3>
                <p>Search for products or scan barcodes to add items</p>
              </div>
            ) : (
              <div className="cart-items-list-modern">
                {cart.map(item => (
                  <div key={item.id} className="cart-item-card-modern">
                    <div className="cart-item-content">
                      <div className="cart-item-info">
                        <h4 className="cart-item-name">{item.name}</h4>
                        <div className="cart-item-price-row">
                          <span className="cart-item-unit-price">{formatPeso(item.price)} each</span>
                          <span className="cart-item-total-price">{formatPeso(item.total)}</span>
                        </div>
                      </div>
                      <div className="cart-item-actions">
                        <div className="quantity-controls-modern">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="qty-btn-modern qty-btn-decrease"
                            disabled={item.quantity <= 1}
                          >
                            <Minus size={16} />
                          </button>
                          <span className="qty-display-modern">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="qty-btn-modern qty-btn-increase"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="btn-remove-modern"
                          title="Remove item"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modern Cart Summary */}
          {cart.length > 0 && (
            <div className="cart-summary-modern">
              <div className="summary-section-modern">
                <div className="summary-line-modern">
                  <span className="summary-label">Subtotal</span>
                  <span className="summary-value">{formatPeso(subtotal)}</span>
                </div>
                <div className="summary-divider-modern"></div>
                <div className="summary-line-modern summary-total-modern">
                  <span className="summary-label-total">Total</span>
                  <span className="summary-value-total">{formatPeso(total)}</span>
                </div>
              </div>
            </div>
          )}
            </>
          )}
        </div>
        )}

        {/* Right Panel - Actions or Settings Content - Only show for POS or Settings */}
        {(currentView === 'pos' || showSettings) && (
          <div className="cashier-right-panel">
            {!showSettings && (
              <div className="right-panel-header-modern">
                <div className="panel-header-content-modern">
                  <div className="header-title-section">
                    <Calculator size={24} className="header-icon-modern" />
                    <div>
                      <h2 className="header-title-modern">Actions & Controls</h2>
                      <p className="header-subtitle-modern">Manage transactions and operations</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
              
            {showSettings && (
                <div className="right-panel-header-modern">
                  <div className="panel-header-content-modern">
                    <div className="header-title-section">
                      <Settings size={24} className="header-icon-modern" />
                      <div>
                        <h2 className="header-title-modern">{settingsMenuItems.find(item => item.id === activeSettingsMenu)?.label}</h2>
                        <p className="header-subtitle-modern">Configure system settings</p>
                      </div>
                    </div>
                    <button 
                      className="header-btn active" 
                      onClick={() => {
                        setShowSettings(false)
                        setCurrentView('pos')
                      }}
                    >
                      <X size={18} />
                      <span>Close</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Right Panel Content Wrapper */}
              <div className="cashier-right-panel-content">
                {/* Settings Content View */}
                {showSettings ? (
                  <div className="settings-content-view">
              {activeSettingsMenu === 'printer' && (
                <div className="settings-panel">
                  <div className="setting-item">
                    <label>Default Receipt Printer</label>
                    <select 
                      value={selectedPrinter} 
                      onChange={(e) => setSelectedPrinter(e.target.value)}
                    >
                      <option value="default">System Default Printer</option>
                      <option value="thermal">Thermal Receipt Printer</option>
                      <option value="pos-80mm">POS 80mm Printer</option>
                      <option value="pos-58mm">POS 58mm Printer</option>
                      <option value="epson">Epson TM Series</option>
                      <option value="star">Star Micronics</option>
                    </select>
                    <small className="setting-hint">Set printer in Chrome kiosk mode launch command</small>
                  </div>

                  <div className="setting-item checkbox-item">
                    <input 
                      type="checkbox" 
                      id="autoPrintInline"
                      checked={autoPrint}
                      onChange={(e) => setAutoPrint(e.target.checked)}
                    />
                    <label htmlFor="autoPrintInline">Auto-print receipt after payment</label>
                  </div>

                  <div className="setting-info">
                    <h5>Kiosk Mode Command:</h5>
                    <code className="command-code">
                      chrome.exe --kiosk --kiosk-printing --printer="EPSONB4B406 (WF-C5790 Series)" --app=http://localhost:5173
                    </code>
                    <small>Replace with your actual printer name from Windows Settings</small>
                  </div>

                  <button className="btn-save-settings" onClick={saveSettings}>
                    <CheckCircle size={20} />
                    Save Printer Settings
                  </button>
                </div>
              )}

              {activeSettingsMenu === 'general' && (
                <div className="settings-panel">
                  <div className="setting-item">
                    <label>Tax Rate (%)</label>
                    <input 
                      type="number" 
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      min="0" 
                      max="100" 
                      step="0.1"
                    />
                    <small className="setting-hint">Default tax percentage applied to transactions</small>
                  </div>

                  <div className="setting-item">
                    <label>Currency Symbol</label>
                    <input 
                      type="text" 
                      value="₱"
                      disabled
                    />
                    <small className="setting-hint">Philippine Peso (₱)</small>
                  </div>

                  <div className="setting-item">
                    <label>Business Name</label>
                    <input 
                      type="text" 
                      defaultValue="IRONWOLF SHOP"
                    />
                  </div>

                  <button className="btn-save-settings" onClick={saveSettings}>
                    <CheckCircle size={20} />
                    Save General Settings
                  </button>
                </div>
              )}

              {activeSettingsMenu === 'receipt' && (
                <div className="settings-panel">
                  <div className="setting-item">
                    <label>Receipt Footer Text</label>
                    <textarea 
                      value={receiptFooter}
                      onChange={(e) => setReceiptFooter(e.target.value)}
                      rows="3"
                      placeholder="Enter footer text for receipts..."
                    />
                    <small className="setting-hint">This text appears at the bottom of all receipts</small>
                  </div>

                  <div className="setting-item checkbox-item">
                    <input type="checkbox" id="showLogo" defaultChecked />
                    <label htmlFor="showLogo">Show business logo on receipt</label>
                  </div>

                  <div className="setting-item checkbox-item">
                    <input type="checkbox" id="showQR" />
                    <label htmlFor="showQR">Include QR code for digital receipt</label>
                  </div>

                  <button className="btn-save-settings" onClick={saveSettings}>
                    <CheckCircle size={20} />
                    Save Receipt Settings
                  </button>
                </div>
              )}

              {activeSettingsMenu === 'about' && (
                <div className="settings-panel about-panel">
                  <div className="about-logo">
                    <Lock size={48} />
                  </div>
                  <h3>IRONWOLF SHOP SYSTEM</h3>
                  <p className="version-large">Version 1.2.1</p>
                  
                  <div className="about-info">
                    <div className="info-row">
                      <span>Release Date:</span>
                      <strong>November 2024</strong>
                    </div>
                    <div className="info-row">
                      <span>License:</span>
                      <strong>Commercial</strong>
                    </div>
                    <div className="info-row">
                      <span>Developer:</span>
                      <strong>IRONWOLF Technologies</strong>
                    </div>
                  </div>

                  <div className="feature-list">
                    <h4>Features:</h4>
                    <ul>
                      <li>✓ Point of Sale (POS) System</li>
                      <li>✓ Inventory Management</li>
                      <li>✓ Order Tracking</li>
                      <li>✓ Payment Processing</li>
                      <li>✓ Receipt Printing</li>
                      <li>✓ Multi-user Support</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ) : currentView === 'daily-sales' ? (
            <div className="daily-sales-view">
              <div className="orders-table-container">
                <div className="empty-orders">
                  <TrendingUp size={48} />
                  <p>Daily Sales</p>
                  <span>Daily sales summary and statistics</span>
                </div>
              </div>
            </div>
          ) : currentView === 'receipts' ? (
            <div className="receipts-view">
              <div className="orders-table-container">
                <div className="empty-orders">
                  <Receipt size={48} />
                  <p>Receipts</p>
                  <span>View and reprint receipts</span>
                </div>
              </div>
            </div>
          ) : currentView === 'reports' ? (
            <div className="reports-view">
              <div className="orders-table-container">
                <div className="empty-orders">
                  <BarChart3 size={48} />
                  <p>Sales Reports</p>
                  <span>Generate and view sales reports</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="cashier-right-panel-content-area">
              {!showPaymentMode && (
                <>
                  {/* Modern Statistics Dashboard */}
                  <div className="statistics-dashboard-modern">
                <div className="stat-card-modern stat-card-primary">
                  <div className="stat-card-icon-wrapper stat-icon-primary">
                    <Calendar size={22} />
                  </div>
                  <div className="stat-card-content">
                    <span className="stat-card-label">Today's Date</span>
                    <span className="stat-card-value">{formatDate(currentDateTime)}</span>
                  </div>
                </div>
                <div className="stat-card-modern stat-card-primary">
                  <div className="stat-card-icon-wrapper stat-icon-primary">
                    <Clock size={22} />
                  </div>
                  <div className="stat-card-content">
                    <span className="stat-card-label">Current Time</span>
                    <span className="stat-card-value">{formatTime(currentDateTime)}</span>
                  </div>
                </div>
                <div className="stat-card-modern stat-card-success">
                  <div className="stat-card-icon-wrapper stat-icon-success">
                    <Users size={22} />
                  </div>
                  <div className="stat-card-content">
                    <span className="stat-card-label">Customers Served</span>
                    <span className="stat-card-value-large">{customerCounter}</span>
                  </div>
                </div>
                <div className="stat-card-modern stat-card-info">
                  <div className="stat-card-icon-wrapper stat-icon-info">
                    <Package size={22} />
                  </div>
                  <div className="stat-card-content">
                    <span className="stat-card-label">Items Sold</span>
                    <span className="stat-card-value-large">{totalItemsSold}</span>
                  </div>
                </div>
              </div>
                </>
              )}

              {showPaymentMode && (
                /* Payment Mode Content */
                <div className="payment-mode-content">
                  {/* Payment Total Display */}
                  <div className="payment-total-section">
                    <div className="payment-total-header">
                      <DollarSign size={24} />
                      <h3>
                        {customDownpaymentOrder 
                          ? 'Custom Down Payment' 
                          : cart.some(item => item.isDownPayment) 
                            ? 'Down Payment Total' 
                            : 'Payment Total'}
                      </h3>
                    </div>
                    {customDownpaymentOrder ? (
                      <div className="payment-total-amount-large" style={{ fontSize: '18px', color: '#9ca3af' }}>
                        Add any amount
                      </div>
                    ) : (
                      <div className="payment-total-amount-large">
                        {formatPeso(total)}
                      </div>
                    )}
                    {customDownpaymentOrder ? (
                      <p className="payment-items-count">
                        {customDownpaymentOrder.orderNumber} • Balance: {formatPeso(customDownpaymentOrder.balance)}
                      </p>
                    ) : (
                      <p className="payment-items-count">{cart.length} {cart.length === 1 ? 'item' : 'items'} in cart</p>
                    )}
                  </div>

                  {/* Payment Method Selection */}
                  <div className="payment-method-section">
                    <label className="payment-method-label">Payment Method</label>
                    <div className="payment-method-buttons">
                      <button
                        className={`payment-method-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
                        onClick={() => setPaymentMethod('cash')}
                      >
                        <DollarSign size={20} />
                        <span>Cash</span>
                      </button>
                      <button
                        className={`payment-method-btn ${paymentMethod === 'card' ? 'active' : ''}`}
                        onClick={() => setPaymentMethod('card')}
                      >
                        <CreditCard size={20} />
                        <span>Card</span>
                      </button>
                      <button
                        className={`payment-method-btn ${paymentMethod === 'gcash' ? 'active' : ''}`}
                        onClick={() => setPaymentMethod('gcash')}
                      >
                        <CreditCard size={20} />
                        <span>GCash</span>
                      </button>
                      <button
                        className={`payment-method-btn ${paymentMethod === 'paymaya' ? 'active' : ''}`}
                        onClick={() => setPaymentMethod('paymaya')}
                      >
                        <CreditCard size={20} />
                        <span>PayMaya</span>
                      </button>
                    </div>
                  </div>

                  {/* Discount Section */}
                  <div className="discount-section">
                    <label className="discount-label">
                      <Lock size={16} />
                      Discount
                    </label>
                    {!discountUnlocked ? (
                      <div className="discount-access-section">
                        <input
                          type="password"
                          className="discount-access-input"
                          value={discountAccessCode}
                          onChange={(e) => {
                            setDiscountAccessCode(e.target.value)
                            setDiscountError('')
                          }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              verifyDiscountAccess()
                            }
                          }}
                          placeholder="Enter access code"
                          autoFocus
                        />
                        <button
                          className="discount-access-btn"
                          onClick={verifyDiscountAccess}
                        >
                          <Lock size={16} />
                          Verify
                        </button>
                        {discountError && (
                          <div className="discount-error">{discountError}</div>
                        )}
                      </div>
                    ) : (
                      <div className="discount-unlocked-section">
                        <input
                          type="number"
                          className="discount-input"
                          value={discountAmount}
                          onChange={(e) => setDiscountAmount(e.target.value)}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                        {discountAmount && discount > 0 && (
                          <div className="discount-display">
                            <span className="discount-display-label">Discount:</span>
                            <span className="discount-display-amount">
                              {formatPeso(discount)}
                            </span>
                          </div>
                        )}
                        <button
                          className="discount-lock-btn"
                          onClick={() => {
                            setDiscountUnlocked(false)
                            setDiscountAmount('')
                            setDiscountAccessCode('')
                            setDiscountError('')
                          }}
                        >
                          <Lock size={14} />
                          Lock Discount
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Amount Paid Input */}
                  <div className="payment-amount-section">
                    <label className="payment-amount-label">Amount Paid</label>
                    <input
                      type="number"
                      className="payment-amount-input"
                      value={customerPaid}
                      onChange={(e) => setCustomerPaid(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      autoFocus
                    />
                    {customerPaid && (
                      <div className="change-display-section">
                        <span className="change-label">Change:</span>
                        <span className={`change-amount ${change >= 0 ? 'positive' : 'negative'}`}>
                          {formatPeso(Math.max(0, change))}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Quick Amount Buttons - Hide for custom downpayment */}
                  {!customDownpaymentOrder && (
                    <div className="quick-amount-buttons-section">
                      <button 
                        className="quick-amount-btn"
                        onClick={() => setCustomerPaid(total.toString())}
                      >
                        Exact
                      </button>
                      <button 
                        className="quick-amount-btn"
                        onClick={() => setCustomerPaid((total + 100).toString())}
                      >
                      +₱100
                    </button>
                    <button 
                      className="quick-amount-btn"
                      onClick={() => setCustomerPaid((total + 500).toString())}
                    >
                      +₱500
                    </button>
                    <button 
                      className="quick-amount-btn"
                      onClick={() => setCustomerPaid((total + 1000).toString())}
                    >
                      +₱1000
                    </button>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="payment-action-buttons">
                    <button 
                      className="btn-complete-payment"
                      onClick={completeTransaction}
                      disabled={
                        !customerPaid || 
                        parseFloat(customerPaid) <= 0 ||
                        (!customDownpaymentOrder && parseFloat(customerPaid) < total)
                      }
                    >
                      <CheckCircle size={20} />
                      <span>Complete Payment</span>
                    </button>
                    <button 
                      className="btn-print-receipt"
                      onClick={printReceipt}
                      disabled={cart.length === 0}
                    >
                      <Printer size={20} />
                      <span>Print Receipt</span>
                    </button>
                  </div>
                </div>
              )}

              {!showPaymentMode && (
                /* Normal Actions & Controls Content */
                <>
                  {/* Process Payment Button - Highlighted */}
                  <div className="process-payment-section">
                    <button 
                      className="process-payment-btn"
                      onClick={processPayment}
                      disabled={cart.length === 0}
                    >
                      <div className="process-payment-icon-wrapper">
                        <CreditCard size={32} />
                      </div>
                      <div className="process-payment-content">
                        <span className="process-payment-label">Process Payment</span>
                        {cart.length > 0 && (
                          <span className="process-payment-amount">{formatPeso(total)}</span>
                        )}
                      </div>
                      <div className="process-payment-arrow">
                        →
                      </div>
                    </button>
                  </div>

                  {/* Modern Action Buttons */}
                  <div className="action-buttons-modern">
                    <button 
                      className="action-btn-modern action-btn-tertiary-modern"
                    >
                      <div className="action-btn-icon-wrapper">
                        <DollarSign size={18} />
                      </div>
                      <span className="action-btn-label">Cash Drawer</span>
                    </button>

                    <button 
                      className="action-btn-modern action-btn-tertiary-modern"
                    >
                      <div className="action-btn-icon-wrapper">
                        <Percent size={18} />
                      </div>
                      <span className="action-btn-label">Discount</span>
                    </button>

                    <button 
                      className="action-btn-modern action-btn-tertiary-modern"
                    >
                      <div className="action-btn-icon-wrapper">
                        <Save size={18} />
                      </div>
                      <span className="action-btn-label">Save Sale</span>
                    </button>

                    <button 
                      className="action-btn-modern action-btn-utility-modern"
                      onClick={clearCart}
                      disabled={cart.length === 0}
                    >
                      <div className="action-btn-icon-wrapper">
                        <RotateCcw size={16} />
                      </div>
                      <span className="action-btn-label">Clear Cart</span>
                    </button>
                  </div>

                  {/* Transaction Info Card - Below Buttons */}
                  <div className="transaction-info-card">
                    <div className="transaction-info-header">
                      <BarChart3 size={20} />
                      <span>Transaction Summary</span>
                    </div>
                    <div className="transaction-info-row">
                      <div className="transaction-info-item">
                        <span className="transaction-info-label">Today's Sales</span>
                        <span className="transaction-info-value">{formatPeso(0)}</span>
                      </div>
                      <div className="transaction-info-item">
                        <span className="transaction-info-label">Transactions</span>
                        <span className="transaction-info-value">{customerCounter - 1}</span>
                      </div>
                    </div>
                  </div>

                  {/* Session Info Section */}
                  <div className="additional-info-section">
                    <div className="info-card-modern">
                      <div className="info-card-header">
                        <Clock size={18} />
                        <span>Session Info</span>
                      </div>
                      <div className="info-card-content">
                        <div className="info-item">
                          <div className="info-item-icon-wrapper">
                            <Calendar size={16} />
                          </div>
                          <div className="info-item-text">
                            <span className="info-item-label">Date</span>
                            <span className="info-item-value">{formatDate(currentDateTime)}</span>
                          </div>
                        </div>
                        <div className="info-item info-item-combined">
                          <div className="info-item-icon-wrapper">
                            <Clock size={16} />
                          </div>
                          <div className="info-item-text-combined">
                            <div className="info-item-group">
                              <span className="info-item-label">Time</span>
                              <span className="info-item-value">{formatTime(currentDateTime)}</span>
                            </div>
                            <div className="info-item-group">
                              <span className="info-item-label">Session Duration</span>
                              <span className="info-item-value session-duration">
                                <Timer size={14} style={{ display: 'inline-block', marginRight: '4px', verticalAlign: 'middle' }} />
                                {getSessionDuration()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          </div>
        </div>
        )}

        {/* View Content - For non-POS views like Pending Payments */}
        {currentView !== 'pos' && !showSettings && (
          <div className="cashier-view-content">
            {currentView === 'pending-payments' ? (
              <div className="pending-payments-view">
                {loadingOrders ? (
                  <div className="loading-orders">
                    <p>Loading orders...</p>
                  </div>
                ) : (
                  <>
                    {/* 5 Stat Cards */}
                    <div className="pending-payments-cards">
                      <div className="pending-stat-card">
                        <div className="pending-stat-icon">
                          <CreditCard size={24} />
                        </div>
                        <div className="pending-stat-content">
                          <span className="pending-stat-label">Total Pending</span>
                          <span className="pending-stat-value">{shopOrders.filter(o => o.balance > 0).length}</span>
                        </div>
                      </div>
                      <div className="pending-stat-card">
                        <div className="pending-stat-icon">
                          <DollarSign size={24} />
                        </div>
                        <div className="pending-stat-content">
                          <span className="pending-stat-label">Total Balance</span>
                          <span className="pending-stat-value">
                            {formatPeso(shopOrders.filter(o => o.balance > 0).reduce((sum, o) => sum + o.balance, 0))}
                          </span>
                        </div>
                      </div>
                      <div className="pending-stat-card">
                        <div className="pending-stat-icon">
                          <TrendingUp size={24} />
                        </div>
                        <div className="pending-stat-content">
                          <span className="pending-stat-label">Total Amount</span>
                          <span className="pending-stat-value">
                            {formatPeso(shopOrders.filter(o => o.balance > 0).reduce((sum, o) => sum + o.totalAmount, 0))}
                          </span>
                        </div>
                      </div>
                      <div className="pending-stat-card">
                        <div className="pending-stat-icon">
                          <CheckCircle size={24} />
                        </div>
                        <div className="pending-stat-content">
                          <span className="pending-stat-label">Total Paid</span>
                          <span className="pending-stat-value">
                            {formatPeso(shopOrders.filter(o => o.balance > 0).reduce((sum, o) => sum + o.paidAmount, 0))}
                          </span>
                        </div>
                      </div>
                      <div className="pending-stat-card">
                        <div className="pending-stat-icon">
                          <Users size={24} />
                        </div>
                        <div className="pending-stat-content">
                          <span className="pending-stat-label">Customers</span>
                          <span className="pending-stat-value">
                            {new Set(shopOrders.filter(o => o.balance > 0).map(o => o.customer)).size}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Table Only */}
                    {shopOrders.filter(o => o.balance > 0).length === 0 ? (
                      <div className="empty-orders">
                        <CreditCard size={48} />
                        <p>No Pending Payments</p>
                        <span>All orders are fully paid</span>
                      </div>
                    ) : (
                      <div className="orders-table-container">
                        <table className="orders-table">
                          <thead>
                            <tr>
                              <th>Order #</th>
                              <th>Service</th>
                              <th>Customer</th>
                              <th>Total</th>
                              <th>Paid</th>
                              <th>Balance</th>
                              <th>Assigned Artist</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {shopOrders.filter(o => o.balance > 0).map((order) => (
                              <tr key={order.id}>
                                <td className="order-number">
                                  {order.orderNumber}
                                  {order.isPahabol && (
                                    <span className="pahabol-badge-small" title="Pahabol (Rush)">PAHABOL</span>
                                  )}
                                </td>
                                <td className="service-name">{order.service}</td>
                                <td>{order.customer}</td>
                                <td className="order-amount">{formatPeso(order.totalAmount)}</td>
                                <td className="paid-amount">{formatPeso(order.paidAmount)}</td>
                                <td className="balance-amount">
                                  <span className="has-balance">{formatPeso(order.balance)}</span>
                                </td>
                                <td className="assigned-artist-cell">
                                  <span className="assigned-artist-name">
                                    {order.assignedArtist}
                                  </span>
                                </td>
                                <td className="action-buttons-cell">
                                  <div className="table-action-buttons">
                                    {(order.service.toLowerCase() === 'tarpaulin' || order.service.toLowerCase() === 'sublimation') && (
                                      order.downPayment > 0 ? (
                                        <button 
                                          className="btn-process-downpayment"
                                          onClick={() => handleDownpaymentButtonClick(order)}
                                          title="Add to Cart for Downpayment"
                                        >
                                          <DollarSign size={16} />
                                          <span>Downpayment</span>
                                        </button>
                                      ) : (
                                        <button 
                                          className="btn-submit-downpayment"
                                          onClick={() => handleSubmitDownpaymentButtonClick(order)}
                                          title="Submit Downpayment Amount"
                                        >
                                          <DollarSign size={16} />
                                          <span>Submit Downpayment</span>
                                        </button>
                                      )
                                    )}
                                    <button 
                                      className="btn-fully-pay"
                                      onClick={() => handlePaymentButtonClick(order)}
                                      title="Add to Cart for Full Payment"
                                    >
                                      <CreditCard size={16} />
                                      <span>Fully Pay</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : currentView === 'daily-sales' ? (
              <div className="daily-sales-view">
                <div className="orders-table-container">
                  <div className="empty-orders">
                    <TrendingUp size={48} />
                    <p>Daily Sales</p>
                    <span>Daily sales summary and statistics</span>
                  </div>
                </div>
              </div>
            ) : currentView === 'receipts' ? (
              <div className="receipts-view">
                <div className="orders-table-container">
                  <div className="empty-orders">
                    <Receipt size={48} />
                    <p>Receipts</p>
                    <span>View and reprint receipts</span>
                  </div>
                </div>
              </div>
            ) : currentView === 'reports' ? (
              <div className="reports-view">
                <div className="orders-table-container">
                  <div className="empty-orders">
                    <BarChart3 size={48} />
                    <p>Sales Reports</p>
                    <span>Generate and view sales reports</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Process Payment</h3>
              <button onClick={() => setShowPaymentModal(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <div className="payment-summary">
                <div className="payment-row">
                  <span>Total Amount:</span>
                  <strong className="amount-large">{formatPeso(total)}</strong>
                </div>
              </div>

              <div className="payment-input-group">
                <label>Amount Paid:</label>
                <input
                  type="number"
                  value={customerPaid}
                  onChange={(e) => setCustomerPaid(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  autoFocus
                />
              </div>

              {customerPaid && (
                <div className="change-display">
                  <span>Change:</span>
                  <strong className={change >= 0 ? 'change-positive' : 'change-negative'}>
                    {formatPeso(Math.max(0, change))}
                  </strong>
                </div>
              )}

              <div className="quick-amounts">
                <button onClick={() => setCustomerPaid(total.toString())}>Exact</button>
                <button onClick={() => setCustomerPaid('100')}>₱100</button>
                <button onClick={() => setCustomerPaid('200')}>₱200</button>
                <button onClick={() => setCustomerPaid('500')}>₱500</button>
                <button onClick={() => setCustomerPaid('1000')}>₱1000</button>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-cancel" 
                onClick={() => setShowPaymentModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-complete" 
                onClick={completeTransaction}
                disabled={!customerPaid || parseFloat(customerPaid) < total}
              >
                <CheckCircle size={20} />
                Complete Transaction
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  )
}

export default CashierDashboard

