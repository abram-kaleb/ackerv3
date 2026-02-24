//AlarmLog.jsx

import React from 'react'
import { PARAMS, getParamStatus } from '../lib/engineConfig'

export default function AlarmLog({ readings, history }) {
  const alarms = []

  if (readings) {
    Object.values(PARAMS).forEach(p => {
      const val = readings[p.key]
      if (val === undefined || val === null) return
      const status = getParamStatus(p, val)
      if (status === 'alarm' || status === 'shutdown' || status === 'warn') {
        alarms.push({
          status,
          label: p.label,
          tag: p.tag,
          value: val,
          unit: p.unit,
          time: readings.timestamp || new Date().toISOString(),
        })
      }
    })
  }

  const statusStyle = {
    shutdown: { text: 'text-danger', bg: 'bg-danger/10', border: 'border-danger', badge: '⚠ SHUTDOWN' },
    alarm: { text: 'text-warn', bg: 'bg-warn/10', border: 'border-warn', badge: '⚡ ALARM' },
    warn: { text: 'text-amber-400', bg: '', border: 'border-steel-600', badge: '▲ WARN' },
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="font-display font-600 uppercase tracking-wider text-slate-300 text-xs">
          Active Alarms
        </span>
        {alarms.length > 0 ? (
          <span className="ml-auto font-mono text-xs bg-danger/20 text-danger px-2 py-0.5">
            {alarms.length} ACTIVE
          </span>
        ) : (
          <span className="ml-auto font-mono text-xs bg-ok/10 text-ok px-2 py-0.5">
            CLEAR
          </span>
        )}
      </div>
      <div className="divide-y divide-steel-700 max-h-64 overflow-y-auto">
        {alarms.length === 0 ? (
          <div className="p-4 text-center font-mono text-xs text-ok opacity-70">
            ✓ No active alarms
          </div>
        ) : (
          alarms.map((alarm, i) => {
            const s = statusStyle[alarm.status]
            return (
              <div key={i} className={`flex items-center gap-3 px-4 py-2 ${s.bg}`}>
                <span className={`font-mono text-xs font-bold w-20 ${s.text}`}>
                  {s.badge}
                </span>
                <span className="font-mono text-xs text-steel-400 w-14 opacity-70">
                  {alarm.tag || '—'}
                </span>
                <span className="font-display font-600 uppercase text-xs text-slate-300 flex-1">
                  {alarm.label}
                </span>
                <span className={`font-mono text-sm font-medium ${s.text}`}>
                  {typeof alarm.value === 'number'
                    ? (alarm.value > 100 ? Math.round(alarm.value) : alarm.value.toFixed(1))
                    : alarm.value} {alarm.unit}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
