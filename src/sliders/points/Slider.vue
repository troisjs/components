<template>
  <Renderer ref="renderer" antialias resize pointer>
    <Camera ref="camera" :position="{ z: 100 }" />
    <Scene ref="scene" />
  </Renderer>
</template>

<script>
import { defineComponent } from 'vue'

import { Camera, Renderer, Scene } from 'troisjs'
import useSliderLogic from '../useSliderLogic'
import useImagePoints from './useImagePoints'

export default defineComponent({
  components: { Camera, Renderer, Scene },
  props: {
    images: Array,
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
      this.slider = useSliderLogic({
        three: this.three,
        onChange: this.onSliderChange,
        enableWheel: this.enableWheel,
        enableClick: this.enableClick,
        enableKey: this.enableKey,
      })

      this.slider.loadImages(this.images, (textures) => {
        this.initImagePoints(textures)
        this.renderer.onBeforeRender(this.animate)
        this.renderer.onResize(this.resize)
      })
    },
    initImagePoints(textures) {
      const imagePoints = this.imagePoints = useImagePoints({ three: this.three, pointSize: 1 })
      // imagePoints.o3d.position.z = -10
      // imagePoints.o3d.position.y = 20
      // imagePoints.o3d.rotation.x = -0.6
      this.three.scene.add(imagePoints.o3d)

      imagePoints.resize(this.three.size)
      imagePoints.setSrc1(textures[0])
      imagePoints.setSrc2(textures[1])
    },
    animate() {
      this.slider.updateProgress()
      const progress = this.slider.progress % 1
      this.imagePoints.uProgress.value = progress

      // tiltTargetRotation.set(-0.6 + three.mouse.y * 0.1, -three.mouse.x * 0.1)
      // tiltRotation.lerp(tiltTargetRotation, 0.1)
      // imagePoints.o3d.rotation.x = tiltRotation.x
      // imagePoints.o3d.rotation.y = tiltRotation.y
    },
    onSliderChange(t1, t2) {
      this.imagePoints.setSrc1(t1)
      this.imagePoints.setSrc2(t2)
    },
    resize(size) {
      this.imagePoints.resize(size)
    },
  },
})
</script>
