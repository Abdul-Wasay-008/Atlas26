"use client";

import Scene from "./components/3d/Scene";
import { orbitron, poppins } from "./fonts";
import { motion } from "framer-motion";
import { FaRocket } from "react-icons/fa";

export default function Home() {
  return (
    <section className="relative h-screen w-full bg-black overflow-hidden">
      {/* 🌌 3D Background */}
      <Scene />

      {/* 🔝 Top Title (refined) */}
      <div className="absolute top-14 md:top-5 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
        {/* Title: clean + soft outer glow */}
        <h1
          className={`text-5xl md:text-6xl 2xl:text-7xl font-bold tracking-wide text-white
    [text-shadow:0_0_16px_rgba(255,255,255,0.35)]
    ${orbitron.className}`}
        >
          ATLAS26
        </h1>

        {/* Tagline: minimal glass chip */}
        <p
          className={`text-xs md:text-sm text-gray-100/95
      px-3.5 py-1.5 rounded-full
      bg-white/6 backdrop-blur-sm ring-1 ring-white/15
      shadow-[0_0_20px_rgba(16,120,255,0.15)]
      ${poppins.className}`}
        >
          A Digital Window Into Our Living Cosmos
        </p>
      </div>

      {/* Subtle top gradient wash so bright stars don’t clash with text */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 md:h-48
  bg-linear-to-b from-black/40 via-black/20 to-transparent z-5" />

      {/* 💠 Futuristic Animated Button */}
      <div className="absolute bottom-24 md:bottom-16 left-1/2 -translate-x-1/2 z-10 text-center text-white">
        <motion.button
          className={`relative px-4 md:px-6 xl:px-8 py-4 rounded-full font-medium overflow-hidden cursor-pointer select-none ${poppins.className}`}
          initial={{ scale: 1 }}
          whileHover={{
            scale: 1.04,
            boxShadow: "0 0 35px rgba(63,169,245,0.5)",
          }}
          whileTap={{ scale: 0.96 }}
          onTouchStart={(e) => {
            e.currentTarget.style.boxShadow = "0 0 35px rgba(63,169,245,0.5)";
          }}
          onTouchEnd={(e) => {
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {/* 🔵 Animated Gradient Background */}
          <motion.span
            className="absolute inset-0 rounded-full bg-linear-to-r from-[#3fa9f5] via-[#00d4ff] to-[#3fa9f5] blur-sm opacity-70"
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              backgroundSize: "300% 300%",
              zIndex: -2,
            }}
          />

          {/* 💎 Glow Ripple Effect on Hover or Touch */}
          <motion.span
            className="absolute inset-0 rounded-full bg-[#3fa9f5]/20 blur-lg"
            whileHover={{
              scale: 1.6,
              opacity: 0.3,
            }}
            whileTap={{
              scale: 1.6,
              opacity: 0.3,
            }}
            transition={{
              duration: 0.6,
              ease: "easeOut",
            }}
            style={{ zIndex: -1 }}
          />

          <div className="flex items-center justify-center">
            <span className="relative z-10 text-white drop-shadow-lg font-bold text-sm xl:text-base tracking-wide">
              Launch Atlas
            </span>
            <FaRocket className="text-white text-base xl:text-xl animate-bounce ml-2" />
          </div>
        </motion.button>
      </div>

    </section>
  );
}