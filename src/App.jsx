// App.js
import React, { useState } from 'react'
import Header from './components/Header'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Predictions from './pages/Predictions'
import Simulation from './pages/Simulation'
import StreamlitLogs from './pages/StreamlitLogs'

export default function App() {
  const [page, setPage] = useState('home')
  const [engineStatus, setEngineStatus] = useState('STANDBY')
  const [lastUpdate, setLastUpdate] = useState(null)
  const [showLogs, setShowLogs] = useState(false)

  const handleStatusChange = (status) => {
    setEngineStatus(status)
    setLastUpdate(new Date())
  }

  const renderPage = () => {
    switch (page) {
      case 'home': return <Home />
      case 'dashboard': return <Dashboard onStatusChange={handleStatusChange} />
      case 'predictions': return <Predictions />
      case 'simulation': return <Simulation />
      default: return <Dashboard onStatusChange={handleStatusChange} />
    }
  }

  return (
    <div className="min-h-screen bg-steel-950 relative overflow-hidden">
      <Header
        page={page}
        setPage={setPage}
        engineStatus={engineStatus}
        lastUpdate={lastUpdate}
        onToggleLogs={() => setShowLogs(!showLogs)}
        showLogs={showLogs}
      />

      <main>
        {renderPage()}
      </main>

      <StreamlitLogs isVisible={showLogs} onClose={() => setShowLogs(false)} />
    </div>
  )
}