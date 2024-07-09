import {
  FETCH_STUDY_PERIOD_BEGIN,
  FETCH_STUDY_PERIOD_SUCCESS,
  FETCH_STUDY_PERIOD_FAILURE,
} from '../actionTypes';

import axios from 'axios';

export const fetchStudyPeriodBegin = () => ({
  type: FETCH_STUDY_PERIOD_BEGIN,
});

export const fetchStudyPeriodSuccess = list => ({
  type: FETCH_STUDY_PERIOD_SUCCESS,
  payload: {list},
});

export const fetchStudyPeriodFailure = error => ({
  type: FETCH_STUDY_PERIOD_FAILURE,
  payload: {error},
});

export const fetchStudyPeriod = () => {
  return dispatch => {
    dispatch(fetchStudyPeriodBegin());
    const listURL = '/availablePeriods';
    return axios
      .get(listURL)
      .then(res => dispatch(fetchStudyPeriodSuccess(res.data)))
      .catch(err => dispatch(fetchStudyPeriodFailure(err)));
  };
};
