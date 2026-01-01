// Export TimeManager as the main time engine
// This maintains backward compatibility while using the new TimeManager
import { timeManager } from "./TimeManager"

// Legacy export name for backward compatibility
export const timeEngine = {
    getTime: () => timeManager.getTime(),
    update: () => timeManager.update(),
    // These are only available in SIMULATION mode
    pause: () => timeManager.pause(),
    resume: () => timeManager.resume(),
    isRunning: () => !timeManager.getIsPaused(),
    setTimeScale: (scale: number) => timeManager.setSpeed(scale),
    getTimeScale: () => timeManager.getSpeedMultiplier(),
}