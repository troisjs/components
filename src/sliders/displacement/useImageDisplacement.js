import {
  DoubleSide,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  Vector4
} from 'three'

export default function({
  three,
  dispScaleX = 1,
  dispScaleY = 1,
  dispScale = 0.1
}) {
  let planeMesh

  const uMap1 = { value: null }
  const uMap2 = { value: null }
  const uUVOffset1 = { value: new Vector4(0, 0, 1, 1) }
  const uUVOffset2 = { value: new Vector4(0, 0, 1, 1) }
  const uDispMap = { value: null }
  const uUVOffsetDisp = { value: new Vector4(0, 0, 1, 1) }
  const uDispScale = { value: new Vector4(dispScaleX, dispScaleY, 0, dispScale) }
  const uProgress = { value: 0 }

  const uniforms = { uMap1, uMap2, uUVOffset1, uUVOffset2, uDispMap, uUVOffsetDisp, uDispScale, uProgress }

  return init()

  function init() {
    initPlaneMesh()
    return { mesh: planeMesh, uProgress, setTexture1, setTexture2, setDispMap, resize }
  }

  function initPlaneMesh() {
    const planeGeo = new PlaneGeometry(2, 2, 1, 1)
    const planeMat = new ShaderMaterial({
      transparent: true,
      side: DoubleSide,
      uniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uMap1;
        uniform sampler2D uMap2;
        uniform vec4 uUVOffset1;
        uniform vec4 uUVOffset2;
        uniform sampler2D uDispMap;
        uniform vec4 uUVOffsetDisp;
        uniform vec4 uDispScale;
        uniform float uProgress;
        varying vec2 vUv;
        void main() {
          vec2 uv1 = vUv * uUVOffset1.zw + uUVOffset1.xy;
          vec2 uv2 = vUv * uUVOffset2.zw + uUVOffset2.xy;
          vec2 duv = vUv * uUVOffsetDisp.zw + uUVOffsetDisp.xy;

          vec4 dtex = texture2D(uDispMap, duv);
          vec2 disp = vec2((dtex.r - 0.5) * uDispScale.x, (dtex.g - 0.5) * uDispScale.y) * uDispScale.w;
          vec2 duv1 = uv1 + disp * uProgress;
          vec4 dtex1 = texture2D(uMap1, duv1);
          vec2 duv2 = uv2 + disp * (1.0 - uProgress);
          vec4 dtex2 = texture2D(uMap2, duv2);
          gl_FragColor = mix(dtex1, dtex2, uProgress);
        }
      `
    })
    planeMesh = new Mesh(planeGeo, planeMat)
  }

  function setTexture1(t) { return _setTexture(t, 1) }
  function setTexture2(t) { return _setTexture(t, 2) }

  function _setTexture(t, i) {
    const uMap = uniforms[`uMap${i}`]
    const uUVOffset = uniforms[`uUVOffset${i}`]
    // if (uMap.value) { uMap.value.dispose() }
    uMap.value = t
    updateUV(uMap, uUVOffset)
  }

  function setDispMap(t) {
    uDispMap.value = t
    updateUV(uDispMap, uUVOffsetDisp)
  }

  function resize() {
    updateUVs()
  }

  function updateUVs() {
    updateUV(uMap1, uUVOffset1)
    updateUV(uMap2, uUVOffset2)
    updateUV(uDispMap, uUVOffsetDisp)
  }

  function updateUV(map, offset) {
    if (!map.value) { return }
    const ratio = three.size.ratio
    const width = map.value.image.videoWidth || map.value.image.width
    const height = map.value.image.videoHeight || map.value.image.height
    const iRatio = width / height
    offset.value.set(0, 0, 1, 1)
    if (iRatio > ratio) {
      offset.value.z = ratio / iRatio
      offset.value.x = (1 - offset.value.z) / 2
    } else {
      offset.value.w = iRatio / ratio
      offset.value.y = (1 - offset.value.w) / 2
    }
  }
}
