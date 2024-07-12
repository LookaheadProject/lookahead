import { createStore, applyMiddleware } from 'redux';
import rootReducer from './reducers';
import thunk from 'redux-thunk';
import LogRocket from 'logrocket';
import { composeWithDevTools } from 'redux-devtools-extension';

const store = createStore(
  rootReducer,
  composeWithDevTools(
    // other store enhancers if any
    applyMiddleware(thunk, LogRocket.reduxMiddleware())
  )
);
export default store;

// Get the type of our store variable
export type AppStore = typeof store
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>
// Infer type of the dispatch
export type AppDispatch = AppStore['dispatch']
