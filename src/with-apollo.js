import React from 'react'
import { ApolloProvider } from 'react-apollo';
import PageContext from './context'

export const withApollo = (key) => (Component) => {
  return function WrapperComponent({...rest}) {
    return (
      <PageContext.Consumer>
        {({apolloClients}) => {
          return (
            <ApolloProvider client={apolloClients[key]}>
              <Component {...rest} />
            </ApolloProvider>
          )
        }}
      </PageContext.Consumer>      
    );
  };
}
export default withApollo
