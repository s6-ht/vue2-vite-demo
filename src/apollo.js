import ApolloClient from 'apollo-boost'

const apolloClient = new ApolloClient({
  // 你需要在这里使用绝对路径
  uri: 'http://127.0.0.1:7001/graphql'
})

export default apolloClient

