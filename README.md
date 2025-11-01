# Salary Counter Dashboard

A modern, sleek black and white tech-themed salary tracking dashboard built with React and Vite.

## Features

- **Real-Time Salary Counter**: Start a timer and watch your earnings accumulate in real-time
- **Customizable Salary Input**: Easily adjust your annual salary to see updated calculations
- **Comprehensive Breakdown**: View earnings per second, minute, hour, day, week, and month
- **Modern UI/UX**: Clean black and white design with smooth animations
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Collapsible Sidebar**: Toggle between expanded and minimized sidebar views
- **Professional Dashboard Layout**: Includes header with search, notifications, and user profile

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist` folder.

## Usage

1. **Set Your Salary**: Enter your annual salary in the top-left stat card
2. **Start the Counter**: Click the "Start" button to begin tracking your earnings
3. **Monitor Progress**: Watch your earnings accumulate in real-time
4. **View Breakdown**: Check the right panel for detailed earnings breakdown
5. **Pause/Reset**: Use the controls to pause or reset the counter

## Tech Stack

- **React 18**: Modern React with hooks
- **Vite**: Lightning-fast build tool
- **Lucide React**: Beautiful icon library
- **CSS3**: Custom styling with animations and transitions

## Project Structure

```
salary-counter/
├── src/
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── Header.css
│   │   ├── Sidebar.jsx
│   │   ├── Sidebar.css
│   │   ├── Dashboard.jsx
│   │   └── Dashboard.css
│   ├── App.jsx
│   ├── App.css
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Customization

You can easily customize the color scheme by modifying the CSS variables in the component stylesheets. The current design uses a black and white theme, but you can adapt it to any color scheme you prefer.

## License

MIT License - feel free to use this project for personal or commercial purposes.
