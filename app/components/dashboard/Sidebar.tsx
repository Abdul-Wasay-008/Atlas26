"use client"

import { useState } from "react"
import { orbitron, poppins } from "@/app/fonts"
import { FaBars, FaTimes } from "react-icons/fa"
import { Orbit, Satellite, Sparkle, Stars, LoaderPinwheelIcon } from "lucide-react"

export default function Sidebar() {
    const [open, setOpen] = useState(false)
    const [active, setActive] = useState("Planets")

    const menu = [
        { name: "All", icon: LoaderPinwheelIcon },
        { name: "Planets", icon: Orbit },
        { name: "Satellites", icon: Satellite },
        { name: "Comets", icon: Sparkle },
        { name: "Interstellar", icon: Stars },
    ]

    const renderMenu = () => (
        <div className="space-y-3 text-sm md:text-base text-white/60">
            {menu.map(({ name, icon: Icon }) => (
                <button
                    key={name}
                    onClick={() => setActive(name)}
                    className={`
                        group flex items-center gap-3 w-full px-3 py-2
                        rounded-lg font-medium transition-all duration-300 cursor-pointer
                        ${poppins.className}
                        ${active === name
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
                            ${active === name
                                ? "text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.45)]"
                                : "group-hover:text-white"
                            }
                        `}
                    />
                    <span>
                        {name}
                    </span>
                </button>
            ))}
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