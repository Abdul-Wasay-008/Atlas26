// import { poppins } from "@/app/fonts"

// export default function InfoPanel() {
//     return (
//         <div className={`w-[260px] lg:w-[300px] h-full border-l border-white/10 pr-10 bg-black/40 p-4 text-white ${poppins.className}`}>

//             <h2 className="text-base md:text-xl xl:text-xl mt-1 font-bold text-center tracking-normal">
//                 OBJECT INFO
//             </h2>

//             <p className="mt-4 text-xs text-white/50 leading-relaxed">
//                 Click any object in space to view detailed information here.
//             </p>

//         </div>
//     )
// }
"use client";

import { useSelectionStore } from "@/app/store/selectionStore";
import { poppins } from "@/app/fonts";

export default function InfoPanel() {
    const selected = useSelectionStore((state) => state.selected);

    return (
        <div
            className={`
                w-[260px] lg:w-[300px] h-full 
                border-l border-white/10 
                bg-black/40 backdrop-blur-2xl 
                p-6 text-white
                overflow-y-auto
                flex flex-col pr-12
                ${poppins.className}
            `}
        >

            {/* Title */}
            <h2 className="text-lg md:text-xl font-bold text-center mb-4 tracking-wider">
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
                        {selected.type}
                    </p>

                    <p className="text-sm">
                        <span className="font-semibold text-white">Radius:</span>{" "}
                        {selected.radius}
                    </p>

                    <p className="text-sm">
                        <span className="font-semibold text-white">Orbital Period:</span>{" "}
                        {selected.orbitalPeriod}
                    </p>

                    {selected.distanceFromEarth && (
                        <p className="text-sm">
                            <span className="font-semibold text-white">Distance:</span>{" "}
                            {selected.distanceFromEarth}
                        </p>
                    )}

                    <p className="text-sm text-white/75 leading-relaxed wrap-break-words">
                        {selected.description}
                    </p>
                </div>
            )}

            {/* Bottom Soft Fade */}
            <div className="absolute bottom-0 left-0 w-full h-16 bg-linear-to-t from-black/70 to-transparent pointer-events-none" />
        </div>
    );
}

