export class TimeEngine {
    private simulationTime: number
    private lastRealTime: number
    private timeScale: number
    private running: boolean

    constructor(startTime = 0) {
        this.simulationTime = startTime
        this.lastRealTime = performance.now()
        this.timeScale = 200 // sensible default
        this.running = true
    }

    update() {
        if (!this.running) return

        const now = performance.now()
        const deltaRealSeconds = (now - this.lastRealTime) / 1000
        this.lastRealTime = now

        this.simulationTime += deltaRealSeconds * this.timeScale
    }

    getTime() {
        return this.simulationTime
    }

    getTimeScale() {
        return this.timeScale
    }

    setTimeScale(scale: number) {
        // 🛡️ Safety cap to protect hardware & simulation
        this.timeScale = Math.min(scale, 5000)
    }

    pause() {
        this.running = false
    }

    resume() {
        this.running = true
        this.lastRealTime = performance.now()
    }

    isRunning() {
        return this.running
    }

    reset(time = 0) {
        this.simulationTime = time
        this.lastRealTime = performance.now()
    }
}