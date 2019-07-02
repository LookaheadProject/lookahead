import {
  GET_SUBJECT_BEGIN,
  REMOVE_SUBJECT,
  GET_SUBJECT_SUCCESS,
  GET_SUBJECT_FAILURE
} from "../actionTypes";

const initialState = {};

export default (state = initialState, action) => {
  switch (action.type) {
    case GET_SUBJECT_BEGIN:
      const { code, name } = action.payload;
      // code: "SWEN30006"
      // label: "SWEN30006 - Software Modelling and Design"
      // value: "Software Modelling and Design"
      // Check if the subject has already been added
      if (state[code]) {
        return state;
      }
      return {
        ...state,
        [code]: { name, data: null, error: null, loading: true }
      };
    case GET_SUBJECT_SUCCESS:
      // If the subject entry doesnt exist at all, it's probably been removed
      if (!state[action.payload.code]) {
        return state;
      }
      // Otherwise, update the subject entry
      return {
        ...state,
        [action.payload.code]: {
          ...state[action.payload.code],
          data: action.payload.classInfo,
          loading: false
        }
      };
    case GET_SUBJECT_FAILURE:
      // Update error, remove data, stop loading
      return {
        ...state,
        [action.payload.code]: {
          ...state[action.payload.code],
          data: null,
          error: action.payload.error,
          loading: false
        }
      };
    case REMOVE_SUBJECT:
      // Remove subject from state
      const { [action.payload.code]: value, ...newState } = state;
      return newState;
    default:
      return state;
  }
};