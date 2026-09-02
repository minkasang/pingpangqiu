import type { RacketControl } from './racket'
import { DEFAULT_RACKET_CONTROL } from './racket'
import type { SpinType } from './types'

/**
 * 四种「接发球」教学场景。每种包含：
 *   spin         来球的旋转类型
 *   incomingRpm  来球转速（RPM）
 *   wrong        错误拍位（教学点：错误的拍面角度会导致球飞出台 / 下网）
 *   correct      正确拍位（教学生如何补偿来球旋转）
 *   failReason   错误示范触时球为什么会出问题（教学文案）
 *   teachReason  为什么这样接是对的（教学文案）
 *
 * 默认拍位（y、z、动作、速度）继承自 DEFAULT_RACKET_CONTROL，只覆盖
 * 教学要点相关的角度字段。
 */
export type ScenarioId = 'receiveTopspin' | 'receiveBackspin' | 'receiveLeftSidespin' | 'receiveRightSidespin'

export interface Scenario {
  id: ScenarioId
  label: string
  spin: SpinType
  incomingRpm: number
  wrong: RacketControl
  correct: RacketControl
  failReason: string
  teachReason: string
}

function withPitch(control: RacketControl, pitchDeg: number, rollDeg = control.rollDeg): RacketControl {
  return { ...control, pitchDeg, rollDeg }
}

function withYaw(control: RacketControl, yawDeg: number): RacketControl {
  return { ...control, yawDeg }
}

const BASE = DEFAULT_RACKET_CONTROL

export const SCENARIOS: Scenario[] = [
  {
    id: 'receiveTopspin',
    label: '接上旋',
    spin: 'topspin',
    incomingRpm: 3200,
    wrong: withPitch(BASE, 20),
    correct: withPitch(BASE, -15),
    failReason:
      '上旋球落台后因摩擦会向前冲，加上拍面后仰，法向反弹把球向上推——结果飞出台。',
    teachReason:
      '来球带强上旋，拍面必须前倾（pitch 为负）让法向反弹向下，从而抵消旋转造成的上飘趋势。',
  },
  {
    id: 'receiveBackspin',
    label: '接下旋',
    spin: 'backspin',
    incomingRpm: 3200,
    wrong: withPitch(BASE, -20),
    correct: withPitch(BASE, 15),
    failReason:
      '下旋球落台后向前减速，加上拍面前倾把球往下压——结果下网。',
    teachReason:
      '下旋来球被台面摩擦减速，拍面必须稍后仰（pitch 为正）让法向反弹向上，才能让球过网且落在台内。',
  },
  {
    id: 'receiveLeftSidespin',
    label: '接左侧旋',
    spin: 'leftSidespin',
    incomingRpm: 3200,
    wrong: withYaw(BASE, 0),
    correct: withYaw(BASE, 30),
    failReason:
      '来球相对球拍表面产生横向滑移，摩擦力把球推向一侧——结果偏出台面。',
    teachReason:
      '接左侧旋必须把拍面转向反方向（yaw 为正），让法向反弹的横向分量与摩擦的横向偏转相互抵消。',
  },
  {
    id: 'receiveRightSidespin',
    label: '接右侧旋',
    spin: 'rightSidespin',
    incomingRpm: 3200,
    wrong: withYaw(BASE, 0),
    correct: withYaw(BASE, -30),
    failReason:
      '来球相对球拍表面产生横向滑移，摩擦力把球推向一侧——结果偏出台面。',
    teachReason:
      '接右侧旋必须把拍面转向反方向（yaw 为负），让法向反弹的横向分量与摩擦的横向偏转相互抵消。',
  },
]

const SCENARIO_BY_ID: Record<ScenarioId, Scenario> = Object.fromEntries(
  SCENARIOS.map((scenario) => [scenario.id, scenario]),
) as Record<ScenarioId, Scenario>

export function getScenario(id: ScenarioId): Scenario {
  return SCENARIO_BY_ID[id]
}