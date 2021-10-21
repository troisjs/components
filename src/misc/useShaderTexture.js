import { Mesh, OrthographicCamera, PlaneBufferGeometry, ShaderMaterial, WebGLRenderTarget } from 'three'

const defaultVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`

export default function({ three, size, fragmentShader }) {
  const rt = new WebGLRenderTarget(size.x, size.y, { depthBuffer: false })

  const material = new ShaderMaterial({
    vertexShader: defaultVertexShader,
    fragmentShader
  })

  const quad = useFullScreenQuad(material)

  return { texture: rt.texture, render, resize, dispose }

  function render() {
    quad.render(three.renderer, rt, material)
  }

  function resize(w, h) {
    rt.setSize(w, h)
  }

  function dispose() {
    rt.dispose()
  }
}

function useFullScreenQuad() {
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const geometry = new PlaneBufferGeometry(2, 2)
  const mesh = new Mesh(geometry)

  return { render }

  function render(renderer, target, material) {
    const oldTarget = renderer.getRenderTarget()
    renderer.setRenderTarget(target)
    mesh.material = material
    renderer.render(mesh, camera)
    renderer.setRenderTarget(oldTarget)
  }
}
