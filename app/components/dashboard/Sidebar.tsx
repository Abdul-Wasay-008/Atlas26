"use client"

import { useState } from "react"
import { orbitron, poppins } from "@/app/fonts"
import { FaBars, FaTimes } from "react-icons/fa"
import { Orbit, Satellite, Sparkle, Stars, LoaderPinwheelIcon, ChevronDown, ChevronRight, SlidersVertical, X, Monitor, Smartphone } from "lucide-react"
import { useSelectionStore } from "@/app/store/selectionStore"
import { spaceObjects } from "@/app/data/spaceObjects"

function ControlsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 z-100 flex items-center justify-center p-4"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal */}
            <div
                onClick={(e) => e.stopPropagation()}
                className={`
                    relative w-full max-w-2xl max-h-[85vh] overflow-y-auto
                    bg-white/10 backdrop-blur-xl
                    border border-white/20
                    rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]
                    p-6 md:p-8
                    ${poppins.className}
                `}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/60 hover:text-white cursor-pointer transition-colors"
                >
                    <X size={24} />
                </button>

                {/* Title */}
                <h2 className={`text-2xl md:text-3xl text-center font-semibold text-white mb-4 ${orbitron.className}`}>
                    Controls
                </h2>
                <p className="text-white/60 text-sm md:text-base text-center mb-8">
                    Follow the guide below to navigate Atlas with ease
                </p>

                {/* Desktop Controls */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <Monitor size={22} className="text-cyan-400" />
                        <h3 className="text-lg font-medium text-white">Desktop / Laptop</h3>
                    </div>

                    <div className="space-y-3 text-white/80 text-sm md:text-base">
                        <div className="flex gap-3">
                            <span className="text-cyan-400 font-medium min-w-[140px]">Rotate View</span>
                            <span>Click and drag with your mouse</span>
                        </div>
                        <div className="flex gap-3">
                            <span className="text-cyan-400 font-medium min-w-[140px]">Pan / Move</span>
                            <span>Right-click and drag, or use W A S D keys</span>
                        </div>
                        <div className="flex gap-3">
                            <span className="text-cyan-400 font-medium min-w-[140px]">Zoom In / Out</span>
                            <span>Scroll with your mouse wheel</span>
                        </div>
                        <div className="flex gap-3">
                            <span className="text-cyan-400 font-medium min-w-[140px]">Move Up / Down</span>
                            <span>Press E to go up, Q to go down</span>
                        </div>
                        <div className="flex gap-3">
                            <span className="text-cyan-400 font-medium min-w-[140px]">Move Faster</span>
                            <span>Hold Shift while moving</span>
                        </div>
                        <div className="flex gap-3">
                            <span className="text-cyan-400 font-medium min-w-[140px]">Select Object</span>
                            <span>Click on any planet or satellite</span>
                        </div>
                        <div className="flex gap-3">
                            <span className="text-cyan-400 font-medium min-w-[140px]">Reset View</span>
                            <span>Press Escape to reset camera, time, and show all orbits</span>
                        </div>
                    </div>
                </div>

                {/* Mobile Controls */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Smartphone size={22} className="text-cyan-400" />
                        <h3 className="text-lg font-medium text-white">Mobile / Tablet</h3>
                    </div>

                    <div className="space-y-3 text-white/80 text-sm md:text-base">
                        <div className="flex gap-3">
                            <span className="text-cyan-400 font-medium min-w-[140px]">Rotate View</span>
                            <span>Touch and drag with one finger</span>
                        </div>
                        <div className="flex gap-3">
                            <span className="text-cyan-400 font-medium min-w-[140px]">Zoom In / Out</span>
                            <span>Pinch with two fingers</span>
                        </div>
                        <div className="flex gap-3">
                            <span className="text-cyan-400 font-medium min-w-[140px]">Pan / Move</span>
                            <span>Drag with two fingers</span>
                        </div>
                        <div className="flex gap-3">
                            <span className="text-cyan-400 font-medium min-w-[140px]">Select Object</span>
                            <span>Tap on any planet or satellite</span>
                        </div>
                    </div>
                </div>

                {/* Tips */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h4 className="text-white font-medium mb-2">Quick Tips</h4>
                    <ul className="text-white/70 text-sm space-y-1.5 list-disc list-inside">
                        <li>Use the sidebar to quickly jump to any planet</li>
                        <li>Click "All" to see all orbit paths at once</li>
                        <li>Use the time controls at the bottom to speed up orbital motion</li>
                        <li>Selected objects show detailed info in the right panel</li>
                        <li>Press <span className="text-cyan-400">Esc</span> or the reset button to return to default view</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

export default function Sidebar() {
    const [open, setOpen] = useState(false)
    const [active, setActive] = useState("All")
    const [planetsExpanded, setPlanetsExpanded] = useState(false)
    const [satellitesExpanded, setSatellitesExpanded] = useState(false)
    const [moonsExpanded, setMoonsExpanded] = useState(false)
    const [controlsModalOpen, setControlsModalOpen] = useState(false)
    const selectObject = useSelectionStore((state) => state.selectObject)
    const selectedId = useSelectionStore((state) => state.selectedId)
    const setShowAllOrbits = useSelectionStore((state) => state.setShowAllOrbits)

    const menu = [
        { name: "All", icon: LoaderPinwheelIcon },
        { name: "Planets", icon: Orbit },
        { name: "Moons", icon: Satellite },
        { name: "Satellites", icon: Satellite },
        { name: "Comets", icon: Sparkle },
        { name: "Interstellar", icon: Stars },
    ]

    // Get planets for the expandable list, ordered from Sun: Mercury → Neptune
    const PLANET_ORDER = ["mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune"] as const
    const planets = spaceObjects
        .filter(obj => obj.type === "planet")
        .sort((a, b) => PLANET_ORDER.indexOf(a.id as typeof PLANET_ORDER[number]) - PLANET_ORDER.indexOf(b.id as typeof PLANET_ORDER[number]))

    // Natural moons: all satellites except artificial ones (ISS, Hubble)
    const moons = spaceObjects.filter(
        obj => obj.type === "satellite" && obj.id !== "iss" && obj.id !== "hubble"
    )

    // All satellites except Earth's Moon (kept separate as a moon)
    const satellites = spaceObjects.filter(
        obj => obj.type === "satellite" && obj.id !== "moon"
    )

    const handlePlanetClick = (planetId: string) => {
        selectObject(planetId)
        setActive("Planets")
    }

    const handleMoonClick = (moonId: string) => {
        selectObject(moonId)
        setActive("Moons")
    }

    const handleSatelliteClick = (satelliteId: string) => {
        selectObject(satelliteId)
        setActive("Satellites")
    }

    const renderMenu = () => (
        <div className="space-y-3 text-sm md:text-base text-white/60">
            {menu.map(({ name, icon: Icon }) => {
                const isPlanets = name === "Planets"
                const isMoons = name === "Moons"
                const isSatellites = name === "Satellites"
                const isActive = active === name
                const isExpandable = isPlanets || isMoons || isSatellites
                const isExpanded = isPlanets
                    ? planetsExpanded
                    : isMoons
                        ? moonsExpanded
                        : satellitesExpanded

                return (
                    <div key={name}>
                        <button
                            onClick={() => {
                                setActive(name)
                                if (name === "All") {
                                    setShowAllOrbits(true)
                                } else {
                                    setShowAllOrbits(false)
                                }
                                if (isPlanets) {
                                    setPlanetsExpanded(!planetsExpanded)
                                }
                                if (isMoons) {
                                    setMoonsExpanded(!moonsExpanded)
                                }
                                if (isSatellites) {
                                    setSatellitesExpanded(!satellitesExpanded)
                                }
                            }}
                            className={`
                                group flex items-center gap-3 w-full px-3 py-2
                                rounded-lg font-medium transition-all duration-300 cursor-pointer
                                ${poppins.className}
                                ${isActive
                                    ? "text-white bg-white/10 backdrop-blur-lg border border-white/20 shadow-[0_0_18px_rgba(255,255,255,0.06)]"
                                    : "hover:text-white hover:bg-white/5 hover:border-white/10 border border-transparent"
                                }
                            `}
                        >
                            <Icon
                                size={20}
                                strokeWidth={1.5}
                                className={`
                                    transition-all duration-300
                                    ${isActive
                                        ? "text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.45)]"
                                        : "group-hover:text-white"
                                    }
                                `}
                            />
                            <span className="flex-1 text-left">
                                {name}
                            </span>
                            {isExpandable && (
                                isExpanded ? (
                                    <ChevronDown size={16} className="text-white/60" />
                                ) : (
                                    <ChevronRight size={16} className="text-white/60" />
                                )
                            )}
                        </button>

                        {/* Expandable planet list */}
                        {isPlanets && planetsExpanded && (
                            <div className="ml-8 mt-1 space-y-1">
                                {planets.map((planet) => (
                                    <button
                                        key={planet.id}
                                        onClick={() => handlePlanetClick(planet.id)}
                                        className={`
                                            w-full px-3 py-1.5 text-left rounded-md
                                            transition-all duration-200 text-sm cursor-pointer
                                            ${selectedId === planet.id
                                                ? "text-cyan-400 bg-cyan-400/10 border border-cyan-400/30"
                                                : "text-white/70 hover:text-white hover:bg-white/5"
                                            }
                                        `}
                                    >
                                        {planet.name}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Expandable moons list */}
                        {isMoons && moonsExpanded && (
                            <div className="ml-8 mt-1 space-y-1">
                                {moons.map((moon) => (
                                    <button
                                        key={moon.id}
                                        onClick={() => handleMoonClick(moon.id)}
                                        className={`
                                            w-full px-3 py-1.5 text-left rounded-md
                                            transition-all duration-200 text-sm cursor-pointer
                                            ${selectedId === moon.id
                                                ? "text-cyan-400 bg-cyan-400/10 border border-cyan-400/30"
                                                : "text-white/70 hover:text-white hover:bg-white/5"
                                            }
                                        `}
                                    >
                                        {moon.name}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Expandable satellite list */}
                        {isSatellites && satellitesExpanded && (
                            <div className="ml-8 mt-1 space-y-1">
                                {satellites.map((satellite) => (
                                    <button
                                        key={satellite.id}
                                        onClick={() => handleSatelliteClick(satellite.id)}
                                        className={`
                                            w-full px-3 py-1.5 text-left rounded-md
                                            transition-all duration-200 text-sm cursor-pointer
                                            ${selectedId === satellite.id
                                                ? "text-cyan-400 bg-cyan-400/10 border border-cyan-400/30"
                                                : "text-white/70 hover:text-white hover:bg-white/5"
                                            }
                                        `}
                                    >
                                        {satellite.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )

    return (
        <>
            {/* 🍔 Mobile/Tablet button */}
            {!open && (
                <button
                    onClick={() => setOpen(true)}
                    className="lg:hidden fixed top-5 left-5 z-50 text-white text-xl"
                >
                    <FaBars />
                </button>
            )}

            {/* 🔳 Overlay */}
            {open && (
                <div
                    onClick={() => setOpen(false)}
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
                />
            )}

            {/* 📱 Sidebar Mobile/Tablet */}
            <aside
                className={`
                    fixed top-0 left-0 h-full w-[250px]
                    bg-black/40 backdrop-blur-xl
                    border-r border-white/10
                    shadow-[0_0_35px_rgba(255,255,255,0.05)]
                    p-6 text-white z-50
                    transform transition-transform duration-300 ease-in-out
                    flex flex-col
                    ${open ? "translate-x-0" : "-translate-x-full"}
                    lg:hidden
                `}
            >
                <button
                    onClick={() => setOpen(false)}
                    className="absolute top-6 right-5 text-white"
                >
                    <FaTimes size={18} />
                </button>

                <h1
                    className={`text-xl tracking-widest mb-8 text-center font-semibold ${orbitron.className}`}
                >
                    ATLAS26
                </h1>

                <div className="flex-1">
                    {renderMenu()}
                </div>

                {/* Controls Button */}
                <button
                    onClick={() => setControlsModalOpen(true)}
                    className={`
                        flex items-center gap-3 w-full px-3 py-2
                        rounded-lg font-medium transition-all duration-300 cursor-pointer
                        text-white/60 hover:text-white hover:bg-white/5 
                        hover:border-white/10 border border-transparent
                        mt-4
                        ${poppins.className}
                    `}
                >
                    <SlidersVertical size={20} strokeWidth={1.5} />
                    <span>Controls</span>
                </button>
            </aside>

            {/* 🖥 Desktop (lg and up) */}
            <aside
                className={`
                    hidden lg:flex flex-col w-[240px] xl:w-[260px] h-full
                    bg-black/40 backdrop-blur-xl
                    border-r border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.06)]
                    p-6 text-white
                `}
            >
                <h1
                    className={`text-lg xl:text-2xl font-semibold text-center tracking-widest mb-8 ${orbitron.className}`}
                >
                    ATLAS26
                </h1>

                <div className="flex-1">
                    {renderMenu()}
                </div>

                {/* Controls Button */}
                <button
                    onClick={() => setControlsModalOpen(true)}
                    className={`
                        group flex items-center gap-3 w-full px-3 py-2
                        rounded-lg font-medium transition-all duration-300 cursor-pointer
                        text-white/60 hover:text-white hover:bg-white/5 
                        hover:border-white/10 border border-transparent
                        mt-4
                        ${poppins.className}
                    `}
                >
                    <SlidersVertical
                        size={20}
                        strokeWidth={1.5}
                        className="transition-all duration-300 group-hover:text-white"
                    />
                    <span>Controls</span>
                </button>
            </aside>

            {/* Controls Modal */}
            <ControlsModal isOpen={controlsModalOpen} onClose={() => setControlsModalOpen(false)} />
        </>
    )
}