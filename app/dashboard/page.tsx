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

"use client";

import { useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "../components/dashboard/Sidebar"
import SpaceCanvas from "../components/dashboard/SpaceCanvas"
import InfoPanel from "../components/dashboard/InfoPanel"
import TimeControls from "../components/dashboard/TimeControls"
import TLEInitializer from "../components/dashboard/TLEInitializer"
import DashboardLoadingOverlay from "../components/dashboard/DashboardLoadingOverlay"
import { useLoadingStore } from "@/app/store/loadingStore"
import { trackEvent } from "@/app/lib/gtag"
import { quality } from "@/app/store/qualityStore"

export default function DashboardPage() {
    const pathname = usePathname();
    const prevPathRef = useRef<string | null>(null);
    const isReady = useLoadingStore((s) => s.isReady);

    if (pathname === "/dashboard" && prevPathRef.current !== "/dashboard") {
        prevPathRef.current = "/dashboard";
        useLoadingStore.getState().reset();
    }
    if (pathname !== "/dashboard") {
        prevPathRef.current = pathname;
    }

    useEffect(() => {
        trackEvent("enter_dashboard");
        trackEvent("device_quality", { tier: quality.tier });
    }, []);

    return (
        <div className="w-screen h-screen flex bg-black overflow-hidden">
            {/* Initialize TLE data at app startup */}
            <TLEInitializer />

            {/* Sidebar */}
            <Sidebar />

            {/* Futuristic Divider (between sidebar & space view) - only on lg+ */}
            <div className="hidden lg:block w-px bg-linear-to-b from-transparent via-white/15 to-transparent" />

            {/* Space View - takes full remaining width */}
            <div id="space-area" className="flex-1 relative">
                <SpaceCanvas />
                <DashboardLoadingOverlay />
            </div>

            {isReady && (
                <>
                    {/* Time Controls - fixed overlay */}
                    <TimeControls />

                    {/* Info Panel - fixed sliding overlay */}
                    <InfoPanel />
                </>
            )}
        </div>
    )
}