import { useTextures } from 'troisjs'

export default function({
  three,
  onChange = () => {},
  enableWheel = true,
  enableClick = true,
  enableKey = true
}) {
  const texturesLoader = useTextures()
  let listeners = false

  const obj = {
    images: [],
    progress: 0,
    targetProgress: 0,
    loadImages,
    setTargetProgress,
    updateProgress,
    dispose
  }

  return obj

  function loadImages(images, cb) {
    obj.images = images
    texturesLoader.loadTextures(images, () => {
      if (!listeners) addListeners()
      cb(texturesLoader.textures)
    })
  }

  function setTargetProgress(value) {
    obj.targetProgress = value
    if (obj.targetProgress < 0) {
      obj.progress += obj.images.length
      obj.targetProgress += obj.images.length
    }
  }

  function updateProgress() {
    const progress = lerp(obj.progress, obj.targetProgress, 0.05)
    const pdiff = progress - obj.progress
    if (pdiff === 0) return

    const p0 = obj.progress % 1
    const p1 = progress % 1

    if ((pdiff > 0 && p1 < p0) || (pdiff < 0 && p0 < p1)) {
      const i = Math.floor(progress) % obj.images.length
      const j = (i + 1) % obj.images.length
      onChange(texturesLoader.textures[i], texturesLoader.textures[j], progress)
    }

    obj.progress = progress
  }

  function addListeners() {
    listeners = true
    const domElement = three.renderer.domElement
    if (enableClick) domElement.addEventListener('click', onClick)
    if (enableWheel) domElement.addEventListener('wheel', onWheel)
    if (enableKey) document.addEventListener('keyup', onKeyup)
  }

  function removeListeners() {
    const domElement = three.renderer.domElement
    domElement.removeEventListener('click', onClick)
    domElement.removeEventListener('wheel', onWheel)
    document.removeEventListener('keyup', onKeyup)
  }

  function onWheel(e) {
    // e.preventDefault()
    if (e.deltaY > 0) {
      setTargetProgress(obj.targetProgress + 1 / 20)
    } else {
      setTargetProgress(obj.targetProgress - 1 / 20)
    }
  }

  function onClick(e) {
    if (e.clientY < three.size.height / 2) {
      navPrevious()
    } else {
      navNext()
    }
  }

  function onKeyup(e) {
    if (e.keyCode === 37 || e.keyCode === 38) {
      navPrevious()
    } else if (e.keyCode === 39 || e.keyCode === 40) {
      navNext()
    }
  }

  function navNext() {
    if (Number.isInteger(obj.targetProgress)) setTargetProgress(obj.targetProgress + 1)
    else setTargetProgress(Math.ceil(obj.targetProgress))
  }

  function navPrevious() {
    if (Number.isInteger(obj.targetProgress)) setTargetProgress(obj.targetProgress - 1)
    else setTargetProgress(Math.floor(obj.targetProgress))
  }

  function dispose() {
    removeListeners()
    texturesLoader.dispose()
  }
}

function lerp(value1, value2, amount) {
  return value1 + (value2 - value1) * amount
}
