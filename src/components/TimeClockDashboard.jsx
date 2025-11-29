import { useState, useEffect, useRef } from 'react'
import { Clock, LogIn, LogOut, Users, CheckCircle, XCircle, X, User, Zap, Activity, Calendar, Play, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import './TimeClockDashboard.css'

const TimeClockDashboard = ({ onExit }) => {
  const [barcodeInput, setBarcodeInput] = useState('')
  const [clockRecords, setClockRecords] = useState([])
  const [employees, setEmployees] = useState([])
  const [lastAction, setLastAction] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [notification, setNotification] = useState(null)
  const [recentAction, setRecentAction] = useState(null) // For the 20-second card
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [selectedPeriod, setSelectedPeriod] = useState('first') // 'first' (1-15) or 'second' (16-31)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [attendanceData, setAttendanceData] = useState({})
  const [manualOverride, setManualOverride] = useState(null) // For manual button selection
  const [overrideCountdown, setOverrideCountdown] = useState(0) // Countdown timer
  const [employeeDTR, setEmployeeDTR] = useState(null) // Store current employee's DTR record
  const [lastScannedEmployee, setLastScannedEmployee] = useState(null) // Store last scanned employee persistently
  const [actionHistory, setActionHistory] = useState([]) // Store recent clock actions
  const inputRef = useRef(null)
  const overrideTimerRef = useRef(null)
  const manualOverrideRef = useRef(null) // Ref to track manual override for closures

  const trailers = [
    {
      id: 'yotei',
      title: 'Ghost of Yōtei',
      description: 'Embark on an epic journey through ancient Japan in this action-adventure masterpiece.',
      video: '/trailer.mp4',
      thumbnail: '/yotei-thumb.jpg'
    },
    {
      id: 'battlefield',
      title: 'Battlefield 6',
      description: 'Experience the next generation of all-out warfare in the most immersive battlefield yet.',
      video: '/battlefield6.mp4',
      thumbnail: '/bf6-thumb.png'
    },
    {
      id: 'gta6',
      title: 'Grand Theft Auto VI',
      description: 'Return to Vice City in the most ambitious and immersive GTA experience ever created.',
      video: '/gta6.mp4',
      thumbnail: '/gta6-thumb.webp'
    },
    {
      id: 'grey-state',
      title: 'Grey State',
      description: 'A thrilling sci-fi adventure where reality and simulation blur in a dystopian future.',
      video: '/grey-state-trailer.mp4',
      thumbnail: '/grey-state-thumb.jpg'
    }
  ]
  
  // Trailer player state - start with random trailer
  const [activeTrailer, setActiveTrailer] = useState(() => Math.floor(Math.random() * trailers.length))
  const [isFadingOut, setIsFadingOut] = useState(false)
  const videoRef = useRef(null)

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Load employees and clock records
  useEffect(() => {
    loadData()
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  // Auto-focus input field
  useEffect(() => {
    inputRef.current?.focus()
  }, [barcodeInput])

  // Store refs for the latest values to avoid stale closures
  const employeesRef = useRef(employees)
  const clockRecordsRef = useRef(clockRecords)
  
  useEffect(() => {
    employeesRef.current = employees
  }, [employees])
  
  useEffect(() => {
    clockRecordsRef.current = clockRecords
  }, [clockRecords])

  // Global barcode scanner listener - captures keyboard input even when input is not focused
  useEffect(() => {
    let scanBuffer = ''
    let scanTimeout = null

    const handleGlobalKeyPress = (e) => {
      // Ignore if typing in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return
      }

      // Ignore special keys
      if (e.key === 'Escape' || e.key === 'Tab' || e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt') {
        return
      }

      // Clear previous timeout
      if (scanTimeout) {
        clearTimeout(scanTimeout)
      }

      // Handle Enter key - process the barcode
      if (e.key === 'Enter' && scanBuffer.trim()) {
        e.preventDefault()
        processBarcodeInput(scanBuffer.trim())
        scanBuffer = ''
        return
      }

      // Add character to buffer
      if (e.key.length === 1) {
        scanBuffer += e.key
      }

      // Auto-clear buffer after 100ms of no input (barcode scanners are fast)
      scanTimeout = setTimeout(() => {
        scanBuffer = ''
      }, 100)
    }

    window.addEventListener('keypress', handleGlobalKeyPress)

    return () => {
      window.removeEventListener('keypress', handleGlobalKeyPress)
      if (scanTimeout) {
        clearTimeout(scanTimeout)
      }
    }
  }, [])

  // Process barcode input (extracted to be used by both input field and global listener)
  const processBarcodeInput = async (barcode) => {
    // Find employee by barcode (time clock) - use ref to get latest state
    const employee = employeesRef.current.find(emp => emp.barcode === barcode)

    if (!employee) {
      showNotification('Employee not found. Please check your barcode.', 'error')
      return
    }

    // Automatically select employee in time tracking
    setSelectedEmployee(employee.id.toString())
    
    // Store last scanned employee
    setLastScannedEmployee(employee)

    // Determine action based on highlighted button
    // IMPORTANT: Use ref to get latest manualOverride value (avoids stale closure issues)
    const currentManualOverride = manualOverrideRef.current
    const highlightedButton = currentManualOverride || getHighlightedButton()
    const isOutButton = highlightedButton === 'am-out' || highlightedButton === 'pm-out' || highlightedButton === 'ot-out'
    const isInButton = highlightedButton === 'am-in' || highlightedButton === 'pm-in' || highlightedButton === 'ot-in'
    
    // Check if employee is currently clocked in - use ref to get latest state
    const existingRecord = clockRecordsRef.current.find(
      record => record.employee_id === employee.id && !record.clock_out
    )

    // Debug logging
    console.log('Process barcode:', {
      currentManualOverride,
      highlightedButton,
      isOutButton,
      isInButton,
      hasExistingRecord: !!existingRecord,
      employeeName: employee.name
    })

    if (isOutButton && existingRecord) {
      // Clock OUT - only if it's an OUT time period and they're clocked in
      await handleClockOut(existingRecord, employee)
    } else if (isInButton && !existingRecord) {
      // Clock IN - for AM IN, PM IN, OT IN (only if not already clocked in)
      await handleClockIn(employee)
    } else if (isInButton && existingRecord) {
      // They tried to clock in but are already clocked in
      showNotification('Cannot clock in. Employee is already clocked in. Please clock out first.', 'error', employee.name)
    } else if (isOutButton && !existingRecord) {
      // They tried to clock out but aren't clocked in
      showNotification('Cannot clock out. Employee is not clocked in.', 'error', employee.name)
    } else {
      // No button selected or invalid state
      showNotification('Please select a time period (AM IN, PM IN, etc.) before scanning.', 'error', employee.name)
    }
  }

  const loadData = async () => {
    try {
      // Load employees
      const { data: employeesData, error: empError } = await supabase
        .from('employees')
        .select('*')
        .order('name')

      if (empError) throw empError
      setEmployees(employeesData || [])

      // Load today's clock records
      const today = new Date().toISOString().split('T')[0]
      const { data: recordsData, error: recError } = await supabase
        .from('time_clock_records')
        .select('*')
        .gte('clock_in', `${today}T00:00:00`)
        .order('clock_in', { ascending: false })

      if (recError) throw recError
      setClockRecords(recordsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      showNotification('Error loading data', 'error')
    }
  }

  const showNotification = (message, type = 'success', employeeName = '') => {
    setNotification({ message, type, employeeName })
    setTimeout(() => setNotification(null), 5000)
  }

  const handleBarcodeInput = async (e) => {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      const barcode = barcodeInput.trim()
      setBarcodeInput('')
      await processBarcodeInput(barcode)
    }
  }

  const handleClockIn = async (employee) => {
    try {
      const now = new Date()
      const nowISO = now.toISOString()
      const dateStr = nowISO.split('T')[0]
      const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
      const dayOfMonth = now.getDate()
      const month = now.getMonth() + 1
      const year = now.getFullYear()
      
      // Ensure selected employee is updated
      setSelectedEmployee(employee.id.toString())

      // Insert clock in record
      const { data, error } = await supabase
        .from('time_clock_records')
        .insert([{
          employee_id: employee.id,
          employee_name: employee.name,
          clock_in: nowISO,
          clock_out: null,
          date: dateStr
        }])
        .select()
        .single()

      if (error) throw error

      // Determine which column to update in DTR based on current time and manual override
      const highlightedButton = getHighlightedButton()
      let dtrColumn = null
      let updatedDTR = null
      
      if (highlightedButton === 'am-in') {
        dtrColumn = 'am_in'
      } else if (highlightedButton === 'pm-in') {
        dtrColumn = 'pm_in'
      } else if (highlightedButton === 'ot-in') {
        dtrColumn = 'ot_in'
      }

      // Update or create DTR record
      if (dtrColumn) {
        // Check if DTR record exists for this employee and date
        const { data: existingDTR, error: dtrCheckError } = await supabase
          .from('dtr_records')
          .select('*')
          .eq('employee_id', employee.id)
          .eq('date', dateStr)
          .single()

        if (dtrCheckError && dtrCheckError.code !== 'PGRST116') {
          console.error('Error checking DTR:', dtrCheckError)
        }

        if (existingDTR) {
          // Check if the column already has a value
          if (existingDTR[dtrColumn] && existingDTR[dtrColumn] !== null) {
            // Column already has a value, don't overwrite
            console.log(`DTR column ${dtrColumn} already has value: ${existingDTR[dtrColumn]}`)
            updatedDTR = existingDTR
            showNotification(`${dtrColumn.toUpperCase().replace('_', ' ')} already recorded at ${existingDTR[dtrColumn]}`, 'error', employee.name)
          } else {
            // Update existing DTR record (column is empty)
            const { data: updateData, error: updateError } = await supabase
              .from('dtr_records')
              .update({ [dtrColumn]: timeStr })
              .eq('id', existingDTR.id)
              .select()
              .single()

            if (updateError) {
              console.error('Error updating DTR:', updateError)
            } else {
              updatedDTR = updateData
              console.log('DTR updated successfully:', updateData)
            }
          }
        } else {
          // Create new DTR record
          const { data: insertData, error: insertError } = await supabase
            .from('dtr_records')
            .insert([{
              employee_id: employee.id,
              employee_name: employee.name,
              date: dateStr,
              day_of_month: dayOfMonth,
              month: month,
              year: year,
              [dtrColumn]: timeStr
            }])
            .select()
            .single()

          if (insertError) {
            console.error('Error creating DTR:', insertError)
          } else {
            updatedDTR = insertData
            console.log('DTR created successfully:', insertData)
          }
        }

        // If DTR update/creation failed, fetch the current DTR as fallback
        if (!updatedDTR) {
          console.log('Fetching DTR as fallback...')
          const { data: fallbackDTR } = await supabase
            .from('dtr_records')
            .select('*')
            .eq('employee_id', employee.id)
            .eq('date', dateStr)
            .single()
          updatedDTR = fallbackDTR
          console.log('Fallback DTR:', fallbackDTR)
        }

        // Store the DTR record to display
        if (updatedDTR) {
          setEmployeeDTR(updatedDTR)
        }
      }

      setLastAction({
        type: 'in',
        employee: employee.name,
        time: nowISO
      })
      
      // Show recent action card for 20 seconds
      const hour = now.getHours()
      const isFirstShift = hour >= 5 && hour < 17
      const actionData = {
        type: 'in',
        employee: employee,
        time: now,
        shift: isFirstShift ? 'Morning' : 'Afternoon',
        shiftType: isFirstShift ? 'first' : 'second',
        dtr: updatedDTR || null,
        id: Date.now() // Unique ID for history
      }
      
      setRecentAction(actionData)
      
      // Add to history (keep last 10 actions)
      setActionHistory(prev => [actionData, ...prev].slice(0, 10))
      
      // Clear after 20 seconds - only clear the action details, not the employee
      setTimeout(() => {
        setRecentAction(null)
      }, 20000)

      showNotification('Clocked In Successfully', 'success', employee.name)
      await loadData()
    } catch (error) {
      console.error('Error clocking in:', error)
      showNotification('Error clocking in. Please try again.', 'error')
    }
  }

  const handleClockOut = async (record, employee) => {
    try {
      const now = new Date()
      const nowISO = now.toISOString()
      const dateStr = nowISO.split('T')[0]
      const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
      const dayOfMonth = now.getDate()
      const month = now.getMonth() + 1
      const year = now.getFullYear()
      
      // Ensure selected employee is updated
      setSelectedEmployee(employee.id.toString())

      // Update clock out record
      const { error } = await supabase
        .from('time_clock_records')
        .update({ clock_out: nowISO })
        .eq('id', record.id)

      if (error) throw error

      // Determine which column to update in DTR based on current time and manual override
      const highlightedButton = getHighlightedButton()
      let dtrColumn = null
      let updatedDTR = null
      
      if (highlightedButton === 'am-out') {
        dtrColumn = 'am_out'
      } else if (highlightedButton === 'pm-out') {
        dtrColumn = 'pm_out'
      } else if (highlightedButton === 'ot-out') {
        dtrColumn = 'ot_out'
      }

      // Update or create DTR record
      if (dtrColumn) {
        // Check if DTR record exists for this employee and date
        const { data: existingDTR, error: dtrCheckError } = await supabase
          .from('dtr_records')
          .select('*')
          .eq('employee_id', employee.id)
          .eq('date', dateStr)
          .single()

        if (dtrCheckError && dtrCheckError.code !== 'PGRST116') {
          console.error('Error checking DTR:', dtrCheckError)
        }

        if (existingDTR) {
          // Check if the column already has a value
          if (existingDTR[dtrColumn] && existingDTR[dtrColumn] !== null) {
            // Column already has a value, don't overwrite
            console.log(`DTR column ${dtrColumn} already has value: ${existingDTR[dtrColumn]}`)
            updatedDTR = existingDTR
            showNotification(`${dtrColumn.toUpperCase().replace('_', ' ')} already recorded at ${existingDTR[dtrColumn]}`, 'error', employee.name)
          } else {
            // Update existing DTR record (column is empty)
            const { data: updateData, error: updateError } = await supabase
              .from('dtr_records')
              .update({ [dtrColumn]: timeStr })
              .eq('id', existingDTR.id)
              .select()
              .single()

            if (updateError) {
              console.error('Error updating DTR:', updateError)
            } else {
              updatedDTR = updateData
              console.log('DTR updated successfully (clock out):', updateData)
            }
          }
        } else {
          // Create new DTR record
          const { data: insertData, error: insertError } = await supabase
            .from('dtr_records')
            .insert([{
              employee_id: employee.id,
              employee_name: employee.name,
              date: dateStr,
              day_of_month: dayOfMonth,
              month: month,
              year: year,
              [dtrColumn]: timeStr
            }])
            .select()
            .single()

          if (insertError) {
            console.error('Error creating DTR:', insertError)
          } else {
            updatedDTR = insertData
            console.log('DTR created successfully (clock out):', insertData)
          }
        }

        // If DTR update/creation failed, fetch the current DTR as fallback
        if (!updatedDTR) {
          console.log('Fetching DTR as fallback (clock out)...')
          const { data: fallbackDTR } = await supabase
            .from('dtr_records')
            .select('*')
            .eq('employee_id', employee.id)
            .eq('date', dateStr)
            .single()
          updatedDTR = fallbackDTR
          console.log('Fallback DTR (clock out):', fallbackDTR)
        }

        // Store the DTR record to display
        if (updatedDTR) {
          setEmployeeDTR(updatedDTR)
        }
      }

      setLastAction({
        type: 'out',
        employee: employee.name,
        time: nowISO
      })
      
      // Show recent action card for 20 seconds
      const duration = calculateDuration(record.clock_in, nowISO)
      const actionData = {
        type: 'out',
        employee: employee,
        time: now,
        duration: duration,
        dtr: updatedDTR || null,
        id: Date.now() // Unique ID for history
      }
      
      setRecentAction(actionData)
      
      // Add to history (keep last 10 actions)
      setActionHistory(prev => [actionData, ...prev].slice(0, 10))
      
      // Clear after 20 seconds - only clear the action details, not the employee
      setTimeout(() => {
        setRecentAction(null)
      }, 20000)

      showNotification('Clocked Out Successfully', 'success', employee.name)
      await loadData()
    } catch (error) {
      console.error('Error clocking out:', error)
      showNotification('Error clocking out. Please try again.', 'error')
    }
  }

  // Determine which button should be highlighted based on current time
  const getHighlightedButton = () => {
    // If manual override is active, return the override button
    // Use a ref to get the latest value since this might be called from event handlers
    if (manualOverride) {
      console.log('Using manual override:', manualOverride)
      return manualOverride
    }
    
    const hour = currentTime.getHours()
    const minute = currentTime.getMinutes()
    const timeInMinutes = hour * 60 + minute
    
    // 7:30 AM - 12:00 PM (450 - 720 minutes) -> AM IN
    if (timeInMinutes >= 450 && timeInMinutes < 720) {
      return 'am-in'
    }
    // 12:00 PM - 1:00 PM (720 - 780 minutes) -> AM OUT
    else if (timeInMinutes >= 720 && timeInMinutes < 780) {
      return 'am-out'
    }
    // 1:00 PM - 7:00 PM (780 - 1140 minutes) -> PM IN
    else if (timeInMinutes >= 780 && timeInMinutes < 1140) {
      return 'pm-in'
    }
    // 7:00 PM - 12:00 AM (1140 - 1440 minutes) -> OT IN
    else if (timeInMinutes >= 1140 && timeInMinutes < 1440) {
      return 'ot-in'
    }
    // 12:00 AM - 7:30 AM (0 - 450 minutes) -> OT OUT
    else if (timeInMinutes >= 0 && timeInMinutes < 450) {
      return 'ot-out'
    }
    return null
  }

  // Handle manual override with countdown
  const setManualHighlight = (buttonType) => {
    // Clear any existing timer
    if (overrideTimerRef.current) {
      clearInterval(overrideTimerRef.current)
    }
    
    // Set manual override in both state and ref
    setManualOverride(buttonType)
    manualOverrideRef.current = buttonType
    setOverrideCountdown(20)
    
    // Start countdown
    overrideTimerRef.current = setInterval(() => {
      setOverrideCountdown((prev) => {
        if (prev <= 1) {
          // Timer expired, clear override
          clearInterval(overrideTimerRef.current)
          setManualOverride(null)
          manualOverrideRef.current = null
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (overrideTimerRef.current) {
        clearInterval(overrideTimerRef.current)
      }
    }
  }, [])

  // Quick action handler for AM/PM/OT buttons - ONLY sets manual override, does NOT trigger action
  const handleQuickAction = async (action /* 'in' | 'out' */, buttonType) => {
    try {
      // Set manual highlight for the clicked button - this only changes the highlighted button
      setManualHighlight(buttonType)
      
      // Show notification that manual selection is active
      showNotification(`Manual time selection: ${buttonType.toUpperCase().replace('-', ' ')} - Scan barcode to apply`, 'success')
    } catch (err) {
      console.error('Quick action failed:', err)
      showNotification('Action failed. Please try again.', 'error')
    }
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const calculateDuration = (clockIn, clockOut) => {
    const start = new Date(clockIn)
    const end = clockOut ? new Date(clockOut) : new Date()
    const diff = Math.floor((end - start) / 1000 / 60) // minutes
    const hours = Math.floor(diff / 60)
    const minutes = diff % 60
    return `${hours}h ${minutes}m`
  }

  const currentlyClockedIn = clockRecords.filter(record => !record.clock_out)
  const completedToday = clockRecords.filter(record => record.clock_out)

  // Handle ESC key to exit
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onExit()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onExit])


  // Handle video ended event - play next random trailer
  const handleVideoEnded = () => {
    setIsFadingOut(true)
    
    setTimeout(() => {
      // Select a random trailer (different from current)
      let nextIndex
      do {
        nextIndex = Math.floor(Math.random() * trailers.length)
      } while (nextIndex === activeTrailer && trailers.length > 1)
      
      setActiveTrailer(nextIndex)
      setIsFadingOut(false)
    }, 500)
  }

  // Enable video when starts (muted)
  useEffect(() => {
    if (videoRef.current && activeTrailer !== null) {
      videoRef.current.volume = 0
      videoRef.current.muted = true
      const playPromise = videoRef.current.play()
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('Autoplay prevented:', error)
        })
      }
    }
  }, [activeTrailer])

  return (
    <div className="time-clock-dashboard">
      {/* Header */}
      <div className="clock-header">
        <div className="clock-header-content">
          <div className="clock-logo">
            <div className="clock-icon-wrapper">
              <Clock size={28} />
            </div>
            <div className="clock-title-group">
              <h1 className="clock-title">TIME CLOCK SYSTEM</h1>
              <span className="clock-subtitle">Employee Attendance Management</span>
            </div>
          </div>
          <div className="clock-header-divider"></div>
          <button className="exit-btn" onClick={onExit}>
            <X size={18} />
            <span>Exit</span>
            <kbd className="exit-keyboard-hint">ESC</kbd>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="clock-content">
        {/* Left Panel - Compact Redesign */}
        <div className="clock-left-panel">
          {/* Top Section: Clock & Scanner */}
          <div className="left-panel-top">
            <div className="compact-clock-section">
              <div className="compact-time-display">
                <div className="compact-time">
                  {currentTime.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                  })}
                </div>
                <div className="compact-date">{formatDate(currentTime)}</div>
              </div>
            </div>
            
            {/* Barcode Input - Hidden but still functional */}
            <div className="barcode-section hidden">
              <input
                ref={inputRef}
                type="password"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyPress={handleBarcodeInput}
                placeholder="Scan barcode..."
                className="barcode-input"
                autoFocus
              />
            </div>
          </div>

          {/* Middle Section: Quick Actions */}
          <div className="left-panel-middle">
            <div className="actions-header">
              <Activity size={16} />
              <span>Quick Actions</span>
              {manualOverride && overrideCountdown > 0 && (
                <div className="compact-override">
                  <Zap size={12} />
                  <span>{overrideCountdown}s</span>
                </div>
              )}
            </div>
            
            <div className="compact-buttons-grid">
              <button 
                className={`action-btn am-in ${getHighlightedButton() === 'am-in' ? 'highlighted' : ''}`} 
                onClick={() => handleQuickAction('in', 'am-in')}
              >
                <LogIn size={16} />
                <span>AM IN</span>
              </button>
              <button 
                className={`action-btn am-out ${getHighlightedButton() === 'am-out' ? 'highlighted' : ''}`} 
                onClick={() => handleQuickAction('out', 'am-out')}
              >
                <LogOut size={16} />
                <span>AM OUT</span>
              </button>
              <button 
                className={`action-btn pm-in ${getHighlightedButton() === 'pm-in' ? 'highlighted' : ''}`} 
                onClick={() => handleQuickAction('in', 'pm-in')}
              >
                <LogIn size={16} />
                <span>PM IN</span>
              </button>
              <button 
                className={`action-btn pm-out ${getHighlightedButton() === 'pm-out' ? 'highlighted' : ''}`} 
                onClick={() => handleQuickAction('out', 'pm-out')}
              >
                <LogOut size={16} />
                <span>PM OUT</span>
              </button>
              <button 
                className={`action-btn ot-in ${getHighlightedButton() === 'ot-in' ? 'highlighted' : ''}`} 
                onClick={() => handleQuickAction('in', 'ot-in')}
              >
                <Zap size={16} />
                <span>OT IN</span>
              </button>
              <button 
                className={`action-btn ot-out ${getHighlightedButton() === 'ot-out' ? 'highlighted' : ''}`} 
                onClick={() => handleQuickAction('out', 'ot-out')}
              >
                <Zap size={16} />
                <span>OT OUT</span>
              </button>
            </div>
          </div>

          {/* Bottom Section: Entertainment */}
          <div className="left-panel-bottom">
            <div className="trailer-carousel-mini">
              <div className={`trailer-player-mini ${isFadingOut ? 'fading-out' : ''}`}>
                <video 
                  ref={videoRef}
                  className="trailer-video-mini"
                  autoPlay
                  muted
                  playsInline
                  onEnded={handleVideoEnded}
                  key={activeTrailer}
                >
                  <source src={trailers[activeTrailer].video} type="video/mp4" />
                </video>
                {/* Lower Third Overlay */}
                <div className="trailer-lower-third">
                  <div className="lower-third-label">NEW GAME TRAILER</div>
                  <div className="lower-third-title">{trailers[activeTrailer].title}</div>
                  <div className="lower-third-description">{trailers[activeTrailer].description}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Container for two separate panels */}
        <div className="clock-right-side">
          {/* Recent Action Panel - Redesigned */}
          <div className="recent-action-panel">
            {recentAction ? (
              <div className={`recent-action-card ${recentAction.type === 'in' ? 'clock-in' : 'clock-out'}`}>
                <div className="action-top-bar">
                  <div className="action-status-badge">
                    {recentAction.type === 'in' ? (
                      <LogIn size={14} />
                    ) : (
                      <LogOut size={14} />
                    )}
                    <span>{recentAction.type === 'in' ? 'CLOCKED IN' : 'CLOCKED OUT'}</span>
                  </div>
                  <div className="action-time-badge">{formatTime(recentAction.time)}</div>
                </div>

                <div className="action-employee-compact">
                  <div className="employee-avatar-compact">
                    <User size={24} />
                  </div>
                  <div className="employee-info-compact">
                    <div className="employee-name-compact">{recentAction.employee.name}</div>
                    {recentAction.type === 'in' ? (
                      <div className="employee-shift-compact">
                        <span className={`shift-tag ${recentAction.shiftType}`}>
                          {recentAction.shift} Shift
                        </span>
                      </div>
                    ) : (
                      <div className="employee-duration-compact">
                        Duration: <strong>{recentAction.duration}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* DTR Record Display - Compact */}
                {recentAction.dtr && (
                  <div className="dtr-display-compact">
                    <div className="dtr-header-compact">
                      <Calendar size={12} />
                      <span>Day {recentAction.dtr.day_of_month}</span>
                    </div>
                    <div className="dtr-grid-compact">
                      <div className="dtr-item-compact">
                        <span className="dtr-label-compact">AM IN</span>
                        <span className="dtr-value-compact">{recentAction.dtr.am_in || '--'}</span>
                      </div>
                      <div className="dtr-item-compact">
                        <span className="dtr-label-compact">AM OUT</span>
                        <span className="dtr-value-compact">{recentAction.dtr.am_out || '--'}</span>
                      </div>
                      <div className="dtr-item-compact">
                        <span className="dtr-label-compact">PM IN</span>
                        <span className="dtr-value-compact">{recentAction.dtr.pm_in || '--'}</span>
                      </div>
                      <div className="dtr-item-compact">
                        <span className="dtr-label-compact">PM OUT</span>
                        <span className="dtr-value-compact">{recentAction.dtr.pm_out || '--'}</span>
                      </div>
                      <div className="dtr-item-compact">
                        <span className="dtr-label-compact">OT IN</span>
                        <span className="dtr-value-compact">{recentAction.dtr.ot_in || '--'}</span>
                      </div>
                      <div className="dtr-item-compact">
                        <span className="dtr-label-compact">OT OUT</span>
                        <span className="dtr-value-compact">{recentAction.dtr.ot_out || '--'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="recent-action-card empty">
                <div className="empty-state-compact">
                  <Activity size={32} />
                  <div className="empty-text-compact">
                    <span className="empty-title">No Activity</span>
                    <span className="empty-subtitle">Scan barcode to start</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* History Panel - Shows recent clock actions */}
          <div className="history-panel">
            <div className="history-header">
              <Clock size={20} />
              <h3>Recent Activity</h3>
            </div>
            <div className="history-list">
              {actionHistory.length > 0 ? (
                actionHistory.map((action) => (
                  <div key={action.id} className={`history-item ${action.type}`}>
                    <div className="history-icon">
                      {action.type === 'in' ? (
                        <LogIn size={18} />
                      ) : (
                        <LogOut size={18} />
                      )}
                    </div>
                    <div className="history-details">
                      <div className="history-employee">{action.employee.name}</div>
                      <div className="history-meta">
                        <span className="history-action">
                          {action.type === 'in' ? 'Clocked In' : 'Clocked Out'}
                        </span>
                        {action.type === 'out' && action.duration && (
                          <span className="history-duration"> • {action.duration}</span>
                        )}
                      </div>
                    </div>
                    <div className="history-time">
                      {new Date(action.time).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="history-empty">
                  <Activity size={32} />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* End Right Side */}
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`notification-toast ${notification.type}`}>
          <div className="notif-icon">
            {notification.type === 'success' ? (
              <CheckCircle size={24} />
            ) : (
              <XCircle size={24} />
            )}
          </div>
          <div className="notif-content">
            {notification.employeeName && (
              <div className="notif-name">{notification.employeeName}</div>
            )}
            <div className="notif-message">{notification.message}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TimeClockDashboard

