<template>
  <Slider :images="images" :disp-map-shader="dispMapShader"/>
</template>

<script lang="ts">
import Slider from './sliders/displacement/Slider.vue'
// import Slider  from './sliders/explode/Slider.vue'
// import Slider  from './sliders/points/Slider.vue'
// import Slider  from './sliders/zoomblur/Slider.vue'

import snoise2 from './glsl/snoise2.glsl.js'

const dispMapShader = `
  varying vec2 vUv;

  ${snoise2}

  void main() {
    vec2 uv = vUv * 50.0;
    float noise = (snoise(uv) + 1.0)  / 2.0;
    gl_FragColor = vec4(noise, noise, 0.0, 1.0);
    // vec2 uv = vUv * 20.0;
    // float modx = mod(uv.x, 2.0);
    // float mody = mod(uv.y, 2.0);
    // vec2 disp = vec2(0.5, 0.5);
    // if (modx < 1.0) { disp.y = 0.0; } else { disp.y = 1.0; }
    // if (mody < 1.0) { disp.x = 1.0; } else { disp.x = 0.0; }
    // gl_FragColor = vec4(disp.x, disp.y, 0.0, 1.0);
  }
`

export default {
  components: { Slider },
  data() {
    return {
      images: [
        { src: 'https://troisjs.github.io/assets/images/img1.jpg' },
        { src: 'https://troisjs.github.io/assets/images/img2.jpg' },
        { src: 'https://troisjs.github.io/assets/images/img3.jpg' },
        { src: 'https://troisjs.github.io/assets/images/img4.jpg' }
      ],
      dispMapShader
    }
  }
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
