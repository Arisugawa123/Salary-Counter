import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { UserCheck, Shield, Lock, Key, DollarSign, Palette, Play, X, TrendingUp, Users, Calendar, Clock, Sparkles, Eye, BarChart3, FileText, Settings, Database, Zap, Award, Target, PieChart } from 'lucide-react'
import TimeClockDashboard from './TimeClockDashboard'
import './Login.css'

const Login = () => {
  const { login } = useAuth()
  const [selectedRole, setSelectedRole] = useState(null)
  const [managerCode, setManagerCode] = useState('')
  const [employeeName, setEmployeeName] = useState('')
  const [employeeAccessCode, setEmployeeAccessCode] = useState('')
  const [error, setError] = useState('')
  const [isAnimating, setIsAnimating] = useState(false)
  const [showAccessCode, setShowAccessCode] = useState(false)
  const [showEmployeeFields, setShowEmployeeFields] = useState(false)
  const [showTimeClock, setShowTimeClock] = useState(false)
  
  // Trailer state
  const [activeTrailer, setActiveTrailer] = useState(null)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const videoRef = useRef(null)

  const trailers = [
    {
      id: 'yotei',
      title: 'Ghost of Yōtei',
      subtitle: 'Official Release Date Trailer',
      video: '/trailer.mp4',
      thumbnail: '/yotei-thumb.jpg'
    },
    {
      id: 'battlefield',
      title: 'Battlefield 6',
      subtitle: 'Official Reveal Trailer',
      video: '/battlefield6.mp4',
      thumbnail: '/bf6-thumb.png'
    },
    {
      id: 'gta6',
      title: 'Grand Theft Auto VI',
      subtitle: 'Trailer 1',
      video: '/gta6.mp4',
      thumbnail: '/gta6-thumb.webp'
    },
    {
      id: 'grey-state',
      title: 'Rules of Engagement: The Grey State',
      subtitle: 'Official Reveal Trailer',
      video: '/grey-state-trailer.mp4',
      thumbnail: '/grey-state-thumb.jpg'
    }
  ]

  const MANAGER_ACCESS_CODE = '050123'

  // Auto-play random trailer on load
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * trailers.length)
    setActiveTrailer(randomIndex)
  }, [])

  const handleVideoEnded = () => {
    setIsFadingOut(true)
    setTimeout(() => {
      // Play another random video after current one ends
      const randomIndex = Math.floor(Math.random() * trailers.length)
      setActiveTrailer(randomIndex)
      setIsFadingOut(false)
    }, 800)
  }

  useEffect(() => {
    if (videoRef.current && activeTrailer !== null) {
      videoRef.current.volume = 1.0
      videoRef.current.muted = false
      const playPromise = videoRef.current.play()
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('Autoplay with audio prevented:', error)
          videoRef.current.muted = false
        })
      }
    }
  }, [activeTrailer])

  const roles = [
    { id: 'accountant', title: 'Accountant', icon: UserCheck },
    { id: 'cashier', title: 'Cashier', icon: DollarSign },
    { id: 'graphic-artist', title: 'Graphic Artist', icon: Palette },
    { id: 'manager', title: 'Manager', icon: Shield, requiresCode: true }
  ]

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId)
    setError('')
    setManagerCode('')
    setEmployeeName('')
    setEmployeeAccessCode('')
    
    if (roleId === 'manager') {
      setShowAccessCode(true)
      setShowEmployeeFields(false)
    } else if (roleId === 'graphic-artist') {
      setShowEmployeeFields(true)
      setShowAccessCode(false)
    } else {
      setShowAccessCode(false)
      setShowEmployeeFields(false)
    }
  }

  const handleLogin = async () => {
    if (!selectedRole) {
      setError('Please select a role')
      return
    }

    if (selectedRole === 'manager') {
      if (managerCode !== MANAGER_ACCESS_CODE) {
        setError('Invalid access code')
        return
      }
    }

    if (selectedRole === 'graphic-artist') {
      if (!employeeName.trim()) {
        setError('Please enter your name')
        return
      }
      if (!employeeAccessCode.trim()) {
        setError('Please enter your access code')
        return
      }
      
      const { supabase } = await import('../lib/supabase')
      const { data, error: dbError } = await supabase
        .from('employees')
        .select('name, access_code')
        .ilike('name', employeeName.trim())
        .single()
      
      if (dbError || !data) {
        setError('Employee not found')
        return
      }
      
      if (data.access_code !== employeeAccessCode.trim()) {
        setError('Invalid access code')
        return
      }
    }

    setIsAnimating(true)
    setTimeout(() => {
      const role = roles.find(r => r.id === selectedRole)
      login({
        role: selectedRole,
        roleTitle: role.title,
        employeeName: selectedRole === 'graphic-artist' ? employeeName.trim() : undefined,
        loginTime: new Date().toISOString()
      })
    }, 600)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && selectedRole) {
      handleLogin()
    }
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault()
        setShowTimeClock(true)
      }
      if (e.altKey && e.key === '1') {
        e.preventDefault()
        setShowTimeClock(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (showTimeClock) {
    return <TimeClockDashboard onExit={() => setShowTimeClock(false)} />
  }

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="bg-grid"></div>
      </div>

      <div className="login-wrapper">
        <div className={`login-panel ${isAnimating ? 'login-success' : ''}`}>
          <div className="panel-header">
            <div className="header-logo">
              <Lock size={20} />
            </div>
            <div className="header-title">
              <h1>IRONWOLF SHOP</h1>
              <span className="version">v1.2.1</span>
            </div>
          </div>

          <div className="panel-body">
            <div className="role-selection">
              <h2>Select Role</h2>
              <div className="roles-grid">
                {roles.map((role) => {
                  const Icon = role.icon
                  const isSelected = selectedRole === role.id

                  return (
                    <button
                      key={role.id}
                      className={`role-btn ${isSelected ? 'active' : ''}`}
                      onClick={() => handleRoleSelect(role.id)}
                    >
                      <Icon size={20} />
                      <span>{role.title}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="auth-section">
              {showAccessCode && (
                <div className="auth-field">
                  <label>
                    <Shield size={14} />
                    Manager Access Code
                  </label>
                  <input
                    type="password"
                    value={managerCode}
                    onChange={(e) => setManagerCode(e.target.value)}
                    onKeyPress={handleKeyPress}
                    maxLength="6"
                    placeholder="Enter 6-digit code"
                    autoFocus
                  />
                </div>
              )}

              {showEmployeeFields && (
                <>
                  <div className="auth-field">
                    <label>
                      <Palette size={14} />
                      Employee Name
                    </label>
                    <input
                      type="text"
                      value={employeeName}
                      onChange={(e) => setEmployeeName(e.target.value)}
                      placeholder="Enter your name"
                      autoFocus
                    />
                  </div>
                  <div className="auth-field">
                    <label>
                      <Key size={14} />
                      Access Code
                    </label>
                    <input
                      type="password"
                      value={employeeAccessCode}
                      onChange={(e) => setEmployeeAccessCode(e.target.value)}
                      onKeyPress={handleKeyPress}
                      maxLength="10"
                      placeholder="Enter access code"
                    />
                  </div>
                </>
              )}

              {error && (
                <div className="error-msg">{error}</div>
              )}

              <button
                className="login-btn"
                onClick={handleLogin}
                disabled={!selectedRole || (selectedRole === 'manager' && !managerCode) || (selectedRole === 'graphic-artist' && (!employeeName || !employeeAccessCode))}
              >
                {isAnimating ? (
                  <span>Logging in...</span>
                ) : (
                  <>
                    <Lock size={16} />
                    <span>Continue as {selectedRole ? roles.find(r => r.id === selectedRole)?.title : 'User'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="panel-footer">
            <div className="features-section">
              <div className="features-title">
                <Zap size={14} />
                <span>System Features</span>
              </div>
              <div className="features-bar">
              <div className="feature-item">
                <TrendingUp size={18} />
                  <div className="feature-text">
                    <span className="feature-title">Analytics</span>
                    <span className="feature-desc">Real-time data</span>
                  </div>
                </div>
                <div className="feature-item">
                  <Users size={18} />
                  <div className="feature-text">
                    <span className="feature-title">Management</span>
                    <span className="feature-desc">Team control</span>
                  </div>
                </div>
                <div className="feature-item">
                  <Calendar size={18} />
                  <div className="feature-text">
                    <span className="feature-title">Tracking</span>
                    <span className="feature-desc">Time records</span>
                  </div>
                </div>
                <div className="feature-item">
                  <Clock size={18} />
                  <div className="feature-text">
                    <span className="feature-title">Payroll</span>
                    <span className="feature-desc">Auto calculation</span>
                  </div>
                </div>
                <div className="feature-item">
                  <BarChart3 size={18} />
                  <div className="feature-text">
                    <span className="feature-title">Reports</span>
                    <span className="feature-desc">Detailed insights</span>
                  </div>
                </div>
                <div className="feature-item">
                  <FileText size={18} />
                  <div className="feature-text">
                    <span className="feature-title">Documents</span>
                    <span className="feature-desc">Export & print</span>
                  </div>
                </div>
                <div className="feature-item">
                  <Settings size={18} />
                  <div className="feature-text">
                    <span className="feature-title">Settings</span>
                    <span className="feature-desc">Customize system</span>
                  </div>
                </div>
                <div className="feature-item">
                  <Database size={18} />
                  <div className="feature-text">
                    <span className="feature-title">Database</span>
                    <span className="feature-desc">Secure storage</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="time-clock-section">
              <div className="time-hint">
                <Clock size={14} />
                <div className="time-hint-content">
                  <span className="time-hint-title">Quick Access</span>
                  <span className="time-hint-text">Press <kbd>CTRL</kbd> + <kbd>A</kbd> for Time Clock</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="trailer-panel">
          <div className="trailer-header">
            <div className="header-content">
              <div className="header-left">
                <div className="header-icon">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2>What's New</h2>
                  <p>November 2, 2025</p>
                </div>
              </div>
              <div className="header-right">
                <span className="update-badge">v1.2</span>
              </div>
            </div>
          </div>

          <div className="trailer-section-title">
            <h3>New Games Trailer</h3>
          </div>

          <div className="trailer-container">
            {activeTrailer !== null && (
              <div className={`trailer-player-row ${isFadingOut ? 'fading' : ''}`}>
                <div className="video-wrapper">
                  <video 
                    ref={videoRef}
                    className="trailer-video"
                    autoPlay
                    playsInline
                    onEnded={handleVideoEnded}
                    key={activeTrailer}
                  >
                    <source src={trailers[activeTrailer].video} type="video/mp4" />
                  </video>
                </div>
                <div 
                  className="video-description"
                  style={{ backgroundImage: `url(${trailers[activeTrailer].thumbnail})` }}
                >
                  <div className="video-description-overlay"></div>
                  <div className="video-description-content">
                    <h3>{trailers[activeTrailer].title}</h3>
                    <p className="video-subtitle">{trailers[activeTrailer].subtitle}</p>
                    <div className="video-info">
                      <p>Watch the latest trailer showcasing new features and updates to the system.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="updates-list">
            <div className="update-card">
              <Key size={18} />
              <div>
                <h3>Authentication & Security</h3>
                <ul>
                  <li>Role-based login system</li>
                  <li>Manager access code protection</li>
                  <li>Settings access requirement</li>
                </ul>
              </div>
            </div>

            <div className="update-card">
              <TrendingUp size={18} />
              <div>
                <h3>Custom Commissions</h3>
                <ul>
                  <li>Unlimited commission types</li>
                  <li>Dynamic salary inputs</li>
                  <li>Full database integration</li>
                </ul>
              </div>
            </div>

            <div className="update-card">
              <Eye size={18} />
              <div>
                <h3>Data Privacy</h3>
                <ul>
                  <li>Accountant data restrictions</li>
                  <li>Employee rate censoring</li>
                  <li>Limited dashboard access</li>
                </ul>
              </div>
            </div>

            <div className="update-card">
              <Zap size={18} />
              <div>
                <h3>Performance</h3>
                <ul>
                  <li>Fast data processing</li>
                  <li>Optimized queries</li>
                  <li>Real-time updates</li>
                </ul>
              </div>
            </div>

            <div className="update-card">
              <Award size={18} />
              <div>
                <h3>Features</h3>
                <ul>
                  <li>Advanced reporting tools</li>
                  <li>Export capabilities</li>
                  <li>Print functionality</li>
                </ul>
              </div>
            </div>

            <div className="update-card">
              <Target size={18} />
              <div>
                <h3>Accuracy</h3>
                <ul>
                  <li>Precise calculations</li>
                  <li>Overtime tracking</li>
                  <li>Commission handling</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login

