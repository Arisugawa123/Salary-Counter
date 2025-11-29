// Print Server for Network Printing to XPrinter
// Run this on the PC connected to the xprinter via Ethernet
// Usage: node print-server.js

const express = require('express')
const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')
const app = express()
const PORT = 3001

// XPrinter configuration
const XPRINTER_IP = '192.168.1.100' // Replace with your xprinter IP address
const XPRINTER_NAME = 'xprinter' // Replace with your xprinter network name

app.use(express.json({ limit: '10mb' }))

// Print endpoint
app.post('/api/print', async (req, res) => {
  try {
    const { printerName, printerIP, html, orderId } = req.body

    // Use the provided printer name/IP or default to xprinter
    const targetPrinter = printerName || XPRINTER_NAME
    const targetIP = printerIP || XPRINTER_IP

    // Create temporary HTML file
    const tempDir = path.join(__dirname, 'temp')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    const tempFile = path.join(tempDir, `print_${orderId || Date.now()}.html`)
    fs.writeFileSync(tempFile, html)

    // Method 1: Use Windows print command (if on Windows)
    if (process.platform === 'win32') {
      // Print using Windows print command to specific printer
      const printCommand = `powershell -Command "Get-Content '${tempFile}' | Out-Printer -Name '${targetPrinter}'"`
      
      exec(printCommand, (error, stdout, stderr) => {
        if (error) {
          console.error('Print error:', error)
          // Try alternative method using rundll32
          const altCommand = `rundll32 printui.dll,PrintUIEntry /in /n "${targetPrinter}" /f "${tempFile}"`
          exec(altCommand, (altError) => {
            if (altError) {
              console.error('Alternative print error:', altError)
              res.status(500).json({ error: 'Failed to print', details: altError.message })
            } else {
              // Clean up temp file
              setTimeout(() => fs.unlinkSync(tempFile), 5000)
              res.status(200).json({ success: true, message: 'Print job sent to xprinter' })
            }
          })
        } else {
          // Clean up temp file
          setTimeout(() => fs.unlinkSync(tempFile), 5000)
          res.status(200).json({ success: true, message: 'Print job sent to xprinter' })
        }
      })
    }
    // Method 2: Use CUPS (if on Linux/Mac)
    else if (process.platform === 'linux' || process.platform === 'darwin') {
      const printCommand = `lp -d ${targetPrinter} ${tempFile}`
      exec(printCommand, (error, stdout, stderr) => {
        if (error) {
          console.error('Print error:', error)
          res.status(500).json({ error: 'Failed to print', details: error.message })
        } else {
          // Clean up temp file
          setTimeout(() => fs.unlinkSync(tempFile), 5000)
          res.status(200).json({ success: true, message: 'Print job sent to xprinter' })
        }
      })
    }
    else {
      res.status(500).json({ error: 'Unsupported platform' })
    }
  } catch (error) {
    console.error('Print server error:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', printer: XPRINTER_NAME, ip: XPRINTER_IP })
})

app.listen(PORT, () => {
  console.log(`Print server running on http://localhost:${PORT}`)
  console.log(`Configured for printer: ${XPRINTER_NAME} at ${XPRINTER_IP}`)
  console.log('Make sure the xprinter is accessible on the network')
})

