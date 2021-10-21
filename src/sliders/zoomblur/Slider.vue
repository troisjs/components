<template>
  <Renderer ref="renderer" antialias resize pointer>
    <OrthographicCamera ref="camera" :position="{ z: 10 }" />
    <Scene ref="scene" />
  </Renderer>
</template>

<script>
import { defineComponent } from 'vue'
import { Vector2 } from 'three'

import { OrthographicCamera, Renderer, Scene } from 'troisjs'
import useSliderLogic from '../useSliderLogic'
import useZoomBlurImage from './useZoomBlurImage.js'

export default defineComponent({
  components: { OrthographicCamera, Renderer, Scene },
  props: {
    images: Array,
    enableWheel: { type: Boolean, default: true },
    enableClick: { type: Boolean, default: true },
    enableKey: { type: Boolean, default: true },
  },
  setup() {
    const center = new Vector2()
    return { center }
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
      this.image1 = useZoomBlurImage({ three: this.three })
      this.image2 = useZoomBlurImage({ three: this.three })

      this.three.scene.add(this.image1.mesh)
      this.three.scene.add(this.image2.mesh)

      this.slider = useSliderLogic({
        three: this.three,
        onChange: this.onSliderChange,
        enableWheel: this.enableWheel,
        enableClick: this.enableClick,
        enableKey: this.enableKey,
      })

      this.slider.loadImages(this.images, (textures) => {
        this.image1.setMap(textures[0])
        this.image2.setMap(textures[1])
        this.renderer.onBeforeRender(this.animate)
        this.renderer.onResize(this.resize)
      })
    },
    animate() {
      const { positionN } = this.three.pointer
      this.center.copy(positionN).divideScalar(2).addScalar(0.5)
      this.image1.uCenter.value.lerp(this.center, 0.1)
      this.image2.uCenter.value.lerp(this.center, 0.1)

      this.slider.updateProgress()
      const progress = this.slider.progress % 1
      this.image1.uStrength.value = progress
      this.image2.uStrength.value = -1 + progress
    },
    onSliderChange(t1, t2) {
      this.image1.setMap(t1)
      this.image2.setMap(t2)
    },
    resize() {
      this.image1.updateUV()
      this.image2.updateUV()
    },
  },
})
</script>
