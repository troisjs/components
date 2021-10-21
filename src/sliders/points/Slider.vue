<template>
  <Renderer ref="renderer" antialias resize :pointer="{ resetOnEnd: true }">
    <Camera ref="camera" :position="{ z: 100 }" />
    <Scene ref="scene" />
  </Renderer>
</template>

<script>
import { defineComponent } from 'vue'
import { Vector2 } from 'three'

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
      const imagePoints = this.imagePoints = useImagePoints({ three: this.three, pointSize: 2 })
      // imagePoints.o3d.position.z = -10
      // imagePoints.o3d.position.y = 20
      // imagePoints.o3d.rotation.x = -0.6
      this.three.scene.add(imagePoints.o3d)

      this.tiltRotation = new Vector2(0, 0)
      this.tiltTargetRotation = this.tiltRotation.clone()

      imagePoints.resize(this.three.size)
      imagePoints.setTexture1(textures[0])
      imagePoints.setTexture2(textures[1])
    },
    animate() {
      this.slider.updateProgress()
      const progress = this.slider.progress % 1
      this.imagePoints.uProgress.value = progress

      const pointer = this.three.pointer.positionN
      this.tiltTargetRotation.set(pointer.y * 0.1, -pointer.x * 0.1)
      this.tiltRotation.lerp(this.tiltTargetRotation, 0.1)
      this.imagePoints.o3d.rotation.x = this.tiltRotation.x
      this.imagePoints.o3d.rotation.y = this.tiltRotation.y
    },
    onSliderChange(t1, t2) {
      this.imagePoints.setTexture1(t1)
      this.imagePoints.setTexture2(t2)
    },
    resize(size) {
      this.imagePoints.resize(size)
    },
  },
})
</script>
