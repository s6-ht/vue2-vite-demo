<template>
  <div class="graphql-wrap"></div>
</template>

<script>
import { getArticleList, createArticle } from './data'
export default {
  name: 'GraphqlDemo',
  data() {
    return {
      formData: {}
    }
  },
  created() {
    this.getArticleList()
  },
  methods: {
    getArticleList() {
      getArticleList({ first: 0 }).then(res => {
        console.error(res, 'getArticleList')
      })
    },
    createArticle() {
      createArticle(this.formData).then(res => {
        console.error(res, 'createArticle')
      })
    }
  }
}
</script>
