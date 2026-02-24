// pages/StreamlitLogs.js
import React from 'react'
import { X, ExternalLink, Activity } from 'lucide-react'

const SERVICES = [
  { id: 'sl1', title: 'GEN', envKey: 'VITE_STREAMLIT_1_URL', color: '#22d3ee' },
  { id: 'sl2', title: 'ML', envKey: 'VITE_STREAMLIT_2_URL', color: '#10b981' },
  { id: 'sl3', title: 'SIM', envKey: 'VITE_STREAMLIT_3_URL', color: '#a855f7' },
]

export default function StreamlitLogs({ isVisible, onClose }) {
  const getUrl = (envKey) => {
    try {
      const url = import.meta.env[envKey]
      return url ? `${url.replace(/\/$/, '')}?embed=true&embed_options=disable_scrolling,light_theme` : null
    } catch {
      return null
    }
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-500 ease-in-out ${isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
    >
      <div className="mx-4 mb-4 overflow-hidden rounded-t-xl border-x border-t border-steel-800 bg-steel-900/95 backdrop-blur-md shadow-2xl">
        <div className="flex items-center justify-between px-4 py-2 border-b border-steel-800 bg-steel-950/50">
          <div className="flex items-center gap-3">
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="font-display font-bold text-[10px] tracking-[0.2em] text-white uppercase">
              Live Backend Workers
            </span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-steel-800 rounded-md transition-colors">
            <X className="w-4 h-4 text-steel-400" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1 p-1 bg-steel-950">
          {SERVICES.map((svc) => {
            const embedUrl = getUrl(svc.envKey)
            return (
              <div key={svc.id} className="relative group bg-steel-900 overflow-hidden rounded-sm">
                <div className="flex items-center justify-between px-2 py-1 bg-steel-800/50 border-b border-steel-700/50">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: svc.color }} />
                    <span className="font-mono text-[9px] font-bold text-steel-300">{svc.title}</span>
                  </div>
                  {import.meta.env[svc.envKey] && (
                    <a
                      href={import.meta.env[svc.envKey]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ExternalLink className="w-3 h-3 text-steel-500 hover:text-white" />
                    </a>
                  )}
                </div>

                <div className="h-[200px] w-full bg-black/20">
                  {embedUrl ? (
                    <iframe
                      src={embedUrl}
                      className="w-full h-full border-none"
                      title={svc.title}
                      loading="eager"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full font-mono text-[8px] text-steel-600 px-4 text-center italic">
                      {svc.envKey} not set
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}