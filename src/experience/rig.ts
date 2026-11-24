import * as THREE from "three"

/** World positions shared by the lamp, the lights and the outro spark. */

export const LAMP = {
  base: new THREE.Vector3(-0.62, 0, -0.1),
  elbow: new THREE.Vector3(-0.66, 0.36, -0.2),
  head: new THREE.Vector3(-0.44, 0.52, -0.02),
  headRotation: new THREE.Euler(0.55, 0, -0.75),
  /** Length of the pull cord when it hangs still. */
  cordLength: 0.15,
}

/** The cord hangs from the front rim of the shade. */
export const CORD_TOP = (() => {
  const m = new THREE.Matrix4().compose(LAMP.head, new THREE.Quaternion().setFromEuler(LAMP.headRotation), new THREE.Vector3(1, 1, 1))
  return new THREE.Vector3(0.06, -0.065, 0.055).applyMatrix4(m)
})()

/** How far the bead travels when the cord is pulled. */
export const CORD_PULL = 0.045

export const rig = {
  /** Centre of the CRT glass, updated once the model has loaded. */
  screen: new THREE.Vector3(0, 0.34, 0.15),
  /** Current bead position of the cord, updated every frame by the lamp. */
  bead: CORD_TOP.clone().add(new THREE.Vector3(0, -LAMP.cordLength, 0)),
}
