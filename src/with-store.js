import React from 'react'
import { Provider } from 'react-redux'; // 👈 import the provider
import { I18nProvider } from '@lingui/react'
import initializeStore from './utils/store'
import initApollo from './utils/init-apollo'
import MobileDetect from 'mobile-detect'
import PageContext from './context'
import Cookies from 'universal-cookie'

const getShareConfig = async (ctx) => {
  const {req} = ctx
  let isMobile = null
  if (req) {
    const md = new MobileDetect(req.headers['user-agent']);
    isMobile = md.mobile()
  } else {
    isMobile = window.__NEXT_DATA__.props.isMobile
  }
  ctx.isMobile = isMobile

  const fetchPolicy = req ? 'network-only' : 'cache-first'
  ctx.fetchPolicy = fetchPolicy

  return {
    isMobile,
    fetchPolicy,
  }
}
function log(str, dev = process.env.NODE_ENV !== 'production') {
  if (dev) {
    const {inspect} = require('util')
    console.log(inspect(str))
  }
}

function objectMap(object, mapFn) {
  return Object.keys(object).reduce(function(result, key) {
      result[key] = mapFn(key, object[key])
      return result
  }, {})
}
const isServer = !process.browser

function getOrCreateStore ({initialReducer, initialReduxState}, path) {
  // Always make a new store if server, otherwise state is shared between requests
  if (isServer) {
    return initializeStore({initialReducer, initialState: initialReduxState})
  }
  // Create store if unavailable on the client and set it on the window object
  if (!window[path]) {
    log(window[path])
    window[path] = initializeStore({initialReducer, initialState: initialReduxState})
    log(window[path])
  }
  return window[path]
}
const withAppStore = Page => {
  return class extends React.Component {
    static async getInitialProps(ctx) {    
      const {req} = ctx        
      const {isMobile} = await getShareConfig(ctx)
      let reduxStore = null
      let apolloClients = null
      let reduxStorePath = null
      let items = null
      let catalogs_ = null
      let language_ = null
      let cookieStr = req ? req.headers.cookie : ''
      const cookies = req ? new Cookies(cookieStr) : new Cookies()
      ctx.cookies = cookies

      if (Page.getInitialConfig) {
        const {redux, apollo, catalogs, language} = await Page.getInitialConfig(ctx)
        catalogs_ = catalogs
        language_ = language
        reduxStorePath = redux
        

        if (redux) {
          log('starting getInitialStore')

          const initialReducer = Page.getInitialStore(ctx)
          reduxStore = getOrCreateStore({initialReducer}, redux)
          ctx.reduxStore = reduxStore
          log('ending getInitialStore')
        }

        if (apollo) {
          log('starting getInitialApolloClients')
          apolloClients = objectMap(apollo, (key, value) => {
            return {
              client: initApollo({name: key, graphqlHost: value, reduxStore, apolloState: null, cookies}),
              graphqlHost: value,
              name: key,
            }
          })

          //const fetchPolicy = req ? { fetchPolicy: 'network-only' } : { fetchPolicy: 'cache-first' }
          ctx.apolloClients = objectMap(apolloClients, (key, item) => item.client)
          log('ending getInitialApolloClients')
          if (Page.getInitialApolloState) {
            await Page.getInitialApolloState(ctx)
          }

          items = objectMap(apolloClients, (key, item) => {
            return {
              name: item.name,
              graphqlHost: item.graphqlHost,
              apolloState: item.client.cache.extract()
            }
          })
        }
      }
            
      return { 
        language: language_,
        catalogs: catalogs_,
        initialReduxState: reduxStore ? reduxStore.getState() : null,
        items,
        isMobile,
        reduxStorePath,
        cookieStr,
      }
    }
    constructor(props) {
      super(props)
      let ctx = {}

      const {catalogs, language, items, initialReduxState, reduxStorePath, cookieStr} = props

      ctx.cookies =  isServer ? new Cookies(cookieStr) : new Cookies()
      this.catalogs = catalogs
      this.language = language
      this.reduxStore = null
      this.apolloClients = null

      if (initialReduxState) {
        const initialReducer = Page.getInitialStore(ctx)
        this.reduxStore = getOrCreateStore({initialReducer, initialReduxState}, reduxStorePath)
      }

      if (items) {
        this.apolloClients = objectMap(items, (key, item) => {
          return initApollo({name: item.name, graphqlHost: item.graphqlHost, reduxStore: this.reduxStore, apolloState: item.apolloState, cookies: ctx.cookies})
        })
      }
    }
    render() {
      const props = this.props
      const apolloClients = this.apolloClients
      const reduxStore = this.reduxStore
      const catalogs = this.catalogs
      const language = this.language

      if (apolloClients && reduxStore) {
        if (language && catalogs) {
          return (
            <I18nProvider language={language} catalogs={catalogs}>
              <Provider store={reduxStore}>
                <PageContext.Provider value={{
                  apolloClients
                }}>
                  <Page {...props} apolloClients={apolloClients} />
                </PageContext.Provider>
              </Provider>
            </I18nProvider>
          )
        } else {
          return (
            <Provider store={reduxStore}>
              <PageContext.Provider value={{
                apolloClients
              }}>
                <Page {...props} apolloClients={apolloClients} />
              </PageContext.Provider>
            </Provider>
          )
        }
        
      } else if (apolloClients) {
        if (language && catalogs) {
          return (          
            <I18nProvider language={language} catalogs={catalogs}>
              <PageContext.Provider value={{
                apolloClients
              }}>
                <Page {...props} apolloClients={apolloClients} />
              </PageContext.Provider>
            </I18nProvider>
          )
        } else {
          return <Page {...props} apolloClients={apolloClients} />
        }
      } else if (reduxStore) {
        if (language && catalogs) {
          return (
            <I18nProvider language={language} catalogs={catalogs}>
              <Provider store={reduxStore}>
                <Page {...props} />
              </Provider>
            </I18nProvider>
          )
        } else {
          return (
            <Provider store={reduxStore}>
              <Page {...props} />
            </Provider>
          )
        }
      } else {
        if (language && catalogs) {
          return (
            <I18nProvider language={language} catalogs={catalogs}>
              <Page {...props} />
            </I18nProvider>
          )
        } else {
          return <Page {...props} />
        }
      }
    }
  }  
}
  
export default withAppStore
