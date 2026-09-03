import { useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { BALL } from '../physics/constants'
import { useMacroView } from '../physics/macroView'
import { useSimStore } from '../state/useSimStore'

/** 只用到这几个成员，避免依赖 three-stdlib 的类型导出 */
interface ControlsLike {
  target: Vector3
  update: () => void
  addEventListener: (type: string, listener: () => void) => void
  removeEventListener: (type: string, listener: () => void) => void
}

const desiredPosition = new Vector3()
const desiredTarget = new Vector3()
const contactPoint = new Vector3()

/**
 * 预设机位，统一用指数阻尼平滑过渡，不做弹性/回弹动画。
 *
 * 用户一旦开始拖动/缩放，立即切换到自由观察并交出相机控制权，
 * 否则预设机会每帧把视角拉回去，用户无法自由旋转。
 *
 * 当 autoMacro 开启且球进入球拍 <3cm 时，相机自动切到 contact 视角，
 * 用户拖动会再次交还控制权。
 */
export function CameraRig() {
  const engine = useSimStore((s) => s.engine)
  const controls = useThree((state) => state.controls) as unknown as ControlsLike | null

  useEffect(() => {
    if (!controls) return
    const release = () => useSimStore.setState({ camera: 'free' })
    controls.addEventListener('start', release)
    return () => controls.removeEventListener('start', release)
  }, [controls])

  useFrame((state, delta) => {
    const store = useSimStore.getState()
    const { racketControl, autoMacro } = store
    let preset = store.camera

    // Macro 自动切镜头：进入 <3cm 时强制切到 contact 视角（直到用户拖动交还）
    if (autoMacro && preset === 'free') {
      const mode = useMacroView(engine.state.position, racketControl, BALL.radius)
      if (mode === 'macro') preset = 'contact'
    }

    if (preset === 'free') return

    const ball = engine.state.position
    switch (preset) {
      case 'player':
        desiredPosition.set(0, 1.32, 2.85)
        desiredTarget.set(0, 0.12, -0.55)
        break
      case 'side':
        desiredPosition.set(3.3, 0.78, 0.1)
        desiredTarget.set(0, 0.12, 0)
        break
      case 'top':
        desiredPosition.set(0, 3.9, 0.002)
        desiredTarget.set(0, 0, 0)
        break
      case 'ball':
        desiredPosition.set(ball.x + 0.42, ball.y + 0.28, ball.z + 0.8)
        desiredTarget.copy(ball)
        break
      case 'contact':
        contactPoint.set(racketControl.x, racketControl.y, racketControl.z)
        desiredPosition.set(racketControl.x + 0.12, racketControl.y + 0.08, racketControl.z + 0.32)
        desiredTarget.copy(contactPoint)
        break
    }

    // 帧率无关的指数阻尼
    const k = 1 - Math.exp(-5 * delta)
    state.camera.position.lerp(desiredPosition, k)

    const controlsObj = state.controls as unknown as ControlsLike | null
    if (controlsObj) {
      controlsObj.target.lerp(desiredTarget, k)
      controlsObj.update()
    } else {
      state.camera.lookAt(desiredTarget)
    }
  })

  return null
}
