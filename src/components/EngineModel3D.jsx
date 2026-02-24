// src/components/EngineModel3D.jsx

import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Stage, ContactShadows, Html } from '@react-three/drei'
import Gauge from './Gauge'

function Model() {
    const { scene } = useGLTF('/engine.glb')
    return <primitive object={scene} scale={8} position-y={-0.9} />
}

export default function EngineModel3D({ readings, PARAMS = {} }) {
    const paramsList = PARAMS ? Object.values(PARAMS) : [];

    return (
        <Canvas
            camera={{ position: [8, -2, -8], fov: 35 }}
        >
            <Suspense fallback={null}>
                <Stage
                    contactShadow={false}
                    adjustCamera={false}
                    environment="city"
                    intensity={0.5}
                    center={{ disable: true }}
                >
                    <Model />
                </Stage>

                {paramsList.length > 0 && (
                    <>
                        <Html position={[-1.5, 0.5, 0]} center distanceFactor={6}>
                            <div className="bg-[#0a192f]/80 backdrop-blur-md p-3 rounded-xl border border-blue-500/30 shadow-2xl flex flex-col items-center min-w-[110px]">
                                <div className="scale-110 mb-1">
                                    <Gauge
                                        param={{
                                            ...paramsList.find(p => p.key === 'engine_speed_rpm'),
                                            label: ""
                                        }}
                                        value={readings?.engine_speed_rpm}
                                        size={70}
                                    />
                                </div>

                                <div className="flex flex-col items-center leading-none">
                                    <span className="text-[22px] font-mono font-black text-white">
                                        {Math.round(readings?.engine_speed_rpm || 0)}
                                        <span className="text-[10px] text-cyan-500 ml-0.5 font-bold">RPM</span>
                                    </span>
                                    <span className="text-[9px] font-mono text-cyan-400 font-bold uppercase tracking-[0.15em] mt-1">
                                        Engine Speed
                                    </span>
                                </div>
                            </div>
                        </Html>

                        <Html position={[-3, 0.1, 0]} center distanceFactor={6}>
                            <div className="bg-[#0a192f]/80 backdrop-blur-md p-3 rounded-xl border border-blue-500/30 shadow-2xl flex flex-col items-center min-w-[100px]">
                                <div className="scale-110 mb-1">
                                    <Gauge
                                        param={{
                                            ...paramsList.find(p => p.key === 'load_factor_pct'),
                                            label: ""
                                        }}
                                        value={readings?.load_factor_pct}
                                        size={70}
                                    />
                                </div>

                                <div className="flex flex-col items-center leading-none">
                                    <span className="text-[20px] font-mono font-black text-white">
                                        {Math.round(readings?.load_factor_pct || 0)}
                                        <span className="text-[10px] text-cyan-500 ml-0.5">%</span>
                                    </span>
                                    <span className="text-[9px] font-mono text-cyan-400/70 font-bold text-center uppercase tracking-[0.2em] mt-1">
                                        Engine Load
                                    </span>
                                </div>
                            </div>
                        </Html>

                        <Html position={[2, 0.9, 0]} center distanceFactor={6}>
                            <div className="bg-[#0a192f]/80 backdrop-blur-md p-3 rounded-xl border border-blue-500/30 shadow-2xl flex flex-col items-center min-w-[110px]">
                                <div className="scale-110 mb-1">
                                    <Gauge
                                        param={{
                                            ...paramsList.find(p => p.key === 'lo_pressure_after_filter_bar'),
                                            label: ""
                                        }}
                                        value={readings?.lo_pressure_after_filter_bar}
                                        size={70}
                                    />
                                </div>

                                <div className="flex flex-col items-center leading-none">
                                    <span className="text-[22px] font-mono font-black text-white">
                                        {readings?.lo_pressure_after_filter_bar?.toFixed(1) || "0.0"}
                                        <span className="text-[10px] text-cyan-500 ml-1 font-bold">BAR</span>
                                    </span>
                                    <span className="text-[9px] font-mono text-cyan-400 font-bold text-center uppercase tracking-[0.15em] mt-1">
                                        L.O. Pressure
                                    </span>
                                </div>
                            </div>
                        </Html>

                        <Html position={[0.3, 0.9, 0]} center distanceFactor={6}>
                            <div className="bg-[#0a192f]/80 backdrop-blur-md p-3 rounded-xl border border-blue-500/30 shadow-2xl flex flex-col items-center min-w-[110px]">
                                <div className="scale-110 mb-1">
                                    <Gauge
                                        param={{
                                            ...paramsList.find(p => p.key === 'ht_cw_temp_outlet_c'),
                                            label: ""
                                        }}
                                        value={readings?.ht_cw_temp_outlet_c}
                                        size={70}
                                    />
                                </div>

                                <div className="flex flex-col items-center leading-none">
                                    <span className="text-[22px] font-mono font-black text-white">
                                        {Math.round(readings?.ht_cw_temp_outlet_c || 0)}
                                        <span className="text-[10px] text-orange-400 ml-0.5 font-bold">°C</span>
                                    </span>
                                    <span className="text-[9px] font-mono text-cyan-400 font-bold text-center uppercase tracking-[0.12em] mt-1">
                                        HT CW Outlet
                                    </span>
                                </div>
                            </div>
                        </Html>
                    </>
                )}

                <OrbitControls
                    enablePan={true}
                    enableDamping={true}
                    dampingFactor={0.07}
                    minDistance={2}
                    maxDistance={20}
                    autoRotate={true}
                    autoRotateSpeed={0}
                    makeDefault
                />
            </Suspense>
        </Canvas>
    )
}