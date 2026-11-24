import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js"

import { fx } from "./store"

RectAreaLightUniformsLib.init()

/**
 * Night time desk: a warm lamp, green light from the CRT, a little cool light
 * from a window off to the right, and almost no ambient light.
 */
export function Lights({ screenBox }: { screenBox: THREE.Box3 | null }) {
  const screenLight = useRef<THREE.RectAreaLight>(null)
  const lampTarget = useMemo(() => {
    const o = new THREE.Object3D()
    o.position.set(-0.15, 0, 0.22)
    return o
  }, [])

  const center = useMemo(() => (screenBox ? screenBox.getCenter(new THREE.Vector3()) : new THREE.Vector3(0, 0.34, 0.15)), [screenBox])

  useEffect(() => {
    screenLight.current?.lookAt(center.x, center.y, center.z + 1)
  }, [center])

  useFrame(() => {
    if (!screenLight.current) return
    // The tube light follows the picture: off before power on, a tiny bit of flicker.
    screenLight.current.intensity = 7 * fx.power * (0.96 + Math.random() * 0.04) + fx.glitch * 4
  })

  return (
    <>
      <ambientLight intensity={0.04} />
      <hemisphereLight args={["#3a4656", "#1a120b", 0.12]} />
      <primitive object={lampTarget} />
      <spotLight
        position={[-0.46, 0.5, -0.0]}
        target={lampTarget}
        color="#ffcf9a"
        intensity={4.2}
        distance={4}
        decay={2}
        angle={0.85}
        penumbra={0.75}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.01}
      />
      {/* Lamp also lights the wall a bit around itself. */}
      <pointLight position={[-0.5, 0.62, -0.2]} color="#ffb877" intensity={0.35} distance={1.6} decay={2} />
      <rectAreaLight ref={screenLight} position={[center.x, center.y, center.z + 0.01]} width={0.28} height={0.21} color="#a8ffc0" intensity={0} />
      <directionalLight position={[3, 2.2, 1.6]} color="#8ea4ff" intensity={0.22} />
    </>
  )
}
