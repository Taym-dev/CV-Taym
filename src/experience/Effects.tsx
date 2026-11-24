import { useFrame } from "@react-three/fiber"
import { Bloom, ChromaticAberration, EffectComposer, Noise, ToneMapping, Vignette } from "@react-three/postprocessing"
import { BlendFunction, ToneMappingMode, type NoiseEffect } from "postprocessing"
import { useMemo, useRef } from "react"
import * as THREE from "three"

import { fx } from "./store"

/** Film look for the whole frame. Chromatic aberration and grain jump up during a glitch. */
export function Effects({ multisampling = 4 }: { multisampling?: number }) {
  const noise = useRef<NoiseEffect>(null)
  const offset = useMemo(() => new THREE.Vector2(0.0005, 0.0002), [])

  useFrame(() => {
    offset.set(0.0005 + fx.glitch * 0.009, 0.0002 + fx.glitch * 0.003)
    if (noise.current) noise.current.blendMode.opacity.value = 0.06 + fx.glitch * 0.4
  })

  return (
    <EffectComposer multisampling={multisampling}>
      <Bloom mipmapBlur intensity={0.85} luminanceThreshold={0.8} luminanceSmoothing={0.25} radius={0.72} />
      <ChromaticAberration offset={offset} radialModulation={false} modulationOffset={0} />
      <Noise ref={noise} premultiply blendFunction={BlendFunction.SCREEN} opacity={0.06} />
      <Vignette offset={0.25} darkness={0.72} />
      <ToneMapping mode={ToneMappingMode.AGX} />
    </EffectComposer>
  )
}
