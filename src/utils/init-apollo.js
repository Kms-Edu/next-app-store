import ApolloClient from 'apollo-client';
import { createHttpLink } from 'apollo-link-http'
import { setContext } from 'apollo-link-context'
import fetch from 'isomorphic-unfetch'
import { ApolloLink, split } from 'apollo-link'
import { WebSocketLink } from 'apollo-link-ws'
import { onError } from 'apollo-link-error';
import { getMainDefinition } from 'apollo-utilities'
import { createSubscriptionClient } from './create-subscription-client'
import { InMemoryCache } from 'apollo-cache-inmemory'

const isSubscriptionOperation = ({ query }) => {
  const { kind, operation } = getMainDefinition(query);
  return kind === 'OperationDefinition' && operation === 'subscription';
};

const isMutationOperation = ({ query }) => {
  const { kind, operation } = getMainDefinition(query);
  return kind === 'OperationDefinition' && operation === 'mutation';
};
//const GRAPHQL_URL=`https://api-qdhhebsjkn.now.sh`
//const WS_URL=`wss://api-qdhhebsjkn.now.sh`
//const GRAPHQL_URL= process.env.NODE_ENV === 'production' ? `https://${SERVER_URL}/graphql` : `http://localhost:3000/graphql`
//const WS_URL = process.env.NODE_ENV === 'production' ? `wss://${SERVER_URL}/subscriptions` :`ws://localhost:3000/subscriptions`

let apolloClient = {}
let wsLinks = {}

// Polyfill fetch() on the server (used by apollo-client)
if (!process.browser) {
  global.fetch = fetch
}

function create ({name, graphqlHost, reduxStore, apolloState}) {
  const QUERY_URL = `https://${graphqlHost}`
  const SUBSCRIPTION_URL = `wss://${graphqlHost}`
  const MUTATION_URL = QUERY_URL

  const ssrMode = !process.browser

  let link = createHttpLink({
    uri: QUERY_URL,
    credentials: 'include',
  })

  const contextLink = setContext(
    async () => {
      let headers = {}
      //const token = localStorage.getItem('token');
      if (reduxStore && reduxStore.dispatch.auth && typeof(reduxStore.dispatch.auth.getHeaders === 'function')) {
        headers = await reduxStore.dispatch.auth.getHeaders()  
      }
      return {headers}
    }
  )

  const errorLink = onError(
    ({ graphQLErrors, networkError }) => {
      if (graphQLErrors) {
        graphQLErrors.map(err => {
          //console.log(err.message)
          reduxStore.dispatch.error.setError(err.message)
        })
      }
      if (networkError) {
        //console.log(networkError)
        reduxStore.dispatch.error.setError(networkError)
      }
    }
  )
  

  link = ApolloLink.from([errorLink, contextLink, link])

  if (!ssrMode) {
    const mutationLink = createHttpLink({
      uri: MUTATION_URL,
    })
    const contextMutationLink = ApolloLink.from([errorLink, contextLink, mutationLink])
    
    link = split(
      isMutationOperation,
      contextMutationLink,
      link,
    )

    wsLinks[name] = wsLinks[name] ? wsLinks[name] : new WebSocketLink(
      createSubscriptionClient({
        wsUrl: SUBSCRIPTION_URL,
        reduxStore,
      })
    )
    const subscriptionLink = ApolloLink.from([errorLink, wsLinks[name]])
        
    // using the ability to split links, you can send data to each link
    // depending on what kind of operation is being sent
    link = split(
      isSubscriptionOperation,
      subscriptionLink,
      link,
    )
/*
    const uploadLink = createUploadLink({ 
      uri: GRAPHQL_URL,
      credentials: 'same-origin',
    });

    const uploadLinkWithContext = ApolloLink.from([
      errorLink, contextLink, uploadLink
    ])

    link = split(
      isUpload, uploadLinkWithContext, link
    )
*/
  }
  // Check out https://github.com/zeit/next.js/pull/4611 if you want to use the AWSAppSyncClient
  let client = new ApolloClient({
    connectToDevTools: process.browser,
    ssrMode: true, // Disables forceFetch on the server (so queries are only run once)
    link: link,
    cache: new InMemoryCache().restore(apolloState || {}),
    shouldBatch: true,
  })
  if (process.browser) {
    client.restartWebsocketConnection = () => {
      if (wsLinks[name]) {        
        wsLinks[name].subscriptionClient.connectionParams = async () => {
          let headers = {}
          //const token = localStorage.getItem('token');
          if (reduxStore && reduxStore.dispatch.auth && typeof(reduxStore.dispatch.auth.getHeaders === 'function')) {
            headers = await reduxStore.dispatch.auth.getHeaders()  
          }
          return {headers}
        }
        wsLinks[name].subscriptionClient.tryReconnect();
      }
    };    
  }
  return client
}

export default function initApollo (options) {
  const {name} = options
  // Make sure to create a new client for every server-side request so that data
  // isn't shared between connections (which would be bad)
  if (!process.browser) {
    return create(options)
  }

  // Reuse client on the client-side
  if (!apolloClient[name]) {
    apolloClient[name] = create(options)
  }

  return apolloClient[name]
}
