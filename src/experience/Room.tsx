import { useTexture } from "@react-three/drei"
import { useMemo } from "react"
import * as THREE from "three"

/**
 * A small dark room: walnut desk, plaster wall, parquet floor, a desk lamp and a few
 * things on the desk. The computer's feet stand at y = 0, which is the desk top.
 * Textures: Poly Haven, CC0 (see blender/textures/CREDITS.txt).
 */

const T = `${import.meta.env.BASE_URL}textures/`
const FLOOR_Y = -0.75

function useSurface(name: string, repeat: [number, number]) {
  const maps = useTexture({
    map: `${T}${name}_color.jpg`,
    normalMap: `${T}${name}_normal.jpg`,
    roughnessMap: `${T}${name}_rough.jpg`,
  })
  return useMemo(() => {
    for (const [key, tex] of Object.entries(maps)) {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping
      tex.repeat.set(...repeat)
      tex.anisotropy = 8
      tex.colorSpace = key === "map" ? THREE.SRGBColorSpace : THREE.NoColorSpace
      tex.needsUpdate = true
    }
    return maps
  }, [maps, repeat])
}

const DESK_REPEAT: [number, number] = [1.6, 0.9]
const FLOOR_REPEAT: [number, number] = [5, 5]
const WALL_REPEAT: [number, number] = [3.5, 2]

export function Room() {
  const desk = useSurface("desk", DESK_REPEAT)
  const floor = useSurface("floor", FLOOR_REPEAT)
  const wall = useSurface("wall", WALL_REPEAT)

  return (
    <group>
      {/* Desk */}
      <mesh position={[0, -0.0175, 0.15]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.035, 0.86]} />
        <meshStandardMaterial {...desk} color="#e0b48a" roughness={1} />
      </mesh>
      {[-0.765, 0.765].map((x) => (
        <mesh key={x} position={[x, (FLOOR_Y - 0.035) / 2, 0.15]} castShadow receiveShadow>
          <boxGeometry args={[0.035, -FLOOR_Y - 0.035, 0.82]} />
          <meshStandardMaterial {...desk} color="#e0b48a" roughness={1} />
        </mesh>
      ))}
      <mesh position={[0, -0.26, -0.24]} receiveShadow>
        <boxGeometry args={[1.5, 0.42, 0.02]} />
        <meshStandardMaterial {...desk} color="#e0b48a" roughness={1} />
      </mesh>

      {/* Floor and walls */}
      <mesh rotation-x={-Math.PI / 2} position={[0, FLOOR_Y, 0.8]} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial {...floor} roughness={1} />
      </mesh>
      <mesh position={[0, 1.2, -0.5]} receiveShadow>
        <planeGeometry args={[8, 4]} />
        <meshStandardMaterial {...wall} color="#8d8a84" roughness={1} />
      </mesh>
      <mesh position={[-2.4, 1.2, 1.5]} rotation-y={Math.PI / 2} receiveShadow>
        <planeGeometry args={[4, 4]} />
        <meshStandardMaterial {...wall} color="#7d7a74" roughness={1} />
      </mesh>

      <DeskLamp />
      <Mug />
      <Floppies />
      <Poster />
    </group>
  )
}

const metal = new THREE.MeshStandardMaterial({ color: "#1d1d1f", metalness: 0.7, roughness: 0.35 })

/** Classic two arm desk lamp, left behind the computer. */
function DeskLamp() {
  const base = new THREE.Vector3(-0.62, 0, -0.1)
  const elbow = new THREE.Vector3(-0.66, 0.36, -0.2)
  const head = new THREE.Vector3(-0.44, 0.52, -0.02)
  const arm = (a: THREE.Vector3, b: THREE.Vector3) => {
    const mid = a.clone().add(b).multiplyScalar(0.5)
    const dir = b.clone().sub(a)
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
    return { position: mid, quaternion: q, length: dir.length() }
  }
  const a1 = arm(base, elbow)
  const a2 = arm(elbow, head)
  return (
    <group>
      <mesh position={[base.x, 0.012, base.z]} material={metal} castShadow>
        <cylinderGeometry args={[0.085, 0.095, 0.024, 48]} />
      </mesh>
      {[a1, a2].map((a, i) => (
        <mesh key={i} position={a.position} quaternion={a.quaternion} material={metal} castShadow>
          <cylinderGeometry args={[0.009, 0.009, a.length, 16]} />
        </mesh>
      ))}
      <mesh position={elbow} material={metal}>
        <sphereGeometry args={[0.018, 16, 16]} />
      </mesh>
      {/* Shade, pointing down at the desk. */}
      <group position={head} rotation={[0.55, 0, -0.75]}>
        <mesh material={metal} castShadow>
          <coneGeometry args={[0.085, 0.13, 48, 1, true]} />
        </mesh>
        <mesh position={[0, -0.03, 0]}>
          <sphereGeometry args={[0.028, 24, 16]} />
          <meshStandardMaterial color="#fff1d6" emissive="#ffd9a0" emissiveIntensity={6} toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}

function Mug() {
  return (
    <group position={[0.58, 0, 0.36]} rotation-y={0.6}>
      <mesh position={[0, 0.048, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.04, 0.037, 0.096, 48, 1, true]} />
        <meshStandardMaterial color="#2a3a33" roughness={0.25} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.003, 0]}>
        <cylinderGeometry args={[0.037, 0.037, 0.006, 48]} />
        <meshStandardMaterial color="#2a3a33" roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.085, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.036, 48]} />
        <meshStandardMaterial color="#1b0f08" roughness={0.1} />
      </mesh>
      <mesh position={[0.046, 0.05, 0]} rotation-z={Math.PI / 2} castShadow>
        <torusGeometry args={[0.022, 0.006, 12, 32, Math.PI]} />
        <meshStandardMaterial color="#2a3a33" roughness={0.25} />
      </mesh>
    </group>
  )
}

/** A small stack of 3.5 inch disks next to the keyboard. */
function Floppies() {
  const colors = ["#1b1b1d", "#3b4a8c", "#1b1b1d"]
  return (
    <group position={[-0.44, 0, 0.38]}>
      {colors.map((c, i) => (
        <group key={i} position={[i * 0.006, 0.0017 + i * 0.0034, -i * 0.004]} rotation-y={0.25 - i * 0.18}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.09, 0.0033, 0.094]} />
            <meshStandardMaterial color={c} roughness={0.45} />
          </mesh>
          <mesh position={[0, 0.0018, 0.012]} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[0.068, 0.052]} />
            <meshStandardMaterial color="#e8e4da" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.0018, -0.034]} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[0.05, 0.022]} />
            <meshStandardMaterial color="#b8bcc2" metalness={0.9} roughness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** Framed print on the wall, catches a little of the lamp light. */
function Poster() {
  return (
    <group position={[0.55, 0.78, -0.49]}>
      <mesh castShadow>
        <boxGeometry args={[0.42, 0.56, 0.02]} />
        <meshStandardMaterial color="#141414" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.011]}>
        <planeGeometry args={[0.36, 0.5]} />
        <meshStandardMaterial color="#d9d3c4" roughness={0.9} />
      </mesh>
      {/* Simple print: a few stacked bars, like a wireframe of a page. */}
      {[0.14, 0.06, -0.02, -0.1].map((y, i) => (
        <mesh key={y} position={[-0.02 + (i % 2) * 0.03, y, 0.012]}>
          <planeGeometry args={[0.24 - i * 0.03, 0.035]} />
          <meshStandardMaterial color={i === 0 ? "#2f6b45" : "#3a3a3a"} roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}
