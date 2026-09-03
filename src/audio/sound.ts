/**
 * 乒乓球物理拟真音频引擎 (基于浏览器原生 Web Audio API 程序化合成)。
 * 零外部音频文件加载依赖、零网络延迟，纯代码实时渲染声学物理特性。
 */

export class SoundEngine {
  private ctx: AudioContext | null = null
  private enabled: boolean = true
  private masterGain: GainNode | null = null

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioCtx) return null
      try {
        this.ctx = new AudioCtx()
        this.masterGain = this.ctx.createGain()
        this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime)
        this.masterGain.connect(this.ctx.destination)
      } catch {
        this.ctx = null
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  public isEnabled(): boolean {
    return this.enabled
  }

  /**
   * 球撞击球台 ("Pong")
   * 特点：木质空腔共鸣，基频约 360-440Hz，带快速指数衰减。
   * @param speed 撞击法向速度 (m/s)
   */
  public playTableBounce(speed: number = 2.5) {
    if (!this.enabled) return
    const ctx = this.initContext()
    if (!ctx || !this.masterGain) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    const normalizedSpeed = Math.min(Math.max(speed / 4, 0.4), 1.5)
    const baseFreq = 380 + Math.min(speed * 15, 60)

    osc.type = 'sine'
    osc.frequency.setValueAtTime(baseFreq, now)
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.08)

    gain.gain.setValueAtTime(0.001, now)
    gain.gain.linearRampToValueAtTime(0.35 * normalizedSpeed, now + 0.003)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09)

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start(now)
    osc.stop(now + 0.1)
  }

  /**
   * 球撞击球拍 ("Ping")
   * 特点：高弹海绵与碳木共鸣，基频较高 (~1000-1300Hz)，音色干脆，转速越高摩擦声调略高。
   * @param speed 相对撞击速度 (m/s)
   * @param rpm 当前旋转转速
   */
  public playRacketHit(speed: number = 3.0, rpm: number = 3000) {
    if (!this.enabled) return
    const ctx = this.initContext()
    if (!ctx || !this.masterGain) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    const normalizedSpeed = Math.min(Math.max(speed / 5, 0.5), 1.8)
    const spinBonus = Math.min(rpm / 100, 50)
    const baseFreq = 1050 + spinBonus

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(baseFreq, now)
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.05)

    gain.gain.setValueAtTime(0.001, now)
    gain.gain.linearRampToValueAtTime(0.42 * normalizedSpeed, now + 0.002)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.065)

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start(now)
    osc.stop(now + 0.07)
  }

  /**
   * 擦网音 ("Tick")
   */
  public playNetTick(speed: number = 2.0) {
    if (!this.enabled) return
    const ctx = this.initContext()
    if (!ctx || !this.masterGain) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    const intensity = Math.min(Math.max(speed / 3, 0.3), 1.0)
    osc.type = 'square'
    osc.frequency.setValueAtTime(720, now)
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.03)

    gain.gain.setValueAtTime(0.001, now)
    gain.gain.linearRampToValueAtTime(0.12 * intensity, now + 0.002)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035)

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start(now)
    osc.stop(now + 0.04)
  }
}

export const sound = new SoundEngine()
