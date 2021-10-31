import { ref, watch } from 'vue'
import { Color, CubeTexture, DoubleSide, Mesh, MeshPhysicalMaterial, PlaneGeometry } from 'three'
import { applyObjectProps, Object3D } from 'troisjs'
import LiquidEffect from './LiquidEffect.js'

export default {
  extends: Object3D,
  props: {
    width: { type: Number, default: 10 },
    height: { type: Number, default: 10 },
    widthSegments: { type: Number, default: 256 },
    heightSegments: { type: Number, default: 256 },
    materialProps: {
      type: Object,
      default: () => ({
        color: '#ffffff',
        metalness: 0.75,
        roughness: 0.25,
        thickness: 1,
        transmission: 1,
        displacementScale: 2,
        envMap: { type: CubeTexture, default: null }
      })
    }
  },
  mounted() {
    this.liquidEffect = new LiquidEffect(this.renderer.renderer)
    this.renderer.onMounted(() => {
      this.liquidEffect.renderer = this.renderer.renderer
      this.togglePlay()
    })

    const hscale = { value: this.materialProps.displacementScale }
    this.material = new MeshPhysicalMaterial({
      ...this.materialProps,
      transparent: true,
      side: DoubleSide,
      onBeforeCompile: shader => {
        // console.log(shader.vertexShader)
        shader.uniforms.hmap = { value: this.liquidEffect.hMap.texture }
        // shader.uniforms.nmap = { value: this.liquidEffect.normalMap.texture }
        shader.uniforms.hscale = hscale
        shader.vertexShader = `
          uniform sampler2D hmap;
          // uniform sampler2D nmap;
          uniform float hscale;
        ` + shader.vertexShader
        const token = '#include <begin_vertex>'
        const customTransform = `
          vec3 transformed = vec3(position);
          vec4 info = texture2D(hmap, uv);

          // vec4 ninfo = texture2D(nmap, uv);
          // vNormal = normalMatrix * ninfo.xyz;

          // vNormal = normalMatrix * vec3(info.b, info.a, sqrt(1.0 - dot(info.ba, info.ba)));
          transformedNormal = normalMatrix * vec3(info.b, info.a, sqrt(1.0 - dot(info.ba, info.ba)));
          vNormal = transformedNormal;
          transformed.z = hscale * info.r;
        `
        shader.vertexShader = shader.vertexShader.replace(token, customTransform)
      }
    })
    bindObjectProps(this.materialProps, this.material, false, this.setMaterialProp)
    watch(() => this.materialProps.displacementScale, (value) => { hscale.value = value })

    this.geometry = new PlaneGeometry(this.width, this.height, this.widthSegments, this.heightSegments)
    this.mesh = new Mesh(this.geometry, this.material)
    this.initObject3D(this.mesh)
  },
  unmounted() {
    this.renderer.offBeforeRender(this.update)
  },
  methods: {
    setMaterialProp(material, key, value, needsUpdate = false) {
      // console.log(material, key, value)
      const dstVal = material[key]
      if (dstVal instanceof Color) dstVal.set(value)
      else material[key] = value
      material.needsUpdate = needsUpdate
    },
    togglePlay() {
      if (!this.isPlaying) {
        this.isPlaying = true
        this.renderer.onBeforeRender(this.update)
      } else {
        this.isPlaying = false
        this.renderer.offBeforeRender(this.update)
      }
    },
    update() {
      this.liquidEffect.update()
    }
  }
}

function bindObjectProps(
  src,
  dst,
  apply = true,
  setter = (dst, key, value) => { dst[key] = value }
) {
  if (apply) applyObjectProps(dst, src, setter)
  const r = ref(src)
  return watch(r, (value) => { applyObjectProps(dst, value, setter) }, { deep: true })
}
