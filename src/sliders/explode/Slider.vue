<template>
  <Renderer ref="renderer" antialias pointer resize>
    <Camera :position="{ z: 150 }" />
    <Scene />
  </Renderer>
</template>

<script>
import { defineComponent } from 'vue'
import { Object3D, Vector2 } from 'three'

import { Camera, Renderer, Scene } from 'troisjs'
import useSliderLogic from '../useSliderLogic'
import useAnimatedPlane from './useAnimatedPlane.js'

export default defineComponent({
  components: { Camera, Renderer, Scene },
  props: {
    images: Array,
    enableWheel: { type: Boolean, default: true },
    enableClick: { type: Boolean, default: true },
    enableKey: { type: Boolean, default: true }
  },
  mounted () {
    this.renderer = this.$refs.renderer
    this.three = this.renderer.three

    if (this.images.length < 2) {
      console.error('This slider needs at least 2 images.')
    } else {
      this.initSlider()
    }
  },
  unmounted () {
    this.slider.dispose()
  },
  methods: {
    initSlider () {
      this.o3d = new Object3D()
      this.tiltRotation = new Vector2(0, 0)
      this.tiltTargetRotation = this.tiltRotation.clone()
      this.three.scene.add(this.o3d)

      this.slider = useSliderLogic({
        three: this.three,
        onChange: this.onSliderChange,
        enableWheel: this.enableWheel,
        enableClick: this.enableClick,
        enableKey: this.enableKey
      })

      this.slider.loadImages(this.images, (textures) => {
        this.image1 = useAnimatedPlane({ three: this.three, size: 10, anim: 1, texture: textures[0] })
        this.image2 = useAnimatedPlane({ three: this.three, size: 10, anim: 2, texture: textures[1] })
        this.o3d.add(this.image1.o3d)
        this.o3d.add(this.image2.o3d)
        this.renderer.onBeforeRender(this.animate)
        this.renderer.onResize(this.resize)
      })
    },
    animate () {
      this.slider.updateProgress()
      const progress = this.slider.progress % 1
      this.image1.uProgress.value = progress
      this.image2.uProgress.value = -1 + progress
      this.image1.material.opacity = 1 - progress
      this.image2.material.opacity = progress
      this.image1.o3d.position.z = progress
      this.image2.o3d.position.z = progress - 1

      this.tiltTargetRotation.set(this.three.pointer.positionN.y * 0.1, -this.three.pointer.positionN.x * 0.1)
      this.tiltRotation.lerp(this.tiltTargetRotation, 0.1)
      this.o3d.rotation.x = this.tiltRotation.x
      this.o3d.rotation.y = this.tiltRotation.y
    },
    onSliderChange (t1, t2) {
      this.image1.setTexture(t1)
      this.image2.setTexture(t2)
    },
    resize () {
      this.image1.resize()
      this.image2.resize()
    }
  }
})
</script>
