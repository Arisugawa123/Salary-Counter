import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
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
  DollarSign
} from 'lucide-react'
import './GraphicArtistDashboard.css'

function GraphicArtistDashboard({ user }) {
  const [currentView, setCurrentView] = useState('dashboard')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      id: 'create-order',
      label: 'Create Order',
      icon: Plus
    },
    {
      id: 'create-pahabol',
      label: 'Create Pahabol',
      icon: Clock
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

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />
      case 'create-order':
        return <CreateOrderView />
      case 'create-pahabol':
        return <CreatePahabolView />
      case 'order-tracking':
        return <OrderTrackingView />
      case 'sublimation-orders':
        return <SublimationOrdersView />
      case 'sublimation-listing':
        return <SublimationListingView />
      default:
        return <DashboardView />
    }
  }

  return (
    <div className="graphic-artist-dashboard">
      <Sidebar 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        menuItems={menuItems}
        sublimationItems={sublimationItems}
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
function DashboardView() {
  const ordersForPayment = []
  const ordersPending = []
  const ordersForDesign = []
  const ordersForSublimation = []

  return (
    <div className="view-container">
      <div className="view-header">
        <h1>Graphic Artist Dashboard</h1>
        <p>Welcome to your workspace</p>
      </div>
      
      {/* Stats Cards */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <Package size={20} />
          </div>
          <div className="stat-content">
            <h3>Pending Orders</h3>
            <p className="stat-value">0</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <CheckCircle size={20} />
          </div>
          <div className="stat-content">
            <h3>Completed Orders</h3>
            <p className="stat-value">0</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <CreditCard size={20} />
          </div>
          <div className="stat-content">
            <h3>Cash Advance</h3>
            <p className="stat-value">₱0.00</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Calendar size={20} />
          </div>
          <div className="stat-content">
            <h3>Next Payroll</h3>
            <p className="stat-value">-</p>
          </div>
        </div>
      </div>

      {/* Orders Tables */}
      <div className="tables-container">
        {/* For Payment & Pending Orders Table */}
        <div className="table-section">
          <div className="table-header">
            <h2>Current Orders</h2>
          </div>
          <div className="table-tabs">
            <button className="tab-btn active">For Payment ({ordersForPayment.length})</button>
            <button className="tab-btn">Pending ({ordersPending.length})</button>
          </div>
          <div className="table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {ordersForPayment.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-table">
                      <Package size={40} />
                      <p>No orders for payment</p>
                    </td>
                  </tr>
                ) : (
                  ordersForPayment.map(order => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{order.customer}</td>
                      <td>{order.product}</td>
                      <td>{order.quantity}</td>
                      <td>{order.amount}</td>
                      <td>{order.date}</td>
                      <td><span className="status-badge for-payment">For Payment</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Production Process Table */}
        <div className="table-section">
          <div className="table-header">
            <h2>Production Status</h2>
          </div>
          <div className="table-tabs">
            <button className="tab-btn active">For Design Process ({ordersForDesign.length})</button>
            <button className="tab-btn">Sublimation Process ({ordersForSublimation.length})</button>
          </div>
          <div className="table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Progress</th>
                  <th>Deadline</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {ordersForDesign.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-table">
                      <Palette size={40} />
                      <p>No orders in design process</p>
                    </td>
                  </tr>
                ) : (
                  ordersForDesign.map(order => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{order.customer}</td>
                      <td>{order.product}</td>
                      <td>{order.quantity}</td>
                      <td>{order.progress}</td>
                      <td>{order.deadline}</td>
                      <td><span className="status-badge in-design">For Design</span></td>
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

// Create Order View
function CreateOrderView() {
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
    downPayment: ''
  })

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

  const handleProblemToggle = (problem) => {
    setRepairData(prev => ({
      ...prev,
      problems: prev.problems.includes(problem)
        ? prev.problems.filter(p => p !== problem)
        : [...prev.problems, problem]
    }))
  }

  const handleNextStep = () => {
    const maxStep = orderType === 'Tarpaulin' ? 4 : 3
    if (step < maxStep) {
      setStep(step + 1)
    }
  }

  const handleSubmitOrder = () => {
    // Submit order logic here
    console.log('Order submitted:', { orderType, repairData })
    
    // Generate and print repair receipt
    printRepairReceipt()
    
    alert('Repair order created successfully! Receipt is ready to print.')
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
            <h1>IRONWOLF SHOP</h1>
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
              <strong>IRONWOLF SHOP SYSTEM v1.2.1</strong>
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
                {step === 2 && orderType !== 'Repairs' && orderType !== 'Tarpaulin' && `${orderType} - Order Details`}
                {step === 3 && orderType === 'Repairs' && 'Problem Checklist'}
                {step === 3 && orderType === 'Tarpaulin' && 'Tarpaulin Order Details'}
                {step === 3 && orderType !== 'Repairs' && orderType !== 'Tarpaulin' && 'Review Order'}
                {step === 4 && orderType === 'Tarpaulin' && 'Review & Payment'}
              </h1>
              <p>
                {step === 1 && 'Select the product category that best fits your project needs'}
                {step === 2 && orderType === 'Repairs' && 'Enter customer information and device details'}
                {step === 2 && orderType === 'Tarpaulin' && 'Enter customer contact information'}
                {step === 2 && orderType !== 'Repairs' && orderType !== 'Tarpaulin' && `Provide the necessary information for your ${orderType.toLowerCase()} order`}
                {step === 3 && orderType === 'Repairs' && 'Check all issues reported by the customer'}
                {step === 3 && orderType === 'Tarpaulin' && 'Specify size, orientation, and design details'}
                {step === 3 && orderType !== 'Repairs' && orderType !== 'Tarpaulin' && 'Double-check all details before submitting your order'}
                {step === 4 && orderType === 'Tarpaulin' && 'Review order summary and process payment'}
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
            {step === 3 && orderType === 'Tarpaulin' && (
              <button className="btn-next" onClick={handleNextStep}>
                Next: Payment →
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
        <div className="order-type-selection">
          <div className="order-type-grid">
            <div className="order-type-card" onClick={() => handleTypeSelect('Tarpaulin')}>
              <div className="card-badge">Popular</div>
              <div className="order-type-icon">
                <Package size={28} />
              </div>
              <h3>Tarpaulin</h3>
              <p>Banners, posters, and outdoor signage</p>
              <div className="card-arrow">→</div>
            </div>
            <div className="order-type-card" onClick={() => handleTypeSelect('Sublimation')}>
              <div className="card-badge premium">Premium</div>
              <div className="order-type-icon">
                <Palette size={28} />
              </div>
              <h3>Sublimation</h3>
              <p>Custom prints on shirts, phone cases, and more</p>
              <div className="card-arrow">→</div>
            </div>
            <div className="order-type-card" onClick={() => handleTypeSelect('Mugs')}>
              <div className="order-type-icon">
                <Coffee size={28} />
              </div>
              <h3>Mugs</h3>
              <p>Personalized mugs with custom designs</p>
              <div className="card-arrow">→</div>
            </div>
            <div className="order-type-card" onClick={() => handleTypeSelect('Stickers')}>
              <div className="order-type-icon">
                <Sticker size={28} />
              </div>
              <h3>Stickers</h3>
              <p>Custom stickers in various sizes and shapes</p>
              <div className="card-arrow">→</div>
            </div>
            <div className="order-type-card" onClick={() => handleTypeSelect('Document Print')}>
              <div className="order-type-icon">
                <FileText size={28} />
              </div>
              <h3>Document Print</h3>
              <p>Professional document printing services</p>
              <div className="card-arrow">→</div>
            </div>
            <div className="order-type-card" onClick={() => handleTypeSelect('Photo Print')}>
              <div className="order-type-icon">
                <Image size={28} />
              </div>
              <h3>Photo Print</h3>
              <p>High-quality photo printing in any size</p>
              <div className="card-arrow">→</div>
            </div>
            <div className="order-type-card" onClick={() => handleTypeSelect('Embroidery')}>
              <div className="order-type-icon">
                <Scissors size={28} />
              </div>
              <h3>Embroidery</h3>
              <p>Custom embroidery on clothing and fabrics</p>
              <div className="card-arrow">→</div>
            </div>
            <div className="order-type-card" onClick={() => handleTypeSelect('Repairs')}>
              <div className="order-type-icon">
                <Wrench size={28} />
              </div>
              <h3>Repairs</h3>
              <p>Equipment and device repair services</p>
              <div className="card-arrow">→</div>
            </div>
            <div className="order-type-card" onClick={() => handleTypeSelect('Software Installation')}>
              <div className="order-type-icon">
                <Monitor size={28} />
              </div>
              <h3>Software Installation</h3>
              <p>Professional software setup and installation</p>
              <div className="card-arrow">→</div>
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
        <div className="order-form-step">
          <div className="repair-form">
            <div className="form-section">
              <h3 className="form-section-title">Customer Information</h3>
              <div className="enhanced-fields-grid">
                {/* Customer Name */}
                <div className="enhanced-field">
                  <label>Customer Name *</label>
                  <div className="enhanced-field-wrapper">
                    <div className="enhanced-field-icon">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      placeholder="Enter customer name"
                      value={tarpaulinData.customerName}
                      onChange={(e) => handleTarpaulinInputChange('customerName', e.target.value)}
                      className="enhanced-field-input"
                    />
                  </div>
                </div>
                
                {/* Contact Number */}
                <div className="enhanced-field">
                  <label>Contact Number *</label>
                  <div className="enhanced-field-wrapper">
                    <div className="enhanced-field-icon">
                      <Phone size={18} />
                    </div>
                    <input
                      type="tel"
                      placeholder="Enter contact number"
                      value={tarpaulinData.contactNumber}
                      onChange={(e) => handleTarpaulinInputChange('contactNumber', e.target.value)}
                      className="enhanced-field-input"
                    />
                  </div>
                </div>
                
                {/* Email Address */}
                <div className="enhanced-field">
                  <label>Email Address</label>
                  <div className="enhanced-field-wrapper">
                    <div className="enhanced-field-icon">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      placeholder="Enter email address (optional)"
                      value={tarpaulinData.email}
                      onChange={(e) => handleTarpaulinInputChange('email', e.target.value)}
                      className="enhanced-field-input"
                    />
                  </div>
                </div>
                
                {/* Business/Organization Name */}
                <div className="enhanced-field">
                  <label>Business/Organization Name</label>
                  <div className="enhanced-field-wrapper">
                    <div className="enhanced-field-icon">
                      <Building2 size={18} />
                    </div>
                    <input
                      type="text"
                      placeholder="Enter business name (optional)"
                      value={tarpaulinData.businessName}
                      onChange={(e) => handleTarpaulinInputChange('businessName', e.target.value)}
                      className="enhanced-field-input"
                    />
                  </div>
                </div>
                
                {/* Customer Address */}
                <div className="enhanced-field enhanced-field-full">
                  <label>Customer Address</label>
                  <div className="enhanced-field-wrapper">
                    <div className="enhanced-field-icon">
                      <MapPin size={18} />
                    </div>
                    <input
                      type="text"
                      placeholder="Enter customer address (optional)"
                      value={tarpaulinData.address}
                      onChange={(e) => handleTarpaulinInputChange('address', e.target.value)}
                      className="enhanced-field-input"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">Event Details (Optional)</h3>
              <div className="enhanced-fields-grid">
                {/* Event Type */}
                <div className="enhanced-field">
                  <label>Event Type</label>
                  <div className="enhanced-field-wrapper">
                    <div className="enhanced-field-icon">
                      <PartyPopper size={18} />
                    </div>
                    <input
                      type="text"
                      placeholder="e.g., Birthday, Wedding, Corporate Event"
                      value={tarpaulinData.eventType}
                      onChange={(e) => handleTarpaulinInputChange('eventType', e.target.value)}
                      className="enhanced-field-input"
                    />
                  </div>
                </div>
                
                {/* Event Date */}
                <div className="enhanced-field">
                  <label>Event Date</label>
                  <div className="enhanced-field-wrapper">
                    <div className="enhanced-field-icon">
                      <CalendarCheck size={18} />
                    </div>
                    <input
                      type="text"
                      placeholder="Click to select date"
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
                      className="enhanced-field-input"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">Order Preferences</h3>
              <div className="enhanced-fields-grid">
                {/* Preferred Pickup Date */}
                <div className="enhanced-field">
                  <label>Preferred Pickup Date</label>
                  <div className="enhanced-field-wrapper">
                    <div className="enhanced-field-icon">
                      <Truck size={18} />
                    </div>
                    <input
                      type="text"
                      placeholder="Click to select date"
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
                      className="enhanced-field-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && orderType !== 'Repairs' && orderType !== 'Tarpaulin' && (
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
        <div className="order-form-step">
          <div className="repair-form">
            <div className="form-section">
              <h3 className="form-section-title">Order Details</h3>
              <div className="enhanced-fields-grid">
                {/* Width */}
                <div className="enhanced-field">
                  <label>Width (ft) *</label>
                  <div className="enhanced-field-wrapper">
                    <div className="enhanced-field-icon">
                      <Maximize2 size={18} />
                    </div>
                    <input
                      type="number"
                      placeholder="0.0"
                      value={tarpaulinData.width}
                      onChange={(e) => handleTarpaulinInputChange('width', e.target.value)}
                      min="1"
                      step="0.5"
                      className="enhanced-field-input"
                    />
                    <span className="enhanced-field-unit">ft</span>
                  </div>
                </div>
                
                {/* Height */}
                <div className="enhanced-field">
                  <label>Height (ft) *</label>
                  <div className="enhanced-field-wrapper">
                    <div className="enhanced-field-icon">
                      <Maximize2 size={18} />
                    </div>
                    <input
                      type="number"
                      placeholder="0.0"
                      value={tarpaulinData.height}
                      onChange={(e) => handleTarpaulinInputChange('height', e.target.value)}
                      min="1"
                      step="0.5"
                      className="enhanced-field-input"
                    />
                    <span className="enhanced-field-unit">ft</span>
                  </div>
                </div>
                
                {/* Orientation */}
                <div className="enhanced-field">
                  <label>Orientation *</label>
                  <div className="enhanced-field-wrapper">
                    <div className="enhanced-field-icon">
                      <RotateCw size={18} />
                    </div>
                    <select
                      value={tarpaulinData.orientation}
                      onChange={(e) => handleTarpaulinInputChange('orientation', e.target.value)}
                      className="enhanced-field-select"
                    >
                      <option value="Landscape">Landscape</option>
                      <option value="Portrait">Portrait</option>
                    </select>
                  </div>
                </div>
                
                {/* Quantity */}
                <div className="enhanced-field">
                  <label>Quantity *</label>
                  <div className="enhanced-field-wrapper">
                    <div className="enhanced-field-icon">
                      <Hash size={18} />
                    </div>
                    <input
                      type="number"
                      placeholder="1"
                      value={tarpaulinData.quantity}
                      onChange={(e) => handleTarpaulinInputChange('quantity', e.target.value)}
                      min="1"
                      className="enhanced-field-input"
                    />
                    <span className="enhanced-field-unit">pc(s)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">Design Specifications</h3>
              <div className="enhanced-fields-grid">
                {/* Background Color */}
                <div className="enhanced-field">
                  <label>Background Color</label>
                  <div className="enhanced-field-wrapper">
                    <div className="enhanced-field-icon">
                      <Paintbrush size={18} />
                    </div>
                    <input
                      type="text"
                      placeholder="e.g., White, Blue, Red"
                      value={tarpaulinData.backgroundColor}
                      onChange={(e) => handleTarpaulinInputChange('backgroundColor', e.target.value)}
                      className="enhanced-field-input"
                    />
                  </div>
                </div>
                
                {/* Text/Main Color */}
                <div className="enhanced-field">
                  <label>Text/Main Color</label>
                  <div className="enhanced-field-wrapper">
                    <div className="enhanced-field-icon">
                      <Type size={18} />
                    </div>
                    <input
                      type="text"
                      placeholder="e.g., Black, Gold, Green"
                      value={tarpaulinData.textColor}
                      onChange={(e) => handleTarpaulinInputChange('textColor', e.target.value)}
                      className="enhanced-field-input"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">Design Notes & Requirements</h3>
              <div className="enhanced-field enhanced-field-full">
                <label>Design Notes</label>
                <div className="enhanced-field-wrapper enhanced-textarea-wrapper">
                  <div className="enhanced-field-icon">
                    <FileEdit size={18} />
                  </div>
                  <textarea
                    placeholder="Describe the design, text content, images, layout, or any special requirements..."
                    rows="4"
                    value={tarpaulinData.designNotes}
                    onChange={(e) => handleTarpaulinInputChange('designNotes', e.target.value)}
                    className="enhanced-field-textarea"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 4 && orderType === 'Tarpaulin' && (
        <div className="order-form-step">
          <div className="horizontal-container">
            {/* Order Summary Section */}
            <div className="form-section summary-section-enhanced">
              <h3 className="form-section-title">Order Summary</h3>
              
              {/* Rush Order Toggle - Full Width at Top */}
              <div className="rush-order-container">
                <label className="rush-order-toggle">
                  <input
                    type="checkbox"
                    checked={tarpaulinData.rushOrder}
                    onChange={(e) => handleTarpaulinInputChange('rushOrder', e.target.checked)}
                  />
                  <div className="rush-toggle-slider"></div>
                  <div className="rush-toggle-content">
                    <div className="rush-toggle-info">
                      <span className="rush-toggle-title">Rush Order</span>
                      <span className="rush-toggle-subtitle">Priority processing</span>
                    </div>
                  </div>
                </label>
              </div>

              {/* Order Details Grid */}
              <div className="summary-enhanced-grid">
                <div className="summary-enhanced-item summary-enhanced-item-full">
                  <div className="summary-enhanced-icon">
                    <User size={18} />
                  </div>
                  <div className="summary-enhanced-content">
                    <div className="summary-enhanced-label">Customer</div>
                    <div className="summary-enhanced-value">{tarpaulinData.customerName || '-'}</div>
                  </div>
                </div>
                <div className="summary-enhanced-item summary-enhanced-item-full">
                  <div className="summary-enhanced-icon">
                    <Phone size={18} />
                  </div>
                  <div className="summary-enhanced-content">
                    <div className="summary-enhanced-label">Contact</div>
                    <div className="summary-enhanced-value">{tarpaulinData.contactNumber || '-'}</div>
                  </div>
                </div>
                <div className="summary-enhanced-item">
                  <div className="summary-enhanced-icon">
                    <Mail size={18} />
                  </div>
                  <div className="summary-enhanced-content">
                    <div className="summary-enhanced-label">Email</div>
                    <div className="summary-enhanced-value">{tarpaulinData.email || '-'}</div>
                  </div>
                </div>
                <div className="summary-enhanced-item">
                  <div className="summary-enhanced-icon">
                    <MapPin size={18} />
                  </div>
                  <div className="summary-enhanced-content">
                    <div className="summary-enhanced-label">Address</div>
                    <div className="summary-enhanced-value">{tarpaulinData.address || '-'}</div>
                  </div>
                </div>
                <div className="summary-enhanced-item">
                  <div className="summary-enhanced-icon">
                    <PartyPopper size={18} />
                  </div>
                  <div className="summary-enhanced-content">
                    <div className="summary-enhanced-label">Event Type</div>
                    <div className="summary-enhanced-value">{tarpaulinData.eventType || '-'}</div>
                  </div>
                </div>
                <div className="summary-enhanced-item">
                  <div className="summary-enhanced-icon">
                    <CalendarCheck size={18} />
                  </div>
                  <div className="summary-enhanced-content">
                    <div className="summary-enhanced-label">Event Date</div>
                    <div className="summary-enhanced-value">
                      {tarpaulinData.eventDate 
                        ? new Date(tarpaulinData.eventDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })
                        : '-'}
                    </div>
                  </div>
                </div>
                <div className="summary-enhanced-item">
                  <div className="summary-enhanced-icon">
                    <Truck size={18} />
                  </div>
                  <div className="summary-enhanced-content">
                    <div className="summary-enhanced-label">Pickup Date</div>
                    <div className="summary-enhanced-value">
                      {tarpaulinData.preferredDeliveryDate 
                        ? new Date(tarpaulinData.preferredDeliveryDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })
                        : '-'}
                    </div>
                  </div>
                </div>
                <div className="summary-enhanced-item">
                  <div className="summary-enhanced-icon">
                    <Maximize2 size={18} />
                  </div>
                  <div className="summary-enhanced-content">
                    <div className="summary-enhanced-label">Size</div>
                    <div className="summary-enhanced-value">
                      {tarpaulinData.width && tarpaulinData.height 
                        ? `${tarpaulinData.width} × ${tarpaulinData.height} ft` 
                        : '-'}
                    </div>
                  </div>
                </div>
                <div className="summary-enhanced-item">
                  <div className="summary-enhanced-icon">
                    <RotateCw size={18} />
                  </div>
                  <div className="summary-enhanced-content">
                    <div className="summary-enhanced-label">Orientation</div>
                    <div className="summary-enhanced-value">{tarpaulinData.orientation || '-'}</div>
                  </div>
                </div>
                <div className="summary-enhanced-item">
                  <div className="summary-enhanced-icon">
                    <Hash size={18} />
                  </div>
                  <div className="summary-enhanced-content">
                    <div className="summary-enhanced-label">Quantity</div>
                    <div className="summary-enhanced-value">{tarpaulinData.quantity || '-'} pc(s)</div>
                  </div>
                </div>
                <div className="summary-enhanced-item">
                  <div className="summary-enhanced-icon">
                    <Paintbrush size={18} />
                  </div>
                  <div className="summary-enhanced-content">
                    <div className="summary-enhanced-label">Background Color</div>
                    <div className="summary-enhanced-value">{tarpaulinData.backgroundColor || '-'}</div>
                  </div>
                </div>
                <div className="summary-enhanced-item">
                  <div className="summary-enhanced-icon">
                    <Type size={18} />
                  </div>
                  <div className="summary-enhanced-content">
                    <div className="summary-enhanced-label">Text/Main Color</div>
                    <div className="summary-enhanced-value">{tarpaulinData.textColor || '-'}</div>
                  </div>
                </div>
                <div className="summary-enhanced-item">
                  <div className="summary-enhanced-icon">
                    <Wallet size={18} />
                  </div>
                  <div className="summary-enhanced-content">
                    <div className="summary-enhanced-label">Payment Method</div>
                    <div className="summary-enhanced-value">{tarpaulinData.paymentMethod || '-'}</div>
                  </div>
                </div>
                <div className="summary-enhanced-item">
                  <div className="summary-enhanced-icon">
                    <DollarSign size={18} />
                  </div>
                  <div className="summary-enhanced-content">
                    <div className="summary-enhanced-label">Down Payment</div>
                    <div className="summary-enhanced-value">
                      {tarpaulinData.downPayment ? `₱${parseFloat(tarpaulinData.downPayment).toFixed(2)}` : '-'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="form-section">
              <h3 className="form-section-title">Payment Details</h3>
              
              {/* Payment Method Buttons - 1 Row */}
              <div className="payment-method-group">
                <label>Payment Method *</label>
                <div className="payment-method-buttons">
                  <button
                    type="button"
                    className={`payment-method-btn ${tarpaulinData.paymentMethod === 'Cash' ? 'active' : ''}`}
                    onClick={() => handleTarpaulinInputChange('paymentMethod', 'Cash')}
                  >
                    <Wallet size={18} />
                    <span>Cash</span>
                  </button>
                  <button
                    type="button"
                    className={`payment-method-btn ${tarpaulinData.paymentMethod === 'GCash' ? 'active' : ''}`}
                    onClick={() => handleTarpaulinInputChange('paymentMethod', 'GCash')}
                  >
                    <CreditCard size={18} />
                    <span>GCash</span>
                  </button>
                  <button
                    type="button"
                    className={`payment-method-btn ${tarpaulinData.paymentMethod === 'Bank Transfer' ? 'active' : ''}`}
                    onClick={() => handleTarpaulinInputChange('paymentMethod', 'Bank Transfer')}
                  >
                    <CreditCard size={18} />
                    <span>Bank Transfer</span>
                  </button>
                  <button
                    type="button"
                    className={`payment-method-btn ${tarpaulinData.paymentMethod === 'Credit Card' ? 'active' : ''}`}
                    onClick={() => handleTarpaulinInputChange('paymentMethod', 'Credit Card')}
                  >
                    <CreditCard size={18} />
                    <span>Credit Card</span>
                  </button>
                </div>
              </div>

              {/* Down Payment */}
              <div className="down-payment-enhanced">
                <label>Down Payment</label>
                <div className="down-payment-input-wrapper">
                  <div className="down-payment-icon">
                    <DollarSign size={18} />
                  </div>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={tarpaulinData.downPayment}
                    onChange={(e) => handleTarpaulinInputChange('downPayment', e.target.value)}
                    min="0"
                    step="0.01"
                    className="down-payment-input"
                  />
                  <span className="down-payment-currency">PHP</span>
                </div>
              </div>

              {/* Payment Breakdown */}
              <div className="payment-breakdown">
                <h4 className="payment-breakdown-title">Payment Breakdown</h4>
                <div className="payment-breakdown-content">
                  <div className="payment-breakdown-item">
                    <span className="payment-breakdown-label">Down Payment:</span>
                    <span className="payment-breakdown-value">
                      ₱{tarpaulinData.downPayment ? parseFloat(tarpaulinData.downPayment).toFixed(2) : '0.00'}
                    </span>
                  </div>
                  <div className="payment-breakdown-item">
                    <span className="payment-breakdown-label">Balance:</span>
                    <span className="payment-breakdown-value">
                      ₱0.00
                    </span>
                  </div>
                  <div className="payment-breakdown-item payment-breakdown-total">
                    <span className="payment-breakdown-label">Total:</span>
                    <span className="payment-breakdown-value">
                      ₱{tarpaulinData.downPayment ? parseFloat(tarpaulinData.downPayment).toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>

                {/* Print Buttons */}
                <div className="print-buttons-row">
                  <button type="button" className="print-btn" onClick={() => console.log('Print Invoice')}>
                    <FileText size={16} />
                    <span>Print Invoice</span>
                  </button>
                  <button type="button" className="print-btn" onClick={() => console.log('Print Detail Copy')}>
                    <FileText size={16} />
                    <span>Print Detail Copy</span>
                  </button>
                  <button type="button" className="print-btn" onClick={() => console.log('Print Receipt')}>
                    <FileText size={16} />
                    <span>Print Receipt</span>
                  </button>
                </div>
              </div>
              
              <div className="payment-note">
                <div className="payment-note-header">
                  <FileText size={16} />
                  <strong>Important Note for Graphic Artist</strong>
                </div>
                <ul className="payment-note-list">
                  <li>Enter the down payment amount agreed with the customer.</li>
                  <li>Select the payment method the customer will use at the cashier.</li>
                  <li>This information will be sent to the cashier for payment collection.</li>
                  <li>Confirm all details with the customer before saving the order.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 3 && orderType !== 'Repairs' && orderType !== 'Tarpaulin' && (
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
          <div className="order-sidebar">
            <div className="sidebar-section">
              <div className="sidebar-header">
                <h3>Order Information</h3>
              </div>
              
              <div className="sidebar-content">
                {/* Category */}
                <div className="sidebar-item">
                  <div className="sidebar-label">Category</div>
                  <div className="sidebar-value category-badge">
                    {orderType === 'Repairs' && <Wrench size={16} />}
                    {orderType === 'Tarpaulin' && <Package size={16} />}
                    {orderType !== 'Repairs' && orderType !== 'Tarpaulin' && <Package size={16} />}
                    <span>{orderType}</span>
                  </div>
                </div>

                <div className="sidebar-divider"></div>

                {/* Repairs Information */}
                {orderType === 'Repairs' && (
                  <>
                    <div className="sidebar-item">
                      <div className="sidebar-label">Customer Name</div>
                      <div className="sidebar-value">{repairData.customerName || 'Not provided'}</div>
                    </div>

                    <div className="sidebar-item">
                      <div className="sidebar-label">Contact Number</div>
                      <div className="sidebar-value">{repairData.contactNumber || 'Not provided'}</div>
                    </div>

                    {repairData.email && (
                      <div className="sidebar-item">
                        <div className="sidebar-label">Email</div>
                        <div className="sidebar-value">{repairData.email}</div>
                      </div>
                    )}

                    <div className="sidebar-divider"></div>

                    <div className="sidebar-item">
                      <div className="sidebar-label">Device Type</div>
                      <div className="sidebar-value">{repairData.deviceType || 'Not selected'}</div>
                    </div>

                    {repairData.deviceBrand && (
                      <div className="sidebar-item">
                        <div className="sidebar-label">Brand</div>
                        <div className="sidebar-value">{repairData.deviceBrand}</div>
                      </div>
                    )}

                    {repairData.deviceModel && (
                      <div className="sidebar-item">
                        <div className="sidebar-label">Model</div>
                        <div className="sidebar-value">{repairData.deviceModel}</div>
                      </div>
                    )}

                    {repairData.techAssigned && (
                      <>
                        <div className="sidebar-divider"></div>
                        <div className="sidebar-item">
                          <div className="sidebar-label">Assigned Technician</div>
                          <div className="sidebar-value">{repairData.techAssigned}</div>
                        </div>
                      </>
                    )}

                    {step === 3 && repairData.problems.length > 0 && (
                      <>
                        <div className="sidebar-divider"></div>
                        <div className="sidebar-item">
                          <div className="sidebar-label">Issues Reported</div>
                          <div className="sidebar-value">{repairData.problems.length} problem(s)</div>
                        </div>
                      </>
                    )}

                    <div className="sidebar-divider"></div>
                    <div className="sidebar-item">
                      <div className="sidebar-label">Order Status</div>
                      <div className="sidebar-value">
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          background: '#1a3a5c',
                          color: '#4da3ff',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          In Progress
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* Tarpaulin Information */}
                {orderType === 'Tarpaulin' && (
                  <>
                    <div className="sidebar-item">
                      <div className="sidebar-label">Customer Name</div>
                      <div className="sidebar-value">{tarpaulinData.customerName || 'Not provided'}</div>
                    </div>

                    <div className="sidebar-item">
                      <div className="sidebar-label">Contact Number</div>
                      <div className="sidebar-value">{tarpaulinData.contactNumber || 'Not provided'}</div>
                    </div>

                    {tarpaulinData.email && (
                      <div className="sidebar-item">
                        <div className="sidebar-label">Email</div>
                        <div className="sidebar-value">{tarpaulinData.email}</div>
                      </div>
                    )}

                    {tarpaulinData.businessName && (
                      <div className="sidebar-item">
                        <div className="sidebar-label">Business Name</div>
                        <div className="sidebar-value">{tarpaulinData.businessName}</div>
                      </div>
                    )}

                    {tarpaulinData.eventType && (
                      <>
                        <div className="sidebar-divider"></div>
                        <div className="sidebar-item">
                          <div className="sidebar-label">Event Type</div>
                          <div className="sidebar-value">{tarpaulinData.eventType}</div>
                        </div>
                      </>
                    )}

                    {tarpaulinData.eventDate && (
                      <div className="sidebar-item">
                        <div className="sidebar-label">Event Date</div>
                        <div className="sidebar-value">
                          {new Date(tarpaulinData.eventDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                    )}

                    {tarpaulinData.preferredDeliveryDate && (
                      <>
                        <div className="sidebar-divider"></div>
                        <div className="sidebar-item">
                          <div className="sidebar-label">Preferred Pickup</div>
                          <div className="sidebar-value">
                            {new Date(tarpaulinData.preferredDeliveryDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                        </div>
                      </>
                    )}

                    {(tarpaulinData.width || tarpaulinData.height) && (
                      <>
                        <div className="sidebar-divider"></div>
                        <div className="sidebar-item">
                          <div className="sidebar-label">Dimensions</div>
                          <div className="sidebar-value">
                            {tarpaulinData.width && tarpaulinData.height 
                              ? `${tarpaulinData.width} x ${tarpaulinData.height} ft` 
                              : tarpaulinData.width 
                                ? `${tarpaulinData.width} ft (W)` 
                                : `${tarpaulinData.height} ft (H)`}
                          </div>
                        </div>
                      </>
                    )}

                    {tarpaulinData.orientation && (
                      <div className="sidebar-item">
                        <div className="sidebar-label">Orientation</div>
                        <div className="sidebar-value">{tarpaulinData.orientation}</div>
                      </div>
                    )}

                    {tarpaulinData.quantity && (
                      <div className="sidebar-item">
                        <div className="sidebar-label">Quantity</div>
                        <div className="sidebar-value">{tarpaulinData.quantity} pc(s)</div>
                      </div>
                    )}

                    {(tarpaulinData.backgroundColor || tarpaulinData.textColor) && (
                      <>
                        <div className="sidebar-divider"></div>
                        {tarpaulinData.backgroundColor && (
                          <div className="sidebar-item">
                            <div className="sidebar-label">Background Color</div>
                            <div className="sidebar-value">{tarpaulinData.backgroundColor}</div>
                          </div>
                        )}
                        {tarpaulinData.textColor && (
                          <div className="sidebar-item">
                            <div className="sidebar-label">Text Color</div>
                            <div className="sidebar-value">{tarpaulinData.textColor}</div>
                          </div>
                        )}
                      </>
                    )}

                    {step === 4 && tarpaulinData.amountPaid && (
                      <>
                        <div className="sidebar-divider"></div>
                        <div className="sidebar-item">
                          <div className="sidebar-label">Amount Paid</div>
                          <div className="sidebar-value">₱{parseFloat(tarpaulinData.amountPaid).toFixed(2)}</div>
                        </div>
                      </>
                    )}

                    <div className="sidebar-divider"></div>
                    <div className="sidebar-item">
                      <div className="sidebar-label">Order Status</div>
                      <div className="sidebar-value">
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          background: '#1a3a5c',
                          color: '#4da3ff',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          In Progress
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* Other Order Types */}
                {orderType !== 'Repairs' && orderType !== 'Tarpaulin' && (
                  <>
                    <div className="sidebar-item">
                      <div className="sidebar-label">Order Type</div>
                      <div className="sidebar-value">{orderType}</div>
                    </div>
                    <div className="sidebar-divider"></div>
                    <div className="sidebar-item">
                      <div className="sidebar-label">Status</div>
                      <div className="sidebar-value">
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          background: '#1a3a5c',
                          color: '#4da3ff',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          In Progress
                        </span>
                      </div>
                    </div>
                  </>
                )}

                <div className="sidebar-divider"></div>

                {/* Order Timestamp and Step in One Row */}
                <div className="sidebar-row-items">
                  <div className="sidebar-item">
                    <div className="sidebar-label">Created</div>
                    <div className="sidebar-value" style={{ fontSize: '12px', color: '#888888' }}>
                      {new Date().toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>

                  <div className="sidebar-item">
                    <div className="sidebar-label">Current Step</div>
                    <div className="sidebar-value">Step {step} of {steps.length}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Create Pahabol View
function CreatePahabolView() {
  return (
    <div className="view-container">
      <div className="view-header">
        <h1>Create Pahabol</h1>
        <p>Create a rush/pahabol order</p>
      </div>
      <div className="content-placeholder">
        <Clock size={48} />
        <p>Create Pahabol form will be here</p>
      </div>
    </div>
  )
}

// Order Tracking View
function OrderTrackingView() {
  return (
    <div className="view-container">
      <div className="view-header">
        <h1>Order Tracking</h1>
        <p>Track all orders</p>
      </div>
      <div className="content-placeholder">
        <Package size={48} />
        <p>Order tracking list will be here</p>
      </div>
    </div>
  )
}

// Sublimation Orders View
function SublimationOrdersView() {
  return (
    <div className="view-container">
      <div className="view-header">
        <h1>Sublimation Orders</h1>
        <p>Manage sublimation orders</p>
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
        <h1>Sublimation Listing</h1>
        <p>View all sublimation products</p>
      </div>
      <div className="content-placeholder">
        <List size={48} />
        <p>Sublimation product listing will be here</p>
      </div>
    </div>
  )
}

export default GraphicArtistDashboard
