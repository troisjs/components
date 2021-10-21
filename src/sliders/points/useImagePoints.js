import {
  BufferAttribute,
  BufferGeometry,
  ClampToEdgeWrapping,
  DoubleSide,
  LinearFilter,
  Mesh,
  Object3D,
  PlaneGeometry,
  Points,
  ShaderMaterial,
  Texture,
  TextureLoader,
  Vector2,
  Vector3,
  Vector4
} from 'three'

export default function({
  three,
  dispScaleX = 1,
  dispScaleY = 1,
  dispScaleZ = -2,
  dispScale = 20,
  pointSize = 1
}) {
  let planeMesh
  let pointsGeometry
  let points1Material, points2Material
  let points1, points2

  const loader = new TextureLoader()
  const o3d = new Object3D()

  const uMap1 = { value: null }
  const uMap2 = { value: null }
  const uUVOffset1 = { value: new Vector2(0, 0) }
  const uUVScale1 = { value: new Vector2(1, 1) }
  const uUVOffset2 = { value: new Vector2(0, 0) }
  const uUVScale2 = { value: new Vector2(1, 1) }
  const uPointSize = { value: pointSize }
  const uDispScale = { value: new Vector4(dispScaleX, dispScaleY, dispScaleZ, dispScale) }
  const uProgress = { value: 0 }

  const uniforms = { uMap1, uMap2, uUVOffset1, uUVScale1, uUVOffset2, uUVScale2, uPointSize, uDispScale, uProgress }

  return init()

  function init() {
    initPlaneMesh()
    initPoints()
    return { o3d, uProgress, setTexture1, setTexture2, resize }
  }

  function initPlaneMesh() {
    const planeGeo = new PlaneGeometry(1, 1, 1, 1)
    const planeMat = new ShaderMaterial({
      transparent: true,
      depthTest: false,
      depthWrite: false,
      side: DoubleSide,
      uniforms: { uMap1, uMap2, uUVOffset1, uUVScale1, uUVOffset2, uUVScale2, uProgress },
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
        uniform vec2 uUVOffset1;
        uniform vec2 uUVScale1;
        uniform vec2 uUVOffset2;
        uniform vec2 uUVScale2;
        uniform float uProgress;
        varying vec2 vUv;
        void main() {
          vec4 tex1 = texture2D(uMap1, vUv * uUVScale1 + uUVOffset1);
          vec4 tex2 = texture2D(uMap2, vUv * uUVScale2 + uUVOffset2);
          float p1 = 1.0 - smoothstep(0.0, 0.05, uProgress);
          float p2 = smoothstep(0.95, 1.0, uProgress);
          gl_FragColor = (tex1 * p1) + (tex2 * p2);
        }
      `
    })
    planeMesh = new Mesh(planeGeo, planeMat)
    o3d.add(planeMesh)
  }

  function initPoints() {
    if (points1) points1.removeFromParent()
    if (points2) points2.removeFromParent()
    if (pointsGeometry) pointsGeometry.dispose()

    pointsGeometry = new BufferGeometry()

    const nx = Math.round(three.size.width / pointSize)
    const ny = Math.round(three.size.height / pointSize)
    const dx = three.size.wWidth / nx
    const dy = three.size.wHeight / ny
    const x0 = (-three.size.wWidth + dx) / 2
    const y0 = (-three.size.wHeight + dy) / 2

    const numPoints = nx * ny
    const positions = new Float32Array(numPoints * 3)
    const uvs = new Float32Array(numPoints * 2)

    const v2 = new Vector2()
    const v3 = new Vector3()
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < ny; j++) {
        v3.set(x0 + i * dx, y0 + j * dy, -0.1)
        v3.toArray(positions, (i + j * nx) * 3)
        v2.set((0.5 / nx) + i / nx, (0.5 / ny) + j / ny)
        v2.toArray(uvs, (i + j * nx) * 2)
      }
    }

    pointsGeometry.setAttribute('position', new BufferAttribute(positions, 3))
    pointsGeometry.setAttribute('uv', new BufferAttribute(uvs, 2))
    pointsGeometry.computeBoundingBox()

    if (!points1Material) {
      points1Material = new ShaderMaterial({
        transparent: true,
        // depthTest: false,
        // depthWrite: false,
        uniforms: { uMap1, uUVOffset1, uUVScale1, uDispScale, uPointSize, uProgress },
        vertexShader: `
          uniform sampler2D uMap1;
          uniform vec2 uUVOffset1;
          uniform vec2 uUVScale1;
          uniform vec4 uDispScale;
          uniform float uPointSize;
          uniform float uProgress;
          varying vec2 vUv1;
          void main() {
            vUv1 = uv * uUVScale1 + uUVOffset1;

            vec4 tex = texture2D(uMap1, vUv1);
            vec3 tPosition = vec3(position) + vec3(uDispScale.x * (tex.r - 0.5), uDispScale.y * (tex.g - 0.5), -uDispScale.z * (tex.b + 0.5) * 2.0) * uDispScale.w * uProgress;

            vec4 mvPosition = modelViewMatrix * vec4(tPosition, 1.0);
            gl_PointSize = uPointSize * (1.0 - uProgress);
            // gl_PointSize = uPointSize * (300.0 / -mvPosition.z) * (1.0 - uProgress);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform sampler2D uMap1;
          uniform float uProgress;
          varying vec2 vUv1;
          void main() {
            // if (!(uProgress>0.01)) discard;

            // float l = length(gl_PointCoord - vec2(0.5));
            // if (l>0.5) discard;

            vec4 tex = texture2D(uMap1, vUv1);
            // tex.a = 1.0 - smoothstep(0.9, 1.0, uProgress);
            tex.a = 1.0 - uProgress;
            gl_FragColor = tex;
          }
        `
      })
    }

    if (!points2Material) {
      points2Material = new ShaderMaterial({
        transparent: true,
        // depthTest: false,
        // depthWrite: false,
        uniforms: { uMap2, uUVOffset2, uUVScale2, uDispScale, uPointSize, uProgress },
        vertexShader: `
          uniform sampler2D uMap2;
          uniform vec2 uUVOffset2;
          uniform vec2 uUVScale2;
          uniform vec4 uDispScale;
          uniform float uPointSize;
          uniform float uProgress;
          varying vec2 vUv2;
          void main() {
            vUv2 = uv * uUVScale2 + uUVOffset2;

            vec4 tex = texture2D(uMap2, vUv2);
            vec3 tPosition = vec3(position) + vec3(uDispScale.x * (tex.r - 0.5), uDispScale.y * (tex.g - 0.5), uDispScale.z * (tex.b + 0.5) * 2.0) * uDispScale.w * (1.0 - uProgress);

            vec4 mvPosition = modelViewMatrix * vec4(tPosition, 1.0);
            gl_PointSize = uPointSize * uProgress;
            // gl_PointSize = uPointSize * (300.0 / -mvPosition.z) * uProgress;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform sampler2D uMap2;
          uniform float uProgress;
          varying vec2 vUv2;
          void main() {
            // if (!(uProgress<0.99)) discard;

            // float l = length(gl_PointCoord - vec2(0.5));
            // if (l>0.5) discard;

            vec4 tex = texture2D(uMap2, vUv2);
            // tex.a = smoothstep(0.0, 0.1, uProgress);
            tex.a = uProgress;
            gl_FragColor = tex;
          }
        `
      })
    }

    points1 = new Points(pointsGeometry, points1Material)
    o3d.add(points1)

    points2 = new Points(pointsGeometry, points2Material)
    o3d.add(points2)
  }

  // function getPointsMaterialParams(i) {
  //   return {
  //   }
  // }

  function setTexture1(src) { _setTexture(src, 1) }
  function setTexture2(src) { _setTexture(src, 2) }

  function _setTexture(src, i) {
    return new Promise((resolve, reject) => {
      const uMap = uniforms[`uMap${i}`]
      const uUVOffset = uniforms[`uUVOffset${i}`]
      const uUVScale = uniforms[`uUVScale${i}`]
      if (src === null || src instanceof Texture) {
        // if (uMap.value) { uMap.value.dispose() }
        uMap.value = src
        updateUV(uMap, uUVOffset, uUVScale)
        resolve()
      } else if (src instanceof String) {
        loader.load(src, (t) => {
          // fix "level 0 not power of 2" on safari (webgl 1)
          t.generateMipmaps = false
          t.wrapS = ClampToEdgeWrapping
          t.wrapT = ClampToEdgeWrapping
          t.minFilter = LinearFilter
          t.magFilter = LinearFilter

          uMap.value = t
          updateUV(uMap, uUVOffset, uUVScale)
          resolve(t)
        }, null, (e) => {
          updateUV(uMap, uUVOffset, uUVScale)
          reject(e)
        })
      } else {
        console.error('Invalid src param')
      }
    })
  }

  // function setSrc(src) {
  //   return new Promise((resolve, reject) => {
  //     if (!src) {
  //       switchMaps()
  //       updateUVs()
  //       resolve()
  //     } else {
  //       loader.load(src, (t) => {
  //         // fix "level 0 not power of 2" on safari (webgl 1)
  //         t.generateMipmaps = false
  //         t.wrapS = ClampToEdgeWrapping
  //         t.wrapT = ClampToEdgeWrapping
  //         t.minFilter = LinearFilter
  //         t.magFilter = LinearFilter

  //         switchMaps(t)
  //         updateUVs()
  //         resolve(t)
  //       }, null, (e) => {
  //         switchMaps()
  //         updateUVs()
  //         reject(e)
  //       })
  //     }
  //   })
  // }

  // function switchMaps(map) {
  //   // if (uMap2.value) { uMap2.value.image.pause?.() }
  //   if (uMap1.value) { uMap1.value.dispose() }
  //   uMap1.value = uMap2.value
  //   uMap2.value = map
  // }

  function resize(size) {
    planeMesh.scale.x = size.wWidth
    planeMesh.scale.y = size.wHeight
    initPoints()
    updateUVs()
  }

  function updateUVs() {
    updateUV(uMap1, uUVOffset1, uUVScale1)
    updateUV(uMap2, uUVOffset2, uUVScale2)
  }

  function updateUV(map, offset, scale) {
    if (!map.value) { return }
    // const ratio = planeMesh.scale.x / planeMesh.scale.y
    const ratio = three.size.ratio
    const width = map.value.image.videoWidth || map.value.image.width
    const height = map.value.image.videoHeight || map.value.image.height
    const iRatio = width / height
    offset.value.set(0, 0)
    scale.value.set(1, 1)
    if (iRatio > ratio) {
      scale.value.x = ratio / iRatio
      offset.value.x = (1 - scale.value.x) / 2
    } else {
      scale.value.y = iRatio / ratio
      offset.value.y = (1 - scale.value.y) / 2
    }
  }
}
