import { TextureLoader, Vector2 } from 'three'
import useThree from '../../useThree'
import useSliderLogic from '../../useSliderLogic'
import useShaderTexture from '../../useShaderTexture'
import useImageDisplacement from './useImageDisplacement'

export default function({ canvas, images, dispMap, dispScaleX = 1, dispScaleY = 1, dispScale = 0.1 }) {
  const three = useThree()

  let slider, image

  init()

  function init() {
    three.init({ canvas, antialias: false, pointer: true, orthographic: true })

    slider = useSliderLogic({ three, onChange: onSliderChange })

    slider.loadImages(images, (textures) => {
      initSlider(textures)
      animate()
    })
  }

  function initSlider(textures) {
    image = useImageDisplacement({ three, dispScaleX, dispScaleY, dispScale })
    image.setTexture1(textures[0])
    image.setTexture2(textures[1])

    const shaderTex = useShaderTexture({
      three,
      size: new Vector2(512, 512),
      fragmentShader: `
        varying vec2 vUv;
        void main() {
          // gl_FragColor = vec4(0.5 + 0.5 * vUv.x, 0.5 + 0.5 * vUv.y, 0.0, 1.0);

          // vec2 uv = vUv * 50.0;
          // vec2 fuv = fract(uv);
          // float modx = mod(uv.x, 4.0);
          // float mody = mod(uv.y, 4.0);
          // vec2 disp = vec2(0);

          // if (modx < 1.0) { disp.x = 0.0; }
          // else if (modx < 2.0) { disp.x = 1.0; }
          // else if (modx < 3.0) { disp.x = 0.0; }
          // else if (modx < 4.0) { disp.x = 1.0; }

          // if (mody < 1.0) { disp.y = 0.0; }
          // else if (mody < 2.0) { disp.y = 1.0; }
          // else if (mody < 3.0) { disp.y = 0.0; }
          // else if (mody < 4.0) { disp.y = 1.0; }

          // // gl_FragColor = vec4(disp.x, disp.y, 0.0, 1.0);

          // vec2 fuv = fract(vUv * 80.0);
          // gl_FragColor = vec4(fuv.x < 0.5 ? 0.0 : 1.0, fuv.y < 0.5 ? 0.0 : 1.0, 0.0, 1.0);

          vec2 uv = vUv * 20.0;
          float modx = mod(uv.x, 2.0);
          float mody = mod(uv.y, 2.0);
          vec2 disp = vec2(0.5, 0.5);
          if (modx < 1.0) { disp.y = 0.0; } else { disp.y = 1.0; }
          if (mody < 1.0) { disp.x = 1.0; } else { disp.x = 0.0; }
          gl_FragColor = vec4(disp.x, disp.y, 0.0, 1.0);
        }
      `
    })
    shaderTex.render()
    image.setDispMap(shaderTex.texture)

    // new TextureLoader().load(dispMap, (texture) => {
    //   image.setDispMap(texture)
    // })

    three.onResize = () => {
      image.resize()
    }
    three.scene.add(image.mesh)
  }

  function onSliderChange(t1, t2) {
    image.setTexture1(t1)
    image.setTexture2(t2)
  }

  function animate() {
    slider.updateProgress()

    image.uProgress.value = slider.progress % 1

    three.render()
    requestAnimationFrame(animate)
  }
}
