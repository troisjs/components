import { Text } from 'troika-three-text'
import { Object3D } from 'troisjs'

export default {
  extends: Object3D,
  created() {
    this.text = new Text()
  },
  mounted() {
    // this.text.sync()
    this.initObject3D(this.text)
  },
  unmounted() {
    this.text.dispose()
  }
}
