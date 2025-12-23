// import Sidebar from "../components/dashboard/Sidebar"
// import SpaceCanvas from "../components/dashboard/SpaceCanvas"
// import InfoPanel from "../components/dashboard/InfoPanel"

// export default function DashboardPage() {
//     return (
//         <div className="w-screen h-screen flex bg-black overflow-hidden">

//             {/* Sidebar */}
//             <Sidebar />

//             {/* 🔥 Futuristic Divider (between sidebar & space view) */}
//             <div className="w-px bg-linear-to-b from-transparent via-white/14 to-transparent" />

//             {/* Space View */}
//             <div id="space-area" className="flex-1 relative">
//                 <SpaceCanvas />
//             </div>

//             {/* 🔥 Futuristic Divider (between space view & info panel) */}
//             <div className="w-px bg-linear-to-b from-transparent via-white/14 to-transparent" />

//             {/* Info Panel */}
//             <div className="hidden lg:block w-[260px]">
//                 <InfoPanel />
//             </div>

//         </div>
//     )
// }

import Sidebar from "../components/dashboard/Sidebar"
import SpaceCanvas from "../components/dashboard/SpaceCanvas"
import InfoPanel from "../components/dashboard/InfoPanel"
import TimeControls from "../components/dashboard/TimeControls"

export default function DashboardPage() {
    return (
        <div className="w-screen h-screen flex bg-black overflow-hidden">

            {/* Sidebar */}
            <Sidebar />

            {/* 🔥 Futuristic Divider (between sidebar & space view) */}
            <div className="w-px bg-linear-to-b from-transparent via-white/14 to-transparent" />

            {/* Space View */}
            <div id="space-area" className="flex-1 relative">
                <SpaceCanvas />
            </div>

            <div className=""><TimeControls /></div>

            {/* 🔥 Futuristic Divider (between space view & info panel) */}
            <div className="w-px bg-linear-to-b from-transparent via-white/14 to-transparent" />

            {/* Info Panel */}
            <div className="hidden lg:block w-[260px]">
                <InfoPanel />
            </div>

        </div>
    )
}