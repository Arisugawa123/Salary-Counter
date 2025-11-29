# XPrinter Network Printing Setup Guide

## Overview
This setup allows automatic printing to your xprinter network printer when processing Tarpaulin orders, without requiring printer selection.

## Setup Instructions

### Option 1: Print Server (Recommended for Network Printing)

1. **Install Node.js** (if not already installed)
   - Download from: https://nodejs.org/
   - Install Node.js on the PC connected to the xprinter via Ethernet

2. **Install Dependencies**
   ```bash
   npm install express
   ```
   Or copy `package-print-server.json` to `package.json` and run:
   ```bash
   npm install
   ```

3. **Configure Printer Settings**
   - Open `print-server.js`
   - Update these lines with your xprinter details:
     ```javascript
     const XPRINTER_IP = '192.168.1.100' // Replace with your xprinter IP address
     const XPRINTER_NAME = 'xprinter' // Replace with your xprinter network name
     ```

4. **Find Your XPrinter IP Address**
   - On Windows: Open Command Prompt and run `arp -a` to see network devices
   - Or check your router's connected devices list
   - Or print a network configuration page from the xprinter

5. **Find Your XPrinter Network Name**
   - On Windows: Go to Settings > Devices > Printers & scanners
   - Find your xprinter and note the exact name
   - Or check the printer's network settings

6. **Start the Print Server**
   ```bash
   node print-server.js
   ```
   The server will run on `http://localhost:3001`

7. **Keep the Server Running**
   - The print server must be running whenever you want to print
   - Consider running it as a Windows Service or using PM2:
     ```bash
     npm install -g pm2
     pm2 start print-server.js
     pm2 save
     pm2 startup
     ```

### Option 2: Direct Windows Printing (Simpler, but requires printer to be on same PC)

If the xprinter is installed as a network printer on the same PC running the application:

1. **Update the print function** in `GraphicArtistDashboard.jsx`
2. Change the `printerName` to match your xprinter's exact Windows printer name
3. The system will use Windows print commands directly

### Testing

1. Process a Tarpaulin order
2. Check the browser console for print status
3. Verify the print job appears in the xprinter queue

### Troubleshooting

- **Print job not sent**: Check that the print server is running
- **Wrong printer**: Verify the printer name/IP in `print-server.js`
- **Connection error**: Ensure the xprinter is on the same network and accessible
- **Permission error**: Run the print server with administrator privileges if needed

### Network Printer Configuration

To ensure the xprinter is accessible:

1. **Enable Network Printing** on the xprinter
2. **Assign Static IP** to the xprinter (recommended)
3. **Install Printer Driver** on the print server PC
4. **Test Print** from Windows to verify the printer works

### Security Note

The print server runs on `localhost:3001` by default. For production:
- Use a firewall to restrict access
- Consider adding authentication
- Use HTTPS if accessing over network

