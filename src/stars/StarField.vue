<template>
  <Renderer ref="rendererRef" pointer resize>
    <Camera :position="{ z: 0 }" :fov="50" />
    <Scene>
      <Points ref="pointsRef" :position="{ z: -150 }">
        <BufferGeometry :attributes="attributes" />
        <ShaderMaterial
          :props="{
            blending: 2,
            depthTest: false,
            depthWrite: false,
            uniforms,
            vertexShader,
            fragmentShader,
          }"
        >
          <Texture :src="star" uniform="uTexture" />
        </ShaderMaterial>
      </Points>
    </Scene>
    <EffectComposer>
      <RenderPass />
      <UnrealBloomPass :strength="bloomStrength" :radius="0" :threshold="0" />
      <ZoomBlurPass :strength="zoomStrength" />
    </EffectComposer>
  </Renderer>
</template>

<script>
import { onMounted, ref, watch } from 'vue'
import { Clock, Color, MathUtils, Vector3 } from 'three'

import {
  lerp,
  BufferGeometry,
  Camera,
  EffectComposer,
  Points,
  Renderer,
  RenderPass,
  Scene,
  ShaderMaterial,
  Texture,
  UnrealBloomPass,
  ZoomBlurPass
} from 'troisjs'

const { randFloat: rnd, randFloatSpread: rndFS, randInt } = MathUtils

const vertexShader = `
  uniform float uTime;
  attribute vec3 color;
  attribute float size;
  attribute float velocity;
  varying vec4 vColor;
  void main(){
    vColor = vec4(color, 1.0);
    vec3 p = vec3(position);
    p.z = -150. + mod(position.z + uTime, 300.);
    vec4 mvPosition = modelViewMatrix * vec4( p, 1.0 );
    gl_PointSize = size * (-50.0 / mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = `
  uniform sampler2D uTexture;
  varying vec4 vColor;
  void main() {
    gl_FragColor = vColor * texture2D(uTexture, gl_PointCoord);
  }
`

export default {
  components: {
    BufferGeometry,
    Camera,
    EffectComposer,
    Points,
    Renderer,
    RenderPass,
    Scene,
    ShaderMaterial,
    Texture,
    UnrealBloomPass,
    ZoomBlurPass
  },
  props: {
    star: String,
    colors: Array,
    count: { type: Number, default: 50000 },
    velocity: { type: Number, default: 1 },
    bloomStrength: { type: Number, default: 2 }
  },
  setup(props) {
    const POINTS_COUNT = props.count
    const palette = props.colors

    // init points data
    const positions = new Float32Array(POINTS_COUNT * 3)
    const colors = new Float32Array(POINTS_COUNT * 3)
    const sizes = new Float32Array(POINTS_COUNT)
    const v3 = new Vector3()
    const color = new Color()

    // fill points data
    for (let i = 0; i < POINTS_COUNT; i++) {
      v3.set(rndFS(200), rndFS(200), rndFS(300))
      v3.toArray(positions, i * 3)
      color.set(palette[Math.floor(rnd(0, palette.length))])
      color.toArray(colors, i * 3)
      sizes[i] = rnd(5, 20)
    }

    // points attributes
    const attributes = [
      { name: 'position', array: positions, itemSize: 3 },
      { name: 'color', array: colors, itemSize: 3 },
      { name: 'size', array: sizes, itemSize: 1 }
    ]

    // material uniforms
    const uniforms = { uTime: { value: 0 } }

    // zoom
    const zoomStrength = ref(0)
    let timeCoef = 1
    let targetTimeCoef = 1

    watch(() => props.velocity, (v) => {
      targetTimeCoef = Math.min(100, Math.max(0, v))
    })

    // refs
    const rendererRef = ref(null)
    const pointsRef = ref(null)

    onMounted(() => {
      const renderer = rendererRef.value
      const points = pointsRef.value.points

      const positionN = renderer.three.pointer.positionN
      const clock = new Clock()

      renderer.onBeforeRender(() => {
        timeCoef = lerp(timeCoef, targetTimeCoef, 0.02)
        uniforms.uTime.value += clock.getDelta() * timeCoef * 4
        zoomStrength.value = timeCoef * 0.004

        const da = 0.05
        const tiltX = lerp(points.rotation.x, positionN.y * da, 0.02)
        const tiltY = lerp(points.rotation.y, -positionN.x * da, 0.02)
        points.rotation.set(tiltX, tiltY, 0)
      })

      watch(() => props.colors, (v) => {
        const colorAttribute = points.geometry.attributes.color
        const color = new Color()
        for (let i = 0; i < POINTS_COUNT; i++) {
          color.set(v[randInt(0, v.length - 1)])
          color.toArray(colorAttribute.array, i * 3)
        }
        colorAttribute.needsUpdate = true
      })
    })

    return {
      attributes,
      uniforms,
      vertexShader,
      fragmentShader,
      zoomStrength,
      rendererRef,
      pointsRef
    }
  }
}
</script>
