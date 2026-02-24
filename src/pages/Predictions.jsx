import React, { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts'
import { supabase, TABLES } from '../lib/supabase'
import { Brain, AlertTriangle, CheckCircle, Clock, TrendingDown, Activity } from 'lucide-react'

const HEALTH_COLORS = {
  healthy: '#10b981',
  degraded: '#f59e0b',
  critical: '#ef4444',
}

const FAULT_ICONS = {
  'fouled_injector': '',
  'lube_oil_degradation': '',
  'cooling_water_issue': '',
  'turbocharger_fouling': '',
  'bearing_wear': '',
  'none': '✓',
}

export default function Predictions() {
  const [prediction, setPrediction] = useState(null)
  const [history, setHistory] = useState([])
  const [connected, setConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)

  useEffect(() => {
    // Initial fetch
    const fetch = async () => {
      const { data, error } = await supabase
        .from(TABLES.ML_PREDICTIONS)
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(30)
      if (!error && data && data.length > 0) {
        setPrediction(data[0])
        setHistory([...data].reverse())
        setConnected(true)
        setLastUpdate(new Date())
      }
    }
    fetch()

    // Real-time subscription
    const channel = supabase
      .channel('ml-predictions')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: TABLES.ML_PREDICTIONS,
      }, (payload) => {
        setPrediction(payload.new)
        setHistory(prev => [...prev.slice(-29), payload.new])
        setConnected(true)
        setLastUpdate(new Date())
      })
      .subscribe((s) => setConnected(s === 'SUBSCRIBED'))

    return () => { supabase.removeChannel(channel) }
  }, [])

  const healthScore = prediction?.health_score ?? 87
  const rul = prediction?.rul_hours ?? 1840
  const faultProb = prediction?.fault_probability ?? 0.08
  const faultType = prediction?.fault_type ?? 'none'
  const anomaly = prediction?.anomaly_detected ?? false
  const confidence = prediction?.model_confidence ?? 0.91
  const recommendation = prediction?.recommendation ?? 'Continue normal operation. Schedule routine maintenance per TBO calendar.'

  const healthCategory = healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'degraded' : 'critical'
  const healthColor = HEALTH_COLORS[healthCategory]

  // Radar data for system health breakdown
  const radarData = prediction?.system_health ? [
    { subject: 'Lube Oil', A: prediction.system_health.lube_oil ?? 90 },
    { subject: 'Cooling', A: prediction.system_health.cooling ?? 88 },
    { subject: 'Fuel', A: prediction.system_health.fuel ?? 85 },
    { subject: 'Turbo', A: prediction.system_health.turbo ?? 92 },
    { subject: 'Exhaust', A: prediction.system_health.exhaust ?? 87 },
    { subject: 'Bearings', A: prediction.system_health.bearings ?? 94 },
  ] : [
    { subject: 'Lube Oil', A: 90 },
    { subject: 'Cooling', A: 88 },
    { subject: 'Fuel', A: 85 },
    { subject: 'Turbo', A: 92 },
    { subject: 'Exhaust', A: 87 },
    { subject: 'Bearings', A: 94 },
  ]

  // Fault probability breakdown
  const faultData = prediction?.fault_probs ? [
    { name: 'Injector', prob: prediction.fault_probs.fouled_injector },
    { name: 'LO Degrad.', prob: prediction.fault_probs.lube_oil_degradation },
    { name: 'Cooling', prob: prediction.fault_probs.cooling_water_issue },
    { name: 'TC Fouling', prob: prediction.fault_probs.turbocharger_fouling },
    { name: 'Bearing', prob: prediction.fault_probs.bearing_wear },
  ] : [
    { name: 'Injector', prob: 0.05 },
    { name: 'LO Degrad.', prob: 0.08 },
    { name: 'Cooling', prob: 0.03 },
    { name: 'TC Fouling', prob: 0.06 },
    { name: 'Bearing', prob: 0.02 },
  ]

  const healthHistory = history.map(h => ({
    t: new Date(h.timestamp).toLocaleTimeString('en', { hour12: false }),
    hs: h.health_score,
    rul: h.rul_hours,
  }))

  return (
    <div className="grid-crosshair min-h-screen p-4 space-y-4">
      {/* Connection status */}
      <div className="flex items-center gap-3 panel px-4 py-2">
        <Brain className="w-4 h-4 text-cyan-400" />
        <span className={`font-mono text-xs ${connected ? 'text-ok' : 'text-steel-500'}`}>
          {connected ? 'ML PIPELINE ACTIVE — TABLE: ml_predictions' : 'WAITING FOR ML SERVICE (Streamlit 2)...'}
        </span>
        {lastUpdate && (
          <span className="ml-auto font-mono text-xs text-steel-500">
            Updated: {lastUpdate.toLocaleTimeString()} · Confidence: {(confidence * 100).toFixed(0)}%
          </span>
        )}
      </div>

      {/* Top row: Health score + RUL + Fault */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Overall Health Score */}
        <div className="panel p-5 flex flex-col items-center">
          <div className="tag-label mb-3">Overall Health Score</div>
          <div className="relative w-36 h-36">
            <svg viewBox="0 0 120 120" className="w-full h-full">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#1a2a3d" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="50"
                fill="none"
                stroke={healthColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 50 * healthScore / 100} ${2 * Math.PI * 50}`}
                transform="rotate(-90 60 60)"
                style={{ transition: 'stroke-dasharray 1s ease', filter: `drop-shadow(0 0 6px ${healthColor}60)` }}
              />
              <text x="60" y="58" textAnchor="middle" fill={healthColor} fontSize="22" fontFamily="JetBrains Mono" fontWeight="500">
                {healthScore}
              </text>
              <text x="60" y="72" textAnchor="middle" fill="#4b5563" fontSize="10" fontFamily="Barlow">
                / 100
              </text>
            </svg>
          </div>
          <div className="font-display font-700 uppercase tracking-wider text-sm mt-2" style={{ color: healthColor }}>
            {healthCategory.toUpperCase()}
          </div>
          {anomaly && (
            <div className="font-mono text-xs text-warn mt-1 animate-pulse-slow">
              ⚠ ANOMALY DETECTED
            </div>
          )}
        </div>

        {/* Remaining Useful Life */}
        <div className="panel p-5">
          <div className="tag-label mb-3">Remaining Useful Life (RUL)</div>
          <div className="flex items-end gap-2 mb-3">
            <span className="font-mono text-4xl font-medium text-cyan-400">
              {rul.toLocaleString()}
            </span>
            <span className="font-mono text-base text-steel-400 mb-1">hours</span>
          </div>

          {/* RUL bar */}
          <div className="h-2 bg-steel-700 rounded overflow-hidden mb-2">
            <div
              className="h-full rounded transition-all duration-1000"
              style={{
                width: `${Math.min(100, (rul / 8000) * 100)}%`,
                backgroundColor: rul > 3000 ? '#10b981' : rul > 1000 ? '#f59e0b' : '#ef4444',
              }}
            />
          </div>
          <div className="flex justify-between font-mono text-xs text-steel-500">
            <span>0</span>
            <span>TBO: 8000h</span>
          </div>

          <div className="mt-4 pt-4 border-t border-steel-700">
            <div className="font-mono text-xs text-steel-400">Next overhaul estimate</div>
            <div className="font-display font-600 text-white mt-1">
              {(() => {
                const d = new Date()
                d.setHours(d.getHours() + rul)
                return d.toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' })
              })()}
            </div>
          </div>
        </div>

        {/* Fault Detection */}
        <div className="panel p-5">
          <div className="tag-label mb-3">Fault Detection</div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">{FAULT_ICONS[faultType] || '⚙️'}</span>
            <div>
              <div className="font-display font-700 uppercase tracking-wider text-sm text-white">
                {faultType === 'none' ? 'No Fault Detected' : faultType.replace(/_/g, ' ')}
              </div>
              <div className="font-mono text-xs text-steel-400 mt-0.5">
                Probability: <span className="text-warn">{(faultProb * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Fault probability bars */}
          <div className="space-y-1.5">
            {faultData.map((fd, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="font-mono text-xs text-steel-500 w-16 text-right shrink-0">{fd.name}</span>
                <div className="flex-1 h-1.5 bg-steel-700 rounded overflow-hidden">
                  <div
                    className="h-full rounded transition-all duration-700"
                    style={{
                      width: `${fd.prob * 100}%`,
                      backgroundColor: fd.prob > 0.3 ? '#ef4444' : fd.prob > 0.15 ? '#f59e0b' : '#22d3ee',
                    }}
                  />
                </div>
                <span className="font-mono text-xs text-steel-400 w-8">{(fd.prob * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Middle row: Radar + Recommendation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* System Health Radar */}
        <div className="panel">
          <div className="panel-header">
            <span className="font-display font-600 uppercase tracking-wider text-slate-300 text-xs">
              System Health Breakdown
            </span>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1a2a3d" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: '#4b5563', fontSize: 11, fontFamily: 'Barlow Condensed' }}
                />
                <Radar
                  dataKey="A"
                  stroke="#22d3ee"
                  fill="#22d3ee"
                  fillOpacity={0.15}
                  strokeWidth={1.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recommendation + details */}
        <div className="panel">
          <div className="panel-header">
            <span className="font-display font-600 uppercase tracking-wider text-slate-300 text-xs">
              Maintenance Recommendation
            </span>
            <span className="ml-auto font-mono text-xs text-steel-500">
              Model: Isolation Forest + LSTM
            </span>
          </div>
          <div className="p-4 space-y-4">
            {/* Recommendation text */}
            <div className="bg-steel-700/50 border-l-2 border-cyan-500 p-3">
              <p className="font-body text-sm text-slate-300 leading-relaxed">
                {recommendation}
              </p>
            </div>

            {/* Model metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="panel p-3">
                <div className="tag-label">Model Confidence</div>
                <div className="font-mono text-xl text-cyan-400 mt-1">{(confidence * 100).toFixed(0)}%</div>
              </div>
              <div className="panel p-3">
                <div className="tag-label">Anomaly Score</div>
                <div className="font-mono text-xl mt-1" style={{ color: anomaly ? '#ef4444' : '#10b981' }}>
                  {prediction?.anomaly_score?.toFixed(3) ?? '0.042'}
                </div>
              </div>
              <div className="panel p-3">
                <div className="tag-label">Data Points Used</div>
                <div className="font-mono text-xl text-slate-300 mt-1">
                  {prediction?.data_points_used?.toLocaleString() ?? '3,600'}
                </div>
              </div>
              <div className="panel p-3">
                <div className="tag-label">Prediction Horizon</div>
                <div className="font-mono text-xl text-slate-300 mt-1">
                  {prediction?.prediction_horizon_hours ?? 72}h
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Health score history */}
      {healthHistory.length > 0 && (
        <div className="panel">
          <div className="panel-header">
            <span className="font-display font-600 uppercase tracking-wider text-slate-300 text-xs">
              Health Score Trend
            </span>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={healthHistory}>
                <XAxis dataKey="t" hide />
                <YAxis domain={[0, 100]} hide />
                <ReferenceLine y={80} stroke="#10b981" strokeDasharray="4 2" strokeOpacity={0.4} />
                <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="4 2" strokeOpacity={0.4} />
                <Tooltip
                  contentStyle={{ background: '#121e2e', border: '1px solid #243347', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  formatter={(v) => [v?.toFixed(1), 'Health Score']}
                  itemStyle={{ color: '#22d3ee' }}
                />
                <Line
                  type="monotone" dataKey="hs" stroke="#22d3ee"
                  dot={false} strokeWidth={2} isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
