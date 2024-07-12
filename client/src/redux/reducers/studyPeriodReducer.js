import {
  FETCH_STUDY_PERIOD_BEGIN,
  FETCH_STUDY_PERIOD_SUCCESS,
  FETCH_STUDY_PERIOD_FAILURE,
} from '../actionTypes';

const initialState = {
  loading: false,
  error: null,
  lists: [],
};

export default (state = initialState, action) => {
  switch (action.type) {
    case FETCH_STUDY_PERIOD_BEGIN:
      return {...state, loading: true, error: null};

    case FETCH_STUDY_PERIOD_SUCCESS: {
      const list = action.payload.list;
      const studyPeriodOptions = list.map(x => {
        return {label: x, value: x};
      });
      console.log('List', studyPeriodOptions);

      return {
        ...state,
        loading: false,
        lists: studyPeriodOptions,
      };
    }
    case FETCH_STUDY_PERIOD_FAILURE:
      return {...state, loading: false, error: action.payload.error};
    default:
      return state;
  }
};
