import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!')
  console.log('Please create a .env file in the root directory with:')
  console.log('VITE_SUPABASE_URL=your-project-url')
  console.log('VITE_SUPABASE_ANON_KEY=your-anon-key')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false // Since this is not a user-based system
  }
})

// Helper functions for database operations

// Convert snake_case to camelCase
const toCamelCase = (obj) => {
  if (!obj) return obj
  if (Array.isArray(obj)) return obj.map(toCamelCase)
  if (typeof obj !== 'object') return obj
  
  const camelObj = {}
  for (const [key, value] of Object.entries(obj)) {
    // Handle both letters and numbers after underscores
    const camelKey = key.replace(/_([a-z0-9])/g, (_, char) => char.toUpperCase())
    camelObj[camelKey] = typeof value === 'object' && value !== null && !Array.isArray(value) 
      ? toCamelCase(value) 
      : value
  }
  return camelObj
}

// Convert camelCase to snake_case
const toSnakeCase = (obj) => {
  if (!obj) return obj
  if (typeof obj !== 'object') return obj
  
  const snakeObj = {}
  for (const [key, value] of Object.entries(obj)) {
    // Convert camelCase to snake_case, handling numbers properly
    const snakeKey = key
      .replace(/([A-Z])/g, '_$1')
      .replace(/([a-z])(\d)/g, '$1_$2')
      .replace(/(\d)([A-Z])/g, '$1_$2')
      .toLowerCase()
      .replace(/^_/, '') // Remove leading underscore if any
    
    snakeObj[snakeKey] = typeof value === 'object' && value !== null && !Array.isArray(value)
      ? toSnakeCase(value)
      : value
  }
  return snakeObj
}

// ==================== EMPLOYEES ====================

export const fetchEmployees = async () => {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching employees:', error)
    throw error
  }
  return (data || []).map(toCamelCase)
}

export const createEmployee = async (employee) => {
  const snakeEmployee = toSnakeCase(employee)
  const { data, error } = await supabase
    .from('employees')
    .insert([snakeEmployee])
    .select()
    .single()

  if (error) {
    console.error('Error creating employee:', error)
    throw error
  }
  return toCamelCase(data)
}

export const updateEmployee = async (id, updates) => {
  const snakeUpdates = toSnakeCase(updates)
  const { data, error } = await supabase
    .from('employees')
    .update(snakeUpdates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating employee:', error)
    throw error
  }
  return toCamelCase(data)
}

export const deleteEmployee = async (id) => {
  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting employee:', error)
    throw error
  }
}

// ==================== TIME RECORDS / PAYROLL ====================

export const fetchTimeRecords = async () => {
  const { data, error } = await supabase
    .from('time_records')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching time records:', error)
    throw error
  }
  return (data || []).map(toCamelCase)
}

export const createTimeRecord = async (record) => {
  const snakeRecord = toSnakeCase(record)
  const { data, error } = await supabase
    .from('time_records')
    .insert([snakeRecord])
    .select()
    .single()

  if (error) {
    console.error('Error creating time record:', error)
    throw error
  }
  return toCamelCase(data)
}

export const updateTimeRecord = async (id, updates) => {
  const snakeUpdates = toSnakeCase(updates)
  const { data, error } = await supabase
    .from('time_records')
    .update(snakeUpdates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating time record:', error)
    throw error
  }
  return toCamelCase(data)
}

export const deleteTimeRecord = async (id) => {
  const { error } = await supabase
    .from('time_records')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting time record:', error)
    throw error
  }
}

// ==================== CASH ADVANCE RECORDS ====================

export const fetchCashAdvanceRecords = async () => {
  const { data, error } = await supabase
    .from('cash_advance_records')
    .select('*')
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching cash advance records:', error)
    throw error
  }
  return (data || []).map(toCamelCase)
}

export const createCashAdvanceRecord = async (record) => {
  const snakeRecord = toSnakeCase(record)
  const { data, error } = await supabase
    .from('cash_advance_records')
    .insert([snakeRecord])
    .select()
    .single()

  if (error) {
    console.error('Error creating cash advance record:', error)
    throw error
  }
  return toCamelCase(data)
}

export const updateCashAdvanceRecord = async (id, updates) => {
  const snakeUpdates = toSnakeCase(updates)
  const { data, error } = await supabase
    .from('cash_advance_records')
    .update(snakeUpdates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating cash advance record:', error)
    throw error
  }
  return toCamelCase(data)
}

export const deleteCashAdvanceRecord = async (id) => {
  const { error } = await supabase
    .from('cash_advance_records')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting cash advance record:', error)
    throw error
  }
}

// ==================== DAY OFF RECORDS ====================

export const fetchDayOffRecords = async () => {
  const { data, error } = await supabase
    .from('day_off_records')
    .select('*')
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching day off records:', error)
    throw error
  }
  return (data || []).map(toCamelCase)
}

export const createDayOffRecord = async (record) => {
  const snakeRecord = toSnakeCase(record)
  const { data, error } = await supabase
    .from('day_off_records')
    .insert([snakeRecord])
    .select()
    .single()

  if (error) {
    console.error('Error creating day off record:', error)
    throw error
  }
  return toCamelCase(data)
}

export const updateDayOffRecord = async (id, updates) => {
  const snakeUpdates = toSnakeCase(updates)
  const { data, error } = await supabase
    .from('day_off_records')
    .update(snakeUpdates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating day off record:', error)
    throw error
  }
  return toCamelCase(data)
}

export const deleteDayOffRecord = async (id) => {
  const { error } = await supabase
    .from('day_off_records')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting day off record:', error)
    throw error
  }
}

// ==================== SETTINGS ====================

export const fetchSettings = async () => {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .single()

  if (error) {
    // If no settings found, return defaults
    if (error.code === 'PGRST116') {
      return {
        defaultHoursPerShift: 9,
        rushTarpCommissionRate: 50,
        regularCommissionRate: 20,
        lateDeductionRate: 1,
        maxAbsencesForDayOff: 3,
        customCommissions: []
      }
    }
    console.error('Error fetching settings:', error)
    throw error
  }
  return toCamelCase(data)
}

export const updateSettings = async (settings) => {
  const snakeSettings = toSnakeCase(settings)
  
  // First, check if settings exist
  const { data: existing } = await supabase
    .from('settings')
    .select('id')
    .single()

  if (existing) {
    // Update existing settings
    const { data, error } = await supabase
      .from('settings')
      .update(snakeSettings)
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating settings:', error)
      throw error
    }
    return toCamelCase(data)
  } else {
    // Create new settings
    const { data, error } = await supabase
      .from('settings')
      .insert([snakeSettings])
      .select()
      .single()

    if (error) {
      console.error('Error creating settings:', error)
      throw error
    }
    return toCamelCase(data)
  }
}

