import { Vector2 } from 'three'
import useThree from '../../useThree'
import useSliderLogic from '../../useSliderLogic'
import useImagePoints from './useImagePoints'

export default function({ canvas, images }) {
  const three = useThree()

  let slider, imagePoints
  const tiltRotation = new Vector2(-0.6, 0)
  const tiltTargetRotation = tiltRotation.clone()

  init()

  function init() {
    three.init({ canvas, antialias: false, pointer: true })

    slider = useSliderLogic({ three, onChange: onSliderChange })

    slider.loadImages(images, (textures) => {
      initImagePoints(textures)
      animate()
    })
  }

  function initImagePoints(textures) {
    imagePoints = useImagePoints({ three, pointSize: 1 })
    imagePoints.o3d.position.z = -10
    imagePoints.o3d.position.y = 20
    imagePoints.o3d.rotation.x = -0.6
    three.scene.add(imagePoints.o3d)

    imagePoints.resize(three.size)
    imagePoints.setSrc1(textures[0])
    imagePoints.setSrc2(textures[1])

    three.onResize = (size) => {
      imagePoints.resize(size)
    }
  }

  function onSliderChange(t1, t2) {
    imagePoints.setSrc1(t1)
    imagePoints.setSrc2(t2)
  }

  function animate() {
    slider.updateProgress()
    imagePoints.uProgress.value = slider.progress % 1

    tiltTargetRotation.set(-0.6 + three.mouse.y * 0.1, -three.mouse.x * 0.1)
    tiltRotation.lerp(tiltTargetRotation, 0.1)
    imagePoints.o3d.rotation.x = tiltRotation.x
    imagePoints.o3d.rotation.y = tiltRotation.y

    three.render()
    requestAnimationFrame(animate)
  }
}
