<template>
  <Renderer ref="renderer" antialias resize pointer>
    <OrthographicCamera ref="camera" :position="{ z: 10 }" />
    <Scene ref="scene" />
  </Renderer>
</template>

<script>
import { defineComponent } from 'vue'

import { OrthographicCamera, Renderer, Scene } from 'troisjs'
import useSliderLogic from '../useSliderLogic'
import useImageDisplacement from './useImageDisplacement'

export default defineComponent({
  components: { OrthographicCamera, Renderer, Scene },
  props: {
    images: Array,
    dispMap: String,
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
