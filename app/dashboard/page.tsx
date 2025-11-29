// import Sidebar from "../components/dashboard/Sidebar"
// import SpaceCanvas from "../components/dashboard/SpaceCanvas"
// import InfoPanel from "../components/dashboard/InfoPanel"

// export default function DashboardPage() {
//     return (
//         <div className="w-screen h-screen flex bg-black overflow-hidden">

//             {/* Sidebar → Hidden on small screens */}
//             <div className="">
//                 <Sidebar />
//             </div>

//             {/* Main Space View */}
//             <div className="flex-1 relative">
//                 <SpaceCanvas />
//             </div>

//             {/* Info Panel → Only show on large screens */}
//             <div className="hidden lg:block">
//                 <InfoPanel />
//             </div>

//         </div>
//     )
// }
import Sidebar from "../components/dashboard/Sidebar"
import SpaceCanvas from "../components/dashboard/SpaceCanvas"
import InfoPanel from "../components/dashboard/InfoPanel"

export default function DashboardPage() {
    return (
        <div className="w-screen h-screen flex bg-black overflow-hidden">

            {/* Sidebar */}
            <Sidebar />

            {/* 🔥 Futuristic Divider (between sidebar & space view) */}
            <div className="w-px bg-linear-to-b from-transparent via-white/14 to-transparent" />


            {/* Space View */}
            <div className="flex-1 relative">
                <SpaceCanvas />
            </div>

            {/* 🔥 Futuristic Divider (between space view & info panel) */}
            <div className="w-px bg-linear-to-b from-transparent via-white/14 to-transparent" />

            {/* Info Panel */}
            <div className="hidden lg:block w-[260px]">
                <InfoPanel />
            </div>

        </div>
    )
}
