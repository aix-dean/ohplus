"use client"

export class NotificationSoundService {
  private static instance: NotificationSoundService
  private audioContext: AudioContext | null = null
  private isEnabled = true

  private constructor() {
    // Initialize audio context on user interaction
    if (typeof window !== "undefined") {
      this.initializeAudioContext()
    }
  }

  static getInstance(): NotificationSoundService {
    if (!NotificationSoundService.instance) {
      NotificationSoundService.instance = new NotificationSoundService()
    }
    return NotificationSoundService.instance
  }

  private initializeAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    } catch (error) {
      console.warn("Audio context not supported:", error)
    }
  }

  // Enable/disable sound notifications
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
    localStorage.setItem("lowStockSoundEnabled", enabled.toString())
  }

  // Check if sound is enabled
  isEnabledCheck(): boolean {
    if (typeof window === "undefined") return false
    const stored = localStorage.getItem("lowStockSoundEnabled")
    return stored !== null ? stored === "true" : this.isEnabled
  }

  // Play warning sound for low stock
  async playWarningSound(): Promise<void> {
    if (!this.isEnabled || !this.audioContext) return

    try {
      // Resume audio context if suspended
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume()
      }

      // Create warning tone (two beeps)
      await this.createTone(800, 0.1, 0.3) // First beep
      setTimeout(() => this.createTone(800, 0.1, 0.3), 200) // Second beep
    } catch (error) {
      console.warn("Error playing warning sound:", error)
    }
  }

  // Play critical sound for out of stock
  async playCriticalSound(): Promise<void> {
    if (!this.isEnabled || !this.audioContext) return

    try {
      // Resume audio context if suspended
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume()
      }

      // Create urgent tone (three rapid beeps)
      await this.createTone(1000, 0.1, 0.4) // First beep
      setTimeout(() => this.createTone(1000, 0.1, 0.4), 150) // Second beep
      setTimeout(() => this.createTone(1000, 0.1, 0.4), 300) // Third beep
    } catch (error) {
      console.warn("Error playing critical sound:", error)
    }
  }

  // Create a tone with specified frequency, duration, and volume
  private async createTone(frequency: number, duration: number, volume = 0.3): Promise<void> {
    if (!this.audioContext) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime)
    oscillator.type = "sine"

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration)

    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + duration)
  }

  // Initialize audio context on user interaction (call this on first user click/touch)
  async initializeOnUserInteraction(): Promise<void> {
    if (!this.audioContext) {
      this.initializeAudioContext()
    }

    if (this.audioContext && this.audioContext.state === "suspended") {
      try {
        await this.audioContext.resume()
      } catch (error) {
        console.warn("Could not resume audio context:", error)
      }
    }
  }
}

// Export singleton instance
export const notificationSound = NotificationSoundService.getInstance()
