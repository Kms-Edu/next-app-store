import { ApolloProvider } from 'react-apollo';
export const withApollo = (key) => (Component) => {
  return function WrapperComponent({apolloClients, ...rest}) {
    return (
      <ApolloProvider client={apolloClients[key]}>
        <Component {...rest} />
      </ApolloProvider>
    );
  };
}
export default withApollo
