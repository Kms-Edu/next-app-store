const getHeaders = (token, role = "user") => {
  let headers = {}
  if (token) {
    headers = {
      'Authorization': `Bearer ${token}`,
      'X-Hasura-Role': role
    }
  }    
  return {headers}
}

export default getHeaders
