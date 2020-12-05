// graphql-tag 用来将string转化为graphql的AST
import gql from 'graphql-tag'
import apolloClient from '@/apollo'

export function getGoodInfo(params) {
  return apolloClient.query({
    query: gql`query ($infoId: Int!) {
      goods(infoId: $infoId) {
        title
        content
        price
        image
      }
    }`,
    variables: params
  })
}

export function addGoods(params) {
  return apolloClient.mutate({
    mutation: gql`mutation ($infoId: Int!, $title: String!, $content: String!, $special: String! $price: Int!, $image: String!) {
      addGoods(infoId: $infoId, title: $title, content: $content, special: $special, price: $price, image: $image ) {
        message
      }
    }`,
    variables: params
  })
}