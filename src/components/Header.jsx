// components/Header.js
import React, { useState, useEffect } from 'react'
import { Home, Activity, Cpu, FlaskConical, BarChart3, Radio, LayoutPanelTop } from 'lucide-react'

const NAV = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'dashboard', label: 'Real-time Monitor', icon: Activity },
  { id: 'predictions', label: 'ML Predictions', icon: BarChart3 },
  { id: 'simulation', label: 'Simulation', icon: FlaskConical },
]

export default function Header({ page, setPage, engineStatus, lastUpdate, onToggleLogs, showLogs }) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const statusColor = engineStatus === 'RUNNING' ? '#10b981'
    : engineStatus === 'ALARM' ? '#f59e0b'
      : engineStatus === 'SHUTDOWN' ? '#ef4444'
        : '#4b5563'

  return (
    <header className="bg-steel-900 border-b border-steel-700 sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 py-2 border-b border-steel-700">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 border border-cyan-500 flex items-center justify-center">
              <div className="w-4 h-4 bg-cyan-500 opacity-20 absolute" />
              <span className="font-display font-800 text-cyan-400 text-sm relative z-10">A</span>
            </div>
          </div>
          <div>
            <div className="font-display font-700 text-white uppercase tracking-widest text-base leading-none">
              ACKERMAN
            </div>
            <div className="font-mono text-xs text-steel-400 leading-none">
              Digital Twin Platform
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: statusColor,
                boxShadow: `0 0 8px ${statusColor}`,
              }}
            />
            <span className="font-mono text-xs" style={{ color: statusColor }}>
              {engineStatus}
            </span>
          </div>
          <div className="font-display font-600 text-white uppercase tracking-widest text-sm">
            MAN 6L23/30H
          </div>
          <div className="font-mono text-xs text-steel-400">
            GenSet · 720 RPM · 780 kW
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onToggleLogs}
            className={`flex items-center gap-2 px-3 py-1.5 rounded border transition-all duration-200 ${showLogs
              ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400'
              : 'bg-steel-800 border-steel-700 text-steel-400 hover:text-white'
              }`}
          >
            <Cpu className={`w-3.5 h-3.5 ${showLogs ? 'animate-pulse' : ''}`} />
            <span className="font-mono text-[10px] font-bold uppercase tracking-tighter">Backend Logs</span>
          </button>

          <div className="h-4 w-[1px] bg-steel-700" />

          {lastUpdate && (
            <div className="hidden md:flex items-center gap-1.5 text-xs font-mono text-steel-500">
              <Radio className="w-3 h-3 text-cyan-500" />
              <span>LIVE</span>
            </div>
          )}
          <div className="font-mono text-xs text-steel-400 whitespace-nowrap">
            {time.toISOString().replace('T', ' ').slice(0, 19)}
          </div>
        </div>
      </div>

      <div className="flex">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setPage(id)}
            className={`
              flex items-center gap-2 px-5 py-2.5 text-xs font-display font-600 uppercase tracking-widest 
              border-b-2 transition-all duration-200
              ${page === id
                ? 'border-cyan-400 text-cyan-400 bg-steel-800/50'
                : 'border-transparent text-steel-400 hover:text-slate-300 hover:border-steel-500'
              }
            `}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>
    </header>
  )
}