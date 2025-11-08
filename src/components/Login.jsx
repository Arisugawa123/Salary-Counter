import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { UserCheck, Shield, Lock, CheckCircle, Key, Eye, DollarSign, Sparkles, TrendingUp, Users, Calendar, Clock, Play, X } from 'lucide-react'
import './Login.css'

const Login = () => {
  const { login } = useAuth()
  const [selectedRole, setSelectedRole] = useState(null)
  const [managerCode, setManagerCode] = useState('')
  const [error, setError] = useState('')
  const [isAnimating, setIsAnimating] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [showAccessCode, setShowAccessCode] = useState(false)
  
  // Trailer carousel state
  const [activeTrailer, setActiveTrailer] = useState(null) // null = show thumbnails, 0 = yotei, 1 = battlefield, 2 = gta6
  const [selectedTrailer, setSelectedTrailer] = useState(null) // Shows which trailer is about to play
  const [isFadingOut, setIsFadingOut] = useState(false) // For smooth fade out
  const videoRef = useRef(null) // Reference to video element

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
    }
  ]

  const MANAGER_ACCESS_CODE = '050123'

  // Auto-carousel effect - show thumbnails, select one, show for 3s, then play
  useEffect(() => {
    let selectionTimeout

    if (activeTrailer === null && selectedTrailer === null && !isFadingOut) {
      // Step 1: Pick random trailer and highlight it after delay
      selectionTimeout = setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * trailers.length)
        setSelectedTrailer(randomIndex)
        
        // Step 2: After 3 seconds showing selected thumbnail, play the video
        setTimeout(() => {
          setActiveTrailer(randomIndex)
          setSelectedTrailer(null)
        }, 3000)
      }, 1000)
    }

    return () => {
      if (selectionTimeout) clearTimeout(selectionTimeout)
    }
  }, [activeTrailer, selectedTrailer, isFadingOut])

  // Handle video ended event
  const handleVideoEnded = () => {
    // Fade out video before returning to thumbnails
    setIsFadingOut(true)
    
    setTimeout(() => {
      setActiveTrailer(null)
      setIsFadingOut(false)
    }, 800) // Fade out duration
  }

  // Enable audio when video starts
  useEffect(() => {
    if (videoRef.current && activeTrailer !== null) {
      videoRef.current.volume = 1.0
      videoRef.current.muted = false
      // Try to play with audio
      const playPromise = videoRef.current.play()
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('Autoplay with audio prevented:', error)
          // If autoplay with audio fails, ensure it's unmuted
          videoRef.current.muted = false
        })
      }
    }
  }, [activeTrailer])

  const roles = [
    {
      id: 'accountant',
      title: 'Accountant',
      description: 'Full access to payroll and financial records',
      icon: UserCheck
    },
    {
      id: 'cashier',
      title: 'Cashier',
      description: 'Process transactions and view basic records',
      icon: DollarSign
    },
    {
      id: 'manager',
      title: 'Manager',
      description: 'Manage employees and approve records',
      icon: Shield,
      requiresCode: true
    }
  ]

  const handleRoleSelect = (roleId) => {
    // If switching away from manager, trigger exit animation
    if (selectedRole === 'manager' && roleId !== 'manager' && showAccessCode) {
      setIsExiting(true)
      setTimeout(() => {
        setShowAccessCode(false)
        setIsExiting(false)
        setSelectedRole(roleId)
        setManagerCode('')
        setError('')
      }, 400) // Match the slideUp animation duration
    } else {
      setSelectedRole(roleId)
      setError('')
      setManagerCode('')
      
      // Show access code field for manager
      if (roleId === 'manager') {
        setShowAccessCode(true)
      } else {
        setShowAccessCode(false)
      }
    }
  }

  const handleLogin = () => {
    if (!selectedRole) {
      setError('Please select a role')
      return
    }

    // Check manager access code
    if (selectedRole === 'manager') {
      if (managerCode !== MANAGER_ACCESS_CODE) {
        setError('Invalid access code')
        return
      }
    }

    // Successful login
    setIsAnimating(true)
    setTimeout(() => {
      const role = roles.find(r => r.id === selectedRole)
      login({
        role: selectedRole,
        roleTitle: role.title,
        loginTime: new Date().toISOString()
      })
    }, 600)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && selectedRole) {
      handleLogin()
    }
  }

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <div className="login-content-wrapper">
      <div className={`login-card ${isAnimating ? 'login-success' : ''}`}>
        <div className="login-header">
          <div className="logo-circle">
            <Lock size={32} />
          </div>
          <h1>IRONWOLF SHOP SYSTEM</h1>
          <p className="version-tag">v1.2.1</p>
          <p>Select your role to continue</p>
        </div>

        <div className="roles-container">
          {roles.map((role) => {
            const Icon = role.icon
            const isSelected = selectedRole === role.id

            return (
              <div
                key={role.id}
                className={`role-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleRoleSelect(role.id)}
                style={{
                  '--role-gradient': role.gradient
                }}
              >
                <div className="role-icon" style={{ background: role.gradient }}>
                  <Icon size={28} />
                </div>
                <div className="role-content">
                  <h3>{role.title}</h3>
                  <p>{role.description}</p>
                </div>
                {isSelected && (
                  <div className="selected-indicator">
                    <CheckCircle size={20} />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {showAccessCode && (
          <div className={`access-code-section ${isExiting ? 'exiting' : ''}`}>
            <label htmlFor="accessCode">
              <Shield size={16} />
              Manager Access Code
            </label>
            <div className="input-wrapper">
              <input
                id="accessCode"
                type="password"
                value={managerCode}
                onChange={(e) => setManagerCode(e.target.value)}
                onKeyPress={handleKeyPress}
                maxLength="6"
                autoFocus
              />
              <span className={`custom-placeholder ${managerCode ? 'hidden' : ''}`}>
                Enter 6-digit access code
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <button
          className="login-button"
          onClick={handleLogin}
          disabled={!selectedRole || (selectedRole === 'manager' && !managerCode)}
        >
          {isAnimating ? (
            <span className="button-loading">Logging in...</span>
          ) : (
            <>
              <Lock size={18} />
              Continue as {selectedRole ? roles.find(r => r.id === selectedRole)?.title : 'User'}
            </>
          )}
        </button>

        {/* Animated Showcase Features */}
        <div className="login-showcase">
          <h3>Why Choose This System?</h3>
          <div className="login-features">
            <div className="login-feature-item">
              <div className="login-feature-icon">
                <TrendingUp size={20} />
              </div>
              <div className="login-feature-text">
                <h4>Real-time Analytics</h4>
                <p>Track earnings & commissions</p>
              </div>
              <div className="feature-pulse"></div>
            </div>

            <div className="login-feature-item">
              <div className="login-feature-icon">
                <Users size={20} />
              </div>
              <div className="login-feature-text">
                <h4>Employee Management</h4>
                <p>Unlimited employees with custom rates</p>
              </div>
              <div className="feature-pulse"></div>
            </div>

            <div className="login-feature-item">
              <div className="login-feature-icon">
                <Calendar size={20} />
              </div>
              <div className="login-feature-text">
                <h4>Time Tracking</h4>
                <p>Accurate records with overtime</p>
              </div>
              <div className="feature-pulse"></div>
            </div>

            <div className="login-feature-item">
              <div className="login-feature-icon">
                <Clock size={20} />
              </div>
              <div className="login-feature-text">
                <h4>Payroll Automation</h4>
                <p>Automated salary calculations</p>
              </div>
              <div className="feature-pulse"></div>
            </div>
          </div>
        </div>

        <div className="login-footer">
          <p>© 2024 IRONWOLF SHOP SYSTEM v1.2.1</p>
        </div>
      </div>

      {/* Version Update Section */}
      <div className="version-update-section">
        <div className="version-header">
          <span className="version-badge">v1.2</span>
          <h2>What's New</h2>
          <p className="update-date">November 2, 2025</p>
        </div>

        {/* Trailer Carousel */}
        <div className="trailer-carousel">
          {activeTrailer === null ? (
            // Show thumbnails
            <div className="trailer-thumbnails">
              {trailers.map((trailer, index) => (
                <div 
                  key={trailer.id}
                  className={`trailer-thumbnail ${
                    selectedTrailer === index ? 'selected' : 
                    selectedTrailer !== null ? 'hidden' : ''
                  }`}
                  onClick={() => {
                    if (!selectedTrailer && !activeTrailer) {
                      setSelectedTrailer(index)
                      setTimeout(() => {
                        setActiveTrailer(index)
                        setSelectedTrailer(null)
                      }, 3000)
                    }
                  }}
                  style={{ backgroundImage: `url(${trailer.thumbnail})` }}
                >
                  <div className="thumbnail-overlay">
                    <div className="play-button">
                      <Play size={48} fill="#ffffff" />
                    </div>
                    <div className="trailer-info">
                      <h4>{trailer.title}</h4>
                      <p>{trailer.subtitle}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Show active video
            <div className={`trailer-player ${isFadingOut ? 'fading-out' : ''}`}>
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
          )}
        </div>

        <div className="updates-grid">
          <div className="update-item">
            <div className="update-icon">
              <Key size={24} />
            </div>
            <div className="update-content">
              <h3>Authentication & Security</h3>
              <ul>
                <li>Role-based login system</li>
                <li>Manager access code protection</li>
                <li>Settings access requirement</li>
              </ul>
            </div>
          </div>

          <div className="update-item">
            <div className="update-icon">
              <Eye size={24} />
            </div>
            <div className="update-content">
              <h3>Data Privacy</h3>
              <ul>
                <li>Accountant data restrictions</li>
                <li>Employee rate censoring</li>
                <li>Limited dashboard access</li>
              </ul>
            </div>
          </div>

          <div className="update-item">
            <div className="update-icon">
              <DollarSign size={24} />
            </div>
            <div className="update-content">
              <h3>Custom Commissions</h3>
              <ul>
                <li>Unlimited commission types</li>
                <li>Dynamic salary inputs</li>
                <li>Full database integration</li>
              </ul>
            </div>
          </div>

          <div className="update-item">
            <div className="update-icon">
              <Sparkles size={24} />
            </div>
            <div className="update-content">
              <h3>UI/UX Improvements</h3>
              <ul>
                <li>Smooth fade animations</li>
                <li>Clean number inputs</li>
                <li>Enhanced notifications</li>
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

