<template>
  <Slider :images="images" />
</template>

<script lang="ts">
import { default as Slider }  from './sliders/zoomblur/Slider.vue';
export default {
  components: { Slider },
  data() {
    return {
      images: [
        { src: '/assets/images/img1.jpg' },
        { src: '/assets/images/img2.jpg' },
        { src: '/assets/images/img3.jpg' },
        { src: '/assets/images/img4.jpg' },
      ],
    };
  },
};
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