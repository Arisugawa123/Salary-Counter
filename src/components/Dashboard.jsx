import { useState, useEffect } from 'react'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
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
  AlertCircle,
  Wallet,
  Mail,
  Phone,
  Award,
  Info,
  Download
} from 'lucide-react'
import JsBarcode from 'jsbarcode'
import { useAuth } from '../contexts/AuthContext'
import './Dashboard.css'
import './TimeTracker.css'
import './TimeTable.css'
import {
  supabase,
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
    email: '',
    phone: '',
    photo: '',
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
  const [showCalendarPicker, setShowCalendarPicker] = useState(false)
  const [calendarCurrentYear, setCalendarCurrentYear] = useState(new Date().getFullYear())
  const [calendarCurrentMonth, setCalendarCurrentMonth] = useState(new Date().getMonth())
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

  // Set up real-time subscription for employees
  useEffect(() => {
    // Subscribe to changes in employees table
    const employeesSubscription = supabase
      .channel('employees-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'employees'
        },
        (payload) => {
          console.log('Employee change detected:', payload)
          
          if (payload.eventType === 'INSERT') {
            // Add new employee
            const newEmployee = {
              id: payload.new.id,
              name: payload.new.name,
              email: payload.new.email,
              phone: payload.new.phone,
              photo: payload.new.photo,
              ratePer9Hours: payload.new.rate_per9_hours,
              hoursPerShift: payload.new.hours_per_shift,
              shiftType: payload.new.shift_type
            }
            setEmployees(prev => [...prev, newEmployee])
          } else if (payload.eventType === 'UPDATE') {
            // Update existing employee
            const updatedEmployee = {
              id: payload.new.id,
              name: payload.new.name,
              email: payload.new.email,
              phone: payload.new.phone,
              photo: payload.new.photo,
              ratePer9Hours: payload.new.rate_per9_hours,
              hoursPerShift: payload.new.hours_per_shift,
              shiftType: payload.new.shift_type
            }
            
            setEmployees(prev => 
              prev.map(emp => emp.id === updatedEmployee.id ? updatedEmployee : emp)
            )
            
            // If the updated employee is currently selected, update selectedEmployee too
            if (selectedEmployee && selectedEmployee.id === updatedEmployee.id) {
              setSelectedEmployee(updatedEmployee)
            }
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted employee
            setEmployees(prev => prev.filter(emp => emp.id !== payload.old.id))
            
            // If the deleted employee is currently selected, clear selection
            if (selectedEmployee && selectedEmployee.id === payload.old.id) {
              setSelectedEmployee(null)
              setSearchQuery('')
              setShowTimeTracker(false)
            }
          }
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(employeesSubscription)
    }
  }, [selectedEmployee])

  // Set up real-time subscriptions for other tables
  useEffect(() => {
    // Helper function to convert snake_case to camelCase
    const toCamelCase = (obj) => {
      if (!obj) return obj
      const camelObj = {}
      for (const [key, value] of Object.entries(obj)) {
        const camelKey = key.replace(/_([a-z0-9])/g, (_, char) => char.toUpperCase())
        camelObj[camelKey] = value
      }
      return camelObj
    }

    // Subscribe to time records changes
    const timeRecordsSubscription = supabase
      .channel('time-records-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_records' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTimeRecords(prev => [toCamelCase(payload.new), ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setTimeRecords(prev => prev.map(r => r.id === payload.new.id ? toCamelCase(payload.new) : r))
        } else if (payload.eventType === 'DELETE') {
          setTimeRecords(prev => prev.filter(r => r.id !== payload.old.id))
        }
      })
      .subscribe()

    // Subscribe to cash advance records changes
    const cashAdvanceSubscription = supabase
      .channel('cash-advance-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cash_advance_records' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setCashAdvanceRecords(prev => [toCamelCase(payload.new), ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setCashAdvanceRecords(prev => prev.map(r => r.id === payload.new.id ? toCamelCase(payload.new) : r))
        } else if (payload.eventType === 'DELETE') {
          setCashAdvanceRecords(prev => prev.filter(r => r.id !== payload.old.id))
        }
      })
      .subscribe()

    // Subscribe to day off records changes
    const dayOffSubscription = supabase
      .channel('day-off-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'day_off_records' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setDayOffRecords(prev => [toCamelCase(payload.new), ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setDayOffRecords(prev => prev.map(r => r.id === payload.new.id ? toCamelCase(payload.new) : r))
        } else if (payload.eventType === 'DELETE') {
          setDayOffRecords(prev => prev.filter(r => r.id !== payload.old.id))
        }
      })
      .subscribe()

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(timeRecordsSubscription)
      supabase.removeChannel(cashAdvanceSubscription)
      supabase.removeChannel(dayOffSubscription)
    }
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
        email: formData.email || null,
        phone: formData.phone || null,
        photo: formData.photo || null,
        ratePer9Hours: Number(formData.ratePer9Hours),
        hoursPerShift: Number(formData.hoursPerShift),
        shiftType: formData.shiftType
      }
        const savedEmployee = await createEmployee(newEmployee)
        setEmployees([...employees, savedEmployee])
        setFormData({ name: '', email: '', phone: '', photo: '', ratePer9Hours: 0, hoursPerShift: 9, shiftType: 'first' })
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
      email: employee.email || '',
      phone: employee.phone || '',
      photo: employee.photo || '',
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
              email: formData.email || null,
              phone: formData.phone || null,
              photo: formData.photo || null,
              ratePer9Hours: Number(formData.ratePer9Hours), 
              hoursPerShift: Number(formData.hoursPerShift),
              shiftType: formData.shiftType
            }
        await updateEmployee(editingEmployee, updates)
        
        // Get the updated employee info
        const updatedEmployee = { ...employees.find(emp => emp.id === editingEmployee), ...updates }
        
        // Update employees state
        setEmployees(employees.map(emp => 
          emp.id === editingEmployee 
            ? updatedEmployee
          : emp
      ))

        // Recalculate all existing payroll records for this employee
        const employeeRecords = timeRecords.filter(record => record.employeeId === editingEmployee)
        
        if (employeeRecords.length > 0) {
          const updatedRecords = employeeRecords.map(record => {
            // Recalculate earnings using the new rate/shift
            const recalculatedEarnings = recalculateRecordEarnings(record, updatedEmployee)
            return {
              ...record,
              ...recalculatedEarnings
            }
          })

          // Update all records in database
          await Promise.all(
            updatedRecords.map(record => updateTimeRecord(record.id, record))
          )

          // Update timeRecords state
          setTimeRecords(timeRecords.map(record => {
            const updatedRecord = updatedRecords.find(r => r.id === record.id)
            return updatedRecord || record
          }))

          showSuccess(
            'Employee Updated!', 
            `Employee information and ${employeeRecords.length} payroll record(s) have been updated with new rate.`,
            [
              { label: 'New Rate', value: formatPeso(updates.ratePer9Hours) },
              { label: 'Records Updated', value: `${employeeRecords.length}` }
            ]
          )
        } else {
          showSuccess('Employee Updated!', 'Employee information has been updated.', [])
        }

        setFormData({ name: '', email: '', phone: '', photo: '', ratePer9Hours: 0, hoursPerShift: 9, shiftType: 'first' })
        setShowAddModal(false)
        setEditingEmployee(null)
      } catch (error) {
        console.error('Error updating employee:', error)
        showSuccess('Error', 'Failed to update employee. Please try again.', [])
      }
    }
  }

  // Helper function to recalculate a single payroll record's earnings
  const recalculateRecordEarnings = (record, employee) => {
    // Calculate hours from time entries
    let totalRegularHours = 0
    let totalOvertimeHours = 0
    let lateMinutes = 0
    
    Object.entries(record.timeEntries).forEach(([day, dayEntry]) => {
      // Calculate day hours (regular and overtime)
      const dayHours = calculateDayHoursForRecord(dayEntry, employee)
      totalRegularHours += dayHours.regularHours
      totalOvertimeHours += dayHours.overtimeHours
      
      // Calculate late minutes
      if (employee.shiftType === 'first' && dayEntry.firstShiftIn) {
        const [hours, minutes] = dayEntry.firstShiftIn.split(':').map(Number)
        const shiftInMinutes = hours * 60 + minutes
        const expectedShiftStart = 7 * 60 // 7:00 AM
        if (shiftInMinutes > expectedShiftStart) {
          lateMinutes += shiftInMinutes - expectedShiftStart
        }
      } else if (employee.shiftType === 'second' && dayEntry.secondShiftIn) {
        const [hours, minutes] = dayEntry.secondShiftIn.split(':').map(Number)
        const shiftInMinutes = hours * 60 + minutes
        const expectedShiftStart = 18 * 60 // 6:00 PM
        if (shiftInMinutes > expectedShiftStart) {
          lateMinutes += shiftInMinutes - expectedShiftStart
        }
      }
    })
    
    // Add day off hours if any (from the original record)
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const dayOffHours = getEmployeeDayOffHoursForPeriod(employee.id, record.month, record.year, record.payPeriod)
    totalRegularHours += dayOffHours
    
    const totalHours = totalRegularHours + totalOvertimeHours
    const hourlyRate = employee.ratePer9Hours / employee.hoursPerShift
    const regularPay = totalRegularHours * hourlyRate
    const overtimePay = totalOvertimeHours * hourlyRate
    const grossPay = regularPay + overtimePay
    
    // Commissions (keep original values)
    const rushTarpCommission = (record.rushTarpCount || 0) * rushTarpCommissionRate
    const regularCommission = (record.regularCommissionCount || 0) * regularCommissionRate
    
    // Calculate custom commissions
    let customCommissionsTotal = 0
    if (record.customCommissionCounts) {
      Object.keys(record.customCommissionCounts).forEach(commId => {
        const commission = customCommissions.find(c => c.id === commId)
        if (commission) {
          customCommissionsTotal += record.customCommissionCounts[commId] * commission.rate
        }
      })
    }
    
    const totalCommissions = rushTarpCommission + regularCommission + customCommissionsTotal
    
    // Late deduction
    const lateDeduction = lateMinutes * lateDeductionRate
    
    // Deductions
    const cashAdvanceDeduction = Number(record.cashAdvance) || 0
    const totalDeductions = cashAdvanceDeduction + lateDeduction
    
    // Net Pay
    const netPay = grossPay + totalCommissions - totalDeductions
    
    return {
      regularPay: regularPay.toFixed(2),
      overtimePay: Math.abs(overtimePay).toFixed(2),
      grossPay: grossPay.toFixed(2),
      rushTarpCommission: rushTarpCommission.toFixed(2),
      regularCommission: regularCommission.toFixed(2),
      customCommissionsTotal: customCommissionsTotal.toFixed(2),
      totalCommissions: totalCommissions.toFixed(2),
      totalDeductions: totalDeductions.toFixed(2),
      netPay: netPay.toFixed(2),
      totalHours: Math.abs(totalHours).toFixed(2),
      regularHours: Math.abs(totalRegularHours).toFixed(2),
      totalOvertimeHours: Math.abs(totalOvertimeHours).toFixed(2),
      lateMinutes: lateMinutes,
      lateDeduction: lateDeduction.toFixed(2)
    }
  }

  // Helper function to calculate hours for a day entry (similar to calculateDayHours but for records)
  const calculateDayHoursForRecord = (dayEntry, employee) => {
    let regularHours = 0
    let overtimeHours = 0
    
    // First shift
    if (dayEntry.firstShiftIn && dayEntry.firstShiftOut) {
      const [inHours, inMinutes] = dayEntry.firstShiftIn.split(':').map(Number)
      const [outHours, outMinutes] = dayEntry.firstShiftOut.split(':').map(Number)
      
      let totalMinutes = (outHours * 60 + outMinutes) - (inHours * 60 + inMinutes)
      
      // Handle overnight shift
      if (totalMinutes < 0) {
        totalMinutes += 24 * 60
      }
      
      const hours = totalMinutes / 60
      
      if (hours > employee.hoursPerShift) {
        regularHours += employee.hoursPerShift
        overtimeHours += hours - employee.hoursPerShift
      } else {
        regularHours += hours
      }
    }
    
    // Second shift
    if (dayEntry.secondShiftIn && dayEntry.secondShiftOut) {
      const [inHours, inMinutes] = dayEntry.secondShiftIn.split(':').map(Number)
      const [outHours, outMinutes] = dayEntry.secondShiftOut.split(':').map(Number)
      
      let totalMinutes = (outHours * 60 + outMinutes) - (inHours * 60 + inMinutes)
      
      // Handle overnight shift
      if (totalMinutes < 0) {
        totalMinutes += 24 * 60
      }
      
      const hours = totalMinutes / 60
      
      if (regularHours + hours > employee.hoursPerShift) {
        const remainingRegularHours = employee.hoursPerShift - regularHours
        if (remainingRegularHours > 0) {
          regularHours += remainingRegularHours
          overtimeHours += hours - remainingRegularHours
        } else {
          overtimeHours += hours
        }
      } else {
        regularHours += hours
      }
    }
    
    // Overtime shift
    if (dayEntry.otTimeIn && dayEntry.otTimeOut) {
      const [inHours, inMinutes] = dayEntry.otTimeIn.split(':').map(Number)
      const [outHours, outMinutes] = dayEntry.otTimeOut.split(':').map(Number)
      
      let totalMinutes = (outHours * 60 + outMinutes) - (inHours * 60 + inMinutes)
      
      // Handle overnight shift
      if (totalMinutes < 0) {
        totalMinutes += 24 * 60
      }
      
      const hours = totalMinutes / 60
      overtimeHours += hours
    }
    
    return { regularHours, overtimeHours }
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

  // Generate and download barcode for employee
  const handleDownloadBarcode = (employee) => {
    const barcode = employee.barcode || (employee.id + 100000).toString()
    
    // Create main canvas for the final card
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    // Set canvas dimensions
    canvas.width = 500
    canvas.height = 300
    
    // Draw white background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Draw border
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 3
    ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30)
    
    // Draw inner border
    ctx.lineWidth = 1
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40)
    
    // Draw employee name
    ctx.fillStyle = '#000000'
    ctx.font = 'bold 28px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(employee.name.toUpperCase(), canvas.width / 2, 60)
    
    // Draw "TIME CLOCK BARCODE" label
    ctx.font = '16px Arial'
    ctx.fillStyle = '#666666'
    ctx.fillText('TIME CLOCK BARCODE', canvas.width / 2, 85)
    
    // Create a temporary canvas for the barcode
    const barcodeCanvas = document.createElement('canvas')
    
    try {
      // Generate barcode using JsBarcode (CODE128 format - widely supported)
      JsBarcode(barcodeCanvas, barcode, {
        format: 'CODE128',
        width: 3,
        height: 100,
        displayValue: true,
        fontSize: 20,
        margin: 10,
        background: '#ffffff',
        lineColor: '#000000'
      })
      
      // Draw the barcode onto main canvas
      const barcodeX = (canvas.width - barcodeCanvas.width) / 2
      const barcodeY = 105
      ctx.drawImage(barcodeCanvas, barcodeX, barcodeY)
      
    } catch (error) {
      console.error('Error generating barcode:', error)
      // Fallback: Draw text if barcode generation fails
      ctx.font = 'bold 48px Courier New'
      ctx.fillStyle = '#000000'
      ctx.fillText(barcode, canvas.width / 2, 180)
    }
    
    // Draw footer instructions
    ctx.font = '14px Arial'
    ctx.fillStyle = '#666666'
    ctx.fillText('Scan this card at the time clock to clock in/out', canvas.width / 2, 250)
    
    // Draw barcode number at bottom
    ctx.font = 'bold 12px Courier New'
    ctx.fillStyle = '#000000'
    ctx.fillText(`ID: ${barcode}`, canvas.width / 2, 275)
    
    // Convert to blob and download
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${employee.name.replace(/\s+/g, '_')}_TimeClockBarcode.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    })
    
    showSuccess('Barcode Downloaded', `Time clock barcode for ${employee.name} has been downloaded`, [])
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
    
    // Calculate OT hours - Handle overnight OT (crosses midnight)
    if (dayEntry.otTimeIn && dayEntry.otTimeOut) {
      const otIn = new Date(`2000-01-01T${dayEntry.otTimeIn}`)
      let otOut = new Date(`2000-01-01T${dayEntry.otTimeOut}`)
      
      // If OT ends before it starts, it means it crosses midnight (e.g. 22:40 to 03:10)
      if (otOut < otIn) {
        otOut = new Date(`2000-01-02T${dayEntry.otTimeOut}`)
      }
      
      overtimeHours += (otOut - otIn) / (1000 * 60 * 60)
    }
    
    return { regularHours, overtimeHours }
  }

  // Determine row status for time entry
  const getRowStatus = (day, entry) => {
    if (!selectedEmployee) return ''
    
    // Debug: Log day off records for this employee
    if (day === 1) { // Only log once per render
      const employeeDayOffs = dayOffRecords.filter(r => {
        const empId = r.employeeId || r.employee_id
        return empId === selectedEmployee.id
      })
      console.log('Day Off Records for employee:', selectedEmployee.name, employeeDayOffs)
      console.log('Selected Month/Year:', selectedMonth, selectedYear)
    }
    
    // Check if this day has a day off record
    const dayOffRecord = dayOffRecords.find(record => {
      const recordDate = new Date(record.date)
      const recordDay = recordDate.getDate()
      const recordMonth = recordDate.getMonth()
      const recordYear = recordDate.getFullYear()
      
      // Handle both camelCase and snake_case property names
      const recordEmployeeId = record.employeeId || record.employee_id
      
      const matches = (
        recordEmployeeId === selectedEmployee.id &&
        recordDay === day &&
        recordMonth === selectedMonth &&
        recordYear === selectedYear
      )
      
      // Debug logging
      if (matches) {
        console.log('Day Off Match Found:', {
          recordDate: record.date,
          day,
          selectedMonth,
          selectedYear,
          employeeId: selectedEmployee.id
        })
      }
      
      return matches
    })
    
    if (dayOffRecord) {
      console.log('Returning dayoff status for day:', day)
      return 'row-status-dayoff'
    }
    
    // Check for morning/first shift
    const hasMorningIn = !!(entry.firstShiftIn && entry.firstShiftIn.trim())
    const hasMorningOut = !!(entry.firstShiftOut && entry.firstShiftOut.trim())
    const hasMorning = hasMorningIn && hasMorningOut
    
    // Check for afternoon/second shift
    const hasAfternoonIn = !!(entry.secondShiftIn && entry.secondShiftIn.trim())
    const hasAfternoonOut = !!(entry.secondShiftOut && entry.secondShiftOut.trim())
    const hasAfternoon = hasAfternoonIn && hasAfternoonOut
    
    // Check if any field has data
    const hasAnyData = hasMorningIn || hasMorningOut || hasAfternoonIn || hasAfternoonOut || 
                       !!(entry.otTimeIn && entry.otTimeIn.trim()) || 
                       !!(entry.otTimeOut && entry.otTimeOut.trim())
    
    // If no data at all, check if it's a skipped day (BETWEEN two days with data)
    if (!hasAnyData) {
      const currentDay = day
      let hasDataBefore = false
      let hasDataAfter = false
      
      // Check if there's any data in previous or future days
      Object.keys(timeEntries).forEach(d => {
        const dayNum = Number(d)
        const prevEntry = timeEntries[dayNum]
        const hasEntryData = !!(prevEntry.firstShiftIn || prevEntry.firstShiftOut || 
            prevEntry.secondShiftIn || prevEntry.secondShiftOut ||
            prevEntry.otTimeIn || prevEntry.otTimeOut)
        
        if (dayNum < currentDay && hasEntryData) {
          hasDataBefore = true
        }
        if (dayNum > currentDay && hasEntryData) {
          hasDataAfter = true
        }
      })
      
      // Mark as absent ONLY if there's data BOTH before AND after (it's between two entries)
      if (hasDataBefore && hasDataAfter) {
        return 'row-status-absent'
      }
      
      return '' // No status if no data yet
    }
    
    // Check for errors (incomplete pairs)
    const morningIncomplete = (hasMorningIn && !hasMorningOut) || (!hasMorningIn && hasMorningOut)
    const afternoonIncomplete = (hasAfternoonIn && !hasAfternoonOut) || (!hasAfternoonIn && hasAfternoonOut)
    
    if (morningIncomplete || afternoonIncomplete) {
      return 'row-status-error'
    }
    
    // GREEN: Both morning and afternoon complete
    if (hasMorning && hasAfternoon) {
      return 'row-status-complete'
    }
    
    // YELLOW: Only morning OR afternoon complete
    if (hasMorning || hasAfternoon) {
      return 'row-status-partial'
    }
    
    return ''
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
      overtimePay: Math.abs(overtimePay).toFixed(2),
      grossPay: grossPay.toFixed(2),
      rushTarpCommission: rushTarpCommission.toFixed(2),
      regularCommission: regularCommission.toFixed(2),
      customCommissionsTotal: customCommissionsTotal.toFixed(2),
      totalCommissions: totalCommissions.toFixed(2),
      totalDeductions: totalDeductions.toFixed(2),
      netPay: netPay.toFixed(2),
      totalHours: Math.abs(totalHours).toFixed(2),
      regularHours: Math.abs(totalRegularHours).toFixed(2),
      totalOvertimeHours: Math.abs(totalOvertimeHours).toFixed(2),
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
    const fieldOrder = ['firstShiftIn', 'firstShiftOut', 'secondShiftIn', 'secondShiftOut', 'otTimeIn', 'otTimeOut']
    const currentFieldIndex = fieldOrder.indexOf(field)
    const days = Object.keys(timeEntries).map(Number).sort((a, b) => a - b)
    const currentDayIndex = days.indexOf(day)
    
    // Handle Enter key - format and move to next field
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
    
    // Handle Arrow Right - move to next field
    if (e.key === 'ArrowRight' && e.target.selectionStart === e.target.value.length) {
      e.preventDefault()
      if (currentFieldIndex < fieldOrder.length - 1) {
        const nextField = fieldOrder[currentFieldIndex + 1]
        const nextInput = document.querySelector(`input[data-day="${day}"][data-field="${nextField}"]`)
        if (nextInput) {
          nextInput.focus()
          nextInput.select()
        }
      } else if (currentDayIndex < days.length - 1) {
        const nextDay = days[currentDayIndex + 1]
        const nextInput = document.querySelector(`input[data-day="${nextDay}"][data-field="firstShiftIn"]`)
        if (nextInput) {
          nextInput.focus()
          nextInput.select()
        }
      }
    }
    
    // Handle Arrow Left - move to previous field
    if (e.key === 'ArrowLeft' && e.target.selectionStart === 0) {
      e.preventDefault()
      if (currentFieldIndex > 0) {
        const prevField = fieldOrder[currentFieldIndex - 1]
        const prevInput = document.querySelector(`input[data-day="${day}"][data-field="${prevField}"]`)
        if (prevInput) {
          prevInput.focus()
          prevInput.select()
        }
      } else if (currentDayIndex > 0) {
        const prevDay = days[currentDayIndex - 1]
        const prevInput = document.querySelector(`input[data-day="${prevDay}"][data-field="otTimeOut"]`)
        if (prevInput) {
          prevInput.focus()
          prevInput.select()
        }
      }
    }
    
    // Handle Arrow Down - move to same field in next day
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (currentDayIndex < days.length - 1) {
        const nextDay = days[currentDayIndex + 1]
        const nextInput = document.querySelector(`input[data-day="${nextDay}"][data-field="${field}"]`)
        if (nextInput) {
          nextInput.focus()
          nextInput.select()
        }
      }
    }
    
    // Handle Arrow Up - move to same field in previous day
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (currentDayIndex > 0) {
        const prevDay = days[currentDayIndex - 1]
        const prevInput = document.querySelector(`input[data-day="${prevDay}"][data-field="${field}"]`)
        if (prevInput) {
          prevInput.focus()
          prevInput.select()
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
        <title>Payroll Slips - IRONWOLF DIGITAL PRINTING</title>
        <style>
          @page {
            size: portrait;
            margin: 0.3in;
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
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 0;
            margin: 0;
            background: white;
          }
          
          .slip {
            background: white;
            border: 3px solid #000;
            margin-bottom: 12px;
            page-break-inside: avoid;
            height: 3.4in;
            overflow: hidden;
          }
          
          /* Header Section */
          .slip-header {
            background: #000;
            color: white;
            padding: 12px 16px;
            text-align: center;
            border-bottom: 3px solid #000;
          }
          
          .company-name {
            font-size: 16px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin: 0 0 5px 0;
          }
          
          .slip-title {
            font-size: 11px;
            margin: 0 0 6px 0;
            letter-spacing: 3px;
            font-weight: 700;
            border-top: 2px solid #fff;
            border-bottom: 2px solid #fff;
            padding: 5px 0;
          }
          
          .period-info {
            font-size: 9px;
            margin: 0;
            font-weight: 600;
            letter-spacing: 1px;
          }
          
          /* Body Section */
          .slip-body {
            padding: 12px 16px;
          }
          
          /* Employee Section */
          .employee-section {
            background: #f8f8f8;
            border: 2px solid #000;
            border-radius: 4px;
            padding: 10px;
            margin-bottom: 10px;
            text-align: center;
          }
          
          .employee-label {
            font-size: 8px;
            text-transform: uppercase;
            font-weight: 700;
            color: #666;
            letter-spacing: 1px;
            margin-bottom: 4px;
          }
          
          .employee-name {
            font-size: 16px;
            font-weight: 900;
            color: #000;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          /* Time Summary Grid */
          .time-summary {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 6px;
            margin-bottom: 10px;
            padding: 8px;
            background: #f8f8f8;
            border: 2px solid #ddd;
            border-radius: 4px;
          }
          
          .time-box {
            text-align: center;
            padding: 6px 4px;
            background: white;
            border: 1px solid #ccc;
            border-radius: 3px;
          }
          
          .time-label {
            font-size: 7px;
            text-transform: uppercase;
            font-weight: 700;
            color: #666;
            letter-spacing: 0.5px;
            margin-bottom: 3px;
          }
          
          .time-value {
            font-size: 12px;
            font-weight: 900;
            color: #000;
            font-family: 'Courier New', monospace;
          }
          
          /* Earnings and Deductions Container */
          .pay-section {
            margin-bottom: 8px;
          }
          
          .section-title {
            background: #000;
            color: white;
            padding: 5px 10px;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 6px;
          }
          
          .pay-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 6px;
          }
          
          .pay-table tr {
            border-bottom: 1px solid #ddd;
          }
          
          .pay-table tr:last-child {
            border-bottom: none;
          }
          
          .pay-table td {
            padding: 4px 6px;
            font-size: 9px;
          }
          
          .pay-table td:first-child {
            color: #555;
            font-weight: 500;
          }
          
          .pay-table td:last-child {
            text-align: right;
            font-weight: 700;
            color: #000;
            font-family: 'Courier New', monospace;
          }
          
          /* Subtotal Row */
          .subtotal-row {
            background: #f0f0f0;
            border: 2px solid #000;
            padding: 7px 10px;
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          
          .subtotal-label {
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            color: #000;
            letter-spacing: 0.5px;
          }
          
          .subtotal-value {
            font-size: 11px;
            font-weight: 900;
            color: #000;
            font-family: 'Courier New', monospace;
          }
          
          /* Net Pay Section */
          .net-pay-section {
            background: #000;
            color: white;
            padding: 10px 12px;
            text-align: center;
            border: 3px solid #000;
            margin-top: 10px;
          }
          
          .net-pay-label {
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          
          .net-pay-amount {
            font-size: 20px;
            font-weight: 900;
            font-family: 'Courier New', monospace;
            letter-spacing: 1px;
          }
          
          /* Cash Advance Warning */
          .cash-advance-warning {
            background: #fff3cd;
            border: 2px solid #ffc107;
            padding: 6px 10px;
            margin-top: 8px;
            text-align: center;
            border-radius: 4px;
          }
          
          .warning-label {
            font-size: 7px;
            font-weight: 700;
            text-transform: uppercase;
            color: #856404;
            letter-spacing: 1px;
            margin-bottom: 3px;
          }
          
          .warning-value {
            font-size: 14px;
            font-weight: 900;
            color: #856404;
            font-family: 'Courier New', monospace;
          }
          
          /* Footer */
          .slip-footer {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: #f8f8f8;
            border-top: 2px solid #ddd;
            padding: 6px;
            text-align: center;
            font-size: 7px;
            color: #666;
          }
        </style>
      </head>
      <body>
        ${timeRecords.map(record => {
          const cashAdvanceBalance = getEmployeeCashAdvanceBalance(record.employeeId)
          return `
          <div class="slip">
            <!-- Header -->
            <div class="slip-header">
              <div class="company-name">IRONWOLF DIGITAL PRINTING</div>
              <div class="slip-title">PAY SLIP</div>
              <div class="period-info">${record.month} ${record.year} | Pay Period: ${record.payPeriod}</div>
            </div>
            
            <!-- Body -->
            <div class="slip-body">
              <!-- Employee Name -->
              <div class="employee-section">
                <div class="employee-label">Employee</div>
                <div class="employee-name">${record.employeeName}</div>
              </div>
              
              <!-- Time Summary -->
              <div class="time-summary">
                <div class="time-box">
                  <div class="time-label">Regular</div>
                  <div class="time-value">${parseFloat(record.regularHours).toFixed(1)}</div>
                </div>
                <div class="time-box">
                  <div class="time-label">Overtime</div>
                  <div class="time-value">${Math.abs(parseFloat(record.totalOvertimeHours)).toFixed(1)}</div>
                </div>
                <div class="time-box">
                  <div class="time-label">Late (min)</div>
                  <div class="time-value">${record.lateMinutes}</div>
                </div>
                <div class="time-box">
                  <div class="time-label">Total Hrs</div>
                  <div class="time-value">${(parseFloat(record.regularHours) + Math.abs(parseFloat(record.totalOvertimeHours))).toFixed(1)}</div>
                </div>
              </div>
              
              <!-- Earnings -->
              <div class="pay-section">
                <div class="section-title">EARNINGS</div>
                <table class="pay-table">
                  <tr>
                    <td>Regular Pay</td>
                    <td>₱${parseFloat(record.regularPay).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td>Overtime Pay</td>
                    <td>₱${Math.abs(parseFloat(record.overtimePay)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td>Rush Tarp Commission</td>
                    <td>₱${parseFloat(record.rushTarpCommission).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td>Regular Commission</td>
                    <td>₱${parseFloat(record.regularCommission).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                </table>
                <div class="subtotal-row">
                  <span class="subtotal-label">Gross Pay</span>
                  <span class="subtotal-value">₱${(parseFloat(record.grossPay) + parseFloat(record.totalCommissions)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
              
              <!-- Deductions -->
              <div class="pay-section">
                <div class="section-title">DEDUCTIONS</div>
                <table class="pay-table">
                  <tr>
                    <td>Cash Advance</td>
                    <td>₱${parseFloat(record.cashAdvance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td>Late Deduction</td>
                    <td>₱${parseFloat(record.lateDeduction).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                </table>
                <div class="subtotal-row">
                  <span class="subtotal-label">Total Deductions</span>
                  <span class="subtotal-value">₱${parseFloat(record.totalDeductions).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
              
              <!-- Net Pay -->
              <div class="net-pay-section">
                <div class="net-pay-label">NET PAY</div>
                <div class="net-pay-amount">₱${parseFloat(record.netPay).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              
              <!-- Cash Advance Balance -->
              ${cashAdvanceBalance > 0 ? `
                <div class="cash-advance-warning">
                  <div class="warning-label">⚠ Outstanding Cash Advance Balance</div>
                  <div class="warning-value">₱${cashAdvanceBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
              ` : ''}
            </div>
            
            <!-- Footer -->
            <div class="slip-footer">
              IRONWOLF DIGITAL PRINTING • This is a computer-generated document • Confidential
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
            size: portrait;
            margin: 0.4in 0.3in;
          }
          @media print {
            body { 
              margin: 0; 
              padding: 0; 
            }
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: white;
            color: #000;
          }
          
          .document-container {
            padding: 10px 15px;
            background: white;
          }
          
          /* Header Section */
          .document-header {
            border-bottom: 3px solid #000;
            padding-bottom: 8px;
            margin-bottom: 10px;
          }
          
          .company-info {
            text-align: center;
            margin-bottom: 6px;
          }
          
          .company-name {
            font-size: 22px;
            font-weight: 900;
            margin: 0 0 3px 0;
            color: #000;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          
          .company-tagline {
            font-size: 10px;
            color: #666;
            margin: 0;
            font-style: italic;
          }
          
          .document-title {
            background: linear-gradient(135deg, #1a1a1a 0%, #000 100%);
            color: #fff;
            padding: 8px 12px;
            text-align: center;
            margin: 8px 0;
            border-radius: 3px;
          }
          
          .document-title h1 {
            margin: 0;
            font-size: 16px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.5px;
          }
          
          .report-info {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            font-size: 9px;
            color: #333;
          }
          
          .report-info-item {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          
          .report-info-label {
            font-weight: 600;
            color: #000;
            text-transform: uppercase;
            font-size: 9px;
            letter-spacing: 0.3px;
          }
          
          .report-info-value {
            font-size: 10px;
            font-weight: 700;
          }
          
          /* Table Styles */
          .payroll-table {
            width: 100%;
            border-collapse: collapse;
            margin: 8px 0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          
          .payroll-table thead tr {
            background: linear-gradient(135deg, #1a1a1a 0%, #000 100%);
            color: white;
          }
          
          .payroll-table th {
            padding: 10px 8px;
            text-align: left;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border: 1px solid #333;
          }
          
          .payroll-table th.numeric {
            text-align: right;
          }
          
          .payroll-table tbody tr {
            border-bottom: 1px solid #e0e0e0;
          }
          
          .payroll-table tbody tr:nth-child(odd) {
            background: #f9f9f9;
          }
          
          .payroll-table tbody tr:hover {
            background: #f0f0f0;
          }
          
          .payroll-table td {
            padding: 10px 8px;
            font-size: 11px;
            border: 1px solid #ddd;
            color: #000;
            line-height: 1.4;
          }
          
          .payroll-table td.numeric {
            text-align: right;
            font-weight: 600;
            font-family: 'Courier New', monospace;
          }
          
          .employee-name {
            font-weight: 700;
            color: #000;
            font-size: 12px;
          }
          
          /* Total Row */
          .total-row {
            background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
            border-top: 2px solid #000 !important;
            border-bottom: 2px solid #000 !important;
          }
          
          .total-row td {
            font-weight: 700;
            font-size: 12px;
            padding: 12px 8px;
            color: #000;
            border-color: #999;
          }
          
          .total-label {
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-size: 12px;
            font-weight: 900;
          }
          
          .total-row td.numeric {
            font-size: 11px;
            font-weight: 900;
          }
          
          /* Summary Section */
          .summary-section {
            margin-top: 12px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            padding: 10px;
            background: #f8f8f8;
            border: 1px solid #ddd;
            border-radius: 4px;
          }
          
          .summary-item {
            text-align: center;
            padding: 10px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 3px;
          }
          
          .summary-label {
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #666;
            font-weight: 600;
            margin-bottom: 5px;
          }
          
          .summary-value {
            font-size: 14px;
            font-weight: 900;
            color: #000;
            font-family: 'Courier New', monospace;
          }
          
          /* Footer Section */
          .document-footer {
            margin-top: 12px;
            padding-top: 8px;
            border-top: 1px solid #ddd;
          }
          
          .signatures {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-top: 15px;
          }
          
          .signature-line {
            text-align: center;
          }
          
          .signature-space {
            border-top: 2px solid #000;
            margin-bottom: 5px;
            padding-top: 30px;
          }
          
          .signature-label {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            color: #000;
            letter-spacing: 0.5px;
          }
          
          .signature-role {
            font-size: 9px;
            color: #666;
            font-style: italic;
            margin-top: 3px;
          }
          
          .print-date {
            text-align: center;
            margin-top: 10px;
            font-size: 8px;
            color: #999;
          }
        </style>
      </head>
      <body>
        <div class="document-container">
          <!-- Header -->
          <div class="document-header">
            <div class="company-info">
              <h1 class="company-name">IRONWOLF DIGITAL PRINTING</h1>
              <p class="company-tagline">Payroll Management System</p>
            </div>
            
            <div class="document-title">
              <h1>Payroll Records Report</h1>
            </div>
            
            <div class="report-info">
              <div class="report-info-item">
                <span class="report-info-label">Report Date</span>
                <span class="report-info-value">${new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              <div class="report-info-item">
                <span class="report-info-label">Total Records</span>
                <span class="report-info-value">${timeRecords.length} Employees</span>
              </div>
              <div class="report-info-item">
                <span class="report-info-label">Status</span>
                <span class="report-info-value">Official Document</span>
              </div>
            </div>
          </div>
          
          <!-- Payroll Table -->
          <table class="payroll-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th class="numeric">Hours</th>
                <th class="numeric">Regular Pay</th>
                <th class="numeric">Overtime</th>
                <th class="numeric">Gross Pay</th>
                <th class="numeric">Commissions</th>
                <th class="numeric">Deductions</th>
                <th class="numeric">Net Pay</th>
              </tr>
            </thead>
            <tbody>
              ${timeRecords.map(record => `
                <tr>
                  <td class="employee-name">${record.employeeName}</td>
                  <td class="numeric">${record.totalHours}</td>
                  <td class="numeric">₱${Number(record.regularPay).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td class="numeric">₱${Number(record.overtimePay).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td class="numeric">₱${Number(record.grossPay).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td class="numeric">₱${Number(record.totalCommissions).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td class="numeric">₱${Number(record.totalDeductions).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td class="numeric">₱${Number(record.netPay).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td class="total-label">GRAND TOTALS</td>
                <td class="numeric">${timeRecords.reduce((sum, r) => sum + Number(r.totalHours), 0).toFixed(1)}</td>
                <td class="numeric">₱${timeRecords.reduce((sum, r) => sum + Number(r.regularPay), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="numeric">₱${timeRecords.reduce((sum, r) => sum + Number(r.overtimePay), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="numeric">₱${timeRecords.reduce((sum, r) => sum + Number(r.grossPay), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="numeric">₱${timeRecords.reduce((sum, r) => sum + Number(r.totalCommissions), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="numeric">₱${timeRecords.reduce((sum, r) => sum + Number(r.totalDeductions), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="numeric">₱${timeRecords.reduce((sum, r) => sum + Number(r.netPay), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
          
          <!-- Summary Section -->
          <div class="summary-section">
            <div class="summary-item">
              <div class="summary-label">Total Gross Pay</div>
              <div class="summary-value">₱${timeRecords.reduce((sum, r) => sum + Number(r.grossPay), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total Deductions</div>
              <div class="summary-value">₱${timeRecords.reduce((sum, r) => sum + Number(r.totalDeductions), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total Net Pay</div>
              <div class="summary-value">₱${timeRecords.reduce((sum, r) => sum + Number(r.netPay), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </div>
          
          <!-- Footer with Signatures -->
          <div class="document-footer">
            <div class="signatures">
              <div class="signature-line">
                <div class="signature-space"></div>
                <div class="signature-label">ASMAR C. AHIL</div>
                <div class="signature-role">HR Department / Co-Owner</div>
              </div>
              <div class="signature-line">
                <div class="signature-space"></div>
                <div class="signature-label">JEFFREY AHIL</div>
                <div class="signature-role">Finance Officer</div>
              </div>
              <div class="signature-line">
                <div class="signature-space"></div>
                <div class="signature-label">JEFFREY AHIL</div>
                <div class="signature-role">General Manager</div>
              </div>
            </div>
            <div class="print-date">
              Generated by Salary Counter System • ${new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
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
              <td>Overtime Hours (${Math.abs(parseFloat(record.totalOvertimeHours))} hrs)</td>
              <td style="text-align: right;">${formatPeso(Math.abs(parseFloat(record.overtimePay)))}</td>
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
            <div className="selected-employee-section">
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
              <button className="save-payroll-btn" onClick={handleSaveTimeEntry}>
                <Save size={20} />
                Save to Payroll
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
                        const rowStatus = getRowStatus(dayNum, entry)
                        
                        return (
                          <tr key={day} className={rowStatus}>
                            <td className="day-cell">{day}</td>
                            <td>
                              <input
                                type="text"
                                value={entry.firstShiftIn || ''}
                                onChange={(e) => handleTimeInputChange(dayNum, 'firstShiftIn', e.target.value)}
                                onKeyDown={(e) => handleTimeInputKeyPress(e, dayNum, 'firstShiftIn')}
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
                                onKeyDown={(e) => handleTimeInputKeyPress(e, dayNum, 'firstShiftOut')}
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
                                onKeyDown={(e) => handleTimeInputKeyPress(e, dayNum, 'secondShiftIn')}
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
                                onKeyDown={(e) => handleTimeInputKeyPress(e, dayNum, 'secondShiftOut')}
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
                                onKeyDown={(e) => handleTimeInputKeyPress(e, dayNum, 'otTimeIn')}
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
                                onKeyDown={(e) => handleTimeInputKeyPress(e, dayNum, 'otTimeOut')}
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
                            <span>Regular Pay ({calculateTotalEarnings().regularHours} hrs)</span>
                            <strong>{formatPeso(calculateTotalEarnings().regularPay)}</strong>
                          </div>
                          <div className="summary-row">
                            <span>Overtime Pay ({calculateTotalEarnings().totalOvertimeHours} hrs)</span>
                            <strong>{formatPeso(calculateTotalEarnings().overtimePay)}</strong>
                          </div>
                          <div className="summary-row highlight">
                            <span>Gross Pay</span>
                            <strong>{formatPeso(calculateTotalEarnings().grossPay)}</strong>
                          </div>
                        </div>

                        <div className="summary-section">
                          <div className="section-title">Commissions</div>
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
              <div className="header-content">
                <div className="header-icon-wrapper">
                  <Calendar size={22} />
                </div>
                <div>
                  <h1>Payroll Timeline History</h1>
                  <p className="subtitle">View payroll records by period</p>
                </div>
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
          <div className="header-content">
            <div className="header-icon-wrapper">
              <Wallet size={22} />
            </div>
            <div>
              <h1>Payroll Records</h1>
              <p className="subtitle">View all saved payroll records</p>
            </div>
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
            {/* Redesigned Summary Cards */}
            <div className="payroll-summary-grid">
              <div className="payroll-summary-card primary-card">
                <div className="summary-card-header">
                  <div className="summary-card-icon">
                    <User size={20} />
                  </div>
                  <span className="summary-card-label">Total Records</span>
                </div>
                <div className="summary-card-value">{timeRecords.length}</div>
                <div className="summary-card-footer">Active payroll entries</div>
              </div>

              <div className="payroll-summary-card">
                <div className="summary-card-header">
                  <div className="summary-card-icon">
                    <Clock size={20} />
                  </div>
                  <span className="summary-card-label">Total Hours</span>
                </div>
                <div className="summary-card-value">{timeRecords.reduce((sum, r) => sum + Number(r.totalHours), 0).toFixed(1)}</div>
                <div className="summary-card-footer">Combined work hours</div>
              </div>

              <div className="payroll-summary-card">
                <div className="summary-card-header">
                  <div className="summary-card-icon">
                    <DollarSign size={20} />
                  </div>
                  <span className="summary-card-label">Gross Pay</span>
                </div>
                <div className="summary-card-value">{formatPeso(timeRecords.reduce((sum, r) => sum + Number(r.grossPay), 0))}</div>
                <div className="summary-card-footer">Before deductions</div>
              </div>

              <div className="payroll-summary-card highlight-card">
                <div className="summary-card-header">
                  <div className="summary-card-icon">
                    <TrendingUp size={20} />
                  </div>
                  <span className="summary-card-label">Net Pay</span>
                </div>
                <div className="summary-card-value">{formatPeso(timeRecords.reduce((sum, r) => sum + Number(r.netPay), 0))}</div>
                <div className="summary-card-footer">Total payout amount</div>
              </div>
            </div>

            {/* Redesigned Compact Table */}
            <div className="payroll-records-section">
              <h2>All Payroll Records</h2>
              <div className="payroll-table-container">
                <table className="payroll-table compact-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Period</th>
                      <th>Hours</th>
                      <th>Gross</th>
                      <th>Net Pay</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timeRecords.map(record => (
                      <tr key={record.id}>
                        <td className="employee-name-cell">
                          <div className="employee-cell-content">
                            <div className="employee-avatar-tiny">
                              <User size={14} />
                            </div>
                            <div className="employee-cell-info">
                              <span className="employee-name">{record.employeeName}</span>
                              <span className="employee-meta">{record.month} {record.year}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="period-badge">Days {record.payPeriod}</span>
                        </td>
                        <td>
                          <div className="hours-cell">
                            <span className="hours-value">{record.totalHours}</span>
                            <span className="hours-label">hrs</span>
                          </div>
                        </td>
                        <td>
                          <div className="pay-cell">
                            <span className="pay-value">{formatPeso(record.grossPay)}</span>
                            <span className="pay-breakdown">+{formatPeso(record.totalCommissions)} | -{formatPeso(record.totalDeductions)}</span>
                          </div>
                        </td>
                        <td className="net-pay-cell-compact">
                          <span className="net-pay-value">{formatPeso(record.netPay)}</span>
                        </td>
                        <td>
                          {record.processed ? (
                            <span className="status-badge-compact processed">Processed</span>
                          ) : (
                            <span className="status-badge-compact pending">Pending</span>
                          )}
                        </td>
                        <td>
                          <div className="action-buttons-compact">
                            <button 
                              className="icon-btn-compact view-btn"
                              onClick={() => setViewingPayrollRecord(record)}
                              title="View Details"
                            >
                              <FileText size={14} />
                            </button>
                            <button 
                              className="icon-btn-compact edit-btn"
                              onClick={() => handleEditRecord(record)}
                              title="Edit Record"
                              disabled={record.processed}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              className="icon-btn-compact delete-btn"
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
                              <Trash2 size={14} />
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

        {/* Payroll Detail View Modal - Remastered */}
        {viewingPayrollRecord && (
          <div className="modal-overlay" onClick={() => setViewingPayrollRecord(null)}>
            <div className="modal-content payroll-detail-modal-v2" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="payroll-modal-header-v2">
                <div className="payroll-modal-icon-v2">
                  <FileText size={24} />
                </div>
                <div className="payroll-modal-title-section-v2">
                  <h2>Payroll Statement</h2>
                  <p>{viewingPayrollRecord.month} {viewingPayrollRecord.year} • Days {viewingPayrollRecord.payPeriod}</p>
                </div>
                {viewingPayrollRecord.processed && (
                  <div className="processed-badge-v2">
                    <CheckCircle size={18} />
                    <span>Processed</span>
                  </div>
                )}
                <button className="payroll-modal-close-v2" onClick={() => setViewingPayrollRecord(null)}>
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="payroll-modal-body-v2">
                {/* Left Column */}
                <div className="payroll-left-column-v2">
                  {/* Employee Info Card */}
                  <div className="payroll-employee-card-v2">
                    <div className="payroll-employee-avatar-v2">
                      <User size={28} />
                    </div>
                    <div className="payroll-employee-info-v2">
                      <h3>{viewingPayrollRecord.employeeName}</h3>
                      <p>Employee #{viewingPayrollRecord.employeeId}</p>
                    </div>
                  </div>

                  {/* Net Pay Summary - Expanded */}
                  <div className="payroll-summary-card-v2">
                    <div className="payroll-summary-breakdown-v2">
                      {/* Earnings Section */}
                      <div className="payroll-breakdown-section-v2 expand">
                        <div className="breakdown-section-title-v2">Earnings</div>
                        <div className="summary-item-v2">
                          <span>Regular Pay</span>
                          <span>{formatPeso(viewingPayrollRecord.regularPay)}</span>
                        </div>
                        {viewingPayrollRecord.overtimePay > 0 && (
                          <div className="summary-item-v2">
                            <span>Overtime Pay</span>
                            <span>{formatPeso(viewingPayrollRecord.overtimePay)}</span>
                          </div>
                        )}
                        <div className="summary-item-v2">
                          <span>Gross Pay</span>
                          <span>{formatPeso(viewingPayrollRecord.grossPay)}</span>
                        </div>
                      </div>

                      {/* Commissions Section */}
                      {viewingPayrollRecord.totalCommissions > 0 && (
                        <div className="payroll-breakdown-section-v2 expand">
                          <div className="breakdown-section-title-v2">Commissions</div>
                          {viewingPayrollRecord.rushTarpCount > 0 && (
                            <div className="summary-item-v2 positive">
                              <span>Rush Tarp ({viewingPayrollRecord.rushTarpCount})</span>
                              <span>+{formatPeso(viewingPayrollRecord.rushTarpCommission)}</span>
                            </div>
                          )}
                          {viewingPayrollRecord.regularCommissionCount > 0 && (
                            <div className="summary-item-v2 positive">
                              <span>Regular ({viewingPayrollRecord.regularCommissionCount})</span>
                              <span>+{formatPeso(viewingPayrollRecord.regularCommission)}</span>
                            </div>
                          )}
                          {viewingPayrollRecord.customCommissionsTotal > 0 && (
                            <div className="summary-item-v2 positive">
                              <span>Custom</span>
                              <span>+{formatPeso(viewingPayrollRecord.customCommissionsTotal)}</span>
                            </div>
                          )}
                          <div className="summary-item-v2 positive">
                            <span>Total Commissions</span>
                            <span>+{formatPeso(viewingPayrollRecord.totalCommissions)}</span>
                          </div>
                        </div>
                      )}

                      {/* Deductions Section */}
                      {viewingPayrollRecord.totalDeductions > 0 && (
                        <div className="payroll-breakdown-section-v2 expand">
                          <div className="breakdown-section-title-v2">Deductions</div>
                          {viewingPayrollRecord.cashAdvance > 0 && (
                            <div className="summary-item-v2 negative">
                              <span>Cash Advance</span>
                              <span>-{formatPeso(viewingPayrollRecord.cashAdvance)}</span>
                            </div>
                          )}
                          {viewingPayrollRecord.lateDeduction > 0 && (
                            <div className="summary-item-v2 negative">
                              <span>Late ({viewingPayrollRecord.lateMinutes} min)</span>
                              <span>-{formatPeso(viewingPayrollRecord.lateDeduction)}</span>
                            </div>
                          )}
                          <div className="summary-item-v2 negative">
                            <span>Total Deductions</span>
                            <span>-{formatPeso(viewingPayrollRecord.totalDeductions)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Net Pay at Bottom */}
                    <div className="payroll-net-pay-v2">
                      <span className="net-pay-label-v2">NET PAY</span>
                      <span className="net-pay-amount-v2">{formatPeso(viewingPayrollRecord.netPay)}</span>
                    </div>
                  </div>
                </div>

                {/* Right Column - Main Grid */}
                <div className="payroll-grid-v2">
                  {/* First Row: Work Hours and Base Pay */}
                  <div className="payroll-grid-row-v2">
                    {/* Work Hours Section */}
                    <div className="payroll-card-v2">
                      <div className="payroll-card-header-v2">
                        <Clock size={16} />
                        <span>Work Hours</span>
                      </div>
                      <div className="payroll-card-content-v2">
                        <div className="payroll-stat-row-v2">
                          <span className="stat-label-v2">Regular Hours</span>
                          <span className="stat-value-v2">{viewingPayrollRecord.regularHours} hrs</span>
                        </div>
                        <div className="payroll-stat-row-v2">
                          <span className="stat-label-v2">Overtime Hours</span>
                          <span className="stat-value-v2">{viewingPayrollRecord.totalOvertimeHours} hrs</span>
                        </div>
                        <div className="payroll-stat-row-v2 highlight">
                          <span className="stat-label-v2">Total Hours</span>
                          <span className="stat-value-v2 bold">{viewingPayrollRecord.totalHours} hrs</span>
                        </div>
                      </div>
                    </div>

                    {/* Base Pay Section */}
                    <div className="payroll-card-v2">
                      <div className="payroll-card-header-v2">
                        <DollarSign size={16} />
                        <span>Base Pay</span>
                      </div>
                      <div className="payroll-card-content-v2">
                        <div className="payroll-stat-row-v2">
                          <span className="stat-label-v2">Regular Pay</span>
                          <span className="stat-value-v2">{formatPeso(viewingPayrollRecord.regularPay)}</span>
                        </div>
                        <div className="payroll-stat-row-v2">
                          <span className="stat-label-v2">Overtime Pay</span>
                          <span className="stat-value-v2">{formatPeso(viewingPayrollRecord.overtimePay)}</span>
                        </div>
                        <div className="payroll-stat-row-v2 highlight">
                          <span className="stat-label-v2">Gross Pay</span>
                          <span className="stat-value-v2 bold">{formatPeso(viewingPayrollRecord.grossPay)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Commission Breakdown Section */}
                  <div className="payroll-card-v2 expand-vertical">
                    <div className="payroll-card-header-v2">
                      <Award size={16} />
                      <span>Commission Breakdown</span>
                      {viewingPayrollRecord.totalCommissions > 0 && (
                        <span className="commission-total-badge-v2">
                          +{formatPeso(viewingPayrollRecord.totalCommissions)}
                        </span>
                      )}
                    </div>
                    <div className="payroll-card-content-v2 space-between">
                      {viewingPayrollRecord.totalCommissions === 0 ? (
                        <div className="no-commissions-v2">
                          <Info size={16} />
                          <span>No commissions earned this period</span>
                        </div>
                      ) : (
                        <>
                          {/* Rush Tarp Commission */}
                          {viewingPayrollRecord.rushTarpCount > 0 && (
                            <div className="commission-detail-row-v2">
                              <div className="commission-info-v2">
                                <div className="commission-badge-v2 rush">Rush Tarp</div>
                                <span className="commission-calc-v2">
                                  {viewingPayrollRecord.rushTarpCount} × {formatPeso(rushTarpCommissionRate)}
                                </span>
                              </div>
                              <span className="commission-amount-v2">
                                +{formatPeso(viewingPayrollRecord.rushTarpCommission)}
                              </span>
                            </div>
                          )}

                          {/* Regular Commission */}
                          {viewingPayrollRecord.regularCommissionCount > 0 && (
                            <div className="commission-detail-row-v2">
                              <div className="commission-info-v2">
                                <div className="commission-badge-v2 regular">Regular</div>
                                <span className="commission-calc-v2">
                                  {viewingPayrollRecord.regularCommissionCount} × {formatPeso(regularCommissionRate)}
                                </span>
                              </div>
                              <span className="commission-amount-v2">
                                +{formatPeso(viewingPayrollRecord.regularCommission)}
                              </span>
                            </div>
                          )}

                          {/* Custom Commissions */}
                          {viewingPayrollRecord.customCommissionCounts && 
                           Object.keys(viewingPayrollRecord.customCommissionCounts).map(commId => {
                              const count = viewingPayrollRecord.customCommissionCounts[commId]
                              if (count > 0) {
                                const commission = customCommissions.find(c => c.id === commId)
                                if (commission) {
                                  const amount = count * commission.rate
                                  return (
                                    <div key={commId} className="commission-detail-row-v2">
                                      <div className="commission-info-v2">
                                        <div className="commission-badge-v2 custom">{commission.name}</div>
                                        <span className="commission-calc-v2">
                                          {count} × {formatPeso(commission.rate)}
                                        </span>
                                      </div>
                                      <span className="commission-amount-v2">
                                        +{formatPeso(amount)}
                                      </span>
                                    </div>
                                  )
                                }
                              }
                              return null
                            })}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Deductions Section */}
                  <div className="payroll-card-v2 expand-vertical">
                    <div className="payroll-card-header-v2">
                      <TrendingDown size={16} />
                      <span>Deductions</span>
                      {viewingPayrollRecord.totalDeductions > 0 && (
                        <span className="deduction-total-badge-v2">
                          -{formatPeso(viewingPayrollRecord.totalDeductions)}
                        </span>
                      )}
                    </div>
                    <div className="payroll-card-content-v2 space-between">
                      {viewingPayrollRecord.totalDeductions === 0 ? (
                        <div className="no-deductions-v2">
                          <CheckCircle size={16} />
                          <span>No deductions this period</span>
                        </div>
                      ) : (
                        <>
                          {viewingPayrollRecord.cashAdvance > 0 && (
                            <div className="deduction-detail-row-v2">
                              <div className="deduction-info-v2">
                                <CreditCard size={16} />
                                <span>Cash Advance</span>
                              </div>
                              <span className="deduction-amount-v2">
                                -{formatPeso(viewingPayrollRecord.cashAdvance)}
                              </span>
                            </div>
                          )}
                          {viewingPayrollRecord.lateMinutes > 0 && (
                            <div className="deduction-detail-row-v2">
                              <div className="deduction-info-v2">
                                <Clock size={16} />
                                <span>Late Penalty ({viewingPayrollRecord.lateMinutes} minutes)</span>
                              </div>
                              <span className="deduction-amount-v2">
                                -{formatPeso(viewingPayrollRecord.lateDeduction)}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              {!viewingPayrollRecord.processed && (
                <div className="payroll-modal-footer-v2">
                  <button 
                    className="payroll-process-btn-v2"
                    onClick={() => {
                      handleProcessPayroll(viewingPayrollRecord)
                      setViewingPayrollRecord(null)
                    }}
                  >
                    <CheckCircle size={18} />
                    <span>Process Payroll</span>
                  </button>
                </div>
              )}
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
          <div className="header-content">
            <div className="header-icon-wrapper">
              <CreditCard size={22} />
            </div>
            <div>
              <h1>Cash Advance Timeline - {viewingCashAdvanceEmployee.name}</h1>
              <p className="subtitle">Complete cash advance history and payments</p>
            </div>
          </div>
        </div>

        <div className="cash-advance-timeline-container">
          {/* Employee Summary Card */}
          <div className="ca-employee-card">
            <div className="ca-card-left">
              <div className="ca-employee-avatar-large">
                {viewingCashAdvanceEmployee.photo ? (
                  <img src={viewingCashAdvanceEmployee.photo} alt={viewingCashAdvanceEmployee.name} />
                ) : (
                  <User size={56} />
                )}
              </div>
              <div className="ca-employee-info">
                <h2>{viewingCashAdvanceEmployee.name}</h2>
                <div className="ca-employee-meta">
                  <span className="ca-meta-item">
                    <Mail size={14} />
                    {viewingCashAdvanceEmployee.email || 'No email'}
                  </span>
                  <span className="ca-meta-item">
                    <Phone size={14} />
                    {viewingCashAdvanceEmployee.phone || 'No phone'}
                  </span>
                </div>
              </div>
            </div>
            <div className="ca-card-stats">
              {(() => {
                const employeeRecords = cashAdvanceRecords.filter(r => r.employeeId === viewingCashAdvanceEmployee.id)
                const totalAdvanced = employeeRecords.reduce((sum, r) => sum + r.amount, 0)
                const totalBalance = employeeRecords.reduce((sum, r) => sum + r.balance, 0)
                const totalPaid = totalAdvanced - totalBalance
                
                return (
                  <>
                    <div className="ca-stat-box">
                      <span className="ca-stat-label">Total Advanced</span>
                      <span className="ca-stat-value">{formatPeso(totalAdvanced)}</span>
                    </div>
                    <div className="ca-stat-box">
                      <span className="ca-stat-label">Total Paid</span>
                      <span className="ca-stat-value">{formatPeso(totalPaid)}</span>
                    </div>
                    <div className="ca-stat-box highlight">
                      <span className="ca-stat-label">Current Balance</span>
                      <span className="ca-stat-value">{formatPeso(totalBalance)}</span>
                    </div>
                  </>
                )
              })()}
            </div>
            <div className="ca-card-actions">
              <button 
                className="ca-action-btn primary"
                onClick={() => setShowAddCashAdvanceModal(true)}
              >
                <Plus size={18} />
                Add Cash Advance
              </button>
              <button 
                className="ca-action-btn secondary"
                onClick={() => {
                  const employeeRecords = cashAdvanceRecords.filter(r => r.employeeId === viewingCashAdvanceEmployee.id && r.balance > 0)
                  if (employeeRecords.length === 0) {
                    showSuccess('No Outstanding Balance', 'This employee has no outstanding cash advances.', [])
                    return
                  }
                  
                  const recordId = employeeRecords[0].id
                  const currentBalance = employeeRecords[0].balance
                  const payment = prompt(`Enter payment amount\nCurrent Balance: ${formatPeso(currentBalance)}`)
                  
                  if (payment && !isNaN(payment) && Number(payment) > 0) {
                    if (Number(payment) > currentBalance) {
                      showSuccess('Invalid Amount', 'Payment amount cannot exceed balance', [
                        { label: 'Current Balance', value: formatPeso(currentBalance) },
                        { label: 'Attempted Payment', value: formatPeso(payment) }
                      ])
                    } else {
                      handleAddPayment(recordId, payment)
                      showSuccess(
                        'Payment Added!',
                        `Payment of ${formatPeso(payment)} recorded successfully`,
                        [
                          { label: 'Payment Amount', value: formatPeso(payment) },
                          { label: 'New Balance', value: formatPeso(currentBalance - Number(payment)) }
                        ]
                      )
                    }
                  }
                }}
              >
                <DollarSign size={18} />
                Add Payment
              </button>
            </div>
          </div>

          {/* Timeline Table */}
          {cashAdvanceRecords.filter(r => r.employeeId === viewingCashAdvanceEmployee.id).length === 0 ? (
            <div className="ca-empty-state">
              <CreditCard size={64} />
              <h3>No Cash Advance Records</h3>
              <p>This employee has no cash advance history yet</p>
            </div>
          ) : (
            <div className="ca-table-container">
              <table className="ca-timeline-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Advanced</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>Notes</th>
                    <th>Payments</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cashAdvanceRecords
                    .filter(r => r.employeeId === viewingCashAdvanceEmployee.id)
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map(record => (
                      <tr key={record.id}>
                        <td>
                          <div className="ca-date-cell">
                            <Calendar size={14} />
                            <span>{new Date(record.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}</span>
                          </div>
                        </td>
                        <td>
                          <span className="ca-amount">{formatPeso(record.amount)}</span>
                        </td>
                        <td>
                          <span className="ca-amount paid">{formatPeso(record.amount - record.balance)}</span>
                        </td>
                        <td>
                          <span className="ca-amount balance">{formatPeso(record.balance)}</span>
                        </td>
                        <td>
                          <div className="ca-notes-cell">
                            {record.notes ? (
                              <span className="ca-notes-text" title={record.notes}>
                                {record.notes.length > 30 ? record.notes.substring(0, 30) + '...' : record.notes}
                              </span>
                            ) : (
                              <span className="ca-no-notes">No notes</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="ca-payments-cell">
                            {record.payments.length > 0 ? (
                              <div className="ca-payments-preview">
                                <span className="ca-payments-badge">{record.payments.length} payment{record.payments.length > 1 ? 's' : ''}</span>
                                <div className="ca-payments-tooltip">
                                  {record.payments.map(payment => (
                                    <div key={payment.id} className="ca-payment-item">
                                      <span>{new Date(payment.date).toLocaleDateString()}</span>
                                      <span>{formatPeso(payment.amount)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <span className="ca-no-payments">No payments</span>
                            )}
                          </div>
                        </td>
                        <td>
                          {record.balance === 0 ? (
                            <span className="ca-status-badge paid">
                              <CheckCircle size={14} />
                              Paid
                            </span>
                          ) : (
                            <span className="ca-status-badge outstanding">
                              <AlertCircle size={14} />
                              Outstanding
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="ca-action-buttons">
                            {record.balance > 0 && (
                              <button 
                                className="ca-icon-btn pay"
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
                                title="Add Payment"
                              >
                                <DollarSign size={14} />
                              </button>
                            )}
                            <button 
                              className="ca-icon-btn delete"
                              onClick={async () => {
                                if (confirm(`Delete this cash advance record of ${formatPeso(record.amount)}?`)) {
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
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
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
          <div className="header-content">
            <div className="header-icon-wrapper">
              <CreditCard size={22} />
            </div>
            <div>
              <h1>Cash Advance Records</h1>
              <p className="subtitle">Track employee cash advances and payments</p>
            </div>
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
            {/* Redesigned Summary Cards */}
            <div className="payroll-summary-grid">
              <div className="payroll-summary-card primary-card">
                <div className="summary-card-header">
                  <div className="summary-card-icon">
                    <User size={20} />
                  </div>
                  <span className="summary-card-label">Total Records</span>
                </div>
                <div className="summary-card-value">{cashAdvanceRecords.length}</div>
                <div className="summary-card-footer">Active cash advances</div>
              </div>

              <div className="payroll-summary-card">
                <div className="summary-card-header">
                  <div className="summary-card-icon">
                    <DollarSign size={20} />
                  </div>
                  <span className="summary-card-label">Total Advanced</span>
                </div>
                <div className="summary-card-value">{formatPeso(cashAdvanceRecords.reduce((sum, r) => sum + r.amount, 0))}</div>
                <div className="summary-card-footer">Amount given to employees</div>
              </div>

              <div className="payroll-summary-card">
                <div className="summary-card-header">
                  <div className="summary-card-icon">
                    <TrendingUp size={20} />
                  </div>
                  <span className="summary-card-label">Total Paid</span>
                </div>
                <div className="summary-card-value">{formatPeso(cashAdvanceRecords.reduce((sum, r) => sum + (r.amount - r.balance), 0))}</div>
                <div className="summary-card-footer">Amount recovered</div>
              </div>

              <div className="payroll-summary-card highlight-card">
                <div className="summary-card-header">
                  <div className="summary-card-icon">
                    <Clock size={20} />
                  </div>
                  <span className="summary-card-label">Outstanding</span>
                </div>
                <div className="summary-card-value">{formatPeso(cashAdvanceRecords.reduce((sum, r) => sum + r.balance, 0))}</div>
                <div className="summary-card-footer">Remaining balance</div>
              </div>
            </div>

            {/* Compact Table View */}
            <div className="payroll-records-section">
              <h2>Employee Cash Advance Status</h2>
              <div className="payroll-table-container">
                <table className="payroll-table compact-table cash-advance-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Records</th>
                      <th>Advanced</th>
                      <th>Paid</th>
                      <th>Balance</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map(employee => {
                      const employeeRecords = cashAdvanceRecords.filter(r => r.employeeId === employee.id)
                      const totalBalance = employeeRecords.reduce((sum, r) => sum + r.balance, 0)
                      const totalAdvanced = employeeRecords.reduce((sum, r) => sum + r.amount, 0)
                      const totalPaid = totalAdvanced - totalBalance

                      return (
                        <tr key={employee.id}>
                          <td className="employee-name-cell">
                            <div className="employee-cell-content">
                              <div className="employee-avatar-tiny">
                                <User size={14} />
                              </div>
                              <div className="employee-cell-info">
                                <span className="employee-name">{employee.name}</span>
                                <span className="employee-meta">{employeeRecords.length} advance(s)</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="record-count-badge">{employeeRecords.length}</span>
                          </td>
                          <td>
                            <span className="amount-compact">{formatPeso(totalAdvanced)}</span>
                          </td>
                          <td>
                            <span className="amount-compact positive">{formatPeso(totalPaid)}</span>
                          </td>
                          <td className="balance-cell-compact">
                            <span className="balance-value">{formatPeso(totalBalance)}</span>
                          </td>
                          <td>
                            {totalBalance === 0 && totalAdvanced > 0 ? (
                              <span className="status-badge-compact paid">Paid</span>
                            ) : totalBalance > 0 ? (
                              <span className="status-badge-compact outstanding">Outstanding</span>
                            ) : (
                              <span className="status-badge-compact no-advance">No Advance</span>
                            )}
                          </td>
                          <td>
                            <div className="action-buttons-compact">
                              <button 
                                className="icon-btn-compact view-btn"
                                onClick={() => {
                                  setViewingCashAdvanceEmployee(employee)
                                  setCashAdvanceTimelineView(true)
                                }}
                                title="View Records"
                              >
                                <FileText size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
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
            <div className="header-content">
              <div className="header-icon-wrapper">
                <Calendar size={22} />
              </div>
              <div>
                <h1>Day Off Management</h1>
                <p className="subtitle">Manage employee paid day offs</p>
              </div>
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
              <button className="add-employee-button" onClick={() => {
                // Reset calendar to current month when opening modal
                const now = new Date()
                setCalendarCurrentYear(now.getFullYear())
                setCalendarCurrentMonth(now.getMonth())
                setShowAddDayOffModal(true)
              }}>
                <Plus size={20} />
                <span>Add Day Off</span>
              </button>
            </div>
          </div>

          {/* Compact Info Card */}
          <div className="dayoff-info-compact">
            <div className="info-compact-header">
              <AlertCircle size={16} />
              <span>How Day Off Works</span>
            </div>
            <div className="info-compact-content">
              <span>• 9 hrs paid per qualified day off</span>
              <span>• Auto-detected absences</span>
              <span>• {maxAbsencesForDayOff}+ absences = not qualified</span>
            </div>
          </div>

          {dayOffRecords.length === 0 ? (
            <div className="empty-state">
              <Calendar size={64} style={{opacity: 0.3}} />
              <h3>No Day Off Records</h3>
              <p>Click "Add Day Off" to create a new record</p>
            </div>
          ) : (
            <div className="dayoff-table-section">
              <div className="payroll-table-container">
                <table className="payroll-table compact-table dayoff-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Date</th>
                      <th>Day</th>
                      <th>Period</th>
                      <th>Status</th>
                      <th>Hours</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayOffRecords.map(record => {
                      const dayOfWeek = new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' })
                      return (
                        <tr key={record.id}>
                          <td>
                            <div className="employee-cell-content">
                              <div className="employee-avatar-tiny">
                                <User size={14} />
                              </div>
                              <div className="employee-cell-info">
                                <span className="employee-name">{record.employeeName}</span>
                                <span className="employee-meta">{record.month} {record.year}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="date-compact">{new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </td>
                          <td>
                            <span className="day-badge">{dayOfWeek}</span>
                          </td>
                          <td>
                            <div className="dayoff-status-cell">
                              <span className={`absence-badge ${record.absenceCount >= maxAbsencesForDayOff ? 'danger' : 'success'}`}>
                                {record.absenceCount} abs
                              </span>
                            </div>
                          </td>
                          <td>
                            {record.isQualified ? (
                              <span className="status-badge-compact qualified">Qualified</span>
                            ) : (
                              <span className="status-badge-compact not-qualified">Not Qualified</span>
                            )}
                          </td>
                          <td>
                            <div className="hours-cell">
                              <span className="hours-value">{record.hoursPaid || 0}</span>
                              <span className="hours-label">hrs</span>
                            </div>
                          </td>
                          <td>
                            <div className="action-buttons-compact">
                              <button 
                                className="icon-btn-compact delete-btn"
                                onClick={() => {
                                  if (confirm(`Delete day off record for ${record.employeeName}?`)) {
                                    handleDeleteDayOff(record.id)
                                  }
                                }}
                                title="Delete Day Off"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
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
              <div className="dayoff-modal-content" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="dayoff-modal-header">
                  <div className="dayoff-modal-icon">
                    <Calendar size={28} />
                  </div>
                  <div className="dayoff-modal-title-section">
                    <h2>Add Day Off</h2>
                    <p>Create a new day off record for an employee</p>
                  </div>
                  <button 
                    className="dayoff-modal-close"
                    onClick={() => {
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
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>

                {/* Modal Body */}
                <div className="dayoff-modal-body">
                  {/* Employee Selection Card */}
                  <div className="dayoff-form-card">
                    <div className="dayoff-form-card-header">
                      <User size={18} />
                      <span>Employee Information</span>
                    </div>
                    <div className="dayoff-form-group">
                      <label className="dayoff-label">
                        <span>Select Employee</span>
                        <span className="required-indicator">*</span>
                      </label>
                      <div className="dayoff-input-wrapper">
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
                          className="dayoff-select"
                        >
                          <option value="">Choose an employee...</option>
                          {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Date Selection Card */}
                  <div className="dayoff-form-card">
                    <div className="dayoff-form-card-header">
                      <Calendar size={18} />
                      <span>Date Information</span>
                    </div>
                    <div className="dayoff-form-group">
                      <label className="dayoff-label">
                        <span>Day Off Date</span>
                        <span className="required-indicator">*</span>
                      </label>
                      <button
                        type="button"
                        className="calendar-picker-button"
                        onClick={() => {
                          // Set calendar to the selected date's month, or current month if no date selected
                          if (dayOffForm.date) {
                            const selectedDate = new Date(dayOffForm.date)
                            setCalendarCurrentYear(selectedDate.getFullYear())
                            setCalendarCurrentMonth(selectedDate.getMonth())
                          } else {
                            const now = new Date()
                            setCalendarCurrentYear(now.getFullYear())
                            setCalendarCurrentMonth(now.getMonth())
                          }
                          setShowCalendarPicker(true)
                        }}
                      >
                        <Calendar size={18} />
                        <span>
                          {dayOffForm.date ? 
                            new Date(dayOffForm.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            }) : 
                            'Select a date'
                          }
                        </span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </button>
                      {dayOffForm.date && (
                        <div className="dayoff-date-preview">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          <span>{new Date(dayOffForm.date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Absence Status Card */}
                  <div className="dayoff-form-card full-width">
                    <div className="dayoff-form-card-header">
                      <AlertCircle size={18} />
                      <span>Qualification Status</span>
                    </div>
                    <div className="dayoff-form-group">
                      <label className="dayoff-label">
                        <span>Absence Count</span>
                        <span className="auto-badge">Auto-calculated</span>
                      </label>
                      <div className="dayoff-absence-display">
                        <div className="dayoff-absence-number">
                          {dayOffForm.absenceCount}
                        </div>
                        <div className="dayoff-absence-label">
                          absence{dayOffForm.absenceCount !== 1 ? 's' : ''} in pay period
                        </div>
                      </div>
                      
                      {dayOffForm.employeeId && dayOffForm.date ? (
                        <div className={`dayoff-status-banner ${dayOffForm.absenceCount >= maxAbsencesForDayOff ? 'not-qualified' : 'qualified'}`}>
                          <div className="status-icon">
                            {dayOffForm.absenceCount >= maxAbsencesForDayOff ? (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                              </svg>
                            ) : (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            )}
                          </div>
                          <div className="status-content">
                            <div className="status-title">
                              {dayOffForm.absenceCount >= maxAbsencesForDayOff ? 
                                'Not Qualified for Paid Day Off' : 
                                'Qualified for Paid Day Off'
                              }
                            </div>
                            <div className="status-message">
                              {dayOffForm.absenceCount >= maxAbsencesForDayOff ? 
                                `Employee has ${dayOffForm.absenceCount} absences (days with 0 hours). Day off will NOT be paid.` :
                                `Employee has ${dayOffForm.absenceCount} absences. Day off will be paid (9 hours).`
                              }
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="dayoff-info-message">
                          <AlertCircle size={16} />
                          <span>Select an employee and date to view qualification status</span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                {/* Modal Footer */}
                <div className="dayoff-modal-footer">
                  <button 
                    className="dayoff-cancel-button" 
                    onClick={() => {
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
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    <span>Cancel</span>
                  </button>
                  <button 
                    className="dayoff-save-button" 
                    onClick={handleAddDayOff}
                    disabled={!dayOffForm.employeeId || !dayOffForm.date}
                  >
                    <Save size={18} />
                    <span>Add Day Off</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Calendar Picker Modal */}
          {showCalendarPicker && (
            <div className="modal-overlay" onClick={() => {
              setShowCalendarPicker(false)
              // Reset calendar to current month when closing
              const now = new Date()
              setCalendarCurrentYear(now.getFullYear())
              setCalendarCurrentMonth(now.getMonth())
            }}>
              <div className="calendar-picker-modal" onClick={(e) => e.stopPropagation()}>
                <div className="calendar-picker-header">
                  <h3>Select Date</h3>
                  <button className="calendar-close-btn" onClick={() => {
                    setShowCalendarPicker(false)
                    // Reset calendar to current month when closing
                    const now = new Date()
                    setCalendarCurrentYear(now.getFullYear())
                    setCalendarCurrentMonth(now.getMonth())
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
                <div className="calendar-picker-body">
                  <div className="calendar-nav">
                    <button className="calendar-nav-btn" onClick={() => {
                      if (calendarCurrentMonth === 0) {
                        setCalendarCurrentMonth(11)
                        setCalendarCurrentYear(calendarCurrentYear - 1)
                      } else {
                        setCalendarCurrentMonth(calendarCurrentMonth - 1)
                      }
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                    </button>
                    <div className="calendar-month-year">
                      {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][calendarCurrentMonth]} {calendarCurrentYear}
                    </div>
                    <button className="calendar-nav-btn" onClick={() => {
                      if (calendarCurrentMonth === 11) {
                        setCalendarCurrentMonth(0)
                        setCalendarCurrentYear(calendarCurrentYear + 1)
                      } else {
                        setCalendarCurrentMonth(calendarCurrentMonth + 1)
                      }
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                  </div>
                  <div className="calendar-weekdays">
                    <div className="calendar-weekday">Sun</div>
                    <div className="calendar-weekday">Mon</div>
                    <div className="calendar-weekday">Tue</div>
                    <div className="calendar-weekday">Wed</div>
                    <div className="calendar-weekday">Thu</div>
                    <div className="calendar-weekday">Fri</div>
                    <div className="calendar-weekday">Sat</div>
                  </div>
                  <div className="calendar-days">
                    {(() => {
                      const today = new Date()
                      const daysInMonth = new Date(calendarCurrentYear, calendarCurrentMonth + 1, 0).getDate()
                      const firstDayOfMonth = new Date(calendarCurrentYear, calendarCurrentMonth, 1).getDay()
                      
                      const handleDateSelect = (day) => {
                        const selectedDate = new Date(calendarCurrentYear, calendarCurrentMonth, day)
                        const dateString = selectedDate.toISOString().split('T')[0]
                        
                        // Auto-calculate absences if employee is selected
                        if (dayOffForm.employeeId) {
                          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
                          const month = monthNames[selectedDate.getMonth()]
                          const year = selectedDate.getFullYear()
                          const payPeriod = day <= 15 ? '1-15' : '16-31'
                          
                          const absences = countAbsencesForPeriod(Number(dayOffForm.employeeId), month, year, payPeriod)
                          
                          setDayOffForm({ 
                            ...dayOffForm, 
                            date: dateString,
                            absenceCount: absences
                          })
                        } else {
                          setDayOffForm({ ...dayOffForm, date: dateString })
                        }
                        setShowCalendarPicker(false)
                        // Reset calendar to current month after selection
                        const now = new Date()
                        setCalendarCurrentYear(now.getFullYear())
                        setCalendarCurrentMonth(now.getMonth())
                      }
                      
                      const days = []
                      for (let i = 0; i < firstDayOfMonth; i++) {
                        days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>)
                      }
                      
                      for (let day = 1; day <= daysInMonth; day++) {
                        const isToday = day === today.getDate() && calendarCurrentMonth === today.getMonth() && calendarCurrentYear === today.getFullYear()
                        const isSelected = dayOffForm.date && new Date(dayOffForm.date).getDate() === day && new Date(dayOffForm.date).getMonth() === calendarCurrentMonth && new Date(dayOffForm.date).getFullYear() === calendarCurrentYear
                        
                        days.push(
                          <button
                            key={day}
                            className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleDateSelect(day)}
                          >
                            {day}
                          </button>
                        )
                      }
                      
                      return days
                    })()}
                  </div>
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
          <div className="header-content">
            <div className="header-icon-wrapper">
              <FileText size={22} />
            </div>
            <div>
              <h1>System Settings</h1>
              <p className="subtitle">Configure system values and manage employees</p>
            </div>
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
                      <th>Barcode / Access Code</th>
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
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span className="barcode-badge">
                              {employee.barcode || (employee.id + 100000).toString()}
                            </span>
                            <span style={{ fontSize: '10px', color: '#666' }}>
                              Login: {employee.accessCode || `AC${employee.id.toString().padStart(4, '0')}`}
                            </span>
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
                                  className="icon-btn barcode-btn"
                                  onClick={() => handleDownloadBarcode(employee)}
                                  title="Download Barcode"
                                >
                                  <Download size={16} />
                                </button>
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
        <div className="header-content">
          <div className="header-icon-wrapper">
            <DollarSign size={22} />
          </div>
          <div>
            <h1>Employee Salary Dashboard</h1>
            <p className="subtitle">Manage employee rates and calculate earnings (9-hour shifts)</p>
          </div>
        </div>
        {isManager && (
          <button className="add-employee-button" onClick={() => setShowAddModal(true)}>
            <Plus size={20} />
            <span>Add Employee</span>
          </button>
        )}
      </div>

      <div className="payroll-summary-grid">
        <div className="payroll-summary-card primary-card">
          <div className="summary-card-header">
            <div className="summary-card-icon">
              <User size={18} />
            </div>
            <span className="summary-card-label">Total Employees</span>
          </div>
          <div className="summary-card-value">{stats.employeeCount}</div>
          <div className="summary-card-footer">Active employees in system</div>
        </div>

        <div className="payroll-summary-card">
          <div className="summary-card-header">
            <div className="summary-card-icon">
              <DollarSign size={18} />
            </div>
            <span className="summary-card-label">Avg. Per Shift</span>
          </div>
          <div className="summary-card-value">{isManager ? formatPeso(stats.avgPerShift) : censorRate()}</div>
          <div className="summary-card-footer">Average 9-hour shift rate</div>
        </div>

        <div className="payroll-summary-card">
          <div className="summary-card-header">
            <div className="summary-card-icon">
              <Calendar size={18} />
            </div>
            <span className="summary-card-label">Total Monthly</span>
          </div>
          <div className="summary-card-value">{isManager ? formatPeso(stats.totalMonthly) : censorRate()}</div>
          <div className="summary-card-footer">Estimated monthly payroll</div>
        </div>

        <div className="payroll-summary-card highlight-card">
          <div className="summary-card-header">
            <div className="summary-card-icon">
              <TrendingUp size={18} />
            </div>
            <span className="summary-card-label">Total Annual</span>
          </div>
          <div className="summary-card-value">{isManager ? formatPeso(stats.totalAnnual) : censorRate()}</div>
          <div className="summary-card-footer">Projected annual payroll</div>
        </div>
      </div>

      <div className="payroll-records-section">
        <h2>Employee List</h2>
        <div className="payroll-table-container">
          <table className="payroll-table compact-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Email</th>
                <th>Phone Number</th>
                <th>Shift</th>
                <th>Rate/Shift</th>
                {isManager && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {employees.map(employee => {
                const empStats = calculateStats(employee)
                return (
                  <tr key={employee.id}>
                    <td className="employee-name-cell">
                      <div className="employee-cell-content">
                        <div className="employee-avatar-tiny">
                          <User size={14} />
                        </div>
                        <div className="employee-cell-info">
                          <span className="employee-name">{employee.name}</span>
                          <span className="employee-meta">{employee.hoursPerShift}hrs/shift</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-cell">
                        <span className="contact-info">{employee.email || 'No email'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="contact-cell">
                        <span className="contact-info">{employee.phone || 'No phone'}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`period-badge ${employee.shiftType}`}>
                        {employee.shiftType === 'first' ? 'First' : employee.shiftType === 'second' ? 'Second' : 'Open'}
                      </span>
                    </td>
                    <td>
                      <div className="pay-cell">
                        <span className="pay-value">{isManager ? formatPeso(employee.ratePer9Hours) : censorRate()}</span>
                      </div>
                    </td>
                    {isManager && (
                      <td>
                        <div className="action-buttons-compact">
                          <button 
                            className="icon-btn-compact barcode"
                            onClick={() => handleDownloadBarcode(employee)}
                            title="Download Barcode"
                          >
                            <Download size={14} />
                          </button>
                          <button 
                            className="icon-btn-compact edit"
                            onClick={() => handleEditEmployee(employee)}
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            className="icon-btn-compact delete"
                            onClick={() => handleDeleteEmployee(employee.id)}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div 
          className="modal-overlay" 
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault()
            }
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddModal(false)
              setEditingEmployee(null)
              setFormData({ name: '', email: '', phone: '', photo: '', ratePer9Hours: 0, hoursPerShift: 9, shiftType: 'first' })
            }
          }}
        >
          <div className="modal-content employee-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h2>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h2>
              <button 
                className="modal-close-btn"
                onClick={() => {
                  setShowAddModal(false)
                  setEditingEmployee(null)
                  setFormData({ name: '', email: '', phone: '', photo: '', ratePer9Hours: 0, hoursPerShift: 9, shiftType: 'first' })
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="employee-form-layout">
              {/* Photo Section */}
              <div className="photo-upload-section">
                <div className="photo-placeholder">
                  {formData.photo ? (
                    <img src={formData.photo} alt="Employee" className="employee-photo-preview" />
                  ) : (
                    <div className="photo-placeholder-content">
                      <User size={48} />
                      <span>Employee Photo</span>
                    </div>
                  )}
                </div>
                <label className="photo-upload-btn">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onloadend = () => {
                          setFormData({ ...formData, photo: reader.result })
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                  Upload Photo
                </label>
                <div className="photo-upload-note">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  <span>Use a good quality photo with small file size for best results</span>
                </div>
                {formData.photo && (
                  <button 
                    className="photo-remove-btn"
                    onClick={() => setFormData({ ...formData, photo: '' })}
                  >
                    Remove Photo
                  </button>
                )}
              </div>

              {/* Form Fields */}
              <div className="employee-form-fields">
                <div className="form-row">
                  <div className="form-group">
                    <label>Employee Name *</label>
                    <div className="enhanced-field-wrapper">
                      <div className="enhanced-field-icon">
                        <User size={18} />
                      </div>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter full name"
                        className="enhanced-field-input"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-row two-columns">
                  <div className="form-group">
                    <label>Email Address</label>
                    <div className="enhanced-field-wrapper">
                      <div className="enhanced-field-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                          <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                      </div>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@example.com"
                        className="enhanced-field-input"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <div className="enhanced-field-wrapper">
                      <div className="enhanced-field-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg>
                      </div>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+63 XXX XXX XXXX"
                        className="enhanced-field-input"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-row two-columns">
                  <div className="form-group">
                    <label>Rate Per 9-Hour Shift (₱) *</label>
                    <div className="enhanced-field-wrapper">
                      <div className="enhanced-field-icon">
                        <DollarSign size={18} />
                      </div>
                      <input
                        type="number"
                        value={formData.ratePer9Hours}
                        onChange={(e) => setFormData({ ...formData, ratePer9Hours: e.target.value })}
                        placeholder="e.g., 600"
                        className="enhanced-field-input"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Hours Per Shift *</label>
                    <div className="enhanced-field-wrapper">
                      <div className="enhanced-field-icon">
                        <Clock size={18} />
                      </div>
                      <input
                        type="number"
                        value={formData.hoursPerShift}
                        onChange={(e) => setFormData({ ...formData, hoursPerShift: e.target.value })}
                        placeholder="e.g., 9"
                        className="enhanced-field-input"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Shift Type *</label>
                    <div className="enhanced-field-wrapper">
                      <div className="enhanced-field-icon">
                        <Calendar size={18} />
                      </div>
                      <select
                        value={formData.shiftType}
                        onChange={(e) => setFormData({ ...formData, shiftType: e.target.value })}
                        className="enhanced-field-select"
                      >
                        <option value="first">First Shift (7AM-5PM)</option>
                        <option value="second">Second Shift (8:30PM-7AM)</option>
                        <option value="open">Open Time (Flexible Schedule)</option>
                      </select>
                    </div>
                    {formData.shiftType === 'open' && (
                      <div className="shift-info-note">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="16" x2="12" y2="12"></line>
                          <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                        <span>Open Time employees can work flexible hours without late deductions</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-actions-custom">
              <button 
                className="modal-button-custom cancel"
                onClick={() => {
                  setShowAddModal(false)
                  setEditingEmployee(null)
                  setFormData({ name: '', email: '', phone: '', photo: '', ratePer9Hours: 0, hoursPerShift: 9, shiftType: 'first' })
                }}
              >
                Cancel
              </button>
              <button 
                className="modal-button-custom save"
                onClick={editingEmployee ? handleUpdateEmployee : handleAddEmployee}
              >
                {editingEmployee ? 'Update Employee' : 'Add Employee'}
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
