import { Orbitron, Poppins } from "next/font/google";

export const orbitron = Orbitron({
    subsets: ["latin"],
    weight: ["400", "700"],
    variable: "--font-orbitron",
    display: "swap",
});

export const poppins = Poppins({
    subsets: ["latin"],
    weight: ["300", "400", "500", "600"],
    variable: "--font-poppins",
    display: "swap",
});
