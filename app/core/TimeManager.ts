/**
 * Unified Time Control System
 * Single source of truth for time management in ATLAS26
 * 
 * Supports:
 * - REAL_TIME mode: Always follows real UTC time
 * - SIMULATION mode: Manual time advancement with speed control and pause
 */

export type TimeMode = "REAL_TIME" | "SIMULATION";

export class TimeManager {
    private mode: TimeMode = "SIMULATION";
    private speedMultiplier: number = 1;
    private isPaused: boolean = false;
    private simulationDate: Date;
    private lastRealTime: number;
    private listeners: Set<() => void> = new Set();

    constructor() {
        // Start with current UTC time
        this.simulationDate = new Date();
        this.lastRealTime = performance.now();
    }

    /**
     * Update time state (call each frame)
     */
    update() {
        if (this.mode === "REAL_TIME") {
            // Always sync to real UTC time
            this.simulationDate = new Date();
        } else if (this.mode === "SIMULATION" && !this.isPaused) {
            // Advance simulation time
            const now = performance.now();
            const deltaRealSeconds = (now - this.lastRealTime) / 1000;
            this.lastRealTime = now;

            // Advance simulation date by deltaTime * speedMultiplier
            const deltaSimulationSeconds = deltaRealSeconds * this.speedMultiplier;
            this.simulationDate = new Date(
                this.simulationDate.getTime() + deltaSimulationSeconds * 1000
            );
        } else {
            // Simulation paused - update lastRealTime but don't advance time
            this.lastRealTime = performance.now();
        }

        // Notify listeners
        this.notifyListeners();
    }

    /**
     * Get current date (UTC-based)
     */
    getCurrentDate(): Date {
        if (this.mode === "REAL_TIME") {
            return new Date();
        }
        return new Date(this.simulationDate);
    }

    /**
     * Get current time in seconds since Unix epoch (UTC)
     * This is what components use for calculations
     */
    getTime(): number {
        return this.getCurrentDate().getTime() / 1000;
    }

    /**
     * Get current mode
     */
    getMode(): TimeMode {
        return this.mode;
    }

    /**
     * Get current speed multiplier
     */
    getSpeedMultiplier(): number {
        return this.speedMultiplier;
    }

    /**
     * Check if time is paused
     */
    getIsPaused(): boolean {
        return this.isPaused;
    }

    /**
     * Set the simulation date (only works in SIMULATION mode)
     */
    setDate(date: Date): void {
        if (this.mode === "SIMULATION") {
            this.simulationDate = new Date(date);
            this.lastRealTime = performance.now();
            this.notifyListeners();
        }
    }

    /**
     * Set speed multiplier (only works in SIMULATION mode)
     */
    setSpeed(multiplier: number): void {
        if (this.mode === "SIMULATION") {
            // Safety cap
            this.speedMultiplier = Math.max(0, Math.min(multiplier, 100000));
            this.lastRealTime = performance.now();
            this.notifyListeners();
        }
    }

    /**
     * Toggle between REAL_TIME and SIMULATION modes
     */
    toggleMode(): void {
        if (this.mode === "REAL_TIME") {
            // Switch to SIMULATION - start from current real time
            this.mode = "SIMULATION";
            this.simulationDate = new Date();
            this.lastRealTime = performance.now();
            // Pause is allowed in simulation
        } else {
            // Switch to REAL_TIME - pause is disabled
            this.mode = "REAL_TIME";
            this.isPaused = false;
            this.speedMultiplier = 1; // Lock to 1x in real time
        }
        this.notifyListeners();
    }

    /**
     * Pause time (only works in SIMULATION mode)
     */
    pause(): void {
        if (this.mode === "SIMULATION") {
            this.isPaused = true;
            this.notifyListeners();
        }
    }

    /**
     * Resume time (only works in SIMULATION mode)
     */
    resume(): void {
        if (this.mode === "SIMULATION") {
            this.isPaused = false;
            this.lastRealTime = performance.now();
            this.notifyListeners();
        }
    }

    /**
     * Toggle pause/resume (only works in SIMULATION mode)
     */
    togglePause(): void {
        if (this.isPaused) {
            this.resume();
        } else {
            this.pause();
        }
    }

    /**
     * Subscribe to time changes (for React components)
     */
    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Notify all listeners of time changes
     */
    private notifyListeners(): void {
        this.listeners.forEach((listener) => listener());
    }

    /**
     * Reset to current real time (useful for reset button)
     */
    reset(): void {
        this.simulationDate = new Date();
        this.lastRealTime = performance.now();
        this.isPaused = false;
        if (this.mode === "SIMULATION") {
            this.speedMultiplier = 1;
        }
        this.notifyListeners();
    }
}

// Export singleton instance
export const timeManager = new TimeManager();

