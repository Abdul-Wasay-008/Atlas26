"use client"

import { useState } from "react"
import { orbitron, poppins } from "@/app/fonts"
import { FaBars, FaTimes } from "react-icons/fa"
import { Orbit, Satellite, Sparkle, Stars, LoaderPinwheelIcon, ChevronDown, ChevronRight } from "lucide-react"
import { useSelectionStore } from "@/app/store/selectionStore"
import { spaceObjects } from "@/app/data/spaceObjects"

export default function Sidebar() {
    const [open, setOpen] = useState(false)
    const [active, setActive] = useState("All")
    const [planetsExpanded, setPlanetsExpanded] = useState(false)
    const [satellitesExpanded, setSatellitesExpanded] = useState(false)
    const selectObject = useSelectionStore((state) => state.selectObject)
    const selectedId = useSelectionStore((state) => state.selectedId)
    const setShowAllOrbits = useSelectionStore((state) => state.setShowAllOrbits)

    const menu = [
        { name: "All", icon: LoaderPinwheelIcon },
        { name: "Planets", icon: Orbit },
        { name: "Satellites", icon: Satellite },
        { name: "Comets", icon: Sparkle },
        { name: "Interstellar", icon: Stars },
    ]

    // Get planets for the expandable list, ordered from Sun: Mercury → Neptune
    const PLANET_ORDER = ["mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune"] as const
    const planets = spaceObjects
        .filter(obj => obj.type === "planet")
        .sort((a, b) => PLANET_ORDER.indexOf(a.id as typeof PLANET_ORDER[number]) - PLANET_ORDER.indexOf(b.id as typeof PLANET_ORDER[number]))
    const satellites = spaceObjects.filter(obj => obj.type === "satellite" && obj.id !== "moon")

    const handlePlanetClick = (planetId: string) => {
        selectObject(planetId)
        setActive("Planets")
    }

    const handleSatelliteClick = (satelliteId: string) => {
        selectObject(satelliteId)
        setActive("Satellites")
    }

    const renderMenu = () => (
        <div className="space-y-3 text-sm md:text-base text-white/60">
            {menu.map(({ name, icon: Icon }) => {
                const isPlanets = name === "Planets"
                const isSatellites = name === "Satellites"
                const isActive = active === name
                const isExpandable = isPlanets || isSatellites
                const isExpanded = isPlanets ? planetsExpanded : satellitesExpanded

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
            {/* 🍔 Mobile button */}
            {!open && (
                <button
                    onClick={() => setOpen(true)}
                    className="md:hidden fixed top-5 left-5 z-50 text-white text-xl"
                >
                    <FaBars />
                </button>
            )}

            {/* 🔳 Overlay */}
            {open && (
                <div
                    onClick={() => setOpen(false)}
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
                />
            )}

            {/* 📱 Sidebar Mobile */}
            <aside
                className={`
                    fixed top-0 left-0 h-full w-[250px]
                    bg-black/40 backdrop-blur-xl
                    border-r border-white/10
                    shadow-[0_0_35px_rgba(255,255,255,0.05)]
                    p-6 text-white z-50
                    transform transition-transform duration-300 ease-in-out
                    ${open ? "translate-x-0" : "-translate-x-full"}
                    md:hidden
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

                {renderMenu()}
            </aside>

            {/* 🖥 Desktop */}
            <aside
                className={`
                    hidden md:flex flex-col w-240px xl:w-[260px] h-full
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

                {renderMenu()}
            </aside>
        </>
    )
}