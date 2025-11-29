import { useEffect } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'
import './Alert.css'

const Alert = ({ isOpen, onClose, type = 'success', title, message }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      // Auto close after 3 seconds for success, 5 seconds for error
      const timer = setTimeout(() => {
        onClose()
      }, type === 'success' ? 3000 : 5000)
      
      return () => {
        clearTimeout(timer)
        document.body.style.overflow = 'unset'
      }
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, type, onClose])

  if (!isOpen) return null

  const Icon = type === 'success' ? CheckCircle : XCircle

  return (
    <div className="alert-overlay" onClick={onClose}>
      <div className="alert-content" onClick={(e) => e.stopPropagation()}>
        <button className="alert-close" onClick={onClose}>
          <X size={18} />
        </button>
        
        <div className={`alert-icon alert-icon-${type}`}>
          <Icon size={48} />
        </div>
        
        {title && <h2 className="alert-title">{title}</h2>}
        <p className="alert-message">{message}</p>
        
        <div className="alert-actions">
          <button 
            className={`alert-button alert-button-${type}`}
            onClick={onClose}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}

export default Alert

