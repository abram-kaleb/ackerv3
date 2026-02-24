import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Table names
export const TABLES = {
  SENSOR_READINGS: 'sensor_readings',     // Table 1 - real-time sensor data from Streamlit 1
  ML_PREDICTIONS: 'ml_predictions',       // Table 2 - ML results from Streamlit 2
  SIMULATION_DATA: 'simulation_data',     // Table 3 - simulation control (row 1) + results (row 2+)
}
