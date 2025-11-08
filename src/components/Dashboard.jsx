import { useState, useEffect } from 'react'
import { 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Clock,
  User,
  Edit2,
  Trash2,
  Plus,
  Save,
  X,
  CreditCard,
  FileText,
  Printer,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import './Dashboard.css'
import './TimeTracker.css'
import './TimeTable.css'
import {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  fetchTimeRecords,
  createTimeRecord,
  updateTimeRecord,
  deleteTimeRecord,
  fetchCashAdvanceRecords,
  createCashAdvanceRecord,
  updateCashAdvanceRecord,
  deleteCashAdvanceRecord,
  fetchDayOffRecords,
  createDayOffRecord,
  updateDayOffRecord,
  deleteDayOffRecord,
  fetchSettings,
  updateSettings
} from '../lib/supabase'

// Format number with commas and peso sign
const formatPeso = (amount) => {
  return `₱${Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Censor sensitive data for accountants
const censorRate = (amount) => {
  return '₱•••••'
}

function Dashboard({ activeView, setActiveView }) {
  const { user } = useAuth()
  const isManager = user?.role === 'manager'
  // Load data from Supabase
  const [employees, setEmployees] = useState([])

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)

  // Time tracking state
  const [showTimeTracker, setShowTimeTracker] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [payPeriod, setPayPeriod] = useState('1-15') // '1-15' or '16-31'
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  
  // Initialize time entries for each day
  const initializeTimeEntries = () => {
    const entries = {}
    const days = payPeriod === '1-15' ? 15 : 16 // 16 days for 16-31
    const startDay = payPeriod === '1-15' ? 1 : 16
    
    for (let i = 0; i < days; i++) {
      const day = startDay + i
      entries[day] = {
        firstShiftIn: '',
        firstShiftOut: '',
        secondShiftIn: '',
        secondShiftOut: '',
        otTimeIn: '',
        otTimeOut: ''
      }
    }
    return entries
  }

  const [timeEntries, setTimeEntries] = useState(initializeTimeEntries())
  const [timeRecords, setTimeRecords] = useState([])
  
  // Deductions and Commissions
  const [rushTarpCount, setRushTarpCount] = useState(0)
  const [regularCommissionCount, setRegularCommissionCount] = useState(0)
  const [cashAdvance, setCashAdvance] = useState(0)

  // Settings
  const [defaultHoursPerShift, setDefaultHoursPerShift] = useState(9)
  const [rushTarpCommissionRate, setRushTarpCommissionRate] = useState(50)
  const [regularCommissionRate, setRegularCommissionRate] = useState(20)
  const [lateDeductionRate, setLateDeductionRate] = useState(1)
  const [maxAbsencesForDayOff, setMaxAbsencesForDayOff] = useState(3)
  const [customCommissions, setCustomCommissions] = useState([])
  
  // Custom Commission Form
  const [newCommissionName, setNewCommissionName] = useState('')
  const [newCommissionRate, setNewCommissionRate] = useState(0)
  
  // Custom Commission Counts
  const [customCommissionCounts, setCustomCommissionCounts] = useState({})

  // Employee Form Data
  const [formData, setFormData] = useState({
    name: '',
    ratePer9Hours: 0,
    hoursPerShift: 9,
    shiftType: 'first'
  })

  // Cash Advance Records
  const [cashAdvanceRecords, setCashAdvanceRecords] = useState([])
  const [showAddCashAdvanceModal, setShowAddCashAdvanceModal] = useState(false)
  const [cashAdvanceForm, setCashAdvanceForm] = useState({
    employeeId: '',
    employeeName: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  })

  // Day Off Records
  const [dayOffRecords, setDayOffRecords] = useState([])
  const [showAddDayOffModal, setShowAddDayOffModal] = useState(false)
  const [showAutoSetupModal, setShowAutoSetupModal] = useState(false)
  const [showSwapModal, setShowSwapModal] = useState(false)
  const [dayOffForm, setDayOffForm] = useState({
    employeeId: '',
    employeeName: '',
    date: new Date().toISOString().split('T')[0],
    month: '',
    year: new Date().getFullYear(),
    payPeriod: '',
    hoursPaid: 9,
    absenceCount: 0,
    isQualified: true,
    notes: ''
  })
  const [autoSetupForm, setAutoSetupForm] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    payPeriod: '1-15',
    selectedEmployees: []
  })
  const [swapForm, setSwapForm] = useState({
    employee1Id: '',
    employee2Id: ''
  })

  // Payroll View
  const [viewingPayrollRecord, setViewingPayrollRecord] = useState(null)
  const [viewingCashAdvanceEmployee, setViewingCashAdvanceEmployee] = useState(null)
  const [cashAdvanceTimelineView, setCashAdvanceTimelineView] = useState(false)
  const [payrollTimelineView, setPayrollTimelineView] = useState(false)
  const [payrollTimelineFilter, setPayrollTimelineFilter] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    payPeriod: '1-15'
  })
  const [editingPayrollRecordId, setEditingPayrollRecordId] = useState(null)

  
  // Custom Success Popup
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successMessage, setSuccessMessage] = useState({
    title: '',
    message: '',
    details: []
  })

  const showSuccess = (title, message, details = []) => {
    setSuccessMessage({ title, message, details })
    setShowSuccessPopup(true)
  }

  // Prevent body scroll when success popup is open
  useEffect(() => {
    if (showSuccessPopup) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showSuccessPopup])

  // Loading state
  const [isLoading, setIsLoading] = useState(true)

  // Load data from Supabase on mount
  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    try {
      setIsLoading(true)
      
      // Load all data in parallel
      const [employeesData, timeRecordsData, cashAdvanceData, dayOffData, settingsData] = await Promise.all([
        fetchEmployees(),
        fetchTimeRecords(),
        fetchCashAdvanceRecords(),
        fetchDayOffRecords(),
        fetchSettings()
      ])

      setEmployees(employeesData)
      setTimeRecords(timeRecordsData)
      setCashAdvanceRecords(cashAdvanceData)
      setDayOffRecords(dayOffData)
      
      // Set settings
      if (settingsData) {
        setDefaultHoursPerShift(settingsData.defaultHoursPerShift || 9)
        setRushTarpCommissionRate(settingsData.rushTarpCommissionRate || 50)
        setRegularCommissionRate(settingsData.regularCommissionRate || 20)
        setLateDeductionRate(settingsData.lateDeductionRate || 1)
        setMaxAbsencesForDayOff(settingsData.maxAbsencesForDayOff || 3)
        setCustomCommissions(settingsData.customCommissions || [])
      }

      setIsLoading(false)
    } catch (error) {
      console.error('Error loading data:', error)
      showSuccess('Database Error', 'Failed to load data from database. Please check your connection.', [])
      setIsLoading(false)
    }
  }

  // Save settings to database whenever they change
  useEffect(() => {
    if (!isLoading) {
      const saveSettings = async () => {
        try {
          await updateSettings({
            defaultHoursPerShift,
            rushTarpCommissionRate,
            regularCommissionRate,
            lateDeductionRate,
            maxAbsencesForDayOff,
            customCommissions
          })
        } catch (error) {
          console.error('Error saving settings:', error)
        }
      }
      saveSettings()
    }
  }, [defaultHoursPerShift, rushTarpCommissionRate, regularCommissionRate, lateDeductionRate, maxAbsencesForDayOff, customCommissions, isLoading])

  // Reset time entries when pay period changes
  const handlePayPeriodChange = (period) => {
    setPayPeriod(period)
    const entries = {}
    const days = period === '1-15' ? 15 : 16
    const startDay = period === '1-15' ? 1 : 16
    
    for (let i = 0; i < days; i++) {
      const day = startDay + i
      entries[day] = {
        firstShiftIn: '',
        firstShiftOut: '',
        secondShiftIn: '',
        secondShiftOut: '',
        otTimeIn: '',
        otTimeOut: ''
      }
    }
    setTimeEntries(entries)
  }

  // Filter employees based on search query
  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const calculateStats = (employee) => {
    // Calculate hourly rate based on the 9-hour shift rate
    const hourlyRate = (employee.ratePer9Hours / employee.hoursPerShift).toFixed(2)
    
    // Assuming 1 shift per day, 5 days a week
    const dailyEarnings = employee.ratePer9Hours // 1 shift = rate per 9 hours
    const weeklyEarnings = (employee.ratePer9Hours * 5).toFixed(2) // 5 shifts per week
    const monthlyEarnings = (employee.ratePer9Hours * 22).toFixed(2) // ~22 working days
    const annualSalary = (employee.ratePer9Hours * 260).toFixed(2) // ~260 working days
    
    return {
      hourlyRate,
      dailyEarnings,
      weeklyEarnings,
      monthlyEarnings,
      annualSalary
    }
  }

  const totalStats = () => {
    if (employees.length === 0) {
      return {
        totalPerShift: '0.00',
        totalWeekly: '0.00',
        totalMonthly: '0.00',
        totalAnnual: '0.00',
        avgPerShift: '0.00',
        employeeCount: 0
      }
    }
    
    const totalPerShift = employees.reduce((sum, emp) => sum + emp.ratePer9Hours, 0)
    const totalWeekly = totalPerShift * 5
    const totalMonthly = totalPerShift * 22
    const totalAnnual = totalPerShift * 260
    const avgPerShift = totalPerShift / employees.length
    
    return {
      totalPerShift: totalPerShift.toFixed(2),
      totalWeekly: totalWeekly.toFixed(2),
      totalMonthly: totalMonthly.toFixed(2),
      totalAnnual: totalAnnual.toFixed(2),
      avgPerShift: avgPerShift.toFixed(2),
      employeeCount: employees.length
    }
  }

  const handleAddEmployee = async () => {
    if (formData.name && formData.ratePer9Hours) {
      try {
      const newEmployee = {
        name: formData.name,
        ratePer9Hours: Number(formData.ratePer9Hours),
        hoursPerShift: Number(formData.hoursPerShift),
        shiftType: formData.shiftType
      }
        const savedEmployee = await createEmployee(newEmployee)
        setEmployees([...employees, savedEmployee])
        setFormData({ name: '', ratePer9Hours: 0, hoursPerShift: 9, shiftType: 'first' })
      setShowAddModal(false)
        showSuccess('Employee Added!', `${savedEmployee.name} has been added to the system.`, [])
      } catch (error) {
        console.error('Error adding employee:', error)
        showSuccess('Error', 'Failed to add employee. Please try again.', [])
      }
    }
  }

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee.id)
    setFormData({
      name: employee.name || '',
      ratePer9Hours: employee.ratePer9Hours || 0,
      hoursPerShift: employee.hoursPerShift || 9,
      shiftType: employee.shiftType || 'first'
    })
    setShowAddModal(true)
  }

  const handleUpdateEmployee = async () => {
    if (formData.name && formData.ratePer9Hours) {
      try {
        const updates = {
              name: formData.name, 
              ratePer9Hours: Number(formData.ratePer9Hours), 
              hoursPerShift: Number(formData.hoursPerShift),
              shiftType: formData.shiftType
            }
        await updateEmployee(editingEmployee, updates)
        
        setEmployees(employees.map(emp => 
          emp.id === editingEmployee 
            ? { ...emp, ...updates }
          : emp
      ))
        setFormData({ name: '', ratePer9Hours: 0, hoursPerShift: 9, shiftType: 'first' })
      setShowAddModal(false)
      setEditingEmployee(null)
        showSuccess('Employee Updated!', 'Employee information has been updated.', [])
      } catch (error) {
        console.error('Error updating employee:', error)
        showSuccess('Error', 'Failed to update employee. Please try again.', [])
      }
    }
  }

  const handleDeleteEmployee = async (id) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      try {
        await deleteEmployee(id)
      setEmployees(employees.filter(emp => emp.id !== id))
        showSuccess('Employee Deleted', 'Employee has been removed from the system.', [])
      } catch (error) {
        console.error('Error deleting employee:', error)
        showSuccess('Error', 'Failed to delete employee. Please try again.', [])
      }
    }
  }

  // Custom Commission Handlers
  const handleAddCustomCommission = () => {
    if (newCommissionName.trim() && newCommissionRate > 0) {
      const newCommission = {
        id: Date.now().toString(),
        name: newCommissionName.trim(),
        rate: Number(newCommissionRate)
      }
      setCustomCommissions([...customCommissions, newCommission])
      setNewCommissionName('')
      setNewCommissionRate(0)
      showSuccess('Commission Added!', `${newCommission.name} commission has been added.`, [])
    }
  }

  const handleDeleteCustomCommission = (id) => {
    setCustomCommissions(customCommissions.filter(comm => comm.id !== id))
    // Remove from counts
    const newCounts = { ...customCommissionCounts }
    delete newCounts[id]
    setCustomCommissionCounts(newCounts)
    showSuccess('Commission Deleted', 'Custom commission has been removed.', [])
  }

  const handleOpenTimeTracker = (employee) => {
    setSelectedEmployee(employee)
    setShowTimeTracker(true)
    setSearchQuery(employee.name)
    setShowDropdown(false)
    setTimeEntries(initializeTimeEntries())
    setRushTarpCount(0)
    setRegularCommissionCount(0)
    setCustomCommissionCounts({})
    setCashAdvance(0)
    setEditingPayrollRecordId(null)
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setShowDropdown(true)
    if (!e.target.value) {
      setSelectedEmployee(null)
      setShowTimeTracker(false)
    }
  }

  const handleSelectEmployee = (employee) => {
    handleOpenTimeTracker(employee)
  }

  const calculateDayHours = (dayEntry) => {
    let regularHours = 0
    let overtimeHours = 0
    
    // Calculate First Shift hours (7 AM - 5 PM = 9 hours regular)
    if (dayEntry.firstShiftIn && dayEntry.firstShiftOut) {
      const firstIn = new Date(`2000-01-01T${dayEntry.firstShiftIn}`)
      const firstOut = new Date(`2000-01-01T${dayEntry.firstShiftOut}`)
      regularHours += (firstOut - firstIn) / (1000 * 60 * 60)
    }
    
    // Calculate Second Shift hours (8 PM - 7 AM = 9 hours regular)
    // Handle overnight shift
    if (dayEntry.secondShiftIn && dayEntry.secondShiftOut) {
      const secondIn = new Date(`2000-01-01T${dayEntry.secondShiftIn}`)
      let secondOut = new Date(`2000-01-01T${dayEntry.secondShiftOut}`)
      
      // If shift ends before it starts, it means it crosses midnight
      if (secondOut < secondIn) {
        secondOut = new Date(`2000-01-02T${dayEntry.secondShiftOut}`)
      }
      
      regularHours += (secondOut - secondIn) / (1000 * 60 * 60)
    }
    
    // Calculate OT hours
    if (dayEntry.otTimeIn && dayEntry.otTimeOut) {
      const otIn = new Date(`2000-01-01T${dayEntry.otTimeIn}`)
      const otOut = new Date(`2000-01-01T${dayEntry.otTimeOut}`)
      overtimeHours += (otOut - otIn) / (1000 * 60 * 60)
    }
    
    return { regularHours, overtimeHours }
  }

  const calculateLateMinutes = () => {
    if (!selectedEmployee) return 0
    
    let totalLateMinutes = 0
    const shiftStartTime = selectedEmployee.shiftType === 'first' ? '07:00' : '20:30'
    
    Object.values(timeEntries).forEach(dayEntry => {
      // Check morning/first shift for first shift employees
      if (selectedEmployee.shiftType === 'first' && dayEntry.firstShiftIn) {
        const clockIn = dayEntry.firstShiftIn
        if (clockIn.includes(':')) {
          const [hours, minutes] = clockIn.split(':').map(Number)
          const clockInMinutes = hours * 60 + minutes
          const shiftStartMinutes = 7 * 60 // 07:00
          
          if (clockInMinutes > shiftStartMinutes) {
            totalLateMinutes += (clockInMinutes - shiftStartMinutes)
          }
        }
      }
      
      // Check afternoon/second shift for second shift employees
      if (selectedEmployee.shiftType === 'second' && dayEntry.secondShiftIn) {
        const clockIn = dayEntry.secondShiftIn
        if (clockIn.includes(':')) {
          const [hours, minutes] = clockIn.split(':').map(Number)
          const clockInMinutes = hours * 60 + minutes
          const shiftStartMinutes = 20 * 60 + 30 // 20:30
          
          if (clockInMinutes > shiftStartMinutes) {
            totalLateMinutes += (clockInMinutes - shiftStartMinutes)
          }
        }
      }
    })
    
    return totalLateMinutes
  }

  const calculateTotalEarnings = () => {
    if (!selectedEmployee) return { 
      regularPay: 0, 
      overtimePay: 0, 
      grossPay: 0,
      rushTarpCommission: 0,
      regularCommission: 0,
      totalCommissions: 0,
      totalDeductions: 0,
      netPay: 0,
      totalHours: 0, 
      regularHours: 0, 
      totalOvertimeHours: 0,
      lateMinutes: 0,
      lateDeduction: 0,
      dayOffHours: 0
    }
    
    let totalRegularHours = 0
    let totalOvertimeHours = 0
    
    Object.values(timeEntries).forEach(dayEntry => {
      const dayHours = calculateDayHours(dayEntry)
      totalRegularHours += dayHours.regularHours
      totalOvertimeHours += dayHours.overtimeHours
    })
    
    // Add day off hours for the current period
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const currentMonth = monthNames[selectedMonth]
    const dayOffHours = getEmployeeDayOffHoursForPeriod(selectedEmployee.id, currentMonth, selectedYear, payPeriod)
    
    totalRegularHours += dayOffHours
    
    const totalHours = totalRegularHours + totalOvertimeHours
    const hourlyRate = selectedEmployee.ratePer9Hours / selectedEmployee.hoursPerShift
    const regularPay = totalRegularHours * hourlyRate
    const overtimePay = totalOvertimeHours * hourlyRate // Same rate as regular hours
    const grossPay = regularPay + overtimePay
    
    // Commissions (using settings values)
    const rushTarpCommission = rushTarpCount * rushTarpCommissionRate
    const regularCommission = regularCommissionCount * regularCommissionRate
    
    // Calculate custom commissions
    let customCommissionsTotal = 0
    Object.keys(customCommissionCounts).forEach(commId => {
      const commission = customCommissions.find(c => c.id === commId)
      if (commission) {
        customCommissionsTotal += customCommissionCounts[commId] * commission.rate
      }
    })
    
    const totalCommissions = rushTarpCommission + regularCommission + customCommissionsTotal
    
    // Calculate late minutes and deduction (using settings rate)
    const lateMinutes = calculateLateMinutes()
    const lateDeduction = lateMinutes * lateDeductionRate
    
    // Deductions
    const cashAdvanceDeduction = Number(cashAdvance) || 0
    const totalDeductions = cashAdvanceDeduction + lateDeduction
    
    // Net Pay
    const netPay = grossPay + totalCommissions - totalDeductions
    
    return {
      regularPay: regularPay.toFixed(2),
      overtimePay: overtimePay.toFixed(2),
      grossPay: grossPay.toFixed(2),
      rushTarpCommission: rushTarpCommission.toFixed(2),
      regularCommission: regularCommission.toFixed(2),
      customCommissionsTotal: customCommissionsTotal.toFixed(2),
      totalCommissions: totalCommissions.toFixed(2),
      totalDeductions: totalDeductions.toFixed(2),
      netPay: netPay.toFixed(2),
      totalHours: totalHours.toFixed(2),
      regularHours: totalRegularHours.toFixed(2),
      totalOvertimeHours: totalOvertimeHours.toFixed(2),
      lateMinutes: lateMinutes,
      lateDeduction: lateDeduction.toFixed(2),
      dayOffHours: dayOffHours.toFixed(2)
    }
  }

  const formatTimeInput = (input) => {
    // Remove any non-digit characters
    const digits = input.replace(/\D/g, '')
    
    // Handle 3 digits (e.g., "700" -> "07:00")
    if (digits.length === 3) {
      const hours = '0' + digits.substring(0, 1)
      const minutes = digits.substring(1, 3)
      return `${hours}:${minutes}`
    }
    
    // Handle 4 digits (e.g., "1300" -> "13:00")
    if (digits.length === 4) {
      const hours = digits.substring(0, 2)
      const minutes = digits.substring(2, 4)
      return `${hours}:${minutes}`
    }
    
    return digits
  }

  const handleTimeInputChange = (day, field, value) => {
    // Remove any non-digit characters except colon
    const cleaned = value.replace(/[^\d:]/g, '')
    
    // If it already has a colon, keep it as is
    if (cleaned.includes(':')) {
      setTimeEntries(prev => ({
        ...prev,
        [day]: {
          ...prev[day],
          [field]: cleaned
        }
      }))
      return
    }
    
    // Only allow up to 4 digits
    const digits = cleaned.replace(/\D/g, '')
    if (digits.length > 4) return
    
    // Just store the digits, don't auto-format (wait for Enter key)
    setTimeEntries(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: digits
      }
    }))
  }

  const handleTimeInputKeyPress = (e, day, field) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      
      // Get current value and format it
      const currentValue = timeEntries[day][field]
      if (currentValue && !currentValue.includes(':')) {
        const formatted = formatTimeInput(currentValue)
        setTimeEntries(prev => ({
          ...prev,
          [day]: {
            ...prev[day],
            [field]: formatted
          }
        }))
      }
      
      // Move to next field
      const fieldOrder = ['firstShiftIn', 'firstShiftOut', 'secondShiftIn', 'secondShiftOut', 'otTimeIn', 'otTimeOut']
      const currentFieldIndex = fieldOrder.indexOf(field)
      
      if (currentFieldIndex < fieldOrder.length - 1) {
        // Move to next field in same day
        const nextField = fieldOrder[currentFieldIndex + 1]
        const nextInput = document.querySelector(`input[data-day="${day}"][data-field="${nextField}"]`)
        if (nextInput) {
          nextInput.focus()
          nextInput.select()
        }
      } else {
        // Move to first field of next day
        const days = Object.keys(timeEntries).map(Number).sort((a, b) => a - b)
        const currentDayIndex = days.indexOf(day)
        if (currentDayIndex < days.length - 1) {
          const nextDay = days[currentDayIndex + 1]
          const nextInput = document.querySelector(`input[data-day="${nextDay}"][data-field="firstShiftIn"]`)
          if (nextInput) {
            nextInput.focus()
            nextInput.select()
          }
        }
      }
    }
  }

  const updateTimeEntry = (day, field, value) => {
    setTimeEntries(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }))
  }

  const handleSaveTimeEntry = async () => {
    if (!selectedEmployee) return
    
    try {
    const earnings = calculateTotalEarnings()
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    
    const recordData = {
      employeeId: selectedEmployee.id,
      employeeName: selectedEmployee.name,
      month: monthNames[selectedMonth],
      year: selectedYear,
      payPeriod: payPeriod,
      timeEntries: { ...timeEntries },
      rushTarpCount: rushTarpCount,
      regularCommissionCount: regularCommissionCount,
      customCommissionCounts: { ...customCommissionCounts },
      cashAdvance: cashAdvance,
        regularPay: earnings.regularPay,
        overtimePay: earnings.overtimePay,
        grossPay: earnings.grossPay,
        rushTarpCommission: earnings.rushTarpCommission,
        regularCommission: earnings.regularCommission,
        customCommissionsTotal: earnings.customCommissionsTotal,
        totalCommissions: earnings.totalCommissions,
        totalDeductions: earnings.totalDeductions,
        netPay: earnings.netPay,
        totalHours: earnings.totalHours,
        regularHours: earnings.regularHours,
        totalOvertimeHours: earnings.totalOvertimeHours,
        lateMinutes: earnings.lateMinutes,
        lateDeduction: earnings.lateDeduction
      }
      
      let savedRecord
      if (editingPayrollRecordId) {
        // Update existing record
        savedRecord = await updateTimeRecord(editingPayrollRecordId, recordData)
        setTimeRecords(timeRecords.map(r => r.id === editingPayrollRecordId ? savedRecord : r))
        setEditingPayrollRecordId(null)
      } else {
        // Create new record
        savedRecord = await createTimeRecord(recordData)
        setTimeRecords([...timeRecords, savedRecord])
      }
    
    // Reset commissions and deductions
    setRushTarpCount(0)
    setRegularCommissionCount(0)
    setCustomCommissionCounts({})
    setCashAdvance(0)
    
    // Reset time entries
    setTimeEntries(initializeTimeEntries())
    
    // Show success message and navigate to payroll
      showSuccess(
        editingPayrollRecordId ? 'Payroll Updated Successfully!' : 'Payroll Saved Successfully!',
        `Payroll record for ${selectedEmployee.name} has been ${editingPayrollRecordId ? 'updated' : 'saved'}.`,
        [
          { label: 'Month', value: `${monthNames[selectedMonth]} ${selectedYear}` },
          { label: 'Period', value: `Days ${payPeriod}` },
          { label: 'Net Pay', value: formatPeso(earnings.netPay) }
        ]
      )
      
      // Navigate to payroll page after a short delay
      setTimeout(() => {
    if (setActiveView) {
      setActiveView('payroll')
        }
      }, 2000)
    } catch (error) {
      console.error('Error saving payroll:', error)
      showSuccess('Error', 'Failed to save payroll record. Please try again.', [])
    }
  }

  const handleEditRecord = (record) => {
    // Find the employee
    const employee = employees.find(emp => emp.id === record.employeeId)
    if (!employee) {
      showSuccess('Error', 'Employee not found!', [])
      return
    }
    
    // Set the employee
    setSelectedEmployee(employee)
    setSearchQuery(employee.name)
    
    // Set the month and year
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const monthIndex = monthNames.indexOf(record.month)
    setSelectedMonth(monthIndex)
    setSelectedYear(record.year)
    
    // Set the pay period
    setPayPeriod(record.payPeriod)
    
    // Set the time entries
    setTimeEntries(record.timeEntries)
    
    // Set commissions and deductions
    setRushTarpCount(record.rushTarpCount || 0)
    setRegularCommissionCount(record.regularCommissionCount || 0)
    setCustomCommissionCounts(record.customCommissionCounts || {})
    setCashAdvance(record.cashAdvance || 0)
    
    // Store the record ID for updating instead of creating new
    setEditingPayrollRecordId(record.id)
    
    // Navigate to salary counter
    if (setActiveView) {
      setActiveView('salary')
    }
  }

  // Cash Advance Functions
  const handleAddCashAdvance = async () => {
    const employeeId = viewingCashAdvanceEmployee ? viewingCashAdvanceEmployee.id : cashAdvanceForm.employeeId
    const employeeName = viewingCashAdvanceEmployee ? viewingCashAdvanceEmployee.name : cashAdvanceForm.employeeName

    if (!employeeId || !cashAdvanceForm.amount) {
      showSuccess('Missing Information', 'Please enter an amount', [])
      return
    }

    try {
    const newCashAdvance = {
      employeeId: Number(employeeId),
      employeeName: employeeName,
      amount: Number(cashAdvanceForm.amount),
      date: cashAdvanceForm.date,
      notes: cashAdvanceForm.notes,
      balance: Number(cashAdvanceForm.amount),
      payments: []
    }

      const savedRecord = await createCashAdvanceRecord(newCashAdvance)
      setCashAdvanceRecords([...cashAdvanceRecords, savedRecord])
    setShowAddCashAdvanceModal(false)
    setCashAdvanceForm({
      employeeId: '',
      employeeName: '',
        amount: 0,
      date: new Date().toISOString().split('T')[0],
      notes: ''
    })
      showSuccess(
        'Cash Advance Added!',
        `Cash advance of ${formatPeso(cashAdvanceForm.amount)} added for ${employeeName}`,
        [
          { label: 'Amount', value: formatPeso(cashAdvanceForm.amount) },
          { label: 'Date', value: new Date(cashAdvanceForm.date).toLocaleDateString() }
        ]
      )
    } catch (error) {
      console.error('Error adding cash advance:', error)
      showSuccess('Error', 'Failed to add cash advance. Please try again.', [])
    }
  }

  const handleAddPayment = async (recordId, paymentAmount) => {
    try {
      const record = cashAdvanceRecords.find(r => r.id === recordId)
      if (!record) return

        const payment = {
          id: Date.now(),
          amount: Number(paymentAmount),
          date: new Date().toISOString().split('T')[0]
        }
        const newBalance = record.balance - Number(paymentAmount)
      
      const updates = {
          balance: newBalance < 0 ? 0 : newBalance,
          payments: [...record.payments, payment]
        }

      await updateCashAdvanceRecord(recordId, updates)
      
      setCashAdvanceRecords(cashAdvanceRecords.map(r => {
        if (r.id === recordId) {
          return { ...r, ...updates }
        }
        return r
      }))
    } catch (error) {
      console.error('Error adding payment:', error)
      showSuccess('Error', 'Failed to add payment. Please try again.', [])
    }
  }

  const getEmployeeCashAdvanceBalance = (employeeId) => {
    const employeeAdvances = cashAdvanceRecords.filter(record => record.employeeId === employeeId)
    return employeeAdvances.reduce((total, record) => total + record.balance, 0)
  }

  // Payroll Functions
  const handlePrintPayrollSlips = () => {
    const printHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payroll Slips</title>
        <style>
          @page {
            size: portrait;
            margin: 0.4in;
          }
          @media print {
            body { margin: 0; padding: 0; }
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            font-family: Arial, sans-serif;
            padding: 0;
            margin: 0;
          }
          .slip {
            border: 2px solid #333;
            padding: 0;
            margin-bottom: 8px;
            page-break-inside: avoid;
            height: 3.35in;
            background: #fff;
            overflow: hidden;
          }
          .slip-header {
            border-bottom: 2px solid #333;
            padding: 6px 12px;
            text-align: center;
          }
          .slip-header h2 {
            margin: 0;
            font-size: 16px;
            text-transform: uppercase;
            font-weight: bold;
            letter-spacing: 1px;
          }
          .slip-header p {
            margin: 2px 0 0 0;
            font-size: 9px;
            color: #666;
          }
          .slip-body {
            padding: 6px 12px;
          }
          .employee-section {
            border: 1px solid #333;
            padding: 4px 8px;
            margin-bottom: 5px;
            text-align: center;
          }
          .employee-section .label {
            font-size: 7px;
            text-transform: uppercase;
            font-weight: bold;
            color: #888;
            margin-bottom: 1px;
          }
          .employee-section .name {
            font-size: 13px;
            font-weight: bold;
            color: #000;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr 1fr;
            gap: 4px;
            margin-bottom: 5px;
          }
          .info-box {
            border: 1px solid #ddd;
            padding: 3px 5px;
            background: #fafafa;
            text-align: center;
          }
          .info-box .label {
            font-size: 7px;
            text-transform: uppercase;
            font-weight: bold;
            color: #888;
            margin-bottom: 1px;
          }
          .info-box .value {
            font-size: 9px;
            font-weight: bold;
            color: #000;
          }
          .section-title {
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #333;
            padding: 2px 0;
            margin: 3px 0 2px 0;
            border-bottom: 1px solid #333;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 1px 4px;
            font-size: 9px;
            border-bottom: 1px dotted #ddd;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            color: #555;
          }
          .detail-value {
            font-weight: bold;
            color: #000;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 3px 6px;
            font-size: 10px;
            background: #f5f5f5;
            border: 1px solid #999;
            margin-top: 2px;
            font-weight: bold;
          }
          .net-pay-section {
            border: 2px solid #333;
            padding: 5px 10px;
            text-align: center;
            margin-top: 4px;
          }
          .net-pay-section .label {
            font-size: 9px;
            font-weight: bold;
            letter-spacing: 1px;
            color: #666;
            margin-bottom: 2px;
          }
          .net-pay-section .amount {
            font-size: 16px;
            font-weight: bold;
            color: #000;
          }
          .balance-notice {
            background: #ffcccc;
            border: 3px solid #cc0000;
            padding: 5px 8px;
            margin-top: 4px;
            font-size: 9px;
            text-align: center;
            font-weight: bold;
            color: #cc0000;
          }
          .balance-notice strong {
            display: block;
            font-size: 11px;
            margin-top: 2px;
          }
        </style>
      </head>
      <body>
        ${timeRecords.map(record => {
          const cashAdvanceBalance = getEmployeeCashAdvanceBalance(record.employeeId)
          return `
          <div class="slip">
            <div class="slip-header">
              <h2>PAYROLL SLIP</h2>
              <p>${record.month} ${record.year} - Days ${record.payPeriod}</p>
            </div>
            
            <div class="slip-body">
              <div class="employee-section">
                <div class="label">Employee Name</div>
                <div class="name">${record.employeeName}</div>
              </div>
              
              <div class="info-grid">
                <div class="info-box">
                  <div class="label">Reg Hrs</div>
                  <div class="value">${parseFloat(record.regularHours).toFixed(1)}</div>
                </div>
                <div class="info-box">
                  <div class="label">OT Hrs</div>
                  <div class="value">${parseFloat(record.totalOvertimeHours).toFixed(1)}</div>
                </div>
                <div class="info-box">
                  <div class="label">Late</div>
                  <div class="value">${record.lateMinutes}m</div>
                </div>
                <div class="info-box">
                  <div class="label">Total</div>
                  <div class="value">${(parseFloat(record.regularHours) + parseFloat(record.totalOvertimeHours)).toFixed(1)}</div>
                </div>
              </div>
              
              <div class="section-title">EARNINGS</div>
              <div class="detail-row">
                <span class="detail-label">Regular Pay</span>
                <span class="detail-value">₱${parseFloat(record.regularPay).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Overtime Pay</span>
                <span class="detail-value">₱${parseFloat(record.overtimePay).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Rush Tarp Commission</span>
                <span class="detail-value">₱${parseFloat(record.rushTarpCommission).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Regular Commission</span>
                <span class="detail-value">₱${parseFloat(record.regularCommission).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div class="total-row">
                <span>GROSS PAY</span>
                <span>₱${(parseFloat(record.grossPay) + parseFloat(record.totalCommissions)).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              
              <div class="section-title">DEDUCTIONS</div>
              <div class="detail-row">
                <span class="detail-label">Cash Advance Deduction</span>
                <span class="detail-value">₱${parseFloat(record.cashAdvance || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Late Deduction</span>
                <span class="detail-value">₱${parseFloat(record.lateDeduction).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div class="total-row">
                <span>TOTAL DEDUCTIONS</span>
                <span>₱${parseFloat(record.totalDeductions).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              
              <div class="net-pay-section">
                <div class="label">NET PAY</div>
                <div class="amount">₱${parseFloat(record.netPay).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              
              ${cashAdvanceBalance > 0 ? `
                <div class="balance-notice">
                  <div>⚠ CASH ADVANCE BALANCE ⚠</div>
                  <strong>₱${cashAdvanceBalance.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </div>
              ` : ''}
            </div>
          </div>
        `}).join('')}
      </body>
      </html>
    `

    // Use hidden iframe to print
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    document.body.appendChild(iframe)
    
    const iframeDoc = iframe.contentWindow.document
    iframeDoc.open()
    iframeDoc.write(printHTML)
    iframeDoc.close()
    
    iframe.contentWindow.focus()
    setTimeout(() => {
      iframe.contentWindow.print()
      setTimeout(() => document.body.removeChild(iframe), 100)
    }, 250)
  }

  const handlePrintPayrollRecords = () => {
    const printHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payroll Records</title>
        <style>
          @page {
            size: landscape;
            margin: 0.5in;
          }
          @media print {
            body { margin: 0; padding: 0; }
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            padding: 15px;
            border: 3px solid #000;
          }
          .header h1 {
            margin: 0 0 5px 0;
            font-size: 24px;
            text-transform: uppercase;
          }
          .header p {
            margin: 0;
            font-size: 12px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            border: 2px solid #000;
          }
          th, td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
            font-size: 11px;
          }
          th {
            background: #000;
            color: #fff;
            font-weight: bold;
            text-transform: uppercase;
          }
          .total-row {
            font-weight: bold;
            background: #f0f0f0;
          }
          .employee-cell {
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Payroll Records</h1>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
          <p>Total Records: ${timeRecords.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Period</th>
              <th>Month/Year</th>
              <th>Total Hours</th>
              <th>Regular Pay</th>
              <th>Overtime</th>
              <th>Gross Pay</th>
              <th>Commissions</th>
              <th>Deductions</th>
              <th>Net Pay</th>
            </tr>
          </thead>
          <tbody>
            ${timeRecords.map(record => `
              <tr>
                <td class="employee-cell">${record.employeeName}</td>
                <td>${record.payPeriod}</td>
                <td>${record.month} ${record.year}</td>
                <td>${record.totalHours} hrs</td>
                <td>₱${Number(record.regularPay).toLocaleString()}</td>
                <td>₱${Number(record.overtimePay).toLocaleString()}</td>
                <td>₱${Number(record.grossPay).toLocaleString()}</td>
                <td>₱${Number(record.totalCommissions).toLocaleString()}</td>
                <td>₱${Number(record.totalDeductions).toLocaleString()}</td>
                <td>₱${Number(record.netPay).toLocaleString()}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="3">TOTALS</td>
              <td>${timeRecords.reduce((sum, r) => sum + Number(r.totalHours), 0).toFixed(1)} hrs</td>
              <td>₱${timeRecords.reduce((sum, r) => sum + Number(r.regularPay), 0).toLocaleString()}</td>
              <td>₱${timeRecords.reduce((sum, r) => sum + Number(r.overtimePay), 0).toLocaleString()}</td>
              <td>₱${timeRecords.reduce((sum, r) => sum + Number(r.grossPay), 0).toLocaleString()}</td>
              <td>₱${timeRecords.reduce((sum, r) => sum + Number(r.totalCommissions), 0).toLocaleString()}</td>
              <td>₱${timeRecords.reduce((sum, r) => sum + Number(r.totalDeductions), 0).toLocaleString()}</td>
              <td>₱${timeRecords.reduce((sum, r) => sum + Number(r.netPay), 0).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `
    
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = 'none'
    document.body.appendChild(iframe)
    
    const iframeDoc = iframe.contentWindow.document
    iframeDoc.open()
    iframeDoc.write(printHTML)
    iframeDoc.close()
    
    iframe.onload = function() {
      iframe.contentWindow.focus()
      iframe.contentWindow.print()
      setTimeout(() => {
        document.body.removeChild(iframe)
      }, 1000)
    }
  }

  const handleClearPayrollTable = async () => {
    if (!confirm('Are you sure you want to delete ALL payroll records? This action cannot be undone!')) {
      return
    }
    
    try {
      const deletePromises = timeRecords.map(record => deleteTimeRecord(record.id))
      await Promise.all(deletePromises)
      setTimeRecords([])
      showSuccess('Table Cleared', 'All payroll records have been deleted.', [])
    } catch (error) {
      console.error('Error clearing payroll table:', error)
      showSuccess('Error', 'Failed to clear payroll table. Please try again.', [])
    }
  }

  // Day Off Management Functions
  const handleAddDayOff = async () => {
    if (!dayOffForm.employeeId || !dayOffForm.date) {
      showSuccess('Missing Information', 'Please select an employee and date', [])
      return
    }

    try {
      const employee = employees.find(emp => emp.id === Number(dayOffForm.employeeId))
      const date = new Date(dayOffForm.date)
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      const day = date.getDate()
      const payPeriod = day <= 15 ? '1-15' : '16-31'

      // Check if employee has too many absences in this pay period
      const isQualified = dayOffForm.absenceCount < maxAbsencesForDayOff

      const newDayOff = {
        employeeId: Number(dayOffForm.employeeId),
        employeeName: employee.name,
        date: dayOffForm.date,
        month: monthNames[date.getMonth()],
        year: date.getFullYear(),
        payPeriod: payPeriod,
        hoursPaid: isQualified ? 9 : 0,
        isQualified: isQualified,
        absenceCount: dayOffForm.absenceCount,
        notes: dayOffForm.notes
      }

      const savedRecord = await createDayOffRecord(newDayOff)
      setDayOffRecords([...dayOffRecords, savedRecord])
      setShowAddDayOffModal(false)
      setDayOffForm({
        employeeId: '',
        employeeName: '',
        date: new Date().toISOString().split('T')[0],
        month: '',
        year: new Date().getFullYear(),
        payPeriod: '',
        hoursPaid: 9,
        absenceCount: 0,
        isQualified: true,
        notes: ''
      })

      showSuccess(
        'Day Off Added!',
        `Day off for ${employee.name} has been added.`,
        [
          { label: 'Date', value: new Date(dayOffForm.date).toLocaleDateString() },
          { label: 'Status', value: isQualified ? 'Qualified (Paid)' : 'Not Qualified' },
          { label: 'Hours Paid', value: isQualified ? '9 hours' : '0 hours' }
        ]
      )
    } catch (error) {
      console.error('Error adding day off:', error)
      showSuccess('Error', 'Failed to add day off. Please try again.', [])
    }
  }

  const handleDeleteDayOff = async (id) => {
    try {
      await deleteDayOffRecord(id)
      setDayOffRecords(dayOffRecords.filter(r => r.id !== id))
      showSuccess('Day Off Deleted', 'Day off record has been deleted.', [])
    } catch (error) {
      console.error('Error deleting day off:', error)
      showSuccess('Error', 'Failed to delete day off. Please try again.', [])
    }
  }

  const getEmployeeDayOffHoursForPeriod = (employeeId, month, year, payPeriod) => {
    const employeeDayOffs = dayOffRecords.filter(record => 
      record.employeeId === employeeId &&
      record.month === month &&
      record.year === year &&
      record.payPeriod === payPeriod &&
      record.isQualified
    )
    return employeeDayOffs.reduce((total, record) => total + (record.hoursPaid || 0), 0)
  }

  // Count absences for an employee in a specific pay period
  const countAbsencesForPeriod = (employeeId, month, year, payPeriod) => {
    // Find time records for this employee, month, year, and pay period
    const timeRecord = timeRecords.find(record => 
      record.employeeId === employeeId &&
      record.month === month &&
      record.year === year &&
      record.payPeriod === payPeriod
    )

    if (!timeRecord || !timeRecord.timeEntries) {
      return 0
    }

    // Count days with 0 hours (absences)
    let absenceCount = 0
    const entries = timeRecord.timeEntries

    Object.keys(entries).forEach(day => {
      const entry = entries[day]
      const dayHours = calculateDayHours(entry)
      const totalHours = dayHours.regularHours + dayHours.overtimeHours
      
      // If no hours worked on this day, it's an absence
      if (totalHours === 0) {
        absenceCount++
      }
    })

    return absenceCount
  }

  // Auto Setup Day Offs
  const handleAutoSetupDayOff = async () => {
    if (employees.length === 0) {
      showSuccess('No Employees', 'Please add employees first before setting up day offs', [])
      return
    }

    try {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      const selectedMonth = monthNames[autoSetupForm.month]
      const year = new Date().getFullYear() // Always use current year

      const createdRecords = []

      // Use entire month for distribution (day 1 to last day of month)
      const lastDayOfMonth = new Date(year, autoSetupForm.month + 1, 0).getDate()

      // Shuffle employees randomly so it's fair (not always first employee gets first day)
      const shuffledEmployees = [...employees].sort(() => Math.random() - 0.5)

      // Distribute employees across the entire month
      // Only 1 employee per day, 1 day off per employee per month
      const promises = shuffledEmployees.map(async (employee, index) => {
        // Calculate which day this employee gets (spread them out evenly across the month)
        // Ensure each employee gets a unique day starting from 1
        let dayOffDay = Math.ceil((lastDayOfMonth / employees.length) * (index + 1))
        
        // Ensure day is within valid range (1 to lastDayOfMonth)
        dayOffDay = Math.max(1, Math.min(dayOffDay, lastDayOfMonth))
        
        // Create date in the correct month
        const dayOffDate = new Date(year, autoSetupForm.month, dayOffDay)
        
        // Verify the date is in the correct month (safety check)
        if (dayOffDate.getMonth() !== autoSetupForm.month) {
          console.error('Date calculation error:', { year, month: autoSetupForm.month, dayOffDay, resultDate: dayOffDate })
          dayOffDate.setMonth(autoSetupForm.month)
          dayOffDate.setDate(1)
        }
        
        const dateString = dayOffDate.toISOString().split('T')[0]

        // Determine which pay period this day falls into
        const payPeriod = dayOffDay <= 15 ? '1-15' : '16-31'

        // Count absences for this employee in this period
        const absenceCount = countAbsencesForPeriod(employee.id, selectedMonth, year, payPeriod)
        const isQualified = absenceCount < maxAbsencesForDayOff

        const newDayOff = {
          employeeId: employee.id,
          employeeName: employee.name,
          date: dateString,
          month: selectedMonth,
          year: year,
          payPeriod: payPeriod,
          hoursPaid: isQualified ? 9 : 0,
          isQualified: isQualified,
          absenceCount: absenceCount,
          notes: 'Auto-generated day off'
        }

        const savedRecord = await createDayOffRecord(newDayOff)
        return savedRecord
      })

      const allRecords = await Promise.all(promises)
      createdRecords.push(...allRecords)

      setDayOffRecords([...dayOffRecords, ...createdRecords])
      setShowAutoSetupModal(false)
      setAutoSetupForm({
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
        payPeriod: '1-15',
        selectedEmployees: []
      })

      showSuccess(
        'Day Offs Created!',
        `Successfully created ${createdRecords.length} day off records with 1 employee per day`,
        [
          { label: 'Month', value: `${selectedMonth} ${year}` },
          { label: 'Per Employee', value: '1 day off' },
          { label: 'Total Records', value: createdRecords.length }
        ]
      )
    } catch (error) {
      console.error('Error auto-setting up day offs:', error)
      showSuccess('Error', 'Failed to create day offs. Please try again.', [])
    }
  }

  // Reset All Day Offs
  const handleResetAllDayOffs = async () => {
    if (!confirm('Are you sure you want to delete ALL day off records? This action cannot be undone!')) {
      return
    }

    try {
      // Delete all day off records
      const deletePromises = dayOffRecords.map(record => deleteDayOffRecord(record.id))
      await Promise.all(deletePromises)
      
      setDayOffRecords([])
      showSuccess('All Day Offs Deleted', 'All day off records have been removed.', [])
    } catch (error) {
      console.error('Error resetting day offs:', error)
      showSuccess('Error', 'Failed to delete all day offs. Please try again.', [])
    }
  }

  // Print Day Off Calendar
  const handlePrintCalendar = () => {
    // Get current date for default month/year
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()
    
    // Group day offs by month/year
    const dayOffsByMonth = {}
    dayOffRecords.forEach(record => {
      const key = `${record.month}-${record.year}`
      if (!dayOffsByMonth[key]) {
        dayOffsByMonth[key] = []
      }
      dayOffsByMonth[key].push(record)
    })

    // Generate calendar HTML
    let calendarHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Day Off Calendar</title>
        <style>
          @page {
            size: 13in 8.5in;
            margin: 0.4in 0.5in;
          }
          @media print {
            body { 
              margin: 0;
              padding: 0;
            }
            .page-break { page-break-after: always; }
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            font-family: Arial, sans-serif;
            padding: 0;
            margin: 0;
            background: white;
          }
          .month-section {
            padding: 15px;
            page-break-after: always;
          }
          .month-section:last-child {
            page-break-after: auto;
          }
          .calendar-header {
            text-align: center;
            margin-bottom: 15px;
            padding: 12px;
            border: 3px solid #000;
          }
          .calendar-header h1 {
            margin: 0 0 5px 0;
            font-size: 28px;
            font-weight: 900;
            color: #000;
            text-transform: uppercase;
          }
          .calendar-header p {
            margin: 0;
            font-size: 11px;
            color: #000;
          }
          .month-title-bar {
            text-align: center;
            padding: 10px;
            border: 2px solid #000;
            background: #000;
            color: #fff;
            margin-bottom: 10px;
          }
          .month-title {
            font-size: 24px;
            font-weight: 900;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 0;
            border: 3px solid #000;
          }
          .calendar-day {
            border: 1px solid #000;
            padding: 6px;
            min-height: 75px;
            background: white;
            position: relative;
          }
          .calendar-day.header {
            background: #000;
            color: white;
            font-weight: 900;
            text-align: center;
            padding: 8px 4px;
            min-height: auto;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .calendar-day.empty {
            background: #f0f0f0;
            border-color: #ccc;
          }
          .calendar-day.weekend {
            background: #e8e8e8;
          }
          .day-number {
            font-weight: 900;
            font-size: 18px;
            margin-bottom: 4px;
            color: #000;
            text-align: right;
          }
          .day-off-info {
            background: #fff;
            color: #000;
            padding: 4px 6px;
            border: 2px solid #000;
            font-size: 10px;
            margin-top: 4px;
            font-weight: 900;
            text-align: center;
            line-height: 1.2;
            text-transform: uppercase;
          }
          .day-off-info.not-qualified {
            background: #000;
            color: #fff;
          }
        </style>
      </head>
      <body>
    `

    // Generate calendar for each month that has day offs
    const sortedKeys = Object.keys(dayOffsByMonth).sort()
    sortedKeys.forEach((monthKey, index) => {
      const records = dayOffsByMonth[monthKey]
      const firstRecord = records[0]
      const monthIndex = new Date(firstRecord.year, new Date(`${firstRecord.month} 1, 2000`).getMonth()).getMonth()
      const year = firstRecord.year
      
      calendarHTML += `
        <div class="month-section">
          <div class="calendar-header">
            <h1>DAY OFF CALENDAR</h1>
            <p>Generated: ${new Date().toLocaleDateString()}</p>
          </div>
          <div class="month-title-bar">
            <h2 class="month-title">${firstRecord.month} ${year}</h2>
          </div>
          <div class="calendar-grid">
      `
      
      // Day headers
      const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
      dayNames.forEach(day => {
        calendarHTML += `<div class="calendar-day header">${day}</div>`
      })
      
      // Get first day of month and total days
      const firstDay = new Date(year, monthIndex, 1).getDay()
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
      
      // Empty cells before first day
      for (let i = 0; i < firstDay; i++) {
        calendarHTML += `<div class="calendar-day empty"></div>`
      }
      
      // Days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = new Date(year, monthIndex, day).toISOString().split('T')[0]
        const dayOfWeek = new Date(year, monthIndex, day).getDay()
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
        const weekendClass = isWeekend ? 'weekend' : ''
        const dayOffForDate = records.find(r => r.date === dateStr)
        
        calendarHTML += `<div class="calendar-day ${weekendClass}">`
        calendarHTML += `<div class="day-number">${day}</div>`
        
        if (dayOffForDate) {
          const qualifiedClass = dayOffForDate.isQualified ? '' : 'not-qualified'
          calendarHTML += `<div class="day-off-info ${qualifiedClass}">${dayOffForDate.employeeName}</div>`
        }
        
        calendarHTML += `</div>`
      }
      
      calendarHTML += `
          </div>
        </div>
      `
    })

    calendarHTML += `
      </body>
      </html>
    `

    // Create a hidden iframe for printing
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = 'none'
    document.body.appendChild(iframe)
    
    const iframeDoc = iframe.contentWindow.document
    iframeDoc.open()
    iframeDoc.write(calendarHTML)
    iframeDoc.close()
    
    // Wait for content to load, then print and remove iframe
    iframe.onload = function() {
      iframe.contentWindow.focus()
      iframe.contentWindow.print()
      
      // Remove iframe after printing
      setTimeout(() => {
        document.body.removeChild(iframe)
      }, 1000)
    }
  }

  // Swap Day Offs Between Employees
  const handleSwapDayOffs = async () => {
    if (!swapForm.employee1Id || !swapForm.employee2Id) {
      showSuccess('Missing Selection', 'Please select both employees', [])
      return
    }

    if (swapForm.employee1Id === swapForm.employee2Id) {
      showSuccess('Invalid Selection', 'Please select different employees', [])
      return
    }

    try {
      const emp1Id = Number(swapForm.employee1Id)
      const emp2Id = Number(swapForm.employee2Id)

      // Find all day offs for both employees
      const emp1DayOffs = dayOffRecords.filter(r => r.employeeId === emp1Id)
      const emp2DayOffs = dayOffRecords.filter(r => r.employeeId === emp2Id)

      if (emp1DayOffs.length === 0 && emp2DayOffs.length === 0) {
        showSuccess('No Day Offs', 'Neither employee has any day off records to swap', [])
        return
      }

      const emp1 = employees.find(e => e.id === emp1Id)
      const emp2 = employees.find(e => e.id === emp2Id)

      // Swap employee information for each record
      const updatePromises = []

      emp1DayOffs.forEach(record => {
        updatePromises.push(
          updateDayOffRecord(record.id, {
            employeeId: emp2Id,
            employeeName: emp2.name
          })
        )
      })

      emp2DayOffs.forEach(record => {
        updatePromises.push(
          updateDayOffRecord(record.id, {
            employeeId: emp1Id,
            employeeName: emp1.name
          })
        )
      })

      await Promise.all(updatePromises)

      // Reload data
      const updatedDayOffs = await fetchDayOffRecords()
      setDayOffRecords(updatedDayOffs)

      setShowSwapModal(false)
      setSwapForm({
        employee1Id: '',
        employee2Id: ''
      })

      showSuccess(
        'Day Offs Swapped!',
        `Successfully swapped day offs between ${emp1.name} and ${emp2.name}`,
        [
          { label: emp1.name, value: `${emp1DayOffs.length} day off(s) → ${emp2.name}` },
          { label: emp2.name, value: `${emp2DayOffs.length} day off(s) → ${emp1.name}` }
        ]
      )
    } catch (error) {
      console.error('Error swapping day offs:', error)
      showSuccess('Error', 'Failed to swap day offs. Please try again.', [])
    }
  }

  const handleProcessPayroll = async (record) => {
    if (!confirm(`Process payroll for ${record.employeeName}?\n\nThis will deduct cash advance payments from their balance.`)) {
      return
    }

    try {
    // Get the cash advance deduction amount from the payroll record
    const deductionAmount = record.cashAdvance || 0

    if (deductionAmount > 0) {
      // Deduct from cash advance records
      let remainingDeduction = deductionAmount
      const updatedRecords = cashAdvanceRecords.map(caRecord => {
        if (caRecord.employeeId === record.employeeId && caRecord.balance > 0 && remainingDeduction > 0) {
          const payment = {
            id: Date.now() + Math.random(),
            amount: Math.min(remainingDeduction, caRecord.balance),
            date: new Date().toISOString().split('T')[0],
            source: 'Payroll Deduction'
          }
          
          const paymentAmount = Math.min(remainingDeduction, caRecord.balance)
          remainingDeduction -= paymentAmount
          
          return {
            ...caRecord,
            balance: caRecord.balance - paymentAmount,
            payments: [...caRecord.payments, payment]
          }
        }
        return caRecord
      })

        // Update all affected cash advance records in database
        const updatePromises = updatedRecords
          .filter(r => r !== cashAdvanceRecords.find(cr => cr.id === r.id) || JSON.stringify(r) !== JSON.stringify(cashAdvanceRecords.find(cr => cr.id === r.id)))
          .map(async (caRecord) => {
            const original = cashAdvanceRecords.find(r => r.id === caRecord.id)
            if (original && (original.balance !== caRecord.balance || original.payments.length !== caRecord.payments.length)) {
              await updateCashAdvanceRecord(caRecord.id, {
                balance: caRecord.balance,
                payments: caRecord.payments
              })
            }
          })

        await Promise.all(updatePromises)
      setCashAdvanceRecords(updatedRecords)
      
        // Mark the payroll record as processed in database
        await updateTimeRecord(record.id, { 
          processed: true, 
          processedDate: new Date().toISOString() 
        })
        
      setTimeRecords(timeRecords.map(r => 
        r.id === record.id ? { ...r, processed: true, processedDate: new Date().toISOString() } : r
      ))

        showSuccess(
          'Payroll Processed!',
          `Payroll for ${record.employeeName} has been processed successfully.`,
          [
            { label: 'Cash Advance Deduction', value: formatPeso(deductionAmount) },
            { label: 'Net Pay', value: formatPeso(record.netPay) }
          ]
        )
    } else {
      // Just mark as processed
        await updateTimeRecord(record.id, { 
          processed: true, 
          processedDate: new Date().toISOString() 
        })
        
      setTimeRecords(timeRecords.map(r => 
        r.id === record.id ? { ...r, processed: true, processedDate: new Date().toISOString() } : r
      ))
        showSuccess(
          'Payroll Processed!',
          `Payroll for ${record.employeeName} has been processed successfully.`,
          []
        )
      }
    } catch (error) {
      console.error('Error processing payroll:', error)
      showSuccess('Error', 'Failed to process payroll. Please try again.', [])
    }
  }

  const handlePrintPayroll = (record) => {
    // Create a printable view
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payroll - ${record.employeeName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          h1 { text-align: center; }
          .header { text-align: center; margin-bottom: 30px; }
          .employee-info { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f0f0f0; font-weight: bold; }
          .total-row { font-weight: bold; background-color: #f9f9f9; }
          .net-pay { font-size: 20px; font-weight: bold; text-align: right; margin-top: 20px; }
          @media print {
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PAYROLL SLIP</h1>
          <p><strong>${record.month} ${record.year} - Days ${record.payPeriod}</strong></p>
        </div>
        
        <div class="employee-info">
          <p><strong>Employee:</strong> ${record.employeeName}</p>
          <p><strong>Period:</strong> ${record.month} ${record.year} (Days ${record.payPeriod})</p>
          <p><strong>Date Generated:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Regular Hours (${record.regularHours} hrs)</td>
              <td style="text-align: right;">${formatPeso(record.regularPay)}</td>
            </tr>
            <tr>
              <td>Overtime Hours (${record.totalOvertimeHours} hrs)</td>
              <td style="text-align: right;">${formatPeso(record.overtimePay)}</td>
            </tr>
            <tr class="total-row">
              <td>Gross Pay</td>
              <td style="text-align: right;">${formatPeso(record.grossPay)}</td>
            </tr>
            <tr>
              <td>Commissions</td>
              <td style="text-align: right; color: green;">+${formatPeso(record.totalCommissions)}</td>
            </tr>
            <tr>
              <td>Total Deductions</td>
              <td style="text-align: right; color: red;">-${formatPeso(record.totalDeductions)}</td>
            </tr>
            ${record.cashAdvance > 0 ? `
            <tr>
              <td style="padding-left: 30px;">- Cash Advance</td>
              <td style="text-align: right; color: red;">-${formatPeso(record.cashAdvance)}</td>
            </tr>
            ` : ''}
            ${record.lateMinutes > 0 ? `
            <tr>
              <td style="padding-left: 30px;">- Late (${record.lateMinutes} min)</td>
              <td style="text-align: right; color: red;">-${formatPeso(record.lateDeduction)}</td>
            </tr>
            ` : ''}
            <tr class="total-row">
              <td><strong>NET PAY</strong></td>
              <td style="text-align: right;"><strong>${formatPeso(record.netPay)}</strong></td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 50px; display: flex; justify-content: space-between;">
          <div style="text-align: center;">
            <div style="border-top: 1px solid #000; width: 200px; margin-top: 50px;"></div>
            <p>Employee Signature</p>
          </div>
          <div style="text-align: center;">
            <div style="border-top: 1px solid #000; width: 200px; margin-top: 50px;"></div>
            <p>Authorized Signature</p>
          </div>
        </div>

        <button onclick="window.print()" style="margin-top: 30px; padding: 10px 20px; background: #000; color: #fff; border: none; cursor: pointer;">Print</button>
      </body>
      </html>
    `)
    printWindow.document.close()
  }

  const stats = totalStats()

  // Custom Success Popup Component
  const SuccessPopup = () => {
    if (!showSuccessPopup) return null

    const isError = successMessage.title.toLowerCase().includes('error') || 
                    successMessage.title.toLowerCase().includes('invalid') ||
                    successMessage.title.toLowerCase().includes('missing')

    return (
      <div className="success-popup-overlay" onClick={() => setShowSuccessPopup(false)}>
        <div className="success-popup-content" onClick={(e) => e.stopPropagation()}>
          <div className={`success-popup-icon ${isError ? 'error' : 'success'}`}>
            {isError ? <AlertCircle size={48} /> : <CheckCircle size={48} />}
          </div>
          <h2 className="success-popup-title">{successMessage.title}</h2>
          <p className="success-popup-message">{successMessage.message}</p>
          
          {successMessage.details.length > 0 && (
            <div className="success-popup-details">
              {successMessage.details.map((detail, index) => (
                <div key={index} className="success-detail-item">
                  <span className="detail-label">{detail.label}:</span>
                  <span className="detail-value">{detail.value}</span>
                </div>
              ))}
            </div>
          )}
          
          <button 
            className="success-popup-close-btn"
            onClick={() => setShowSuccessPopup(false)}
          >
            Close
          </button>
        </div>
      </div>
    )
  }


  if (activeView === 'salary') {
    return (
      <>
        <SuccessPopup />
      <div className="dashboard salary-tracker-layout">
        {/* Employee Selection Container - Top */}
        <div className="employee-selection-container">
          <h2>Select Employee</h2>
          <div className="search-dropdown-container">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setShowDropdown(true)}
              placeholder="Type employee name to search..."
              className="employee-search-input"
            />
            <User className="search-icon-input" size={18} />
            
            {showDropdown && searchQuery && filteredEmployees.length > 0 && (
              <div className="employee-dropdown">
                {filteredEmployees.map(employee => (
                  <div
                    key={employee.id}
                    className="dropdown-item"
                    onClick={() => handleSelectEmployee(employee)}
                  >
                    <div className="dropdown-avatar">
                      <User size={20} />
                    </div>
                    <div className="dropdown-info">
                      <span className="dropdown-name">{employee.name}</span>
                      <span className="dropdown-rate">{isManager ? formatPeso(employee.ratePer9Hours) : censorRate()}/9hrs</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {selectedEmployee && (
            <div className="selected-employee-badge">
              <div className="badge-avatar">
                <User size={20} />
              </div>
              <div className="badge-info">
                <span className="badge-name">{selectedEmployee.name}</span>
                <span className="badge-rate">{isManager ? formatPeso(selectedEmployee.ratePer9Hours) : censorRate()} per 9 hours</span>
              </div>
              <button className="clear-selection-btn" onClick={() => {
                setSelectedEmployee(null)
                setSearchQuery('')
                setShowTimeTracker(false)
              }}>
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="tracker-main-content">
          {/* Left Panel - Time Entry Form */}
          <div className={`time-entry-panel ${selectedEmployee ? 'active' : ''}`}>
            {selectedEmployee ? (
              <div className="time-entry-form">
                <div className="period-selector">
                  <h2>Time Entry</h2>
                  <div className="period-controls">
                    <select 
                      value={selectedMonth} 
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="month-select"
                    >
                      <option value={0}>January</option>
                      <option value={1}>February</option>
                      <option value={2}>March</option>
                      <option value={3}>April</option>
                      <option value={4}>May</option>
                      <option value={5}>June</option>
                      <option value={6}>July</option>
                      <option value={7}>August</option>
                      <option value={8}>September</option>
                      <option value={9}>October</option>
                      <option value={10}>November</option>
                      <option value={11}>December</option>
                    </select>
                    <select 
                      value={selectedYear} 
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="year-select"
                    >
                      <option value={2023}>2023</option>
                      <option value={2024}>2024</option>
                      <option value={2025}>2025</option>
                    </select>
                  </div>
                </div>

                <div className="pay-period-tabs">
                  <button 
                    className={`period-tab ${payPeriod === '1-15' ? 'active' : ''}`}
                    onClick={() => handlePayPeriodChange('1-15')}
                  >
                    Days 1-15
                  </button>
                  <button 
                    className={`period-tab ${payPeriod === '16-31' ? 'active' : ''}`}
                    onClick={() => handlePayPeriodChange('16-31')}
                  >
                    Days 16-31
                  </button>
                </div>

                <div className="time-table-container">
                  <table className="time-entry-table">
                    <thead>
                      <tr>
                        <th>Day</th>
                        <th colSpan="2">Morning</th>
                        <th colSpan="2">Afternoon</th>
                        <th colSpan="2">Overtime</th>
                        <th>Total</th>
                      </tr>
                      <tr>
                        <th></th>
                        <th>In</th>
                        <th>Out</th>
                        <th>In</th>
                        <th>Out</th>
                        <th>In</th>
                        <th>Out</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(timeEntries).map(day => {
                        const dayNum = Number(day)
                        const entry = timeEntries[dayNum] || {
                          firstShiftIn: '',
                          firstShiftOut: '',
                          secondShiftIn: '',
                          secondShiftOut: '',
                          otTimeIn: '',
                          otTimeOut: ''
                        }
                        const dayHours = calculateDayHours(entry)
                        const totalDayHours = dayHours.regularHours + dayHours.overtimeHours
                        
                        return (
                          <tr key={day}>
                            <td className="day-cell">{day}</td>
                            <td>
                              <input
                                type="text"
                                value={entry.firstShiftIn || ''}
                                onChange={(e) => handleTimeInputChange(dayNum, 'firstShiftIn', e.target.value)}
                                onKeyPress={(e) => handleTimeInputKeyPress(e, dayNum, 'firstShiftIn')}
                                data-day={dayNum}
                                data-field="firstShiftIn"
                                className="time-input"
                                placeholder="0700"
                                maxLength="5"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={entry.firstShiftOut || ''}
                                onChange={(e) => handleTimeInputChange(dayNum, 'firstShiftOut', e.target.value)}
                                onKeyPress={(e) => handleTimeInputKeyPress(e, dayNum, 'firstShiftOut')}
                                data-day={dayNum}
                                data-field="firstShiftOut"
                                className="time-input"
                                placeholder="1700"
                                maxLength="5"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={entry.secondShiftIn || ''}
                                onChange={(e) => handleTimeInputChange(dayNum, 'secondShiftIn', e.target.value)}
                                onKeyPress={(e) => handleTimeInputKeyPress(e, dayNum, 'secondShiftIn')}
                                data-day={dayNum}
                                data-field="secondShiftIn"
                                className="time-input"
                                placeholder="2000"
                                maxLength="5"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={entry.secondShiftOut || ''}
                                onChange={(e) => handleTimeInputChange(dayNum, 'secondShiftOut', e.target.value)}
                                onKeyPress={(e) => handleTimeInputKeyPress(e, dayNum, 'secondShiftOut')}
                                data-day={dayNum}
                                data-field="secondShiftOut"
                                className="time-input"
                                placeholder="0700"
                                maxLength="5"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={entry.otTimeIn || ''}
                                onChange={(e) => handleTimeInputChange(dayNum, 'otTimeIn', e.target.value)}
                                onKeyPress={(e) => handleTimeInputKeyPress(e, dayNum, 'otTimeIn')}
                                data-day={dayNum}
                                data-field="otTimeIn"
                                className="time-input"
                                placeholder="1800"
                                maxLength="5"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={entry.otTimeOut || ''}
                                onChange={(e) => handleTimeInputChange(dayNum, 'otTimeOut', e.target.value)}
                                onKeyPress={(e) => handleTimeInputKeyPress(e, dayNum, 'otTimeOut')}
                                data-day={dayNum}
                                data-field="otTimeOut"
                                className="time-input"
                                placeholder="2000"
                                maxLength="5"
                              />
                            </td>
                            <td className="total-cell">{totalDayHours.toFixed(1)}h</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="late-section">
                  <h3>Late Time & Deductions</h3>
                  <div className="late-display">
                    <div className="late-info-row">
                      <span className="late-label">Total Late (Minutes):</span>
                      <span className="late-value">{calculateTotalEarnings().lateMinutes} min</span>
                    </div>
                    <div className="late-info-row">
                      <span className="late-label">Late Deduction Amount:</span>
                      <span className="late-value negative">-{formatPeso(calculateTotalEarnings().lateDeduction)}</span>
                    </div>
                  </div>
                  {calculateTotalEarnings().lateMinutes > 0 && (
                    <div className="late-summary">
                      <span>⚠️ Late: {calculateTotalEarnings().lateMinutes} minutes @ ₱{lateDeductionRate}/min</span>
                      <span className="late-amount">-{formatPeso(calculateTotalEarnings().lateDeduction)}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="empty-state-small">
                <User size={48} />
                <h3>No Employee Selected</h3>
                <p>Search and select an employee above to start</p>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="right-column">
            {selectedEmployee && (
              <>
                {/* Commissions Section */}
                <div className="commissions-container">
                  <h2>Commissions</h2>
                  <div className="commission-inputs">
                    <div className="commission-item">
                      <label>Rush Tarp (₱{rushTarpCommissionRate} each)</label>
                      <div className="input-with-result">
                        <input
                          type="number"
                          min="0"
                          value={rushTarpCount}
                          onChange={(e) => setRushTarpCount(Number(e.target.value))}
                          className="commission-input"
                          placeholder="0"
                        />
                        <span className="result-value">{formatPeso(rushTarpCount * rushTarpCommissionRate)}</span>
                      </div>
                    </div>
                    <div className="commission-item">
                      <label>Regular (₱{regularCommissionRate} each)</label>
                      <div className="input-with-result">
                        <input
                          type="number"
                          min="0"
                          value={regularCommissionCount}
                          onChange={(e) => setRegularCommissionCount(Number(e.target.value))}
                          className="commission-input"
                          placeholder="0"
                        />
                        <span className="result-value">{formatPeso(regularCommissionCount * regularCommissionRate)}</span>
                      </div>
                    </div>
                    
                    {/* Custom Commissions */}
                    {customCommissions.map(commission => (
                      <div key={commission.id} className="commission-item">
                        <label>{commission.name} (₱{commission.rate} each)</label>
                        <div className="input-with-result">
                          <input
                            type="number"
                            min="0"
                            value={customCommissionCounts[commission.id] || 0}
                            onChange={(e) => setCustomCommissionCounts({
                              ...customCommissionCounts,
                              [commission.id]: Number(e.target.value)
                            })}
                            className="commission-input"
                            placeholder="0"
                          />
                          <span className="result-value">{formatPeso((customCommissionCounts[commission.id] || 0) * commission.rate)}</span>
                        </div>
                      </div>
                    ))}
                    
                    <div className="commission-total">
                      <span>Total Commissions:</span>
                      <strong>{formatPeso(calculateTotalEarnings().totalCommissions)}</strong>
                    </div>
                  </div>
                </div>

                {/* Deductions Section */}
                <div className="deductions-container">
                  <h2>Deductions</h2>
                  {selectedEmployee && getEmployeeCashAdvanceBalance(selectedEmployee.id) > 0 && (
                    <div className="cash-advance-alert">
                      <div className="alert-icon">⚠️</div>
                      <div className="alert-content">
                        <span className="alert-label">Outstanding Cash Advance Balance:</span>
                        <span className="alert-amount">{formatPeso(getEmployeeCashAdvanceBalance(selectedEmployee.id))}</span>
                      </div>
                    </div>
                  )}
                  <div className="deduction-inputs">
                    <div className="deduction-item">
                      <label>Cash Advance Deduction</label>
                      {selectedEmployee && getEmployeeCashAdvanceBalance(selectedEmployee.id) > 0 && (
                        <div className="balance-helper">
                          <span>Balance: {formatPeso(getEmployeeCashAdvanceBalance(selectedEmployee.id))}</span>
                        </div>
                      )}
                      <input
                        type="text"
                        value={cashAdvance || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d.]/g, '')
                          if (value === '' || !isNaN(value)) {
                            setCashAdvance(value === '' ? 0 : Number(value))
                          }
                        }}
                        className="deduction-input"
                        placeholder="₱0.00"
                      />
                    </div>
                    <div className="deduction-total">
                      <span>Total Deductions:</span>
                      <strong>{formatPeso(calculateTotalEarnings().totalDeductions)}</strong>
                    </div>
                  </div>
                </div>

                {/* Earnings Summary Container */}
                <div className="earnings-summary-container">
                  <h2>Earnings Breakdown</h2>
                  <div className="summary-content">
                    {isManager ? (
                      <>
                        <div className="summary-section">
                          <div className="section-title">Work Hours</div>
                          <div className="summary-row">
                            <span>Regular Hours</span>
                            <strong>{calculateTotalEarnings().regularHours} hrs</strong>
                          </div>
                          <div className="summary-row">
                            <span>Overtime Hours</span>
                            <strong>{calculateTotalEarnings().totalOvertimeHours} hrs</strong>
                          </div>
                          {parseFloat(calculateTotalEarnings().dayOffHours) > 0 && (
                            <div className="summary-row day-off-row">
                              <span>Day Off Hours (Paid)</span>
                              <strong>+{calculateTotalEarnings().dayOffHours} hrs</strong>
                            </div>
                          )}
                          <div className="summary-row highlight">
                            <span>Total Hours</span>
                            <strong>{calculateTotalEarnings().totalHours} hrs</strong>
                          </div>
                        </div>

                        <div className="summary-section">
                          <div className="section-title">Base Earnings</div>
                          <div className="summary-row">
                            <span>Regular Pay</span>
                            <strong>{formatPeso(calculateTotalEarnings().regularPay)}</strong>
                          </div>
                          <div className="summary-row">
                            <span>Overtime Pay</span>
                            <strong>{formatPeso(calculateTotalEarnings().overtimePay)}</strong>
                          </div>
                          <div className="summary-row highlight">
                            <span>Gross Pay</span>
                            <strong>{formatPeso(calculateTotalEarnings().grossPay)}</strong>
                          </div>
                        </div>

                        <div className="summary-section">
                          <div className="section-title">Additions</div>
                          {rushTarpCount > 0 && (
                            <div className="summary-row positive">
                              <span>Rush Tarp ({rushTarpCount} × ₱{rushTarpCommissionRate})</span>
                              <strong>+{formatPeso(rushTarpCount * rushTarpCommissionRate)}</strong>
                            </div>
                          )}
                          {regularCommissionCount > 0 && (
                            <div className="summary-row positive">
                              <span>Regular ({regularCommissionCount} × ₱{regularCommissionRate})</span>
                              <strong>+{formatPeso(regularCommissionCount * regularCommissionRate)}</strong>
                            </div>
                          )}
                          {customCommissions.map(commission => {
                            const count = customCommissionCounts[commission.id] || 0
                            if (count > 0) {
                              return (
                                <div key={commission.id} className="summary-row positive">
                                  <span>{commission.name} ({count} × ₱{commission.rate})</span>
                                  <strong>+{formatPeso(count * commission.rate)}</strong>
                                </div>
                              )
                            }
                            return null
                          })}
                          <div className="summary-row highlight positive">
                            <span>Total Commissions</span>
                            <strong>+{formatPeso(calculateTotalEarnings().totalCommissions)}</strong>
                          </div>
                        </div>

                        <div className="summary-section">
                          <div className="section-title">Deductions</div>
                          {cashAdvance > 0 && (
                            <div className="summary-row negative">
                              <span>Cash Advance</span>
                              <strong>-{formatPeso(cashAdvance)}</strong>
                            </div>
                          )}
                          {calculateTotalEarnings().lateMinutes > 0 && (
                            <div className="summary-row negative">
                              <span>Late ({calculateTotalEarnings().lateMinutes} min @ ₱{lateDeductionRate}/min)</span>
                              <strong>-{formatPeso(calculateTotalEarnings().lateDeduction)}</strong>
                            </div>
                          )}
                          <div className="summary-row highlight negative">
                            <span>Total Deductions</span>
                            <strong>-{formatPeso(calculateTotalEarnings().totalDeductions)}</strong>
                          </div>
                        </div>

                        <div className="summary-net-pay">
                          <span>NET PAY</span>
                          <strong>{formatPeso(calculateTotalEarnings().netPay)}</strong>
                        </div>
                      </>
                    ) : (
                      <div className="accountant-net-pay-only">
                        <div className="summary-net-pay">
                          <span>NET PAY</span>
                          <strong>{formatPeso(calculateTotalEarnings().netPay)}</strong>
                        </div>
                        <p className="restricted-notice">Full breakdown restricted to Manager access</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

          </div>
        </div>

        {selectedEmployee && (
          <div className="save-payroll-container">
            <button className="save-payroll-btn" onClick={handleSaveTimeEntry}>
              <Save size={20} />
              Save to Payroll
            </button>
          </div>
        )}
      </div>
      </>
    )
  }

  if (activeView === 'payroll') {
    // Timeline View
    if (payrollTimelineView) {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      const selectedMonthName = monthNames[payrollTimelineFilter.month]
      
      const filteredRecords = timeRecords.filter(record => {
        return record.month === selectedMonthName &&
               record.year === payrollTimelineFilter.year &&
               record.payPeriod === payrollTimelineFilter.payPeriod
      })
      
      return (
        <>
          <SuccessPopup />
          <div className="dashboard">
            <button className="back-button" onClick={() => setPayrollTimelineView(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back to All Records
            </button>
            
            <div className="dashboard-header">
              <div>
                <h1>Payroll Timeline History</h1>
                <p className="subtitle">View payroll records by period</p>
              </div>
            </div>
            
            <div className="info-card" style={{marginBottom: '30px'}}>
              <p className="info-card-title">Filter by Period:</p>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px'}}>
                <div className="form-group">
                  <label>Month</label>
                  <select
                    value={payrollTimelineFilter.month}
                    onChange={(e) => setPayrollTimelineFilter({ ...payrollTimelineFilter, month: Number(e.target.value) })}
                    className="form-input"
                  >
                    {monthNames.map((month, index) => (
                      <option key={index} value={index}>{month}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Year</label>
                  <input
                    type="number"
                    value={payrollTimelineFilter.year}
                    onChange={(e) => setPayrollTimelineFilter({ ...payrollTimelineFilter, year: Number(e.target.value) })}
                    className="form-input"
                    min="2020"
                    max="2100"
                  />
                </div>
                <div className="form-group">
                  <label>Pay Period</label>
                  <select
                    value={payrollTimelineFilter.payPeriod}
                    onChange={(e) => setPayrollTimelineFilter({ ...payrollTimelineFilter, payPeriod: e.target.value })}
                    className="form-input"
                  >
                    <option value="1-15">1-15</option>
                    <option value="16-31">16-31</option>
                  </select>
                </div>
              </div>
            </div>
            
            {filteredRecords.length === 0 ? (
              <div className="empty-state">
                <Calendar size={64} />
                <h2>No Records Found</h2>
                <p>No payroll records for {selectedMonthName} {payrollTimelineFilter.year} (Days {payrollTimelineFilter.payPeriod})</p>
              </div>
            ) : (
              <div className="payroll-container">
                <div className="payroll-summary-cards">
                  <div className="stat-card">
                    <div className="stat-icon">
                      <User size={24} />
                    </div>
                    <div className="stat-content">
                      <span className="stat-label">Records Found</span>
                      <span className="stat-value">{filteredRecords.length}</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">
                      <DollarSign size={24} />
                    </div>
                    <div className="stat-content">
                      <span className="stat-label">Total Net Pay</span>
                      <span className="stat-value">{formatPeso(filteredRecords.reduce((sum, r) => sum + Number(r.netPay), 0))}</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">
                      <Clock size={24} />
                    </div>
                    <div className="stat-content">
                      <span className="stat-label">Total Hours</span>
                      <span className="stat-value">{filteredRecords.reduce((sum, r) => sum + Number(r.totalHours), 0).toFixed(1)} hrs</span>
                    </div>
                  </div>
                </div>
                
                <div className="payroll-records-section">
                  <h2>{selectedMonthName} {payrollTimelineFilter.year} - Days {payrollTimelineFilter.payPeriod}</h2>
                  <div className="payroll-table-container">
                    <table className="payroll-table">
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>Total Hours</th>
                          <th>Regular Pay</th>
                          <th>Overtime Pay</th>
                          <th>Gross Pay</th>
                          <th>Commissions</th>
                          <th>Deductions</th>
                          <th>Net Pay</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRecords.map(record => (
                          <tr key={record.id}>
                            <td className="employee-name-cell">
                              <div className="employee-cell-content">
                                <User size={16} />
                                <span>{record.employeeName}</span>
                              </div>
                            </td>
                            <td>{record.totalHours} hrs</td>
                            <td>{formatPeso(record.regularPay)}</td>
                            <td>{formatPeso(record.overtimePay)}</td>
                            <td className="highlight-cell">{formatPeso(record.grossPay)}</td>
                            <td className="positive-cell">+{formatPeso(record.totalCommissions)}</td>
                            <td className="negative-cell">-{formatPeso(record.totalDeductions)}</td>
                            <td className="net-pay-cell">{formatPeso(record.netPay)}</td>
                            <td>
                              <button 
                                className="icon-btn view-btn"
                                onClick={() => setViewingPayrollRecord(record)}
                                title="View Details"
                              >
                                <FileText size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )
    }
    
    // Main Payroll View
    return (
      <>
        <SuccessPopup />
      <div className="dashboard">
        <div className="dashboard-header">
          <div>
            <h1>Payroll Records</h1>
            <p className="subtitle">View all saved payroll records</p>
          </div>
          <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
            {timeRecords.length > 0 && (
              <>
                <button className="secondary-button" onClick={handlePrintPayrollRecords}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 6 2 18 2 18 9"></polyline>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                    <rect x="6" y="14" width="12" height="8"></rect>
                  </svg>
                  <span>Print Payroll Report</span>
                </button>
                <button className="secondary-button" onClick={handlePrintPayrollSlips}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 6 2 18 2 18 9"></polyline>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                    <rect x="6" y="14" width="12" height="8"></rect>
                  </svg>
                  <span>Print Payroll Slip</span>
                </button>
                <button className="danger-button" onClick={handleClearPayrollTable}>
                  <Trash2 size={18} />
                  <span>Clear Table</span>
                </button>
              </>
            )}
            <button className="secondary-button" onClick={() => setPayrollTimelineView(true)}>
              <Calendar size={18} />
              <span>Timeline History</span>
            </button>
          </div>
        </div>

        {timeRecords.length === 0 ? (
          <div className="empty-state">
            <Save size={64} />
            <h2>No Payroll Records Yet</h2>
            <p>Records saved from the Salary Counter will appear here</p>
          </div>
        ) : (
          <div className="payroll-container">
            <div className="payroll-summary-cards">
              <div className="stat-card primary">
                <div className="stat-icon">
                  <User size={24} />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Total Records</span>
                  <span className="stat-value">{timeRecords.length}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <DollarSign size={24} />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Total Gross Pay</span>
                  <span className="stat-value">{formatPeso(timeRecords.reduce((sum, r) => sum + Number(r.grossPay), 0))}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <TrendingUp size={24} />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Total Net Pay</span>
                  <span className="stat-value">{formatPeso(timeRecords.reduce((sum, r) => sum + Number(r.netPay), 0))}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <Clock size={24} />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Total Hours</span>
                  <span className="stat-value">{timeRecords.reduce((sum, r) => sum + Number(r.totalHours), 0).toFixed(1)} hrs</span>
                </div>
              </div>
            </div>

            <div className="payroll-records-section">
              <h2>All Payroll Records</h2>
              <div className="payroll-table-container">
                <table className="payroll-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Period</th>
                      <th>Month/Year</th>
                      <th>Total Hours</th>
                      <th>Regular Pay</th>
                      <th>Overtime Pay</th>
                      <th>Gross Pay</th>
                      <th>Commissions</th>
                      <th>Deductions</th>
                      <th>Status</th>
                      <th>Net Pay</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timeRecords.map(record => (
                      <tr key={record.id}>
                        <td className="employee-name-cell">
                          <div className="employee-cell-content">
                            <User size={16} />
                            <span>{record.employeeName}</span>
                          </div>
                        </td>
                        <td>Days {record.payPeriod}</td>
                        <td>{record.month} {record.year}</td>
                        <td>{record.totalHours} hrs</td>
                        <td>{formatPeso(record.regularPay)}</td>
                        <td>{formatPeso(record.overtimePay)}</td>
                        <td className="highlight-cell">{formatPeso(record.grossPay)}</td>
                        <td className="positive-cell">+{formatPeso(record.totalCommissions)}</td>
                        <td className="negative-cell">-{formatPeso(record.totalDeductions)}</td>
                        <td>
                          {record.processed ? (
                            <div className="processed-badge">Processed</div>
                          ) : (
                            <div className="pending-badge">Pending</div>
                          )}
                        </td>
                        <td className="net-pay-cell">
                          {formatPeso(record.netPay)}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="icon-btn view-btn"
                              onClick={() => setViewingPayrollRecord(record)}
                              title="View Details"
                            >
                              <FileText size={16} />
                            </button>
                            <button 
                              className="icon-btn edit-btn"
                              onClick={() => handleEditRecord(record)}
                              title="Edit Record"
                              disabled={record.processed}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              className="icon-btn delete-btn"
                              onClick={async () => {
                                if (confirm(`Delete payroll record for ${record.employeeName}?`)) {
                                  try {
                                    await deleteTimeRecord(record.id)
                                  setTimeRecords(timeRecords.filter(r => r.id !== record.id))
                                    showSuccess('Record Deleted', 'Payroll record has been deleted.', [])
                                  } catch (error) {
                                    console.error('Error deleting record:', error)
                                    showSuccess('Error', 'Failed to delete record. Please try again.', [])
                                  }
                                }
                              }}
                              title="Delete Record"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Payroll Detail View Modal */}
        {viewingPayrollRecord && (
          <div className="modal-overlay" onClick={() => setViewingPayrollRecord(null)}>
            <div className="modal-content payroll-detail-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Payroll Details</h2>
                <button className="close-btn" onClick={() => setViewingPayrollRecord(null)}>
                  <X size={20} />
                </button>
              </div>

              <div className="payroll-detail-content">
                <div className="employee-detail-header">
                  <div className="employee-avatar-large">
                    <User size={32} />
                  </div>
                  <div>
                    <h3>{viewingPayrollRecord.employeeName}</h3>
                    <p className="period-info">{viewingPayrollRecord.month} {viewingPayrollRecord.year} - Days {viewingPayrollRecord.payPeriod}</p>
                  </div>
                  {viewingPayrollRecord.processed && (
                    <div className="processed-badge-large">
                      <CheckCircle size={20} />
                      <span>Processed</span>
                    </div>
                  )}
                </div>

                <div className="detail-sections">
                  <div className="detail-section">
                    <h4>Work Hours</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Regular Hours</span>
                        <span className="detail-value">{viewingPayrollRecord.regularHours} hrs</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Overtime Hours</span>
                        <span className="detail-value">{viewingPayrollRecord.totalOvertimeHours} hrs</span>
                      </div>
                      <div className="detail-item highlight">
                        <span className="detail-label">Total Hours</span>
                        <span className="detail-value">{viewingPayrollRecord.totalHours} hrs</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>Earnings</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Regular Pay</span>
                        <span className="detail-value">{formatPeso(viewingPayrollRecord.regularPay)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Overtime Pay</span>
                        <span className="detail-value">{formatPeso(viewingPayrollRecord.overtimePay)}</span>
                      </div>
                      <div className="detail-item highlight">
                        <span className="detail-label">Gross Pay</span>
                        <span className="detail-value">{formatPeso(viewingPayrollRecord.grossPay)}</span>
                      </div>
                      <div className="detail-item positive">
                        <span className="detail-label">Commissions</span>
                        <span className="detail-value">+{formatPeso(viewingPayrollRecord.totalCommissions)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>Deductions</h4>
                    <div className="detail-grid">
                      {viewingPayrollRecord.cashAdvance > 0 && (
                        <div className="detail-item negative">
                          <span className="detail-label">Cash Advance</span>
                          <span className="detail-value">-{formatPeso(viewingPayrollRecord.cashAdvance)}</span>
                        </div>
                      )}
                      {viewingPayrollRecord.lateMinutes > 0 && (
                        <div className="detail-item negative">
                          <span className="detail-label">Late ({viewingPayrollRecord.lateMinutes} min)</span>
                          <span className="detail-value">-{formatPeso(viewingPayrollRecord.lateDeduction)}</span>
                        </div>
                      )}
                      <div className="detail-item highlight negative">
                        <span className="detail-label">Total Deductions</span>
                        <span className="detail-value">-{formatPeso(viewingPayrollRecord.totalDeductions)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="net-pay-section">
                    <span className="net-pay-label">NET PAY</span>
                    <span className="net-pay-amount">{formatPeso(viewingPayrollRecord.netPay)}</span>
                  </div>
                </div>

                <div className="modal-actions">
                  {!viewingPayrollRecord.processed && (
                    <button 
                      className="modal-button save"
                      onClick={() => {
                        handleProcessPayroll(viewingPayrollRecord)
                        setViewingPayrollRecord(null)
                      }}
                    >
                      <CheckCircle size={18} />
                      Process Payroll
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      </>
    )
  }

  // Check timeline view first before general cash advance view
  if (activeView === 'cashadvance' && cashAdvanceTimelineView && viewingCashAdvanceEmployee) {
    return (
      <>
        <SuccessPopup />
        <div className="dashboard">
        <div className="dashboard-header">
          <button 
            className="back-button"
            onClick={() => {
              setCashAdvanceTimelineView(false)
              setViewingCashAdvanceEmployee(null)
            }}
          >
            <X size={20} />
            <span>Back to Cash Advance Records</span>
          </button>
          <div>
            <h1>Cash Advance Timeline - {viewingCashAdvanceEmployee.name}</h1>
            <p className="subtitle">Complete cash advance history and payments</p>
          </div>
        </div>

        <div className="timeline-page-content">
                <div className="employee-detail-header">
                  <div className="employee-avatar-large">
                    <User size={32} />
                  </div>
                  <div>
                    <h3>{viewingCashAdvanceEmployee.name}</h3>
                    <p className="period-info">Complete Cash Advance History</p>
                  </div>
                </div>

                {/* Add New Cash Advance Button */}
                <button 
                  className="add-cash-advance-timeline-btn"
                  onClick={() => setShowAddCashAdvanceModal(true)}
                >
                  <Plus size={18} />
                  Add New Cash Advance
                </button>

          {cashAdvanceRecords.filter(r => r.employeeId === viewingCashAdvanceEmployee.id).length === 0 ? (
            <div className="empty-timeline">
              <CreditCard size={48} />
              <p>No cash advance records for this employee</p>
            </div>
          ) : (
            <div className="timeline">
              {cashAdvanceRecords
                .filter(r => r.employeeId === viewingCashAdvanceEmployee.id)
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map(record => (
                        <div key={record.id} className="timeline-item">
                          <div className="timeline-marker"></div>
                          <div className="timeline-card">
                            <div className="timeline-header">
                              <div className="timeline-date">
                                <Calendar size={16} />
                                <span>{new Date(record.date).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}</span>
                              </div>
                              <button 
                                className="icon-btn delete-btn"
                                onClick={async () => {
                                  if (confirm(`Delete this cash advance record?`)) {
                                    try {
                                      await deleteCashAdvanceRecord(record.id)
                                      setCashAdvanceRecords(cashAdvanceRecords.filter(r => r.id !== record.id))
                                      showSuccess('Record Deleted', 'Cash advance record has been deleted.', [])
                                    } catch (error) {
                                      console.error('Error deleting cash advance:', error)
                                      showSuccess('Error', 'Failed to delete record. Please try again.', [])
                                    }
                                  }
                                }}
                                title="Delete Record"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>

                            <div className="timeline-amounts">
                              <div className="timeline-amount-row">
                                <span className="timeline-label">Amount Advanced:</span>
                                <span className="timeline-value">{formatPeso(record.amount)}</span>
                              </div>
                              <div className="timeline-amount-row">
                                <span className="timeline-label">Total Paid:</span>
                                <span className="timeline-value positive">{formatPeso(record.amount - record.balance)}</span>
                              </div>
                              <div className="timeline-amount-row highlight">
                                <span className="timeline-label">Balance:</span>
                                <span className="timeline-value">{formatPeso(record.balance)}</span>
                              </div>
                            </div>

                            {record.notes && (
                              <div className="timeline-notes">
                                <span className="notes-label">Notes:</span>
                                <p>{record.notes}</p>
                              </div>
                            )}

                            {record.payments.length > 0 && (
                              <div className="timeline-payments">
                                <h5>Payment History</h5>
                                <div className="timeline-payments-list">
                                  {record.payments.map(payment => (
                                    <div key={payment.id} className="timeline-payment-item">
                                      <div className="payment-info">
                                        <Calendar size={14} />
                                        <span>{new Date(payment.date).toLocaleDateString()}</span>
                                        {payment.source && (
                                          <span className="payment-source">({payment.source})</span>
                                        )}
                                      </div>
                                      <span className="payment-amount">{formatPeso(payment.amount)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {record.balance > 0 && (
                              <button 
                                className="add-payment-btn-small"
                                onClick={() => {
                                  const payment = prompt(`Enter payment amount\nCurrent Balance: ${formatPeso(record.balance)}`)
                                  if (payment && !isNaN(payment) && Number(payment) > 0) {
                                    if (Number(payment) > record.balance) {
                                      showSuccess('Invalid Amount', 'Payment amount cannot exceed balance', [
                                        { label: 'Current Balance', value: formatPeso(record.balance) },
                                        { label: 'Attempted Payment', value: formatPeso(payment) }
                                      ])
                                    } else {
                                      handleAddPayment(record.id, payment)
                                      showSuccess(
                                        'Payment Added!',
                                        `Payment of ${formatPeso(payment)} recorded successfully`,
                                        [
                                          { label: 'Payment Amount', value: formatPeso(payment) },
                                          { label: 'New Balance', value: formatPeso(record.balance - Number(payment)) }
                                        ]
                                      )
                                    }
                                  }
                                }}
                              >
                                <Plus size={14} />
                                Add Payment
                              </button>
                            )}

                            {record.balance === 0 && (
                              <div className="timeline-paid-badge">
                                <CheckCircle size={16} />
                                <span>Fully Paid</span>
                              </div>
                            )}
                          </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Add Cash Advance Modal (still modal for adding) */}
        {showAddCashAdvanceModal && (
          <div className="modal-overlay" onClick={() => {
            setShowAddCashAdvanceModal(false)
            if (!viewingCashAdvanceEmployee) {
              setCashAdvanceForm({
                employeeId: '',
                employeeName: '',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                notes: ''
              })
            }
          }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Add Cash Advance</h2>
              <div className="form-group">
                <label>Employee</label>
                <select
                  value={viewingCashAdvanceEmployee ? viewingCashAdvanceEmployee.id : cashAdvanceForm.employeeId}
                  onChange={(e) => {
                    const employee = employees.find(emp => emp.id === Number(e.target.value))
                    setCashAdvanceForm({
                      ...cashAdvanceForm,
                      employeeId: e.target.value,
                      employeeName: employee ? employee.name : ''
                    })
                  }}
                  className="form-input"
                  disabled={viewingCashAdvanceEmployee !== null}
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} {getEmployeeCashAdvanceBalance(emp.id) > 0 ? `(Balance: ${formatPeso(getEmployeeCashAdvanceBalance(emp.id))})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Amount (₱)</label>
                <input
                  type="number"
                  value={cashAdvanceForm.amount}
                  onChange={(e) => setCashAdvanceForm({ ...cashAdvanceForm, amount: e.target.value })}
                  placeholder="Enter amount"
                  className="form-input"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={cashAdvanceForm.date}
                  onChange={(e) => setCashAdvanceForm({ ...cashAdvanceForm, date: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  value={cashAdvanceForm.notes}
                  onChange={(e) => setCashAdvanceForm({ ...cashAdvanceForm, notes: e.target.value })}
                  placeholder="Add any notes about this cash advance"
                  className="form-input"
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button 
                  className="modal-button cancel"
                  onClick={() => {
                    setShowAddCashAdvanceModal(false)
                    setCashAdvanceForm({
                      employeeId: '',
                      employeeName: '',
                      amount: '',
                      date: new Date().toISOString().split('T')[0],
                      notes: ''
                    })
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="modal-button save"
                  onClick={handleAddCashAdvance}
                >
                  Add Cash Advance
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </>
    )
  }

  // Main cash advance view (after timeline check)
  if (activeView === 'cashadvance') {
    return (
      <>
        <SuccessPopup />
      <div className="dashboard">
        <div className="dashboard-header">
          <div>
            <h1>Cash Advance Records</h1>
            <p className="subtitle">Track employee cash advances and payments</p>
          </div>
        </div>

        {employees.length === 0 ? (
          <div className="empty-state">
            <User size={64} />
            <h2>No Employees</h2>
            <p>Add employees first to track their cash advances</p>
          </div>
        ) : (
          <div className="cash-advance-container">
            <div className="payroll-summary-cards">
              <div className="stat-card primary">
                <div className="stat-icon">
                  <User size={24} />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Total Records</span>
                  <span className="stat-value">{cashAdvanceRecords.length}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <DollarSign size={24} />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Total Advanced</span>
                  <span className="stat-value">{formatPeso(cashAdvanceRecords.reduce((sum, r) => sum + r.amount, 0))}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <TrendingUp size={24} />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Total Paid</span>
                  <span className="stat-value">{formatPeso(cashAdvanceRecords.reduce((sum, r) => sum + (r.amount - r.balance), 0))}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <Clock size={24} />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Outstanding Balance</span>
                  <span className="stat-value">{formatPeso(cashAdvanceRecords.reduce((sum, r) => sum + r.balance, 0))}</span>
                </div>
              </div>
            </div>

            <div className="payroll-records-section">
              <h2>All Employees Cash Advance Status</h2>
              <div className="cash-advance-grid">
                {employees.map(employee => {
                  const employeeRecords = cashAdvanceRecords.filter(r => r.employeeId === employee.id)
                  const totalBalance = employeeRecords.reduce((sum, r) => sum + r.balance, 0)
                  const totalAdvanced = employeeRecords.reduce((sum, r) => sum + r.amount, 0)
                  const totalPaid = totalAdvanced - totalBalance

                  return (
                    <div key={employee.id} className="cash-advance-card">
                      <div className="cash-advance-header">
                        <div className="employee-info-large">
                          <div className="employee-avatar">
                            <User size={24} />
                          </div>
                          <div>
                            <h3>{employee.name}</h3>
                            <span className="date-text">{employeeRecords.length} advance(s)</span>
                          </div>
                        </div>
                      </div>

                      <div className="cash-advance-amounts">
                        <div className="amount-item">
                          <span className="amount-label">Total Advanced</span>
                          <span className="amount-value">{formatPeso(totalAdvanced)}</span>
                        </div>
                        <div className="amount-item">
                          <span className="amount-label">Total Paid</span>
                          <span className="amount-value positive">{formatPeso(totalPaid)}</span>
                        </div>
                        <div className="amount-item highlight">
                          <span className="amount-label">Balance</span>
                          <span className="amount-value">{formatPeso(totalBalance)}</span>
                        </div>
                      </div>

                      <div className="payment-section">
                        <button 
                          className="add-payment-btn"
                          onClick={() => {
                            setViewingCashAdvanceEmployee(employee)
                            setCashAdvanceTimelineView(true)
                          }}
                        >
                          <FileText size={16} />
                          View Cash Advance Records
                        </button>
                      </div>

                      {totalBalance === 0 && totalAdvanced > 0 && (
                        <div className="paid-badge">
                          <span>✓ All Paid</span>
                        </div>
                      )}
                      
                      {employeeRecords.length === 0 && (
                        <div className="no-advance-badge">
                          <span>No Cash Advances</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Old records for reference - can be removed */}
            <div className="payroll-records-section" style={{display: 'none'}}>
              <h2>Detailed Records</h2>
              <div className="cash-advance-grid">
                {cashAdvanceRecords.map(record => (
                  <div key={record.id} className="cash-advance-card">
                    <div className="cash-advance-header">
                      <div className="employee-info-large">
                        <div className="employee-avatar">
                          <User size={24} />
                        </div>
                        <div>
                          <h3>{record.employeeName}</h3>
                          <span className="date-text">Date: {new Date(record.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <button 
                        className="icon-btn delete-btn"
                        onClick={async () => {
                          if (confirm(`Delete cash advance record for ${record.employeeName}?`)) {
                            try {
                              await deleteCashAdvanceRecord(record.id)
                              setCashAdvanceRecords(cashAdvanceRecords.filter(r => r.id !== record.id))
                              showSuccess('Record Deleted', 'Cash advance record has been deleted.', [])
                            } catch (error) {
                              console.error('Error deleting cash advance:', error)
                              showSuccess('Error', 'Failed to delete record. Please try again.', [])
                            }
                          }
                        }}
                        title="Delete Record"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="cash-advance-amounts">
                      <div className="amount-item">
                        <span className="amount-label">Amount Advanced</span>
                        <span className="amount-value">{formatPeso(record.amount)}</span>
                      </div>
                      <div className="amount-item">
                        <span className="amount-label">Total Paid</span>
                        <span className="amount-value positive">{formatPeso(record.amount - record.balance)}</span>
                      </div>
                      <div className="amount-item highlight">
                        <span className="amount-label">Balance</span>
                        <span className="amount-value">{formatPeso(record.balance)}</span>
                      </div>
                    </div>

                    {record.notes && (
                      <div className="cash-advance-notes">
                        <span className="notes-label">Notes:</span>
                        <span className="notes-text">{record.notes}</span>
                      </div>
                    )}

                    {record.balance > 0 && (
                      <div className="payment-section">
                        <button 
                          className="add-payment-btn"
                          onClick={() => {
                            const payment = prompt(`Enter payment amount for ${record.employeeName}\nCurrent Balance: ${formatPeso(record.balance)}`)
                            if (payment && !isNaN(payment) && Number(payment) > 0) {
                              if (Number(payment) > record.balance) {
                                showSuccess('Invalid Amount', 'Payment amount cannot exceed balance', [
                                  { label: 'Current Balance', value: formatPeso(record.balance) },
                                  { label: 'Attempted Payment', value: formatPeso(payment) }
                                ])
                              } else {
                                handleAddPayment(record.id, payment)
                                showSuccess(
                                  'Payment Added!',
                                  `Payment of ${formatPeso(payment)} recorded for ${record.employeeName}`,
                                  [
                                    { label: 'Payment Amount', value: formatPeso(payment) },
                                    { label: 'New Balance', value: formatPeso(record.balance - Number(payment)) }
                                  ]
                                )
                              }
                            }
                          }}
                        >
                          <Plus size={16} />
                          Add Payment
                        </button>
                      </div>
                    )}

                    {record.payments.length > 0 && (
                      <div className="payments-history">
                        <h4>Payment History</h4>
                        <div className="payments-list">
                          {record.payments.map(payment => (
                            <div key={payment.id} className="payment-item">
                              <span className="payment-date">{new Date(payment.date).toLocaleDateString()}</span>
                              <span className="payment-amount">{formatPeso(payment.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {record.balance === 0 && (
                      <div className="paid-badge">
                        <span>✓ Fully Paid</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Add Cash Advance Modal */}
        {showAddCashAdvanceModal && (
          <div className="modal-overlay" onClick={() => {
            setShowAddCashAdvanceModal(false)
            if (!viewingCashAdvanceEmployee) {
              setCashAdvanceForm({
                employeeId: '',
                employeeName: '',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                notes: ''
              })
            }
          }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Add Cash Advance</h2>
              <div className="form-group">
                <label>Employee</label>
                <select
                  value={viewingCashAdvanceEmployee ? viewingCashAdvanceEmployee.id : cashAdvanceForm.employeeId}
                  onChange={(e) => {
                    const employee = employees.find(emp => emp.id === Number(e.target.value))
                    setCashAdvanceForm({
                      ...cashAdvanceForm,
                      employeeId: e.target.value,
                      employeeName: employee ? employee.name : ''
                    })
                  }}
                  className="form-input"
                  disabled={viewingCashAdvanceEmployee !== null}
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} {getEmployeeCashAdvanceBalance(emp.id) > 0 ? `(Balance: ${formatPeso(getEmployeeCashAdvanceBalance(emp.id))})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Amount (₱)</label>
                <input
                  type="number"
                  value={cashAdvanceForm.amount}
                  onChange={(e) => setCashAdvanceForm({ ...cashAdvanceForm, amount: e.target.value })}
                  placeholder="Enter amount"
                  className="form-input"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={cashAdvanceForm.date}
                  onChange={(e) => setCashAdvanceForm({ ...cashAdvanceForm, date: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  value={cashAdvanceForm.notes}
                  onChange={(e) => setCashAdvanceForm({ ...cashAdvanceForm, notes: e.target.value })}
                  placeholder="Add any notes about this cash advance"
                  className="form-input"
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button 
                  className="modal-button cancel"
                  onClick={() => {
                    setShowAddCashAdvanceModal(false)
                    setCashAdvanceForm({
                      employeeId: '',
                      employeeName: '',
                      amount: '',
                      date: new Date().toISOString().split('T')[0],
                      notes: ''
                    })
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="modal-button save"
                  onClick={handleAddCashAdvance}
                >
                  Add Cash Advance
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </>
    )
  }

  // Day Off Management View
  if (activeView === 'dayoff') {
    return (
      <>
        <SuccessPopup />
        <div className="dashboard">
          <div className="dashboard-header">
            <div>
              <h1>Day Off Management</h1>
              <p className="subtitle">Manage employee paid day offs</p>
            </div>
            <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
              <button 
                className="secondary-button"
                onClick={() => setShowAutoSetupModal(true)}
              >
                <Calendar size={18} />
                <span>Auto Setup</span>
              </button>
              {dayOffRecords.length > 0 && (
                <button 
                  className="secondary-button"
                  onClick={handlePrintCalendar}
                  title="Print calendar view"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 6 2 18 2 18 9"></polyline>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                    <rect x="6" y="14" width="12" height="8"></rect>
                  </svg>
                  <span>Print Calendar</span>
                </button>
              )}
              <button 
                className="secondary-button"
                onClick={() => setShowSwapModal(true)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="17 1 21 5 17 9"></polyline>
                  <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                  <polyline points="7 23 3 19 7 15"></polyline>
                  <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                </svg>
                <span>Swap</span>
              </button>
              {dayOffRecords.length > 0 && (
                <button 
                  className="danger-button"
                  onClick={handleResetAllDayOffs}
                >
                  <Trash2 size={18} />
                  <span>Reset All</span>
                </button>
              )}
              <button className="add-employee-button" onClick={() => setShowAddDayOffModal(true)}>
                <Plus size={20} />
                <span>Add Day Off</span>
              </button>
            </div>
          </div>

          <div className="info-card">
            <p className="info-card-title">How Day Off Works:</p>
            <ul className="info-card-list">
              <li>Each qualified day off is paid for 9 hours of work</li>
              <li>Day off hours are automatically added to the payroll calculation</li>
              <li><strong>Auto Setup:</strong> Creates 1 day off per employee per month, spread evenly to ensure coverage</li>
              <li><strong>Absences are auto-detected:</strong> Days with 0 hours in the salary counter count as absences</li>
              <li>If an employee has {maxAbsencesForDayOff} or more absences in a pay period, their day off will not be paid</li>
              <li>You can adjust the absence threshold in Settings</li>
            </ul>
          </div>

          {dayOffRecords.length === 0 ? (
            <div className="empty-state">
              <Calendar size={64} style={{opacity: 0.3}} />
              <h3>No Day Off Records</h3>
              <p>Click "Add Day Off" to create a new record</p>
            </div>
          ) : (
            <div className="payroll-table-container">
              <table className="payroll-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Date</th>
                    <th>Day of Week</th>
                    <th>Month/Year</th>
                    <th>Absences</th>
                    <th>Status</th>
                    <th>Hours Paid</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dayOffRecords.map(record => {
                    const dayOfWeek = new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' })
                    return (
                      <tr key={record.id}>
                        <td>
                          <div className="employee-info">
                            <div className="employee-avatar-small">
                              <User size={16} />
                            </div>
                            <span>{record.employeeName}</span>
                          </div>
                        </td>
                        <td>{new Date(record.date).toLocaleDateString()}</td>
                        <td>
                          <span className="day-of-week-badge">{dayOfWeek}</span>
                        </td>
                        <td>{record.month} {record.year}</td>
                        <td>
                          <span className={record.absenceCount >= maxAbsencesForDayOff ? 'status-badge danger' : 'status-badge success'}>
                            {record.absenceCount} absence{record.absenceCount !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td>
                          {record.isQualified ? (
                            <span className="status-badge success">Qualified</span>
                          ) : (
                            <span className="status-badge danger">Not Qualified</span>
                          )}
                        </td>
                        <td>
                          <strong>{record.hoursPaid || 0} hours</strong>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="icon-btn delete-btn"
                              onClick={() => {
                                if (confirm(`Delete day off record for ${record.employeeName}?`)) {
                                  handleDeleteDayOff(record.id)
                                }
                              }}
                              title="Delete Day Off"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Add Day Off Modal */}
          {showAddDayOffModal && (
            <div className="modal-overlay" onClick={() => {
              setShowAddDayOffModal(false)
              setDayOffForm({
                employeeId: '',
                employeeName: '',
                date: new Date().toISOString().split('T')[0],
                month: '',
                year: new Date().getFullYear(),
                payPeriod: '',
                hoursPaid: 9,
                absenceCount: 0,
                isQualified: true,
                notes: ''
              })
            }}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Add Day Off</h2>
                <div className="form-group">
                  <label>Employee</label>
                  <select
                    value={dayOffForm.employeeId}
                    onChange={(e) => {
                      const employee = employees.find(emp => emp.id === Number(e.target.value))
                      const employeeId = Number(e.target.value)
                      
                      // Auto-calculate absences if date is selected
                      if (employeeId && dayOffForm.date) {
                        const date = new Date(dayOffForm.date)
                        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
                        const day = date.getDate()
                        const month = monthNames[date.getMonth()]
                        const year = date.getFullYear()
                        const payPeriod = day <= 15 ? '1-15' : '16-31'
                        
                        const absences = countAbsencesForPeriod(employeeId, month, year, payPeriod)
                        
                        setDayOffForm({
                          ...dayOffForm,
                          employeeId: e.target.value,
                          employeeName: employee ? employee.name : '',
                          absenceCount: absences
                        })
                      } else {
                        setDayOffForm({
                          ...dayOffForm,
                          employeeId: e.target.value,
                          employeeName: employee ? employee.name : ''
                        })
                      }
                    }}
                    className="form-input"
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Day Off Date</label>
                  <input
                    type="date"
                    value={dayOffForm.date}
                    onChange={(e) => {
                      const newDate = e.target.value
                      
                      // Auto-calculate absences if employee is selected
                      if (dayOffForm.employeeId && newDate) {
                        const date = new Date(newDate)
                        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
                        const day = date.getDate()
                        const month = monthNames[date.getMonth()]
                        const year = date.getFullYear()
                        const payPeriod = day <= 15 ? '1-15' : '16-31'
                        
                        const absences = countAbsencesForPeriod(Number(dayOffForm.employeeId), month, year, payPeriod)
                        
                        setDayOffForm({ 
                          ...dayOffForm, 
                          date: newDate,
                          absenceCount: absences
                        })
                      } else {
                        setDayOffForm({ ...dayOffForm, date: newDate })
                      }
                    }}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Number of Absences in Pay Period (Auto-calculated)</label>
                  <input
                    type="number"
                    value={dayOffForm.absenceCount}
                    readOnly
                    className="form-input"
                    style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}}
                  />
                  <small style={{color: '#666', marginTop: '5px', display: 'block'}}>
                    {dayOffForm.employeeId && dayOffForm.date ? (
                      <>
                        {dayOffForm.absenceCount >= maxAbsencesForDayOff ? 
                          `⚠️ Employee has ${dayOffForm.absenceCount} absences (days with 0 hours). Day off will NOT be paid.` :
                          `✓ Employee has ${dayOffForm.absenceCount} absences (days with 0 hours). Day off will be paid (9 hours).`
                        }
                      </>
                    ) : (
                      'Select an employee and date to auto-calculate absences from salary counter records'
                    )}
                  </small>
                </div>
                <div className="form-group">
                  <label>Notes (Optional)</label>
                  <textarea
                    value={dayOffForm.notes}
                    onChange={(e) => setDayOffForm({ ...dayOffForm, notes: e.target.value })}
                    className="form-input"
                    rows="3"
                    placeholder="Add any notes about this day off..."
                  />
                </div>
                <div className="modal-actions">
                  <button className="cancel-button" onClick={() => {
                    setShowAddDayOffModal(false)
                    setDayOffForm({
                      employeeId: '',
                      employeeName: '',
                      date: new Date().toISOString().split('T')[0],
                      month: '',
                      year: new Date().getFullYear(),
                      payPeriod: '',
                      hoursPaid: 9,
                      absenceCount: 0,
                      isQualified: true,
                      notes: ''
                    })
                  }}>
                    Cancel
                  </button>
                  <button className="save-button" onClick={handleAddDayOff}>
                    <Save size={18} />
                    <span>Add Day Off</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Auto Setup Day Off Modal */}
          {showAutoSetupModal && (
            <div className="modal-overlay" onClick={() => {
              setShowAutoSetupModal(false)
              setAutoSetupForm({
                month: new Date().getMonth(),
                year: new Date().getFullYear(),
                payPeriod: '1-15',
                selectedEmployees: []
              })
            }}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Auto Setup Day Offs</h2>
                <p className="modal-description">
                  Automatically create day off records for all employees in the selected month.
                </p>
                
                <div className="info-card" style={{marginBottom: '20px'}}>
                  <p className="info-card-title">What will be created:</p>
                  <ul className="info-card-list">
                    <li>Day offs for <strong>all {employees.length} employees</strong></li>
                    <li><strong>1 day off per employee</strong> for the entire month</li>
                    <li>In the selected month of <strong>{new Date().getFullYear()}</strong></li>
                    <li><strong>Only 1 employee per day</strong> - spread evenly across the month</li>
                    <li>Qualification based on absence count in their pay period</li>
                  </ul>
                </div>

                <div className="form-group">
                  <label>Select Month</label>
                  <select
                    value={autoSetupForm.month}
                    onChange={(e) => setAutoSetupForm({ ...autoSetupForm, month: Number(e.target.value) })}
                    className="form-input"
                  >
                    <option value={0}>January</option>
                    <option value={1}>February</option>
                    <option value={2}>March</option>
                    <option value={3}>April</option>
                    <option value={4}>May</option>
                    <option value={5}>June</option>
                    <option value={6}>July</option>
                    <option value={7}>August</option>
                    <option value={8}>September</option>
                    <option value={9}>October</option>
                    <option value={10}>November</option>
                    <option value={11}>December</option>
                  </select>
                </div>

                <div className="modal-actions">
                  <button className="cancel-button" onClick={() => {
                    setShowAutoSetupModal(false)
                    setAutoSetupForm({
                      month: new Date().getMonth(),
                      year: new Date().getFullYear(),
                      payPeriod: '1-15',
                      selectedEmployees: []
                    })
                  }}>
                    Cancel
                  </button>
                  <button className="save-button" onClick={handleAutoSetupDayOff}>
                    <Calendar size={18} />
                    <span>Generate Day Offs</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Swap Day Offs Modal */}
          {showSwapModal && (
            <div className="modal-overlay" onClick={() => {
              setShowSwapModal(false)
              setSwapForm({ employee1Id: '', employee2Id: '' })
            }}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Swap Day Offs Between Employees</h2>
                <p className="modal-description">
                  All day off records will be swapped between the two selected employees.
                </p>
                
                <div className="form-group">
                  <label>First Employee</label>
                  <select
                    value={swapForm.employee1Id}
                    onChange={(e) => setSwapForm({ ...swapForm, employee1Id: e.target.value })}
                    className="form-input"
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => {
                      const dayOffCount = dayOffRecords.filter(r => r.employeeId === emp.id).length
                      return (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} {dayOffCount > 0 ? `(${dayOffCount} day off${dayOffCount !== 1 ? 's' : ''})` : '(No day offs)'}
                        </option>
                      )
                    })}
                  </select>
                </div>

                <div className="swap-icon-divider">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="17 1 21 5 17 9"></polyline>
                    <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                    <polyline points="7 23 3 19 7 15"></polyline>
                    <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                  </svg>
                </div>

                <div className="form-group">
                  <label>Second Employee</label>
                  <select
                    value={swapForm.employee2Id}
                    onChange={(e) => setSwapForm({ ...swapForm, employee2Id: e.target.value })}
                    className="form-input"
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => {
                      const dayOffCount = dayOffRecords.filter(r => r.employeeId === emp.id).length
                      return (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} {dayOffCount > 0 ? `(${dayOffCount} day off${dayOffCount !== 1 ? 's' : ''})` : '(No day offs)'}
                        </option>
                      )
                    })}
                  </select>
                </div>

                <div className="modal-actions">
                  <button className="cancel-button" onClick={() => {
                    setShowSwapModal(false)
                    setSwapForm({ employee1Id: '', employee2Id: '' })
                  }}>
                    Cancel
                  </button>
                  <button className="save-button" onClick={handleSwapDayOffs}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="17 1 21 5 17 9"></polyline>
                      <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                      <polyline points="7 23 3 19 7 15"></polyline>
                      <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                    </svg>
                    <span>Swap Day Offs</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </>
    )
  }

  if (activeView === 'settings') {
    return (
      <>
        <SuccessPopup />
      <div className="dashboard">
        <div className="dashboard-header">
          <div>
            <h1>System Settings</h1>
            <p className="subtitle">Configure system values and manage employees</p>
          </div>
        </div>

        <div className="settings-container">
          {/* System Configuration */}
          <div className="settings-section">
            <h2>Work Hours & Rates</h2>
            <div className="settings-grid">
              <div className="setting-item">
                <label>Default Hours Per Shift</label>
                <p className="setting-description">Standard working hours for a shift</p>
                <div className="setting-input-group">
                  <input
                    type="number"
                    value={defaultHoursPerShift}
                    onChange={(e) => setDefaultHoursPerShift(Number(e.target.value))}
                    min="1"
                    max="24"
                    className="setting-input"
                  />
                  <span className="input-suffix">hours</span>
                  </div>
                </div>

              <div className="setting-item">
                <label>Late Deduction Rate</label>
                <p className="setting-description">Amount deducted per minute late</p>
                <div className="setting-input-group">
                  <span className="input-prefix">₱</span>
                  <input
                    type="number"
                    value={lateDeductionRate}
                    onChange={(e) => setLateDeductionRate(Number(e.target.value))}
                    min="0"
                    step="0.01"
                    className="setting-input"
                  />
                  <span className="input-suffix">per minute</span>
            </div>
                              </div>
            </div>
                            </div>

          {/* Commission Settings */}
          <div className="settings-section">
            <h2>Commission Rates</h2>
            <div className="settings-grid">
              <div className="setting-item">
                <label>Rush Tarp Commission</label>
                <p className="setting-description">Commission per rush tarp completed</p>
                <div className="setting-input-group">
                  <span className="input-prefix">₱</span>
                  <input
                    type="number"
                    value={rushTarpCommissionRate}
                    onChange={(e) => setRushTarpCommissionRate(Number(e.target.value))}
                    min="0"
                    step="0.01"
                    className="setting-input"
                  />
                  <span className="input-suffix">each</span>
                              </div>
                              </div>

              <div className="setting-item">
                <label>Regular Commission</label>
                <p className="setting-description">Commission per regular item completed</p>
                <div className="setting-input-group">
                  <span className="input-prefix">₱</span>
                  <input
                    type="number"
                    value={regularCommissionRate}
                    onChange={(e) => setRegularCommissionRate(Number(e.target.value))}
                    min="0"
                    step="0.01"
                    className="setting-input"
                  />
                  <span className="input-suffix">each</span>
                </div>
              </div>
            </div>

            {/* Custom Commissions */}
            <div style={{ marginTop: '30px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', marginBottom: '16px' }}>Custom Commission Types</h3>
              
              {/* Add Custom Commission Form */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <input
                  type="text"
                  placeholder="Commission Name"
                  value={newCommissionName}
                  onChange={(e) => setNewCommissionName(e.target.value)}
                  style={{
                    flex: 2,
                    padding: '10px 12px',
                    background: '#0a0a0a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '14px'
                  }}
                />
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '0 12px' }}>
                  <span style={{ color: '#999999', marginRight: '8px' }}>₱</span>
                  <input
                    type="number"
                    placeholder="Rate"
                    value={newCommissionRate || ''}
                    onChange={(e) => setNewCommissionRate(Number(e.target.value))}
                    min="0"
                    step="0.01"
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '14px',
                      outline: 'none',
                      MozAppearance: 'textfield',
                      WebkitAppearance: 'none',
                      appearance: 'none'
                    }}
                    onWheel={(e) => e.target.blur()}
                  />
                </div>
                <button
                  onClick={handleAddCustomCommission}
                  style={{
                    padding: '10px 20px',
                    background: '#ffffff',
                    color: '#0a0a0a',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  Add
                </button>
              </div>

              {/* Custom Commissions List */}
              {customCommissions.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {customCommissions.map(commission => (
                    <div key={commission.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      background: '#1a1a1a',
                      border: '1px solid #2a2a2a',
                      borderRadius: '8px'
                    }}>
                      <div>
                        <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: '500' }}>{commission.name}</span>
                        <span style={{ color: '#999999', fontSize: '13px', marginLeft: '12px' }}>₱{commission.rate} each</span>
                      </div>
                      <button
                        onClick={() => handleDeleteCustomCommission(commission.id)}
                        style={{
                          padding: '6px 12px',
                          background: 'transparent',
                          border: '1px solid #ff6b6b',
                          color: '#ff6b6b',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={14} style={{ verticalAlign: 'middle' }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Day Off Settings */}
          <div className="settings-section">
            <h2>Day Off Settings</h2>
            <div className="settings-grid">
              <div className="setting-item">
                <label>Maximum Absences for Paid Day Off</label>
                <p className="setting-description">If absences reach or exceed this number, day off will not be paid</p>
                <div className="setting-input-group">
                  <input
                    type="number"
                    value={maxAbsencesForDayOff}
                    onChange={(e) => setMaxAbsencesForDayOff(Number(e.target.value))}
                    min="0"
                    max="31"
                    className="setting-input"
                  />
                  <span className="input-suffix">absences</span>
                </div>
              </div>
            </div>
          </div>

          {/* Employee Management */}
          <div className="settings-section">
            <div className="section-header-with-action">
              <h2>Employee Management</h2>
              {isManager && (
                <button className="add-employee-button" onClick={() => setShowAddModal(true)}>
                  <Plus size={20} />
                  <span>Add Employee</span>
                </button>
              )}
                              </div>

            {employees.length === 0 ? (
              <div className="empty-state-small">
                <User size={48} />
                <h3>No Employees</h3>
                <p>Click "Add Employee" to get started</p>
                                      </div>
            ) : (
              <div className="employees-table-container">
                <table className="employees-table">
                  <thead>
                    <tr>
                      <th>Employee Name</th>
                      <th>Rate per {defaultHoursPerShift} Hours</th>
                      <th>Hours/Shift</th>
                      <th>Shift Type</th>
                      <th>Shift Time</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map(employee => (
                      <tr key={employee.id}>
                        <td>
                          <div className="employee-name-cell">
                            <div className="employee-avatar-small">
                              <User size={16} />
                                    </div>
                            <span>{employee.name}</span>
                                </div>
                        </td>
                        <td>{isManager ? formatPeso(employee.ratePer9Hours) : censorRate()}</td>
                        <td>{employee.hoursPerShift} hrs</td>
                        <td>
                          <span className={`shift-badge ${employee.shiftType}`}>
                            {employee.shiftType === 'first' ? 'First Shift' : 'Second Shift'}
                          </span>
                        </td>
                        <td>{employee.shiftType === 'first' ? '7:00 AM - 5:00 PM' : '8:30 PM - 7:00 AM'}</td>
                        <td>
                          <div className="action-buttons">
                            {isManager && (
                              <>
                                <button 
                                className="icon-btn edit-btn"
                                onClick={() => handleEditEmployee(employee)}
                                title="Edit"
                              >
                                <Edit2 size={16} />
                                </button>
                              <button 
                                className="icon-btn delete-btn"
                                onClick={() => handleDeleteEmployee(employee.id)}
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                              </>
                            )}
                            {!isManager && (
                              <span className="no-access-badge">View Only</span>
                            )}
                              </div>
                        </td>
                      </tr>
                ))}
                  </tbody>
                </table>
            </div>
          )}
          </div>
        </div>

        {/* Add/Edit Employee Modal */}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => {
            setShowAddModal(false)
            setEditingEmployee(null)
            setFormData({ name: '', ratePer9Hours: 0, hoursPerShift: defaultHoursPerShift, shiftType: 'first' })
          }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h2>
              <div className="form-group">
                <label>Employee Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter employee name"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Rate Per {defaultHoursPerShift}-Hour Shift (₱)</label>
                <input
                  type="number"
                  value={formData.ratePer9Hours}
                  onChange={(e) => setFormData({ ...formData, ratePer9Hours: e.target.value })}
                  placeholder={`e.g., 600 for ₱600 per ${defaultHoursPerShift} hours`}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Hours Per Shift</label>
                <input
                  type="number"
                  value={formData.hoursPerShift}
                  onChange={(e) => setFormData({ ...formData, hoursPerShift: e.target.value })}
                  placeholder="Enter hours per shift"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Shift Type</label>
                <select
                  value={formData.shiftType}
                  onChange={(e) => setFormData({ ...formData, shiftType: e.target.value })}
                  className="form-input"
                >
                  <option value="first">First Shift (7AM-5PM)</option>
                  <option value="second">Second Shift (8:30PM-7AM)</option>
                </select>
              </div>
              <div className="modal-actions">
                <button 
                  className="modal-button cancel"
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingEmployee(null)
                    setFormData({ name: '', ratePer9Hours: 0, hoursPerShift: defaultHoursPerShift, shiftType: 'first' })
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="modal-button save"
                  onClick={editingEmployee ? handleUpdateEmployee : handleAddEmployee}
                >
                  {editingEmployee ? 'Update' : 'Add'} Employee
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </>
    )
  }

  if (activeView !== 'dashboard') {
    return (
      <>
        <SuccessPopup />
      <div className="dashboard">
        <div className="coming-soon">
          <h2>Coming Soon</h2>
          <p>This feature is under development</p>
        </div>
      </div>
      </>
    )
  }

  return (
    <>
      <SuccessPopup />
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Employee Salary Dashboard</h1>
          <p className="subtitle">Manage employee rates and calculate earnings (9-hour shifts)</p>
        </div>
        {isManager && (
          <button className="add-employee-button" onClick={() => setShowAddModal(true)}>
            <Plus size={20} />
            <span>Add Employee</span>
          </button>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">
            <User size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Employees</span>
            <span className="stat-value">{stats.employeeCount}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Avg. Per Shift (9hrs)</span>
            <span className="stat-value">{isManager ? formatPeso(stats.avgPerShift) : censorRate()}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Monthly</span>
            <span className="stat-value">{isManager ? formatPeso(stats.totalMonthly) : censorRate()}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Annual</span>
            <span className="stat-value">{isManager ? formatPeso(stats.totalAnnual) : censorRate()}</span>
          </div>
        </div>
      </div>

      <div className="employees-section">
        <h2>Employee List</h2>
        <div className="employees-grid">
          {employees.map(employee => {
            const empStats = calculateStats(employee)
            return (
              <div key={employee.id} className="employee-card">
                <div className="employee-header">
                  <div className="employee-avatar">
                    <User size={24} />
                  </div>
                  <div className="employee-info">
                    <h3>{employee.name}</h3>
                    <span className="employee-hours">{employee.hoursPerShift} hours/shift</span>
                  </div>
                  {isManager && (
                    <div className="employee-actions">
                      <button 
                        className="icon-btn edit-btn"
                        onClick={() => handleEditEmployee(employee)}
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className="icon-btn delete-btn"
                        onClick={() => handleDeleteEmployee(employee.id)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="employee-rate">
                  <span className="rate-label">Per 9-Hour Shift</span>
                  <span className="rate-value">{isManager ? formatPeso(employee.ratePer9Hours) : censorRate()}</span>
                </div>

                <div className="employee-stats">
                  <div className="stat-item">
                    <Clock size={14} />
                    <div>
                      <span className="stat-item-label">Shift Time</span>
                      <span className="stat-item-value">{employee.shiftType === 'first' ? '7AM-5PM' : '8:30PM-7AM'}</span>
                    </div>
                  </div>
                  <div className="stat-item">
                    <Calendar size={14} />
                    <div>
                      <span className="stat-item-label">Shift Type</span>
                      <span className="stat-item-value">{employee.shiftType === 'first' ? 'First Shift' : 'Second Shift'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => {
          setShowAddModal(false)
          setEditingEmployee(null)
          setFormData({ name: '', ratePer9Hours: 0, hoursPerShift: 9, shiftType: 'first' })
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h2>
            <div className="form-group">
              <label>Employee Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter employee name"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Rate Per 9-Hour Shift (₱)</label>
              <input
                type="number"
                value={formData.ratePer9Hours}
                onChange={(e) => setFormData({ ...formData, ratePer9Hours: e.target.value })}
                placeholder="e.g., 600 for ₱600 per 9 hours"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Hours Per Shift</label>
              <input
                type="number"
                value={formData.hoursPerShift}
                onChange={(e) => setFormData({ ...formData, hoursPerShift: e.target.value })}
                placeholder="Enter hours per shift"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Shift Type</label>
              <select
                value={formData.shiftType}
                onChange={(e) => setFormData({ ...formData, shiftType: e.target.value })}
                className="form-input"
              >
                <option value="first">First Shift (7AM-5PM)</option>
                <option value="second">Second Shift (8:30PM-7AM)</option>
              </select>
            </div>
            <div className="modal-actions">
              <button 
                className="modal-button cancel"
                onClick={() => {
                  setShowAddModal(false)
                  setEditingEmployee(null)
                  setFormData({ name: '', ratePer9Hours: 0, hoursPerShift: 9, shiftType: 'first' })
                }}
              >
                Cancel
              </button>
              <button 
                className="modal-button save"
                onClick={editingEmployee ? handleUpdateEmployee : handleAddEmployee}
              >
                {editingEmployee ? 'Update' : 'Add'} Employee
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}

export default Dashboard
