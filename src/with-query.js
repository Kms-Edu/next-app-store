import React from 'react'
import withApollo from './with-apollo'
import Query from './query'

const withQuery = ({apollo, query, subscription, ...rest}) => Component => {
  return withApollo(apollo)(() => {
    return (
      <Query
        query={query}
        subscription={subscription}
        {...rest}>
      {
        ({...restProps}) => <Component {...restProps} />
      }
    </Query>
    )
  })
}
export default withQuery
