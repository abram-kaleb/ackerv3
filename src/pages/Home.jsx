// src/pages/Home.jsx

import React, { useState, useEffect, useMemo } from 'react'
import { supabase, TABLES } from '../lib/supabase'
import { PARAMS, ENGINE_SPEC, getParamStatus } from '../lib/engineConfig'
import { AlertTriangle, Activity, Brain, Zap, Clock, } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import EngineModel3D from '../components/EngineModel3D'
import Gauge from '../components/Gauge'

export default function Home() {
    const [readings, setReadings] = useState(null)
    const [history, setHistory] = useState([])
    const [prediction, setPrediction] = useState(null)
    const [healthScore, setHealthScore] = useState(0)
    const MAX_HISTORY = 30
    const [activeMetric, setActiveMetric] = useState('engine_speed_rpm');

    const HUD_METRICS = [
        { id: 'engine_speed_rpm', label: 'Engine Speed', unit: 'RPM', color: '#22d3ee' },
        { id: 'load_factor_pct', label: 'Engine Load', unit: '%', color: '#22d3ee' },
        { id: 'lo_pressure_after_filter_bar', label: 'L.O. Press', unit: 'BAR', color: '#22d3ee' },
        { id: 'ht_cw_temp_outlet_c', label: 'HT CW Temp', unit: '°C', color: '#fb923c' }
    ];

    const chartData = useMemo(() => {
        if (!history || !Array.isArray(history)) return [];
        return history.map(h => ({
            t: h.timestamp ? new Date(h.timestamp).toLocaleTimeString('en', { hour12: false }) : '',
            val: h[activeMetric] ?? 0
        }));
    }, [history, activeMetric]);

    const current = HUD_METRICS.find(m => m.id === activeMetric) || HUD_METRICS[0];

    useEffect(() => {
        const fetchInitialData = async () => {
            const { data: sData } = await supabase
                .from(TABLES.SENSOR_READINGS)
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(MAX_HISTORY)

            if (sData) {
                const formatted = sData.reverse().map(d => ({
                    ...d,
                    t: new Date(d.timestamp).toLocaleTimeString('en', { hour12: false })
                }))
                setHistory(formatted)
                setReadings(formatted[formatted.length - 1])
            }

            const { data: mData } = await supabase
                .from(TABLES.ML_PREDICTIONS)
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(1)
                .single()
            if (mData) {
                setPrediction(mData)
                setHealthScore(mData.health_score)
            }
        }

        fetchInitialData()

        const sensorChannel = supabase
            .channel('home-sensors-realtime')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: TABLES.SENSOR_READINGS,
            }, (payload) => {
                const latest = payload.new
                const newPoint = {
                    ...latest,
                    t: new Date(latest.timestamp).toLocaleTimeString('en', { hour12: false })
                }
                setReadings(latest)
                setHistory(prev => [...prev.slice(-(MAX_HISTORY - 1)), newPoint])
            })
            .subscribe()

        const mlChannel = supabase
            .channel('home-ml-sync')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: TABLES.ML_PREDICTIONS,
            }, (payload) => {
                setPrediction(payload.new)
                setHealthScore(payload.new.health_score)
            })
            .subscribe()

        return () => {
            supabase.removeChannel(sensorChannel)
            supabase.removeChannel(mlChannel)
        }
    }, [])

    const activeAlarms = useMemo(() => {
        if (!readings || !PARAMS) return []
        return Object.values(PARAMS)
            .map(p => {
                const val = readings[p.key]
                if (val == null) return null
                const status = getParamStatus(p, val)
                // Hanya masukkan jika status bukan 'normal'
                return (status && status !== 'normal')
                    ? { ...p, value: val, status }
                    : null
            })
            .filter(Boolean)
    }, [readings])

    const isCritical = useMemo(() =>
        activeAlarms.some(a => a.status === 'alarm' || a.status === 'shutdown'),
        [activeAlarms])

    return (
        <div className="p-4 space-y-4 ">
            <div className="absolute inset-0 z-0">
                <EngineModel3D
                    specs={ENGINE_SPEC}
                    readings={readings}
                    PARAMS={PARAMS}
                    prediction={prediction}
                    activeAlarms={activeAlarms}
                />
            </div>


            <div className="absolute top-26 left-6 z-50">
                <div className="bg-[#0a192f]/80 backdrop-blur-md p-4 rounded-xl border border-blue-500/30 shadow-2xl flex flex-col w-56 gap-4">

                    {/* HEADER UTAMA */}
                    <div className="flex flex-col w-full">
                        <div className="flex items-center gap-2 mb-1">
                            <Activity size={16} className="text-cyan-400" />
                            <span className="text-[14px] font-mono text-cyan-400 font-bold uppercase tracking-wider">Analytics</span>
                        </div>
                        <div className="h-[2px] w-full bg-blue-500/20 overflow-hidden">
                            <div className="bg-cyan-500 h-full w-full animate-pulse" />
                        </div>
                    </div>

                    {/* HEALTH SCORE SECTION */}
                    <div className="flex flex-col items-center py-2">
                        <div className="relative flex items-center justify-center">
                            <svg className="w-24 h-24 transform -rotate-90">
                                <circle cx="48" cy="48" r="42" stroke="#1a2a3d" strokeWidth="5" fill="none" />
                                <circle
                                    cx="48" cy="48" r="42"
                                    stroke={healthScore >= 80 ? '#10b981' : healthScore >= 60 ? '#f59e0b' : '#ef4444'}
                                    strokeWidth="5" fill="none"
                                    strokeDasharray={263.8}
                                    strokeDashoffset={263.8 - (263.8 * (healthScore || 0)) / 100}
                                    strokeLinecap="round"
                                    style={{ transition: 'stroke-dashoffset 1.5s ease-in-out' }}
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className="text-2xl font-mono font-black text-white leading-none">{Math.round(healthScore)}%</span>
                                <span className="text-[7px] font-mono text-cyan-500/50 uppercase tracking-widest mt-1">Health</span>
                            </div>
                        </div>
                    </div>

                    {/* RUL SECTION (Kecil/Ringkas) */}
                    <div className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/5">
                        <div className="flex items-center gap-2">
                            <Clock size={12} className="text-cyan-500" />
                            <span className="text-[10px] font-mono text-white/60 uppercase">RUL Est.</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-sm font-mono font-bold text-white">{(prediction?.rul_hours || 0).toLocaleString()}</span>
                            <span className="text-[8px] font-mono text-cyan-500/50 uppercase font-bold">Hrs</span>
                        </div>
                    </div>

                    {/* ADVISOR SECTION */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-1">
                            <Brain size={12} className="text-cyan-500" />
                            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-tighter">AI Recommendation</span>
                        </div>
                        <div className="bg-cyan-500/5 border-l-2 border-cyan-500/50 p-2">
                            <p className="text-[10px] font-mono text-white/80 leading-tight ">
                                {prediction?.recommendation || "Processing system metrics..."}
                            </p>
                        </div>
                    </div>

                    {/* FOOTER STATUS */}
                    <div className={`w-full text-center py-1 rounded text-[9px] font-mono font-bold uppercase tracking-widest border ${healthScore >= 80 ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                        healthScore >= 60 ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
                        }`}>
                        System: {healthScore >= 80 ? 'Optimal' : healthScore >= 60 ? 'Degraded' : 'Critical'}
                    </div>

                </div>
            </div>









            {/* --- COMPONENT 2: SYSTEM STATUS / ALARMS (RIGHT) --- */}
            <div className={`absolute top-26 right-6 w-72 bg-[#0a192f]/80 backdrop-blur-md p-4 rounded-xl border border-blue-500/30 shadow-2xl transition-all duration-500 ${activeAlarms.length > 0 ? 'border-r-4 border-r-red-500' : 'border-r-4 border-r-green-500'}`}>
                <div className="flex flex-col w-full">
                    {/* Header dengan Aksen Garis Biru (SAMA DENGAN KIRI) */}
                    <div className="flex flex-col w-full mb-4">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={16} className={activeAlarms.length > 0 ? 'text-red-500' : 'text-green-500'} />
                                <span className="text-[14px] font-mono text-cyan-400 font-bold uppercase tracking-wider">System Status</span>
                            </div>
                            {activeAlarms.length > 0 && (
                                <span className="bg-red-500 text-[10px] font-bold px-2 py-0.5 rounded text-white">
                                    {activeAlarms.length}
                                </span>
                            )}
                        </div>
                        <div className="h-[2px] w-full bg-blue-500/20 overflow-hidden">
                            <div className={`h-full w-1/3 ${activeAlarms.length > 0 ? 'bg-red-500' : 'bg-cyan-500'}`} />
                        </div>
                    </div>

                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                        {activeAlarms.length > 0 ? (
                            activeAlarms.map((alarm, idx) => (
                                <div
                                    key={idx}
                                    className="group flex flex-col gap-1 bg-red-500/10 border border-red-500/20 p-3 rounded-lg"
                                >
                                    <div className="flex justify-between items-start">
                                        <span className="text-[12px] font-mono text-red-400 font-black uppercase leading-none">
                                            {alarm.label}
                                        </span>
                                        <span className="text-sm font-mono font-bold text-white leading-none">
                                            {alarm.value?.toFixed(1)}
                                            <span className="text-[10px] text-white/30 ml-0.5">{alarm.unit}</span>
                                        </span>
                                    </div>
                                    <div className="w-full bg-white/5 h-[2px] mt-2 overflow-hidden">
                                        <div className="bg-red-500 h-full" style={{ width: '100%' }} />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center py-6">
                                <div className="text-[12px] font-mono text-green-400 font-bold tracking-widest uppercase mb-1">All Systems Nominal</div>
                                <div className="h-[1px] w-16 bg-green-500/50 shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>


            <div className="absolute bottom-6 right-[2vw] z-50 pointer-events-none">
                <div className="w-[400px] flex flex-col gap-2 pointer-events-auto">

                    <div className="flex items-end justify-between px-2">
                        <div className="flex flex-col">
                            <div className="flex gap-3 mt-2 ml-4">
                                {HUD_METRICS.map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => setActiveMetric(m.id)}
                                        className={`text-[7px] font-mono font-bold tracking-widest transition-all px-1.5 py-0.5 rounded border ${activeMetric === m.id
                                            ? 'text-cyan-400 border-cyan-500/50 bg-cyan-500/10'
                                            : 'text-white/20 border-transparent hover:text-white/40'
                                            }`}
                                    >
                                        {m.id.split('_')[0].toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="text-right  mb-[2px]">
                            <span className="text-base font-mono text-white font-black uppercase tracking-[0.3em]">
                                {current.label}
                            </span>
                        </div>
                    </div>

                    <div className="h-[120px] w-full p-4 bg-[#0a192f]/80 backdrop-blur-md rounded-xl border border-blue-500/30 shadow-2xl">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <XAxis dataKey="t" hide />
                                <YAxis domain={['auto', 'auto']} hide />

                                <ReferenceLine
                                    y={current.threshold}
                                    stroke={activeMetric.includes('temp') ? "#ef4444" : "#10b981"}
                                    strokeDasharray="4 2"
                                    strokeOpacity={0.4}
                                />

                                <Tooltip
                                    contentStyle={{
                                        background: '#121e2e',
                                        border: '1px solid #243347',
                                        fontSize: 10,
                                        fontFamily: 'JetBrains Mono'
                                    }}
                                    formatter={(v) => [v, current.label]}
                                    itemStyle={{ color: current.color }}
                                    labelStyle={{ color: '#4b5563' }}
                                />

                                <Line
                                    type="monotone"
                                    dataKey="val"
                                    stroke={current.color}
                                    dot={false}
                                    strokeWidth={2}
                                    isAnimationActive={false}
                                    connectNulls={true}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

        </div>
    )
}