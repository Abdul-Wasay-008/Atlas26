"use client";

import { useSelectionStore } from "@/app/store/selectionStore";
import { poppins, orbitron } from "@/app/fonts";
import { useISSTelemetry } from "@/app/hooks/useISSTelemetry";
import { useHubbleTelemetry } from "@/app/hooks/useHubbleTelemetry";
import { PanelRightClose, PanelRightOpen } from "lucide-react";

export default function InfoPanel() {
    const selected = useSelectionStore((state) => state.selected);
    const infoPanelOpen = useSelectionStore((state) => state.infoPanelOpen);
    const setInfoPanelOpen = useSelectionStore((state) => state.setInfoPanelOpen);
    
    const issTelemetry = useISSTelemetry();
    const hubbleTelemetry = useHubbleTelemetry();

    return (
        <>
            {/* Toggle Button - Always visible on right edge */}
            <button
                onClick={() => setInfoPanelOpen(!infoPanelOpen)}
                className={`
                    fixed top-1/2 -translate-y-1/2 z-50
                    flex items-center justify-center
                    w-10 h-16 
                    bg-black/60 backdrop-blur-xl
                    border border-white/20 
                    rounded-l-xl
                    text-white/70 hover:text-white
                    transition-all duration-300
                    cursor-pointer
                    hover:bg-black/80
                    ${infoPanelOpen ? "right-[280px] lg:right-[300px]" : "right-0"}
                `}
                aria-label={infoPanelOpen ? "Close info panel" : "Open info panel"}
            >
                {infoPanelOpen ? (
                    <PanelRightClose size={20} strokeWidth={1.5} />
                ) : (
                    <PanelRightOpen size={20} strokeWidth={1.5} />
                )}
            </button>

            {/* Info Panel - Sliding from right */}
            <aside
                className={`
                    fixed top-0 right-0 h-full
                    w-[280px] lg:w-[300px]
                    bg-black/60 backdrop-blur-2xl
                    border-l border-white/10
                    shadow-[-10px_0_40px_rgba(0,0,0,0.5)]
                    p-6 text-white z-40
                    transform transition-transform duration-300 ease-in-out
                    flex flex-col
                    overflow-y-auto
                    ${infoPanelOpen ? "translate-x-0" : "translate-x-full"}
                    ${poppins.className}
                `}
            >
                {/* Title */}
                <h2 className={`text-lg lg:text-xl font-bold text-center mb-6 tracking-wider ${orbitron.className}`}>
                    {selected ? selected.name.toUpperCase() : "OBJECT INFO"}
                </h2>

                {/* Default Message */}
                {!selected && (
                    <p className="text-sm text-white/50 text-center leading-relaxed">
                        Click any object in space to view detailed information here.
                    </p>
                )}

                {/* Selected Object Details */}
                {selected && (
                    <div className="space-y-4 text-left animate-fadeIn">
                        <p className="text-sm">
                            <span className="font-semibold text-white">Type:</span>{" "}
                            <span className="text-white/70 capitalize">{selected.type}</span>
                        </p>

                        <p className="text-sm">
                            <span className="font-semibold text-white">Radius:</span>{" "}
                            <span className="text-white/70">{selected.radius}</span>
                        </p>

                        <p className="text-sm">
                            <span className="font-semibold text-white">Orbital Period:</span>{" "}
                            <span className="text-white/70">{selected.orbitalPeriod}</span>
                        </p>

                        {/* Live telemetry for ISS */}
                        {selected.id === "iss" ? (
                            <>
                                <p className="text-sm">
                                    <span className="font-semibold text-white">Altitude:</span>{" "}
                                    <span className="text-cyan-400">{issTelemetry.altitudeKm.toFixed(1)} km</span>
                                </p>
                                <p className="text-sm">
                                    <span className="font-semibold text-white">Latitude:</span>{" "}
                                    <span className="text-cyan-400">{issTelemetry.latitude.toFixed(2)}°</span>
                                </p>
                                <p className="text-sm">
                                    <span className="font-semibold text-white">Longitude:</span>{" "}
                                    <span className="text-cyan-400">{issTelemetry.longitude.toFixed(2)}°</span>
                                </p>
                                <p className="text-sm">
                                    <span className="font-semibold text-white">Speed:</span>{" "}
                                    <span className="text-cyan-400">{issTelemetry.speedKmS.toFixed(2)} km/s</span>
                                </p>
                            </>
                        ) : selected.id === "hubble" ? (
                            <>
                                <p className="text-sm">
                                    <span className="font-semibold text-white">Altitude:</span>{" "}
                                    <span className="text-cyan-400">{hubbleTelemetry.altitudeKm.toFixed(1)} km</span>
                                </p>
                                <p className="text-sm">
                                    <span className="font-semibold text-white">Latitude:</span>{" "}
                                    <span className="text-cyan-400">{hubbleTelemetry.latitude.toFixed(2)}°</span>
                                </p>
                                <p className="text-sm">
                                    <span className="font-semibold text-white">Longitude:</span>{" "}
                                    <span className="text-cyan-400">{hubbleTelemetry.longitude.toFixed(2)}°</span>
                                </p>
                                <p className="text-sm">
                                    <span className="font-semibold text-white">Speed:</span>{" "}
                                    <span className="text-cyan-400">{hubbleTelemetry.speedKmS.toFixed(2)} km/s</span>
                                </p>
                            </>
                        ) : (
                            selected.distanceFromEarth && (
                                <p className="text-sm">
                                    <span className="font-semibold text-white">Distance:</span>{" "}
                                    <span className="text-white/70">{selected.distanceFromEarth}</span>
                                </p>
                            )
                        )}

                        <div className="pt-2 border-t border-white/10">
                            <p className="text-sm text-white/60 leading-relaxed">
                                {selected.description}
                            </p>
                        </div>
                    </div>
                )}

                {/* Bottom Soft Fade */}
                <div className="absolute bottom-0 left-0 w-full h-16 bg-linear-to-t from-black/70 to-transparent pointer-events-none" />
            </aside>
        </>
    );
}
