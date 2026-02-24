// src/components/Gauge.jsx

import React, { useMemo } from 'react'
import { STATUS_COLORS } from '../lib/engineConfig'

const GAUGE_SIZE = 160
const CENTER = GAUGE_SIZE / 2
const RADIUS = 60
const START_ANGLE = 225
const END_ANGLE = -45
const SWEEP = 270

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg - 90) * (Math.PI / 180)
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  }
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const s = polarToCartesian(cx, cy, r, startAngle)
  const e = polarToCartesian(cx, cy, r, endAngle)
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1'
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`
}

export default function Gauge({ param, value, size = 160 }) {
  const scale = size / GAUGE_SIZE
  const cx = CENTER
  const cy = CENTER

  const pct = useMemo(() => {
    if (value === null || value === undefined) return 0
    return Math.max(0, Math.min(1, (value - param.min) / (param.max - param.min)))
  }, [value, param])

  const arcLength = 2 * Math.PI * RADIUS * (SWEEP / 360)
  const dashOffset = arcLength * (1 - pct)

  const status = useMemo(() => {
    if (value === null || value === undefined) return 'unknown'
    if (param.shutdown) {
      if (param.shutdown.high && value >= param.shutdown.high) return 'shutdown'
      if (param.shutdown.low && value <= param.shutdown.low) return 'shutdown'
    }
    if (param.alarm) {
      if (param.alarm.high && value >= param.alarm.high) return 'alarm'
      if (param.alarm.low && value <= param.alarm.low) return 'alarm'
    }
    if (param.normal && value >= param.normal[0] && value <= param.normal[1]) return 'normal'
    return 'warn'
  }, [value, param])

  const color = STATUS_COLORS[status]

  const normalStartPct = (param.normal?.[0] - param.min) / (param.max - param.min)
  const normalEndPct = (param.normal?.[1] - param.min) / (param.max - param.min)
  const normalStartAngle = START_ANGLE + normalStartPct * SWEEP
  const normalEndAngle = START_ANGLE + normalEndPct * SWEEP

  const alarmHighPct = param.alarm?.high ? (param.alarm.high - param.min) / (param.max - param.min) : null
  const alarmHighAngle = alarmHighPct ? START_ANGLE + alarmHighPct * SWEEP : null

  const displayValue = value !== null && value !== undefined
    ? Number(value).toFixed(value > 100 ? 0 : 1)
    : '--'

  return (
    <div
      className="relative flex flex-col items-center"
      style={{ width: size, height: size + 20 }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${GAUGE_SIZE} ${GAUGE_SIZE}`}
        style={{ overflow: 'visible' }}
      >
        <path
          d={describeArc(cx, cy, RADIUS, START_ANGLE, START_ANGLE + SWEEP)}
          fill="none"
          stroke="#1a2a3d"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {param.normal && (
          <path
            d={describeArc(cx, cy, RADIUS, normalStartAngle, normalEndAngle)}
            fill="none"
            stroke="rgba(16,185,129,0.2)"
            strokeWidth="8"
            strokeLinecap="butt"
          />
        )}

        <path
          d={describeArc(cx, cy, RADIUS, START_ANGLE, START_ANGLE + SWEEP)}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={arcLength}
          strokeDashoffset={dashOffset}
          className="gauge-arc-value"
          style={{
            filter: status !== 'unknown' ? `drop-shadow(0 0 4px ${color}80)` : 'none',
            transition: 'stroke-dashoffset 0.8s ease-out'
          }}
        />

        {alarmHighAngle && (
          <>
            {(() => {
              const inner = polarToCartesian(cx, cy, RADIUS - 10, alarmHighAngle)
              const outer = polarToCartesian(cx, cy, RADIUS + 4, alarmHighAngle)
              return (
                <line
                  x1={inner.x} y1={inner.y}
                  x2={outer.x} y2={outer.y}
                  stroke="#f59e0b"
                  strokeWidth="2"
                  opacity="0.8"
                />
              )
            })()}
          </>
        )}

        <circle cx={cx} cy={cy} r="4" fill="#1a2a3d" stroke={color} strokeWidth="1.5" />

        {(() => {
          const tipAngle = (START_ANGLE + pct * SWEEP - 90) * (Math.PI / 180)
          const tip = {
            x: cx + (RADIUS - 10) * Math.cos(tipAngle),
            y: cy + (RADIUS - 10) * Math.sin(tipAngle),
          }
          return (
            <line
              x1={cx} y1={cy}
              x2={tip.x} y2={tip.y}
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              style={{
                transition: 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                filter: `drop-shadow(0 0 3px ${color}80)`,
              }}
            />
          )
        })()}

        <text
          x={cx} y={cy + 24}
          textAnchor="middle"
          fill={color}
          fontSize="14"
          style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: "500" }}
        >
          {displayValue}
        </text>

        <text
          x={cx} y={cy + 36}
          textAnchor="middle"
          fill="#4b5563"
          fontSize="8"
          style={{
            fontFamily: "'Barlow', sans-serif",
            letterSpacing: "1px",
            textTransform: "uppercase"
          }}
        >
          {param.unit}
        </text>

        {(() => {
          const pos = polarToCartesian(cx, cy, RADIUS + 14, START_ANGLE)
          return (
            <text x={pos.x} y={pos.y + 2} textAnchor="middle" fill="#2e4060" fontSize="7" style={{ fontFamily: "monospace" }}>
              {param.min}
            </text>
          )
        })()}

        {(() => {
          const pos = polarToCartesian(cx, cy, RADIUS + 14, START_ANGLE + SWEEP)
          return (
            <text x={pos.x} y={pos.y + 2} textAnchor="middle" fill="#2e4060" fontSize="7" style={{ fontFamily: "monospace" }}>
              {param.max}
            </text>
          )
        })()}
      </svg>

      <div className="text-center mt-1" style={{ width: size }}>
        <div className="font-display text-xs font-500 uppercase tracking-wider text-slate-400 leading-tight">
          {param.label}
        </div>
        {param.tag && (
          <div className="font-mono text-xs text-steel-500 opacity-60 leading-tight">
            {param.tag}
          </div>
        )}
        {status !== 'normal' && status !== 'unknown' && (
          <div
            className={`font-mono text-xs uppercase font-bold mt-0.5 ${status === 'shutdown' ? 'text-red-500 animate-pulse' : status === 'alarm' ? 'text-orange-500' : 'text-yellow-500'}`}
          >
            {status === 'shutdown' ? '⚠ SHUTDOWN' : status === 'alarm' ? '⚡ ALARM' : '▲ WARN'}
          </div>
        )}
      </div>
    </div>
  )
}