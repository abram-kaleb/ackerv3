import React from 'react'
import { PARAMS, STATUS_COLORS, getParamStatus } from '../lib/engineConfig'

export default function CylinderExhBar({ readings }) {
  const cylParams = [
    PARAMS.exh_temp_cyl_1,
    PARAMS.exh_temp_cyl_2,
    PARAMS.exh_temp_cyl_3,
    PARAMS.exh_temp_cyl_4,
    PARAMS.exh_temp_cyl_5,
    PARAMS.exh_temp_cyl_6,
  ]

  const average = readings
    ? cylParams.reduce((sum, p) => sum + (readings[p.key] ?? p.nominal), 0) / 6
    : null

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="font-mono text-xs text-cyan-400">TI 60</span>
        <span className="font-display font-600 uppercase tracking-wider text-slate-300 text-xs">
          Exhaust Temp — Individual Cylinders
        </span>
        {average && (
          <span className="ml-auto font-mono text-xs text-steel-400">
            avg: <span className="text-slate-300">{average.toFixed(0)}°C</span>
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex gap-3 items-end justify-around h-28">
          {cylParams.map((p, i) => {
            const val = readings?.[p.key] ?? p.nominal
            const status = getParamStatus(p, val)
            const color = STATUS_COLORS[status]
            const pct = ((val - p.min) / (p.max - p.min)) * 100
            const deviation = average ? Math.abs(val - average) : 0
            const isDeviation = deviation > 50

            return (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                {/* Deviation badge */}
                {isDeviation && (
                  <span className="font-mono text-xs text-warn leading-none">
                    ±{deviation.toFixed(0)}
                  </span>
                )}
                
                {/* Bar */}
                <div className="w-full relative flex flex-col justify-end" style={{ height: 80 }}>
                  {/* Normal range indicator */}
                  <div
                    className="absolute inset-x-0 border-t border-dashed opacity-30"
                    style={{
                      bottom: `${((p.normal[0] - p.min) / (p.max - p.min)) * 100}%`,
                      borderColor: '#10b981',
                    }}
                  />
                  <div
                    className="absolute inset-x-0 border-t border-dashed opacity-30"
                    style={{
                      bottom: `${((p.normal[1] - p.min) / (p.max - p.min)) * 100}%`,
                      borderColor: '#10b981',
                    }}
                  />
                  {/* Alarm line */}
                  <div
                    className="absolute inset-x-0 border-t border-dashed opacity-50"
                    style={{
                      bottom: `${((p.alarm.high - p.min) / (p.max - p.min)) * 100}%`,
                      borderColor: '#f59e0b',
                    }}
                  />

                  {/* Value bar */}
                  <div
                    className="w-full rounded-sm transition-all duration-700"
                    style={{
                      height: `${pct}%`,
                      backgroundColor: color,
                      boxShadow: status !== 'normal' ? `0 0 6px ${color}80` : 'none',
                    }}
                  />
                </div>

                {/* Value */}
                <span className="font-mono text-xs leading-none" style={{ color }}>
                  {val.toFixed(0)}
                </span>

                {/* Cylinder label */}
                <span className="font-display text-xs text-steel-500 uppercase font-600">
                  #{i + 1}
                </span>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-3 pt-3 border-t border-steel-700">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-ok opacity-50 border-t border-dashed" style={{ borderColor: '#10b981' }} />
            <span className="font-mono text-xs text-steel-500">Normal {cylParams[0].normal[0]}–{cylParams[0].normal[1]}°C</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 border-t border-dashed border-warn opacity-50" />
            <span className="font-mono text-xs text-steel-500">Alarm {cylParams[0].alarm.high}°C</span>
          </div>
          <div className="font-mono text-xs text-steel-500 ml-auto">
            Deviation alarm: ±50°C from avg
          </div>
        </div>
      </div>
    </div>
  )
}
