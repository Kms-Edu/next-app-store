import { createStore } from 'easy-peasy';

const initializeStore = ({initialReducer, initialState = {}}) => {
  const store = createStore(initialReducer, {
    config: {
      initialState
    }
  })
  // Return the modified store
  return store
}

export default initializeStore
