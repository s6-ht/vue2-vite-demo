const config = {
  test: ['/api/test', 'GET']
}

export const getApi = (api) => {
  return config[api]
}
