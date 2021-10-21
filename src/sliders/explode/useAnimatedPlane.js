import {
  DoubleSide,
  InstancedBufferAttribute,
  InstancedMesh,
  MathUtils,
  MeshBasicMaterial,
  Object3D,
  Vector2,
  Vector3
} from 'three'

import { Geometry, Face3 } from 'three/examples/jsm/deprecated/Geometry.js'

export default function({ three, size, anim, texture }) {
  let wSize, nx, ny, cx, cy, icount
  let geometry, material, imesh
  const o3d = new Object3D()
  const uProgress = { value: 0 }
  const uvScale = new Vector2()

  const obj = { o3d, uProgress, material, setTexture, resize }

  init()

  return obj

  function init() {
    initMaterial()
    initPlane()
  }

  function initMaterial() {
    obj.material = material = new MeshBasicMaterial({
      side: DoubleSide,
      transparent: true,
      map: texture,
      onBeforeCompile: shader => {
        shader.uniforms.progress = uProgress
        shader.uniforms.uvScale = { value: uvScale }
        shader.vertexShader = `
          uniform float progress;
          uniform vec2 uvScale;

          attribute vec3 offset;
          attribute vec3 rotation;
          attribute vec2 uvOffset;

          mat3 rotationMatrixXYZ(vec3 r)
          {
            float cx = cos(r.x);
            float sx = sin(r.x);
            float cy = cos(r.y);
            float sy = sin(r.y);
            float cz = cos(r.z);
            float sz = sin(r.z);

            return mat3(
                cy * cz, cx * sz + sx * sy * cz, sx * sz - cx * sy * cz,
              -cy * sz, cx * cz - sx * sy * sz, sx * cz + cx * sy * sz,
                    sy,               -sx * cy,                cx * cy
            );
          }
        ` + shader.vertexShader

        shader.vertexShader = shader.vertexShader.replace('#include <uv_vertex>', `
          #include <uv_vertex>
          vUv = vUv * uvScale + uvOffset;
        `)

        shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', `
          mat3 rotMat = rotationMatrixXYZ(progress * rotation);
          transformed = rotMat * transformed;

          vec4 mvPosition = vec4(transformed, 1.0);
          #ifdef USE_INSTANCING
            mvPosition = instanceMatrix * mvPosition;
          #endif

          mvPosition.xyz += progress * offset;

          mvPosition = modelViewMatrix * mvPosition;
          gl_Position = projectionMatrix * mvPosition;
        `)
      }
    })
  }

  function initPlane() {
    const { width, wWidth, wHeight } = three.size
    wSize = size * wWidth / width
    nx = Math.ceil(wWidth / wSize) + 1
    ny = Math.ceil(wHeight / wSize) + 1
    icount = nx * ny

    initGeometry()
    initUV()
    initAnimAttributes()

    if (imesh) {
      o3d.remove(imesh)
    }
    imesh = new InstancedMesh(geometry, material, icount)
    o3d.add(imesh)

    const dummy = new Object3D()
    let index = 0
    let x = -(wWidth - (wWidth - nx * wSize)) / 2 + cx
    for (let i = 0; i < nx; i++) {
      let y = -(wHeight - (wHeight - ny * wSize)) / 2 + cy
      for (let j = 0; j < ny; j++) {
        dummy.position.set(x, y, 0)
        dummy.updateMatrix()
        imesh.setMatrixAt(index++, dummy.matrix)
        y += wSize
      }
      x += wSize
    }
  }

  function initGeometry() {
    // square
    const geo = new Geometry()
    geo.vertices.push(new Vector3(0, 0, 0))
    geo.vertices.push(new Vector3(wSize, 0, 0))
    geo.vertices.push(new Vector3(0, wSize, 0))
    geo.vertices.push(new Vector3(wSize, wSize, 0))
    geo.faces.push(new Face3(0, 2, 1))
    geo.faces.push(new Face3(2, 3, 1))

    geo.faceVertexUvs[0].push([new Vector2(0, 0), new Vector2(0, 1), new Vector2(1, 0)])
    geo.faceVertexUvs[0].push([new Vector2(0, 1), new Vector2(1, 1), new Vector2(1, 0)])

    // geometry.computeFaceNormals();
    // geometry.computeVertexNormals();

    // center
    cx = wSize / 2
    cy = wSize / 2
    geo.translate(-cx, -cy, 0)

    geometry = geo.toBufferGeometry()
  }

  function initAnimAttributes() {
    const { randFloat: rnd, randFloatSpread: rndFS } = MathUtils
    const v3 = new Vector3()

    const offsets = new Float32Array(icount * 3)
    for (let i = 0; i < offsets.length; i += 3) {
      // if (anim === 1) v3.set(rndFS(10), rnd(50, 100), rnd(20, 50)).toArray(offsets, i)
      // else v3.set(rndFS(20), rndFS(20), rnd(20, 200)).toArray(offsets, i)
      v3.set(rndFS(20), rndFS(20), rnd(100, 200)).toArray(offsets, i)
    }
    geometry.setAttribute('offset', new InstancedBufferAttribute(offsets, 3))

    const rotations = new Float32Array(icount * 3)
    const angle = Math.PI * 4
    for (let i = 0; i < rotations.length; i += 3) {
      rotations[i] = rndFS(angle)
      rotations[i + 1] = rndFS(angle)
      rotations[i + 2] = rndFS(angle)
    }
    geometry.setAttribute('rotation', new InstancedBufferAttribute(rotations, 3))
  }

  function initUV() {
    const ratio = nx / ny
    const tRatio = texture.image.width / texture.image.height
    if (ratio > tRatio) uvScale.set(1 / nx, (tRatio / ratio) / ny)
    else uvScale.set((ratio / tRatio) / nx, 1 / ny)
    const nW = uvScale.x * nx
    const nH = uvScale.y * ny

    const v2 = new Vector2()
    const uvOffsets = new Float32Array(icount * 2)
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < ny; j++) {
        v2.set(
          uvScale.x * i + (1 - nW) / 2,
          uvScale.y * j + (1 - nH) / 2
        ).toArray(uvOffsets, (i * ny + j) * 2)
      }
    }
    geometry.setAttribute('uvOffset', new InstancedBufferAttribute(uvOffsets, 2))
  }

  function setTexture(texParam) {
    texture = texParam
    material.map = texture
    initUV()
  }

  function resize() {
    initPlane()
  }
}
