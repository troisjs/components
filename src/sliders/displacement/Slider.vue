<template>
  <Renderer ref="renderer" antialias resize pointer>
    <OrthographicCamera ref="camera" :position="{ z: 10 }" />
    <Scene ref="scene" />
  </Renderer>
</template>

<script>
import { defineComponent } from 'vue'
import { TextureLoader, Vector2 } from 'three'

import { OrthographicCamera, Renderer, Scene } from 'troisjs'
import useSliderLogic from '../useSliderLogic'
import useImageDisplacement from './useImageDisplacement'
import useShaderTexture from '../../misc/useShaderTexture'

export default defineComponent({
  components: { OrthographicCamera, Renderer, Scene },
  props: {
    images: Array,
    dispMap: String,
    dispMapShader: String,
    dispScaleX: { type: Number, default: 1 },
    dispScaleY: { type: Number, default: 1 },
    dispScale: { type: Number, default: 0.1 },
    enableWheel: { type: Boolean, default: true },
    enableClick: { type: Boolean, default: true },
    enableKey: { type: Boolean, default: true },
  },
  mounted() {
    this.renderer = this.$refs.renderer
    this.three = this.renderer.three

    if (this.images.length < 2) {
      console.error('This slider needs at least 2 images.')
    } else {
      this.initSlider()
    }
  },
  unmounted() {
    this.slider.dispose()
  },
  methods: {
    initSlider() {
      this.image = useImageDisplacement({
        three: this.three,
        dispScaleX: this.dispScaleX,
        dispScaleY: this.dispScaleY,
        dispScale: this.dispScale,
      })
      this.three.scene.add(this.image.mesh)

      this.slider = useSliderLogic({
        three: this.three,
        onChange: this.onSliderChange,
        enableWheel: this.enableWheel,
        enableClick: this.enableClick,
        enableKey: this.enableKey,
      })

      // test
      const dispMapShader = `
        varying vec2 vUv;
        void main() {
          vec2 uv = vUv * 20.0;
          float modx = mod(uv.x, 2.0);
          float mody = mod(uv.y, 2.0);
          vec2 disp = vec2(0.5, 0.5);
          if (modx < 1.0) { disp.y = 0.0; } else { disp.y = 1.0; }
          if (mody < 1.0) { disp.x = 1.0; } else { disp.x = 0.0; }
          gl_FragColor = vec4(disp.x, disp.y, 0.0, 1.0);
        }
      `

      // if (this.dispMap) {
      //   new TextureLoader().load(this.dispMap, (texture) => {
      //     this.image.setDispMap(texture)
      //   })
      // } else if (this.dispMapShader) {
        const shaderTex = useShaderTexture({
          three: this.three,
          size: new Vector2(512, 512),
          fragmentShader: dispMapShader,
        })
        shaderTex.render()
        this.image.setDispMap(shaderTex.texture)
      // }

      this.slider.loadImages(this.images, (textures) => {
        this.image.setTexture1(textures[0])
        this.image.setTexture2(textures[1])
        this.renderer.onBeforeRender(this.animate)
        this.renderer.onResize(this.resize)
      })
    },
    animate() {
      this.slider.updateProgress()
      const progress = this.slider.progress % 1
      this.image.uProgress.value = progress
    },
    onSliderChange(t1, t2) {
      this.image.setTexture1(t1)
      this.image.setTexture2(t2)
    },
    resize() {
      this.image.resize()
    },
  },
})
</script>
