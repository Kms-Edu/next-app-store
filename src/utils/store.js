import { createStore } from 'easy-peasy';
const defaultReducer = {
  websocket: {
    status: null,
    setStatus: (state, payload) => {
      state.status = payload
    }
  },
  i18n: {
    language: 'en',
    setLanguage: (state, payload) => {
      state.language = payload
    }
  }
}
const initializeStore = ({initialReducer, initialState = {}}) => {
  const store = createStore({
    ...initialReducer,
    ...defaultReducer,
  }, {
    config: {
      initialState
    }
  })
  // Return the modified store
  return store
}

export default initializeStore
