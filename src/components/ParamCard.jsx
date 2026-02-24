import React from 'react'
import { STATUS_COLORS, getParamStatus } from '../lib/engineConfig'

const TREND_ICONS = {
  up: '↑',
  down: '↓',
  flat: '→',
}

export default function ParamCard({ param, value, trend, compact = false }) {
  const status = getParamStatus(param, value)
  const color = STATUS_COLORS[status]
  const isAlarm = status === 'alarm' || status === 'shutdown'

  const displayVal = value !== null && value !== undefined
    ? (value > 100 ? Math.round(value) : Number(value).toFixed(1))
    : '--'

  return (
    <div
      className={`panel relative overflow-hidden transition-all duration-300 ${compact ? 'p-2' : 'p-3'} ${isAlarm ? 'alarm-pulse' : ''}`}
      style={{
        borderColor: isAlarm ? color : undefined,
      }}
    >
      {/* Status accent bar */}
      <div
        className="absolute top-0 left-0 w-0.5 h-full"
        style={{ backgroundColor: color }}
      />

      <div className="pl-2">
        {/* Tag */}
        {param.tag && (
          <div className="font-mono text-xs text-steel-500 leading-none mb-0.5 opacity-70">
            {param.tag}
          </div>
        )}
        
        {/* Label */}
        <div className={`font-display font-600 uppercase tracking-wide text-slate-400 leading-tight ${compact ? 'text-xs' : 'text-xs'}`}>
          {param.label}
        </div>

        {/* Value row */}
        <div className="flex items-baseline gap-1.5 mt-1">
          <span
            className={`font-mono font-medium leading-none ${compact ? 'text-lg' : 'text-xl'}`}
            style={{ color }}
          >
            {displayVal}
          </span>
          <span className="font-mono text-xs text-steel-500">{param.unit}</span>
          {trend && (
            <span className={`text-xs ml-auto ${trend === 'up' ? 'text-danger' : trend === 'down' ? 'text-ok' : 'text-steel-500'}`}>
              {TREND_ICONS[trend]}
            </span>
          )}
        </div>

        {/* Normal range */}
        {!compact && param.normal && (
          <div className="text-xs font-mono text-steel-500 mt-1 opacity-70">
            {param.normal[0]}–{param.normal[1]} {param.unit}
          </div>
        )}

        {/* Alarm status */}
        {isAlarm && (
          <div
            className={`font-mono text-xs font-bold uppercase mt-1 ${status === 'shutdown' ? 'text-danger animate-flicker' : 'text-warn'}`}
          >
            {status === 'shutdown' ? '⚠ SHUTDOWN' : status === 'alarm' ? '⚡ ALARM' : '▲ WARN'}
          </div>
        )}
      </div>
    </div>
  )
}
