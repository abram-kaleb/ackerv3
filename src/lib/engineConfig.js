// MAN 6L23/30H Engine Specification Constants
// Source: MAN Energy Solutions Technical Documentation L23/30H Project Guide 2024

export const ENGINE_SPEC = {
  model: '6L23/30H',
  manufacturer: 'MAN Energy Solutions',
  cylinders: 6,
  bore_mm: 225,
  stroke_mm: 300,
  rated_speed_rpm: 720, // also 750 rpm variant
  rated_power_kw: 780,  // 720 rpm: 130 kW/cyl × 6
  rated_power_kw_750: 810, // 750 rpm: 135 kW/cyl × 6
  mean_piston_speed_ms: 7.2,
  compression_ratio: 14.5,
  firing_order: [1, 4, 2, 6, 3, 5],
}

// Parameter definitions with normal ranges, alarm, and shutdown limits
// Based on Operation Data & Set Points B 19 00 0 (Tier II)
export const PARAMS = {
  // ═══ SPEED SYSTEM ═══
  engine_speed: {
    key: 'engine_speed_rpm',
    label: 'Engine Speed',
    unit: 'RPM',
    min: 0, max: 900,
    normal: [700, 760],
    alarm: { high: 815 },
    shutdown: { high: 825 },
    nominal: 720,
    gauge: true,
    color: 'cyan',
  },
  tc_speed: {
    key: 'tc_speed_rpm',
    label: 'TC Speed',
    unit: 'RPM',
    min: 0, max: 70000,
    normal: [50000, 58000],
    alarm: { high: 55290 },
    nominal: 53000,
    gauge: false,
    color: 'cyan',
  },

  // ═══ LUBRICATING OIL SYSTEM ═══
  lo_temp_before_cooler: {
    key: 'lo_temp_before_cooler_c',
    label: 'LO Temp (Before Cooler)',
    unit: '°C',
    min: 0, max: 120,
    normal: [60, 75],
    alarm: { high: 85 },
    shutdown: { high: 95 },
    nominal: 68,
    gauge: true,
    color: 'amber',
    tag: 'TI 20',
  },
  lo_temp_after_cooler: {
    key: 'lo_temp_after_cooler_c',
    label: 'LO Temp (Inlet Engine)',
    unit: '°C',
    min: 0, max: 100,
    normal: [45, 65],
    alarm: { high: 75 },
    shutdown: { high: 85 },
    nominal: 55,
    gauge: true,
    color: 'amber',
    tag: 'TI 22',
  },
  lo_pressure_after_filter: {
    key: 'lo_pressure_after_filter_bar',
    label: 'LO Pressure (Inlet Engine)',
    unit: 'bar',
    min: 0, max: 7,
    normal: [3.1, 4.5],
    alarm: { low: 2.5 },
    shutdown: { low: 3.0 },
    nominal: 3.8,
    gauge: true,
    color: 'cyan',
    tag: 'PI 22',
  },
  lo_pressure_drop_filter: {
    key: 'lo_pressure_drop_filter_bar',
    label: 'LO Filter ΔP',
    unit: 'bar',
    min: 0, max: 2,
    normal: [0.5, 1.0],
    alarm: { high: 1.5 },
    nominal: 0.7,
    gauge: false,
    color: 'amber',
    tag: 'PDI 21-22',
  },
  lo_level: {
    key: 'lo_level_pct',
    label: 'LO Level',
    unit: '%',
    min: 0, max: 100,
    normal: [40, 90],
    alarm: { low: 20, high: 95 },
    nominal: 65,
    gauge: false,
    color: 'cyan',
    tag: 'LI 25',
  },
  lo_main_bearing_temp: {
    key: 'lo_main_bearing_temp_c',
    label: 'Main Bearing Temp',
    unit: '°C',
    min: 0, max: 120,
    normal: [60, 85],
    alarm: { high: 95 },
    nominal: 72,
    gauge: false,
    color: 'amber',
    tag: 'TE 29',
  },

  // ═══ COOLING WATER - HT SYSTEM ═══
  ht_cw_temp_inlet: {
    key: 'ht_cw_temp_inlet_c',
    label: 'HT CW Temp (Inlet)',
    unit: '°C',
    min: 0, max: 120,
    normal: [60, 75],
    alarm: { high: 90 },
    nominal: 68,
    gauge: true,
    color: 'amber',
    tag: 'TI 10',
  },
  ht_cw_temp_outlet: {
    key: 'ht_cw_temp_outlet_c',
    label: 'HT CW Temp (Outlet)',
    unit: '°C',
    min: 0, max: 120,
    normal: [70, 85],
    alarm: { high: 90 },
    shutdown: { high: 93 },
    nominal: 82,
    gauge: true,
    color: 'amber',
    tag: 'TI 12',
    setpoint: 82, // nominal setpoint from thermostat
  },
  ht_cw_pressure_inlet: {
    key: 'ht_cw_pressure_inlet_bar',
    label: 'HT CW Pressure',
    unit: 'bar',
    min: 0, max: 6,
    normal: [1.5, 4.6],
    alarm: { low: 0.4 },
    nominal: 2.5,
    gauge: false,
    color: 'cyan',
    tag: 'PI 10',
  },
  ht_cw_temp_raise: {
    key: 'ht_cw_temp_raise_c',
    label: 'HT CW ΔT',
    unit: '°C',
    min: 0, max: 20,
    normal: [5, 10],
    alarm: { high: 12 },
    nominal: 8,
    gauge: false,
    color: 'amber',
    tag: 'ΔT CYL',
  },

  // ═══ COOLING WATER - LT SYSTEM ═══
  lt_cw_pressure_inlet: {
    key: 'lt_cw_pressure_inlet_bar',
    label: 'LT CW Pressure',
    unit: 'bar',
    min: 0, max: 4,
    normal: [1.0, 2.5],
    alarm: { low: 0.4 },
    nominal: 1.8,
    gauge: false,
    color: 'cyan',
    tag: 'PI 01',
  },
  lt_cw_temp_outlet: {
    key: 'lt_cw_temp_outlet_c',
    label: 'LT CW Temp (Outlet)',
    unit: '°C',
    min: 0, max: 60,
    normal: [29, 41],
    nominal: 35,
    gauge: false,
    color: 'amber',
    tag: 'TI LT',
    setpoint: 35,
  },

  // ═══ EXHAUST GAS SYSTEM ═══
  exh_temp_before_tc: {
    key: 'exh_temp_before_tc_c',
    label: 'Exh Temp (Before TC)',
    unit: '°C',
    min: 0, max: 700,
    normal: [425, 475],
    alarm: { high: 550 },
    shutdown: { high: 600 },
    nominal: 450,
    gauge: true,
    color: 'danger',
    tag: 'TI 62',
  },
  exh_temp_after_tc: {
    key: 'exh_temp_after_tc_c',
    label: 'Exh Temp (After TC)',
    unit: '°C',
    min: 0, max: 500,
    normal: [290, 370],
    alarm: { high: 450 },
    nominal: 342,
    gauge: true,
    color: 'danger',
    tag: 'TI 61',
  },
  // Individual cylinder exhaust temps (6 cylinders)
  exh_temp_cyl_1: { key: 'exh_temp_cyl_1_c', label: 'Exh Cyl #1', unit: '°C', min: 200, max: 600, normal: [300, 415], alarm: { high: 500, deviation: 50 }, nominal: 370, gauge: false, tag: 'TI 60-1' },
  exh_temp_cyl_2: { key: 'exh_temp_cyl_2_c', label: 'Exh Cyl #2', unit: '°C', min: 200, max: 600, normal: [300, 415], alarm: { high: 500, deviation: 50 }, nominal: 368, gauge: false, tag: 'TI 60-2' },
  exh_temp_cyl_3: { key: 'exh_temp_cyl_3_c', label: 'Exh Cyl #3', unit: '°C', min: 200, max: 600, normal: [300, 415], alarm: { high: 500, deviation: 50 }, nominal: 372, gauge: false, tag: 'TI 60-3' },
  exh_temp_cyl_4: { key: 'exh_temp_cyl_4_c', label: 'Exh Cyl #4', unit: '°C', min: 200, max: 600, normal: [300, 415], alarm: { high: 500, deviation: 50 }, nominal: 365, gauge: false, tag: 'TI 60-4' },
  exh_temp_cyl_5: { key: 'exh_temp_cyl_5_c', label: 'Exh Cyl #5', unit: '°C', min: 200, max: 600, normal: [300, 415], alarm: { high: 500, deviation: 50 }, nominal: 375, gauge: false, tag: 'TI 60-5' },
  exh_temp_cyl_6: { key: 'exh_temp_cyl_6_c', label: 'Exh Cyl #6', unit: '°C', min: 200, max: 600, normal: [300, 415], alarm: { high: 500, deviation: 50 }, nominal: 370, gauge: false, tag: 'TI 60-6' },

  // ═══ CHARGE AIR SYSTEM ═══
  charge_air_pressure: {
    key: 'charge_air_pressure_bar',
    label: 'Charge Air Pressure',
    unit: 'bar',
    min: 0, max: 4,
    normal: [2.0, 2.5],
    alarm: { low: 1.5 },
    nominal: 2.3,
    gauge: true,
    color: 'cyan',
    tag: 'PI 31',
  },
  charge_air_temp: {
    key: 'charge_air_temp_c',
    label: 'Charge Air Temp',
    unit: '°C',
    min: 0, max: 100,
    normal: [35, 55],
    alarm: { high: 65 },
    nominal: 45,
    gauge: false,
    color: 'amber',
    tag: 'TI 31',
    setpoint: 55,
  },

  // ═══ FUEL OIL SYSTEM ═══
  fuel_pressure_inlet: {
    key: 'fuel_pressure_inlet_bar',
    label: 'Fuel Oil Pressure',
    unit: 'bar',
    min: 0, max: 10,
    normal: [2.5, 5.0],
    alarm: { low: 1.5 },
    nominal: 4.0,
    gauge: false,
    color: 'amber',
    tag: 'PI 40',
  },
  fuel_rack_position: {
    key: 'fuel_rack_position_pct',
    label: 'Fuel Rack Position',
    unit: '%',
    min: 0, max: 100,
    normal: [20, 85],
    alarm: { high: 95 },
    nominal: 60,
    gauge: false,
    color: 'cyan',
    tag: 'FI 44',
  },

  // ═══ COMPRESSED AIR SYSTEM ═══
  start_air_pressure: {
    key: 'start_air_pressure_bar',
    label: 'Start Air Pressure',
    unit: 'bar',
    min: 0, max: 35,
    normal: [7, 30],
    alarm: { low: 7 },
    nominal: 25,
    gauge: false,
    color: 'cyan',
    tag: 'PI 70',
  },

  // ═══ ALTERNATOR / ELECTRICAL ═══
  alternator_load_kw: {
    key: 'alternator_load_kw',
    label: 'Generator Load',
    unit: 'kW',
    min: 0, max: 900,
    normal: [0, 780],
    alarm: { high: 810 },
    nominal: 600,
    gauge: true,
    color: 'cyan',
    tag: 'PI 59',
  },
  alternator_frequency: {
    key: 'alternator_frequency_hz',
    label: 'Frequency',
    unit: 'Hz',
    min: 45, max: 55,
    normal: [49.5, 50.5],
    alarm: { low: 48.5, high: 51.5 },
    nominal: 50,
    gauge: false,
    color: 'cyan',
    tag: 'FI 59',
  },
  alternator_voltage: {
    key: 'alternator_voltage_v',
    label: 'Voltage',
    unit: 'V',
    min: 0, max: 480,
    normal: [385, 415],
    alarm: { low: 370, high: 420 },
    nominal: 400,
    gauge: false,
    color: 'cyan',
    tag: 'VI 59',
  },
  load_factor: {
    key: 'load_factor_pct',
    label: 'Load Factor',
    unit: '%',
    min: 0, max: 110,
    normal: [0, 100],
    alarm: { high: 100 },
    nominal: 75,
    gauge: true,
    color: 'amber',
    tag: 'LF',
  },

  // ═══ CRANKCASE / SAFETY ═══
  oil_mist_level: {
    key: 'oil_mist_level_pct',
    label: 'Oil Mist Level',
    unit: '%',
    min: 0, max: 100,
    normal: [0, 30],
    alarm: { high: 50 },
    shutdown: { high: 80 },
    nominal: 5,
    gauge: false,
    color: 'warn',
    tag: 'OMD 92',
  },
  crankcase_pressure: {
    key: 'crankcase_pressure_mbar',
    label: 'Crankcase Pressure',
    unit: 'mbar',
    min: -5, max: 20,
    normal: [-2, 5],
    alarm: { high: 10 },
    nominal: 1,
    gauge: false,
    color: 'warn',
    tag: 'PI CC',
  },

  // ═══ AMBIENT ═══
  ambient_temp: {
    key: 'ambient_temp_c',
    label: 'Ambient Temp',
    unit: '°C',
    min: -10, max: 60,
    normal: [15, 45],
    nominal: 25,
    gauge: false,
    color: 'cyan',
    tag: 'TI 39',
  },
  scavenge_air_pressure: {
    key: 'scavenge_air_pressure_bar',
    label: 'Scavenge Air Press',
    unit: 'bar',
    min: 0, max: 4,
    normal: [1.8, 2.5],
    alarm: { low: 1.5 },
    nominal: 2.1,
    gauge: false,
    color: 'cyan',
    tag: 'PI 32',
  },
}

// Gauge parameters for main dashboard
export const GAUGE_PARAMS = Object.values(PARAMS).filter(p => p.gauge)

// Get status color based on value
export function getParamStatus(param, value) {
  if (value === null || value === undefined) return 'unknown'
  const p = typeof param === 'string' ? PARAMS[param] : param
  if (!p) return 'unknown'

  if (p.shutdown) {
    if (p.shutdown.high && value >= p.shutdown.high) return 'shutdown'
    if (p.shutdown.low && value <= p.shutdown.low) return 'shutdown'
  }
  if (p.alarm) {
    if (p.alarm.high && value >= p.alarm.high) return 'alarm'
    if (p.alarm.low && value <= p.alarm.low) return 'alarm'
  }
  if (p.normal) {
    if (value >= p.normal[0] && value <= p.normal[1]) return 'normal'
    return 'warn'
  }
  return 'normal'
}

export const STATUS_COLORS = {
  normal: '#10b981',
  warn: '#f59e0b',
  alarm: '#f97316',
  shutdown: '#ef4444',
  unknown: '#4b5563',
}
