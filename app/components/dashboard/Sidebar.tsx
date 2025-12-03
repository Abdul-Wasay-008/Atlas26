// "use client"

// import { useState } from "react"
// import { orbitron, poppins } from "@/app/fonts"
// import { FaBars, FaTimes } from "react-icons/fa"

// // Lucide Icons
// import { Orbit, Satellite, Sparkle, Stars } from "lucide-react"

// export default function Sidebar() {
//     const [open, setOpen] = useState(false)
//     const [active, setActive] = useState("Planets")

//     const menu = [
//         { name: "Planets", icon: Orbit },
//         { name: "Satellites", icon: Satellite },
//         { name: "Comets", icon: Sparkle },
//         { name: "Interstellar", icon: Stars },
//     ]

//     const renderMenu = () => (
//         <div className="space-y-4 text-sm md:text-base text-white/60">
//             {menu.map(({ name, icon: Icon }) => (
//                 <button
//                     key={name}
//                     onClick={() => setActive(name)}
//                     className={`
//                         group flex items-center gap-3 w-full px-2 py-1.5 rounded-md
//                         transition-all duration-200 cursor-pointer
//                         ${poppins.className}
//                         ${active === name ? "text-white bg-white/10" : "hover:text-white"}
//                     `}
//                 >
//                     <Icon
//                         size={20}
//                         strokeWidth={1.5}
//                         className={`
//                             transition-all duration-200
//                             ${active === name
//                                 ? "text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.35)]"
//                                 : "text-white/70 group-hover:text-white group-hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.25)]"
//                             }
//                         `}
//                     />

//                     <span
//                         className={`
//                             transition-all
//                             ${active === name
//                                 ? "text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.35)]"
//                                 : "group-hover:text-white"
//                             }
//                         `}
//                     >
//                         {name}
//                     </span>
//                 </button>
//             ))}
//         </div>
//     )

//     return (
//         <>
//             {/* 🍔 Mobile Hamburger */}
//             {!open && (
//                 <button
//                     onClick={() => setOpen(true)}
//                     className="md:hidden fixed top-5 left-5 z-50 text-white text-xl"
//                 >
//                     <FaBars />
//                 </button>
//             )}


//             {/* 🌑 Mobile Overlay */}
//             {open && (
//                 <div
//                     onClick={() => setOpen(false)}
//                     className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
//                 />
//             )}

//             {/* 📱 Mobile Sidebar */}
//             <div
//                 className={`
//                     fixed top-0 left-0 h-full w-[260px] bg-black/90 p-5 text-white z-50
//                     transform transition-transform duration-300 ease-in-out
//                     ${open ? "translate-x-0" : "-translate-x-full"}
//                     md:hidden
//                 `}
//             >
//                 <button
//                     onClick={() => setOpen(false)}
//                     className="absolute top-6 right-5 text-white text-lg"
//                 >
//                     <FaTimes />
//                 </button>

//                 <h1
//                     className={`text-xl tracking-widest mb-8 text-center font-bold ${orbitron.className}`}
//                 >
//                     ATLAS26
//                 </h1>

//                 {renderMenu()}
//             </div>

//             {/* 🖥 Desktop Sidebar */}
//             <div
//                 className={`
//                     hidden md:flex flex-col w-[230px] md:w-[260px] h-full 
//                     border-r border-white/10 bg-black/40 p-6 text-white 
//                 `}
//             >
//                 <h1
//                     className={`text-base md:text-xl xl:text-2xl font-bold text-center tracking-widest mb-8 ${orbitron.className}`}
//                 >
//                     ATLAS26
//                 </h1>

//                 {renderMenu()}
//             </div>
//         </>
//     )
// }


"use client"

import { useState } from "react"
import { orbitron, poppins } from "@/app/fonts"
import { FaBars, FaTimes } from "react-icons/fa"

// Lucide Icons
import { Orbit, Satellite, Sparkle, Stars } from "lucide-react"

export default function Sidebar() {
    const [open, setOpen] = useState(false)
    const [active, setActive] = useState("Planets")

    const menu = [
        { name: "Planets", icon: Orbit },
        { name: "Satellites", icon: Satellite },
        { name: "Comets", icon: Sparkle },
        { name: "Interstellar", icon: Stars },
    ]

    const renderMenu = () => (
        <div className="space-y-4 text-sm md:text-base text-white/70">
            {menu.map(({ name, icon: Icon }) => (
                <button
                    key={name}
                    onClick={() => setActive(name)}
                    className={`
                        group flex items-center gap-3 w-full px-2 py-1.5 rounded-md
                        transition-all duration-200 cursor-pointer
                        ${poppins.className}
                        ${active === name ?
                            "text-white bg-white/10 backdrop-blur-md shadow-[0_0_12px_rgba(255,255,255,0.1)]"
                            : "hover:text-white hover:bg-white/5"}
                    `}
                >
                    <Icon
                        size={20}
                        strokeWidth={1.5}
                        className={`
                            transition-all duration-200
                            ${active === name
                                ? "text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.35)]"
                                : "text-white/60 group-hover:text-white"
                            }
                        `}
                    />

                    <span
                        className={`
                            transition-all
                            ${active === name
                                ? "text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.35)]"
                                : "group-hover:text-white"
                            }
                        `}
                    >
                        {name}
                    </span>
                </button>
            ))}
        </div>
    )

    return (
        <>
            {/* 🍔 Mobile Hamburger */}
            {!open && (
                <button
                    onClick={() => setOpen(true)}
                    className="md:hidden fixed top-5 left-5 z-50 text-white text-xl"
                >
                    <FaBars />
                </button>
            )}

            {/* 🌑 Mobile Overlay */}
            {open && (
                <div
                    onClick={() => setOpen(false)}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                />
            )}

            {/* 📱 Mobile Sidebar (GLASS EFFECT) */}
            <div
                className={`
                    fixed top-0 left-0 h-full w-[260px]
                    bg-white/10 backdrop-blur-xl 
                    border-r border-white/20
                    shadow-[0_0_40px_rgba(255,255,255,0.06)]
                    p-5 text-white z-50
                    transform transition-transform duration-300 ease-in-out
                    ${open ? "translate-x-0" : "-translate-x-full"}
                    md:hidden
                `}
            >
                <button
                    onClick={() => setOpen(false)}
                    className="absolute top-6 right-5 text-white text-lg"
                >
                    <FaTimes />
                </button>

                <h1
                    className={`text-xl tracking-widest mb-8 text-center font-bold ${orbitron.className}`}
                >
                    ATLAS26
                </h1>

                {renderMenu()}
            </div>

            {/* 🖥 Desktop Sidebar (GLASS EFFECT) */}
            <div
                className={`
                    hidden md:flex flex-col w-[230px] md:w-[260px] h-full 
                    bg-white/10 backdrop-blur-xl 
                    border-r border-white/10 
                    shadow-[0_0_40px_rgba(255,255,255,0.05)]
                    p-6 text-white
                `}
            >
                <h1
                    className={`text-base md:text-xl xl:text-2xl font-bold text-center tracking-widest mb-8 ${orbitron.className}`}
                >
                    ATLAS26
                </h1>

                {renderMenu()}
            </div>
        </>
    )
}