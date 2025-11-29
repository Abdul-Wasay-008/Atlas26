import { poppins } from "@/app/fonts"

export default function InfoPanel() {
    return (
        <div className={`w-[260px] lg:w-[300px] h-full border-l border-white/10 pr-10 bg-black/40 p-4 text-white ${poppins.className}`}>

            <h2 className="text-base md:text-xl xl:text-xl mt-1 font-bold text-center tracking-normal">
                OBJECT INFO
            </h2>

            <p className="mt-4 text-xs text-white/50 leading-relaxed">
                Click any object in space to view detailed information here.
            </p>

        </div>
    )
}