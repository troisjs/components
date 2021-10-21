<template>
  <Slider :images="images" />
</template>

<script lang="ts">
import { default as Slider }  from './sliders/displacement/Slider.vue'
// import { default as Slider }  from './sliders/explode/Slider.vue'
// import { default as Slider }  from './sliders/points/Slider.vue'
// import { default as Slider }  from './sliders/zoomblur/Slider.vue'
export default {
  components: { Slider },
  data() {
    return {
      images: [
        { src: 'https://troisjs.github.io/assets/images/img1.jpg' },
        { src: 'https://troisjs.github.io/assets/images/img2.jpg' },
        { src: 'https://troisjs.github.io/assets/images/img3.jpg' },
        { src: 'https://troisjs.github.io/assets/images/img4.jpg' },
      ],
    }
  },
}
</script>

<style>
body, html, #app {
  margin: 0;
  height: 100%;
}
canvas {
  display: block;
}
</style>