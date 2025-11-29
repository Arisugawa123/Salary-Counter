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
  Scan
} from 'lucide-react'
import { fetchOrders } from '../lib/supabase'
import './CashierDashboard.css'

// Format number with commas and peso sign
const formatPeso = (amount) => {
  return `₱${Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function CashierDashboard() {
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
  const [showShopOrders, setShowShopOrders] = useState(false)
  const [barcodeInput, setBarcodeInput] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  
  // Settings
  const [selectedPrinter, setSelectedPrinter] = useState(localStorage.getItem('selectedPrinter') || 'default')
  const [autoPrint, setAutoPrint] = useState(localStorage.getItem('autoPrint') === 'true')
  const [taxRate, setTaxRate] = useState(localStorage.getItem('taxRate') || '0')
  const [receiptFooter, setReceiptFooter] = useState(localStorage.getItem('receiptFooter') || 'Thank you for your purchase!')
  
  // Settings menu items
  const settingsMenuItems = [
    { id: 'printer', icon: Printer, label: 'Printer Settings' },
    { id: 'general', icon: Settings, label: 'General Settings' },
    { id: 'receipt', icon: FileText, label: 'Receipt Settings' },
    { id: 'about', icon: Package, label: 'About System' }
  ]

  // Shop orders from database
  const [shopOrders, setShopOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)

  // Update date and time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Load orders function
  const loadOrders = useCallback(async () => {
    try {
      setLoadingOrders(true)
      const orders = await fetchOrders()
      
      // Map database orders to shop orders format
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
        orderId: order.id, // Keep original ID for reference
        isPahabol: order.isPahabol || false
      }))
      
      setShopOrders(mappedOrders)
    } catch (error) {
      console.error('Error loading orders:', error)
      if (showShopOrders) {
        alert('Failed to load orders. Please try again.')
      }
    } finally {
      setLoadingOrders(false)
    }
  }, [showShopOrders])

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
  const total = subtotal
  const change = customerPaid ? parseFloat(customerPaid) - total : 0

  // Clear cart
  const clearCart = () => {
    if (cart.length > 0) {
      if (window.confirm('Clear all items from cart?')) {
        setCart([])
        setCustomerPaid('')
      }
    }
  }

  // Process payment
  const processPayment = () => {
    if (cart.length === 0) {
      alert('Cart is empty')
      return
    }
    setShowPaymentModal(true)
  }

  // Complete transaction
  const completeTransaction = () => {
    if (!customerPaid || parseFloat(customerPaid) < total) {
      alert('Insufficient payment amount')
      return
    }

    // Update statistics
    const itemsInTransaction = cart.reduce((sum, item) => sum + item.quantity, 0)
    setTotalItemsSold(prev => prev + itemsInTransaction)
    setCustomerCounter(prev => prev + 1)

    // Here you would typically save the transaction to database
    alert(`Transaction completed!\nTotal: ${formatPeso(total)}\nPaid: ${formatPeso(customerPaid)}\nChange: ${formatPeso(change)}`)
    
    setCart([])
    setCustomerPaid('')
    setShowPaymentModal(false)

    // Auto-print if enabled
    if (autoPrint) {
      setTimeout(() => {
        window.print()
      }, 500)
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
    }
  }

  // Add shop order to cart
  const addOrderToCart = (order) => {
    if (order.balance <= 0) {
      alert('This order is already fully paid')
      return
    }

    const newItem = {
      id: Date.now(),
      name: `${order.service} - ${order.orderNumber}`,
      price: order.balance,
      quantity: 1,
      total: order.balance,
      orderReference: order.orderNumber
    }

    setCart([...cart, newItem])
    alert(`Added ${order.service} (Balance: ${formatPeso(order.balance)}) to cart`)
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

  // Handle barcode scan
  const handleBarcodeScan = async (barcodeValue) => {
    if (!barcodeValue || barcodeValue.trim() === '') {
      return
    }

    setIsScanning(true)
    
    try {
      // Parse the receipt number to get order ID
      const orderId = parseReceiptNumber(barcodeValue)
      
      if (!orderId) {
        alert('Invalid barcode format. Expected format: 25-200-XXXXXX')
        setBarcodeInput('')
        setIsScanning(false)
        return
      }

      // Find the order in the shopOrders array
      let order = shopOrders.find(o => o.orderId === orderId || o.id === orderId)
      
      // If not found in current list, fetch orders directly
      if (!order) {
        try {
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
          
          // Update shopOrders state for future scans
          setShopOrders(mappedOrders)
        } catch (fetchError) {
          console.error('Error fetching orders:', fetchError)
        }
      }

      if (!order) {
        alert(`Order not found for barcode: ${barcodeValue}\nOrder ID: ${orderId}`)
        setBarcodeInput('')
        setIsScanning(false)
        return
      }

      // Check if order is already fully paid
      if (order.balance <= 0) {
        alert('This order is already fully paid')
        setBarcodeInput('')
        setIsScanning(false)
        return
      }

      // Check if order is already in cart
      const existingInCart = cart.find(item => item.orderReference === order.orderNumber)
      if (existingInCart) {
        alert(`Order ${order.orderNumber} is already in the cart`)
        setBarcodeInput('')
        setIsScanning(false)
        return
      }

      // Add order to cart
      addOrderToCart(order)
      setBarcodeInput('')
    } catch (error) {
      console.error('Error processing barcode scan:', error)
      alert('Error processing barcode. Please try again.')
    } finally {
      setIsScanning(false)
    }
  }

  // Handle barcode input change (for manual entry or scanner)
  const handleBarcodeInputChange = (e) => {
    setBarcodeInput(e.target.value)
  }

  // Handle barcode input key press (Enter key or scanner sends Enter)
  const handleBarcodeKeyPress = (e) => {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      e.preventDefault()
      handleBarcodeScan(barcodeInput)
    }
  }

  return (
    <div className="cashier-dashboard">
      {/* Main Content Area */}
      <div className={`cashier-content ${showSettings ? 'settings-active' : ''}`}>
        {/* Left Panel - Cart or Settings Menu */}
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
              <div className="panel-header">
                <ShoppingCart size={24} />
                <h2>Cart Items</h2>
                <span className="item-count">{cart.length} items</span>
              </div>

          {/* Barcode Scanner */}
          <div className="barcode-scanner-section">
            <div className="barcode-input-wrapper">
              <Scan size={20} className="barcode-icon" />
              <input
                type="text"
                placeholder="Scan barcode or enter receipt number (25-200-XXXXXX)"
                value={barcodeInput}
                onChange={handleBarcodeInputChange}
                onKeyPress={handleBarcodeKeyPress}
                className="barcode-input"
                disabled={isScanning}
                autoFocus
              />
              {isScanning && <span className="scanning-indicator">Scanning...</span>}
            </div>
          </div>

          {/* Add Product Form */}
          <div className="add-product-form">
            <input
              type="text"
              placeholder="Product name"
              value={productInput}
              onChange={(e) => setProductInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addToCart()}
            />
            <input
              type="number"
              placeholder="Price"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addToCart()}
              min="0"
              step="0.01"
            />
            <input
              type="number"
              placeholder="Qty"
              value={quantityInput}
              onChange={(e) => setQuantityInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addToCart()}
              min="1"
            />
            <button className="btn-add-item" onClick={addToCart}>
              <Plus size={20} />
              Add
            </button>
          </div>

          {/* Cart Table */}
          <div className="cart-table-container">
            {cart.length === 0 ? (
              <div className="empty-cart">
                <ShoppingCart size={48} />
                <p>Cart is empty</p>
                <span>Add items to get started</span>
              </div>
            ) : (
              <table className="cart-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Total</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map(item => (
                    <tr key={item.id}>
                      <td className="product-name">{item.name}</td>
                      <td>{formatPeso(item.price)}</td>
                      <td>
                        <div className="quantity-controls">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="qty-btn"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="qty-display">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="qty-btn"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="item-total">{formatPeso(item.total)}</td>
                      <td>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="btn-remove"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Cart Summary */}
          <div className="cart-summary">
            <div className="summary-row subtotal-row">
              <span>Subtotal:</span>
              <strong>{formatPeso(subtotal)}</strong>
            </div>
            <div className="summary-row total-row">
              <span>Total Amount:</span>
              <strong>{formatPeso(total)}</strong>
            </div>
          </div>
            </>
          )}
        </div>

        {/* Right Panel - Actions or Settings Content */}
        <div className="cashier-right-panel">
          <div className="panel-header">
            <div className="panel-header-left">
              {showSettings ? (
                <>
                  <Settings size={24} />
                  <h2>{settingsMenuItems.find(item => item.id === activeSettingsMenu)?.label}</h2>
                </>
              ) : (
                <>
                  <Calculator size={24} />
                  <h2>Actions</h2>
                </>
              )}
            </div>
            <div className="panel-header-actions">
              {!showSettings && (
                <>
                  <button 
                    className={`header-btn ${showShopOrders ? 'active' : ''}`}
                    onClick={() => setShowShopOrders(!showShopOrders)}
                  >
                    <FileText size={18} />
                    <span>{showShopOrders ? 'Back to Actions' : 'Shop Orders'}</span>
                  </button>
                  <button className="header-btn">
                    <CheckCircle size={18} />
                    <span>History</span>
                  </button>
                </>
              )}
              {showSettings && (
                <button className="header-btn active" onClick={toggleSettings}>
                  <X size={18} />
                  <span>Close Settings</span>
                </button>
              )}
            </div>
          </div>

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
          ) : showShopOrders ? (
            <div className="shop-orders-view">
              <div className="orders-table-container">
                {loadingOrders ? (
                  <div className="loading-orders">
                    <p>Loading orders...</p>
                  </div>
                ) : shopOrders.length === 0 ? (
                  <div className="empty-orders">
                    <Package size={48} />
                    <p>No orders found</p>
                    <span>Orders will appear here once created</span>
                  </div>
                ) : (
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>Service</th>
                        <th>Customer</th>
                        <th>Total</th>
                        <th>Paid</th>
                        <th>Balance</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shopOrders.map((order) => (
                        <tr key={order.id}>
                          <td className="order-number">
                            {order.orderNumber}
                            {order.isPahabol && (
                              <span className="pahabol-badge-small" title="Pahabol (Rush)">P</span>
                            )}
                          </td>
                          <td className="service-name">{order.service}</td>
                          <td>{order.customer}</td>
                          <td className="order-amount">{formatPeso(order.totalAmount)}</td>
                          <td className="paid-amount">{formatPeso(order.paidAmount)}</td>
                          <td className="balance-amount">
                            <span className={order.balance > 0 ? 'has-balance' : 'no-balance'}>
                              {formatPeso(order.balance)}
                            </span>
                          </td>
                          <td className="order-status-cell">
                            <span className={`status-badge status-${order.status.toLowerCase().replace(' ', '-')}`}>
                              {order.status}
                            </span>
                          </td>
                          <td>
                            {order.balance > 0 ? (
                              <button 
                                className="btn-add-to-cart"
                                onClick={() => addOrderToCart(order)}
                              >
                                <ShoppingCart size={16} />
                                <span>Add to Cart</span>
                              </button>
                            ) : (
                              <span className="fully-paid">Fully Paid</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Statistics Section */}
              <div className="statistics-section">
            <div className="stat-item">
              <div className="stat-icon">
                <Calendar size={18} />
              </div>
              <div className="stat-info">
                <span className="stat-title">Date</span>
                <span className="stat-data">{formatDate(currentDateTime)}</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">
                <Clock size={18} />
              </div>
              <div className="stat-info">
                <span className="stat-title">Time</span>
                <span className="stat-data">{formatTime(currentDateTime)}</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">
                <Users size={18} />
              </div>
              <div className="stat-info">
                <span className="stat-title">Customers</span>
                <span className="stat-data">{customerCounter}</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">
                <Package size={18} />
              </div>
              <div className="stat-info">
                <span className="stat-title">Items Sold</span>
                <span className="stat-data">{totalItemsSold}</span>
              </div>
            </div>
          </div>

          <div className="action-buttons">
            <button 
              className="action-btn primary"
              onClick={processPayment}
              disabled={cart.length === 0}
            >
              <CreditCard size={24} />
              <span>Process Payment</span>
            </button>

            <button 
              className="action-btn cash-drawer"
            >
              <DollarSign size={24} />
              <span>Cash Drawer</span>
            </button>

            <button 
              className="action-btn"
              onClick={printReceipt}
              disabled={cart.length === 0}
            >
              <Printer size={24} />
              <span>Print Receipt</span>
            </button>

            <button 
              className="action-btn"
              onClick={clearCart}
            >
              <RotateCcw size={24} />
              <span>Clear Cart</span>
            </button>

            <button 
              className="action-btn"
            >
              <Undo2 size={24} />
              <span>Refund</span>
            </button>

            <button 
              className="action-btn"
            >
              <Percent size={24} />
              <span>Discount</span>
            </button>

            <button 
              className="action-btn"
            >
              <Save size={24} />
              <span>Save Sale</span>
            </button>

            <button 
              className="action-btn"
              onClick={toggleSettings}
            >
              <Settings size={24} />
              <span>Settings</span>
            </button>
          </div>

              {/* Quick Stats */}
              <div className="quick-stats">
                <div className="stat-card">
                  <span className="stat-label">Items in Cart</span>
                  <span className="stat-value">{cart.length}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Total Amount</span>
                  <span className="stat-value">{formatPeso(total)}</span>
                </div>
              </div>
            </>
          )}
        </div>
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
  )
}

export default CashierDashboard

