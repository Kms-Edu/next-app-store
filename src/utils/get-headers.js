const getHeaders = (token) => {
  let headers = {}
  if (token) {
    headers = {
      'Authorization': `Bearer ${token}`
    }
  }    
  return {headers}
}

export default getHeaders
