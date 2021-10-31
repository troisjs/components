import { defineComponent } from 'vue'
import { Vector3 } from 'three'
import { Sphere } from 'troisjs'
import { makeNoise4D } from 'fast-simplex-noise'

const noise = makeNoise4D()

export default defineComponent({
  extends: Sphere,
  props: {
    widthSegments: { type: Number, default: 64 },
    heightSegments: { type: Number, default: 64 },
    timeCoef: { type: Number, default: 0.0005 },
    noiseCoef: { type: Number, default: 1 },
    displacementScale: { type: Number, default: 0.2 }
  },
  mounted() {
    this.init()
    this.renderer.onBeforeRender(this.update)
  },
  unmounted() {
    this.renderer.offBeforeRender(this.update)
  },
  methods: {
    init() {
      this.pArray = this.geometry.attributes.position.array.slice()
    },
    update({ time }) {
      const position = this.geometry.attributes.position.array
      const v3 = new Vector3()
      for (let i = 0; i < position.length; i += 3) {
        v3.fromArray(this.pArray, i)
        const n = noise(v3.x * this.noiseCoef, v3.y * this.noiseCoef, v3.z * this.noiseCoef, time * this.timeCoef)
        v3.multiplyScalar(1 + n * this.displacementScale)
        v3.toArray(position, i)
      }
      this.geometry.attributes.position.needsUpdate = true

      this.geometry.computeVertexNormals()
      // this.geometry.normalizeNormals()
    }
  },
  __hmrId: 'NoisySphere'
})
