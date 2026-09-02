/** 柔和影棚布光：主光带阴影，补光压暗部，半球光提供环境色 */
export function Lighting() {
  return (
    <>
      <hemisphereLight args={['#c7d5e5', '#0a0c10', 0.55]} />
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[2.4, 4.2, 2.6]}
        intensity={2.1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
        shadow-camera-near={0.1}
        shadow-camera-far={12}
      />
      <directionalLight position={[-3.2, 1.8, -2.4]} intensity={0.45} />
      <directionalLight position={[0, 1.2, -3.5]} intensity={0.3} />
    </>
  )
}
