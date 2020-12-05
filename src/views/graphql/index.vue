<template>
  <section>graphql</section>
</template>

<script>
import { getGoodInfo, addGoods } from './data'
export default {
  data () {
    return {
      infoId: 2
    }
  },
  created () {
    this.addGoods()
    this.getGoodInfo()
  },
  methods: {
    getGoodInfo () {
      getGoodInfo({ infoId: this.infoId }).then(res => {
        console.error(res);
      })
    },
    addGoods () {
      const params = {
        infoId: 5,
        title: '这是一件很漂亮的衣服5',
        content: '～～～',
        special: '---',
        price: 66,
        image: '999'
      }
      addGoods(params).then(res => {
        console.error(res);
      })
    }
  }
}
</script>
