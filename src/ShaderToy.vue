<template>
  <Renderer ref="rendererRef" pointer resize>
    <OrthographicCamera :position="{ z: 10 }" />
    <Scene>
      <Plane :width="2" :height="2">
        <ShaderMaterial :props="{ uniforms, vertexShader, fragmentShader }" />
      </Plane>
    </Scene>
  </Renderer>
</template>

<script>
import { onMounted, ref } from 'vue'

import { Vector2, Vector3 } from 'three'
import {
  OrthographicCamera,
  Plane,
  Renderer,
  Scene,
  ShaderMaterial
} from 'troisjs'

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`

export default {
  components: {
    OrthographicCamera,
    Plane,
    Renderer,
    Scene,
    ShaderMaterial
  },
  props: {
    shader: String
  },
  computed: {
    fragmentShader() {
      return `
        uniform vec3 iResolution;
        uniform float iTime;
        uniform vec2 iMouse;

        ${this.shader}

        void main() {
          mainImage(gl_FragColor, gl_FragCoord.xy);
        }
      `
    }
  },
  setup() {
    const startTime = Date.now()
    const iResolution = { value: new Vector3() }
    const iTime = { value: 0 }
    const iMouse = { value: new Vector2() }
    const uniforms = { iResolution, iTime, iMouse }

    const rendererRef = ref(null)
    onMounted(() => {
      const renderer = rendererRef.value

      iMouse.value = renderer.$pointer.position

      iResolution.value.set(renderer.size.width, renderer.size.height, 1)
      renderer.onResize(({ size }) => {
        iResolution.value.set(size.width, size.height, 1)
      })

      renderer.onBeforeRender(() => {
        iTime.value = 0.001 * (Date.now() - startTime)
      })
    })

    return {
      rendererRef,
      uniforms,
      vertexShader
    }
  }
}
</script>
