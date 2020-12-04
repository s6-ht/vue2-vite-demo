// graphql-tag 用来将string转化为graphql的AST
import gql from 'graphql-tag'
import apolloClient from '@/utils/apollo-boost'

export function getGoodsList(params) {
  return apolloClient.query({
    query: gql`query ($first: ID) {
      goodsList(first: $first) {
        id
        title
        content
        author {
          name
          age
        }
      }
    }`,
    variables: params
  })
}

export function createGoods(params) {
  return apolloClient.mutate({
    mutation: gql`mutation ($title: String, $content: String, $author: AddAuthor) {
      addGoods(title: $title, content: $content, author: $author) {
        id
        title
        content
        author {
          age
          name
        }
      }
    }`,
    variables: param
  })
}


