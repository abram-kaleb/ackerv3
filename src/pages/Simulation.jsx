import React, { useState, useEffect, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { supabase, TABLES } from '../lib/supabase'
import { PARAMS, getParamStatus, STATUS_COLORS } from '../lib/engineConfig'
import Gauge from '../components/Gauge'
import { Play, Square, Settings, Send, RotateCcw } from 'lucide-react'

const DEFAULT_CONTROLS = {
  engine_speed_setpoint: 720,
  load_setpoint_pct: 75,
  ambient_temp_c: 28,
  fuel_type: 'MDO',
  injection_timing_offset: 0,
  lo_degradation_factor: 1.0,
  cooling_efficiency_factor: 1.0,
  tc_fouling_factor: 0.0,
  fault_inject: 'none',
  simulation_interval_s: 2,
  running: false,
}

const FAULT_OPTIONS = [
  { value: 'none', label: 'None (Normal)' },
  { value: 'fouled_injector_cyl3', label: 'Fouled Injector Cyl #3' },
  { value: 'lube_oil_degradation', label: 'Lube Oil Degradation' },
  { value: 'cooling_water_leak', label: 'Cooling Water Leak' },
  { value: 'turbocharger_fouling', label: 'Turbocharger Fouling' },
  { value: 'overload', label: 'Overload Condition' },
]

export default function Simulation() {
  const [controls, setControls] = useState(DEFAULT_CONTROLS)
  const [simRunning, setSimRunning] = useState(false)
  const [simData, setSimData] = useState([])
  const [connected, setConnected] = useState(false)
  const dataRef = useRef([])

  // Subscribe to simulation_data rows 2+ (id > 1 or row_type='data')
  useEffect(() => {
    const channel = supabase
      .channel('sim-data')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: TABLES.SIMULATION_DATA,
        filter: 'row_type=eq.data',
      }, (payload) => {
        setConnected(true)
        const newPoint = {
          t: new Date(payload.new.timestamp).toLocaleTimeString('en', { hour12: false }),
          ...payload.new,
        }
        dataRef.current = [...dataRef.current.slice(-119), newPoint]
        setSimData([...dataRef.current])
      })
      .subscribe((s) => setConnected(s === 'SUBSCRIBED'))

    return () => { supabase.removeChannel(channel) }
  }, [])

  const sendControl = async (ctrl) => {
    // Upsert row 1 (control row) in simulation_data
    const { error } = await supabase
      .from(TABLES.SIMULATION_DATA)
      .upsert({
        id: 1,
        row_type: 'control',
        timestamp: new Date().toISOString(),
        ...ctrl,
      })
    if (error) console.error('Error sending control:', error)
  }

  const handleStart = async () => {
    const ctrl = { ...controls, running: true }
    await sendControl(ctrl)
    setControls(ctrl)
    setSimRunning(true)
    dataRef.current = []
    setSimData([])
  }

  const handleStop = async () => {
    const ctrl = { ...controls, running: false }
    await sendControl(ctrl)
    setControls(ctrl)
    setSimRunning(false)
  }

  const handleReset = async () => {
    await handleStop()
    setControls(DEFAULT_CONTROLS)
    dataRef.current = []
    setSimData([])
  }

  const handleControlChange = (key, val) => {
    const updated = { ...controls, [key]: val }
    setControls(updated)
  }

  const latestSim = simData[simData.length - 1]

  const gaugeParams = [
    PARAMS.engine_speed,
    PARAMS.alternator_load_kw,
    PARAMS.ht_cw_temp_outlet,
    PARAMS.lo_pressure_after_filter,
    PARAMS.exh_temp_before_tc,
    PARAMS.charge_air_pressure,
  ]

  return (
    <div className="grid-crosshair min-h-screen p-4 space-y-4">
      {/* Status bar */}
      <div className="flex items-center gap-3 panel px-4 py-2">
        <div
          className={`w-2 h-2 rounded-full ${simRunning ? 'animate-pulse' : ''}`}
          style={{ backgroundColor: simRunning ? '#10b981' : '#4b5563' }}
        />
        <span className={`font-mono text-xs ${simRunning ? 'text-ok' : 'text-steel-500'}`}>
          {simRunning ? 'SIMULATION RUNNING — Streamlit 3 Active' : 'SIMULATION STOPPED'}
        </span>
        {simData.length > 0 && (
          <span className="ml-auto font-mono text-xs text-steel-500">
            {simData.length} data points · Table: simulation_data
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Control Panel */}
        <div className="panel">
          <div className="panel-header">
            <Settings className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-display font-600 uppercase tracking-wider text-slate-300 text-xs">
              Simulation Controls
            </span>
          </div>
          <div className="p-4 space-y-4">
            {/* Engine Speed */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="tag-label">Engine Speed Setpoint</label>
                <span className="font-mono text-xs text-cyan-400">{controls.engine_speed_setpoint} RPM</span>
              </div>
              <input
                type="range" min="0" max="860" step="5"
                value={controls.engine_speed_setpoint}
                onChange={e => handleControlChange('engine_speed_setpoint', +e.target.value)}
                disabled={simRunning}
                className="w-full accent-cyan-400"
              />
              <div className="flex justify-between font-mono text-xs text-steel-600 mt-0.5">
                <span>0</span><span>720 ★</span><span>750</span><span>860</span>
              </div>
            </div>

            {/* Load */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="tag-label">Load Setpoint</label>
                <span className="font-mono text-xs text-cyan-400">{controls.load_setpoint_pct}%</span>
              </div>
              <input
                type="range" min="0" max="110" step="5"
                value={controls.load_setpoint_pct}
                onChange={e => handleControlChange('load_setpoint_pct', +e.target.value)}
                disabled={simRunning}
                className="w-full accent-cyan-400"
              />
              <div className="flex justify-between font-mono text-xs text-steel-600 mt-0.5">
                <span>0%</span><span>75% ★</span><span>100%</span><span>110%</span>
              </div>
            </div>

            {/* Ambient Temp */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="tag-label">Ambient Temperature</label>
                <span className="font-mono text-xs text-cyan-400">{controls.ambient_temp_c}°C</span>
              </div>
              <input
                type="range" min="-10" max="55" step="1"
                value={controls.ambient_temp_c}
                onChange={e => handleControlChange('ambient_temp_c', +e.target.value)}
                disabled={simRunning}
                className="w-full accent-amber-400"
              />
            </div>

            {/* LO Degradation */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="tag-label">LO Degradation Factor</label>
                <span className="font-mono text-xs text-warn">{controls.lo_degradation_factor.toFixed(2)}</span>
              </div>
              <input
                type="range" min="1.0" max="2.0" step="0.05"
                value={controls.lo_degradation_factor}
                onChange={e => handleControlChange('lo_degradation_factor', +e.target.value)}
                disabled={simRunning}
                className="w-full accent-amber-400"
              />
              <div className="font-mono text-xs text-steel-600 mt-0.5">1.0 = new oil · 2.0 = severely degraded</div>
            </div>

            {/* Cooling efficiency */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="tag-label">Cooling Efficiency</label>
                <span className="font-mono text-xs text-cyan-400">{(controls.cooling_efficiency_factor * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range" min="0.5" max="1.0" step="0.05"
                value={controls.cooling_efficiency_factor}
                onChange={e => handleControlChange('cooling_efficiency_factor', +e.target.value)}
                disabled={simRunning}
                className="w-full accent-cyan-400"
              />
            </div>

            {/* TC Fouling */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="tag-label">TC Fouling Factor</label>
                <span className="font-mono text-xs text-warn">{(controls.tc_fouling_factor * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range" min="0" max="1.0" step="0.05"
                value={controls.tc_fouling_factor}
                onChange={e => handleControlChange('tc_fouling_factor', +e.target.value)}
                disabled={simRunning}
                className="w-full accent-amber-400"
              />
            </div>

            {/* Injection timing */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="tag-label">Injection Timing Offset</label>
                <span className="font-mono text-xs text-cyan-400">{controls.injection_timing_offset > 0 ? '+' : ''}{controls.injection_timing_offset}°</span>
              </div>
              <input
                type="range" min="-5" max="5" step="0.5"
                value={controls.injection_timing_offset}
                onChange={e => handleControlChange('injection_timing_offset', +e.target.value)}
                disabled={simRunning}
                className="w-full accent-cyan-400"
              />
            </div>

            {/* Fault inject */}
            <div>
              <label className="tag-label block mb-1">Fault Injection</label>
              <select
                value={controls.fault_inject}
                onChange={e => handleControlChange('fault_inject', e.target.value)}
                disabled={simRunning}
                className="w-full bg-steel-700 border border-steel-600 text-slate-300 font-mono text-xs px-2 py-1.5 focus:outline-none focus:border-cyan-500"
              >
                {FAULT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Fuel type */}
            <div>
              <label className="tag-label block mb-1">Fuel Type</label>
              <div className="flex gap-2">
                {['MDO', 'MGO', 'HFO'].map(f => (
                  <button
                    key={f}
                    onClick={() => handleControlChange('fuel_type', f)}
                    disabled={simRunning}
                    className={`flex-1 py-1.5 font-display font-600 uppercase text-xs tracking-widest border transition-colors ${
                      controls.fuel_type === f
                        ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10'
                        : 'border-steel-600 text-steel-400 hover:border-steel-400'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Interval */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="tag-label">Interval</label>
                <span className="font-mono text-xs text-cyan-400">{controls.simulation_interval_s}s</span>
              </div>
              <input
                type="range" min="1" max="10" step="1"
                value={controls.simulation_interval_s}
                onChange={e => handleControlChange('simulation_interval_s', +e.target.value)}
                disabled={simRunning}
                className="w-full accent-cyan-400"
              />
            </div>

            {/* Control buttons */}
            <div className="flex gap-2 pt-2">
              {!simRunning ? (
                <button
                  onClick={handleStart}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  START SIM
                </button>
              ) : (
                <button
                  onClick={handleStop}
                  className="flex-1 bg-danger hover:bg-red-700 text-white font-display font-600 uppercase tracking-widest text-sm px-4 py-2 flex items-center justify-center gap-2 transition-colors"
                >
                  <Square className="w-4 h-4" />
                  STOP
                </button>
              )}
              <button
                onClick={handleReset}
                className="btn-ghost flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Live Simulation Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Gauges */}
          <div className="panel">
            <div className="panel-header">
              <span className="font-display font-600 uppercase tracking-wider text-slate-300 text-xs">
                Live Simulation Readings
              </span>
              {simRunning && (
                <span className="ml-auto font-mono text-xs text-ok animate-pulse">● LIVE</span>
              )}
            </div>
            <div className="p-4 flex flex-wrap justify-around gap-4">
              {gaugeParams.map(p => (
                <Gauge
                  key={p.key}
                  param={p}
                  value={latestSim?.[p.key] ?? (simRunning ? p.nominal : null)}
                  size={130}
                />
              ))}
            </div>
          </div>

          {/* Trend charts */}
          {simData.length > 1 && (
            <div className="panel">
              <div className="panel-header">
                <span className="font-display font-600 uppercase tracking-wider text-slate-300 text-xs">
                  Simulation Trends
                </span>
                <span className="ml-auto font-mono text-xs text-steel-400">{simData.length} points</span>
              </div>
              <div className="p-4 grid grid-cols-2 gap-4">
                {[
                  { key: PARAMS.engine_speed.key, label: 'Engine Speed (RPM)', color: '#22d3ee', domain: [600, 900], ref: { alarm: 815, shutdown: 825 } },
                  { key: PARAMS.ht_cw_temp_outlet.key, label: 'HT CW Outlet (°C)', color: '#f59e0b', domain: [60, 110], ref: { alarm: 90, shutdown: 93 } },
                  { key: PARAMS.exh_temp_before_tc.key, label: 'Exh Before TC (°C)', color: '#ef4444', domain: [300, 650], ref: { alarm: 550 } },
                  { key: PARAMS.lo_pressure_after_filter.key, label: 'LO Pressure (bar)', color: '#22d3ee', domain: [0, 6], ref: { alarm_low: 2.5 } },
                ].map(({ key, label, color, domain, ref }) => (
                  <div key={key}>
                    <div className="font-mono text-xs text-steel-400 mb-1">{label}</div>
                    <ResponsiveContainer width="100%" height={80}>
                      <LineChart data={simData}>
                        <XAxis dataKey="t" hide />
                        <YAxis domain={domain} hide />
                        {ref.alarm && <ReferenceLine y={ref.alarm} stroke="#f59e0b" strokeDasharray="4 2" strokeOpacity={0.5} />}
                        {ref.shutdown && <ReferenceLine y={ref.shutdown} stroke="#ef4444" strokeDasharray="4 2" strokeOpacity={0.5} />}
                        {ref.alarm_low && <ReferenceLine y={ref.alarm_low} stroke="#f59e0b" strokeDasharray="4 2" strokeOpacity={0.5} />}
                        <Tooltip
                          contentStyle={{ background: '#121e2e', border: '1px solid #243347', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                          itemStyle={{ color }}
                          formatter={(v) => [v?.toFixed(1), label]}
                        />
                        <Line type="monotone" dataKey={key} stroke={color} dot={false} strokeWidth={1.5} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cylinder exhaust temps */}
          {simData.length > 0 && (
            <div className="panel">
              <div className="panel-header">
                <span className="font-mono text-xs text-cyan-400">TI 60</span>
                <span className="font-display font-600 uppercase tracking-wider text-slate-300 text-xs ml-2">
                  Exhaust Temps — Simulation
                </span>
              </div>
              <div className="p-4 grid grid-cols-6 gap-2">
                {[1,2,3,4,5,6].map(n => {
                  const key = `exh_temp_cyl_${n}_c`
                  const val = latestSim?.[key] ?? PARAMS[`exh_temp_cyl_${n}`]?.nominal
                  const p = PARAMS[`exh_temp_cyl_${n}`]
                  const status = getParamStatus(p, val)
                  const color = STATUS_COLORS[status]
                  return (
                    <div key={n} className="panel p-2 text-center">
                      <div className="font-display font-600 uppercase text-xs text-steel-400 mb-1">CYL #{n}</div>
                      <div className="font-mono text-base font-medium" style={{ color }}>{val?.toFixed(0) ?? '--'}</div>
                      <div className="font-mono text-xs text-steel-500">°C</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
