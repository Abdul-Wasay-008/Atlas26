export class TimeEngine {
    private simulationTime: number
    private lastRealTime: number
    private timeScale: number
    private running: boolean

    constructor(startTime?: number) {
        this.simulationTime = startTime ?? 0
        this.lastRealTime = performance.now()
        this.timeScale = 1
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

    setTimeScale(scale: number) {
        this.timeScale = scale
    }

    pause() {
        this.running = false
    }

    resume() {
        this.running = true
        this.lastRealTime = performance.now()
    }

    reset(time = 0) {
        this.simulationTime = time
        this.lastRealTime = performance.now()
    }
}