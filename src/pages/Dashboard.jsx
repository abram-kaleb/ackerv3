import React, { useState, useEffect, useCallback, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { supabase, TABLES } from '../lib/supabase'
import { PARAMS, GAUGE_PARAMS, getParamStatus, STATUS_COLORS } from '../lib/engineConfig'
import Gauge from '../components/Gauge'
import ParamCard from '../components/ParamCard'
import CylinderExhBar from '../components/CylinderExhBar'
import AlarmLog from '../components/AlarmLog'
import { RefreshCw, Wifi, WifiOff } from 'lucide-react'

const MAX_HISTORY = 60  // points to display in trend

export default function Dashboard({ onStatusChange }) {
  const [readings, setReadings] = useState(null)
  const [history, setHistory] = useState([])
  const [connected, setConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const historyRef = useRef([])
  const channelRef = useRef(null)

  const processReading = useCallback((data) => {
    if (!data || data.length === 0) return
    const latest = data[0]
    setReadings(latest)
    setLastUpdate(new Date())

    // Append to history
    const newPoint = {
      t: new Date(latest.timestamp).toLocaleTimeString('en', { hour12: false }),
      ...latest,
    }
    historyRef.current = [...historyRef.current.slice(-(MAX_HISTORY - 1)), newPoint]
    setHistory([...historyRef.current])

    // Calculate overall status
    let worstStatus = 'normal'
    Object.values(PARAMS).forEach(p => {
      const val = latest[p.key]
      if (val === undefined || val === null) return
      const s = getParamStatus(p, val)
      if (s === 'shutdown') worstStatus = 'shutdown'
      else if (s === 'alarm' && worstStatus !== 'shutdown') worstStatus = 'alarm'
      else if (s === 'warn' && !['alarm', 'shutdown'].includes(worstStatus)) worstStatus = 'warn'
    })
    const statusMap = { normal: 'RUNNING', warn: 'WARNING', alarm: 'ALARM', shutdown: 'SHUTDOWN' }
    onStatusChange?.(statusMap[worstStatus] || 'RUNNING')
  }, [onStatusChange])

  // Initial fetch
  useEffect(() => {
    const fetchLatest = async () => {
      const { data, error } = await supabase
        .from(TABLES.SENSOR_READINGS)
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(MAX_HISTORY)
      if (!error && data) {
        const reversed = [...data].reverse()
        historyRef.current = reversed.map(r => ({
          t: new Date(r.timestamp).toLocaleTimeString('en', { hour12: false }),
          ...r,
        }))
        setHistory([...historyRef.current])
        processReading([data[0]])
        setConnected(true)
      }
    }
    fetchLatest()
  }, [processReading])

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('sensor-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: TABLES.SENSOR_READINGS,
      }, (payload) => {
        setConnected(true)
        processReading([payload.new])
      })
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED')
      })

    return () => { supabase.removeChannel(channel) }
  }, [processReading])

  const GAUGE_PARAMS_FILTERED = GAUGE_PARAMS.slice(0, 8)

  // Secondary params grid
  const secondaryParams = [
    PARAMS.lo_temp_before_cooler,
    PARAMS.lo_temp_after_cooler,
    PARAMS.lo_pressure_after_filter,
    PARAMS.lo_pressure_drop_filter,
    PARAMS.lo_level,
    PARAMS.lo_main_bearing_temp,
    PARAMS.ht_cw_temp_inlet,
    PARAMS.ht_cw_pressure_inlet,
    PARAMS.ht_cw_temp_raise,
    PARAMS.lt_cw_pressure_inlet,
    PARAMS.lt_cw_temp_outlet,
    PARAMS.charge_air_temp,
    PARAMS.fuel_pressure_inlet,
    PARAMS.fuel_rack_position,
    PARAMS.start_air_pressure,
    PARAMS.alternator_frequency,
    PARAMS.alternator_voltage,
    PARAMS.oil_mist_level,
    PARAMS.crankcase_pressure,
    PARAMS.ambient_temp,
    PARAMS.scavenge_air_pressure,
    PARAMS.tc_speed,
  ]

  const trendParam = PARAMS.engine_speed
  const trendData = history.map(h => ({
    t: h.t,
    v: h[trendParam.key],
    v2: h[PARAMS.ht_cw_temp_outlet.key],
    v3: h[PARAMS.charge_air_pressure.key],
  }))

  return (
    <div className="grid-crosshair min-h-screen p-4 space-y-4">
      {/* Main Gauges */}
      <div className="panel">
        <div className="panel-header">
          <span className="font-display font-600 text-white uppercase tracking-widest text-sm">
            Main Parameters
          </span>
        </div>

        <div className="p-4 flex flex-wrap justify-around gap-4">
          {GAUGE_PARAMS.map((p, i) => (
            <Gauge
              key={p.key}
              param={p}
              value={readings?.[p.key] ?? p.nominal}
              size={148}
            />
          ))}
        </div>
      </div>

      {/* Cylinder exhaust temps */}
      <CylinderExhBar readings={readings} />

      {/* Trend charts */}
      <div className="panel">
        <div className="panel-header">
          <span className="font-display font-600 uppercase tracking-wider text-slate-300 text-xs">
            Trend History — Last {MAX_HISTORY} readings
          </span>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Engine Speed */}
          <div>
            <div className="font-mono text-xs text-steel-400 mb-2">Engine Speed (RPM)</div>
            <ResponsiveContainer width="100%" height={80}>
              <LineChart data={trendData}>
                <XAxis dataKey="t" hide />
                <YAxis domain={[600, 900]} hide />
                <Tooltip
                  contentStyle={{ background: '#121e2e', border: '1px solid #243347', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  labelStyle={{ color: '#4b5563' }}
                  itemStyle={{ color: '#22d3ee' }}
                  formatter={(v) => [v?.toFixed(0) + ' RPM', 'Speed']}
                />
                <Line type="monotone" dataKey="v" stroke="#22d3ee" dot={false} strokeWidth={1.5} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* HT CW Temp */}
          <div>
            <div className="font-mono text-xs text-steel-400 mb-2">HT CW Temp Outlet (°C)</div>
            <ResponsiveContainer width="100%" height={80}>
              <LineChart data={trendData}>
                <XAxis dataKey="t" hide />
                <YAxis domain={[60, 100]} hide />
                <Tooltip
                  contentStyle={{ background: '#121e2e', border: '1px solid #243347', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  formatter={(v) => [v?.toFixed(1) + ' °C', 'HT CW Out']}
                  itemStyle={{ color: '#f59e0b' }}
                />
                <Line type="monotone" dataKey="v2" stroke="#f59e0b" dot={false} strokeWidth={1.5} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Charge air pressure */}
          <div>
            <div className="font-mono text-xs text-steel-400 mb-2">Charge Air Pressure (bar)</div>
            <ResponsiveContainer width="100%" height={80}>
              <LineChart data={trendData}>
                <XAxis dataKey="t" hide />
                <YAxis domain={[1, 3]} hide />
                <Tooltip
                  contentStyle={{ background: '#121e2e', border: '1px solid #243347', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  formatter={(v) => [v?.toFixed(2) + ' bar', 'Ch.Air']}
                  itemStyle={{ color: '#22d3ee' }}
                />
                <Line type="monotone" dataKey="v3" stroke="#22d3ee" dot={false} strokeWidth={1.5} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary params grid */}
      <div>
        <div className="font-display font-600 uppercase tracking-widest text-xs text-steel-400 mb-2 px-1">
          All Parameters
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {secondaryParams.map(p => (
            <ParamCard
              key={p.key}
              param={p}
              value={readings?.[p.key] ?? p.nominal}
              compact
            />
          ))}
        </div>
      </div>

      {/* Alarm log */}
      <AlarmLog readings={readings} history={history} />
    </div>
  )
}
