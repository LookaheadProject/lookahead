import type { IPreferences, Time, Times, Day } from 'optimiser';

import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from '@reduxjs/toolkit';

/*

 export interface IPreferences {
  timeRestriction: Times;
  avoidDays: number[];
  minimiseClashes: boolean;
  skipLectures: boolean;
  minimiseDaysOnCampus: boolean;
  allocateBreaks: boolean;
  minimiseBreaks: boolean;
}
*/
const initialState: IPreferences = {
  timeRestriction: { start: { hour: 8, minute: 0 }, end: { hour: 22, minute: 0 } },
  avoidDays: [],
  minimiseClashes: true,
  skipLectures: false,
  minimiseDaysOnCampus: false,
  allocateBreaks: false,
  minimiseBreaks: false,
};
export const defaultPreferences = initialState;

export const optimisationsSlice = createSlice({
  name: "optimisations",
  initialState,
  reducers: {
    updatePreferences(state, action: PayloadAction<Partial<IPreferences>>) {
      const newState = {
        ...state,
        ...action.payload
      }
      console.log("State change:", newState);

      // save to localStorage
      localStorage.setItem("preferences", JSON.stringify(newState));
      console.log("Saved to Local Storace")

      return newState;
    }
  }
})

export default optimisationsSlice.reducer;
// actions will be re-exported by ../actions/optimisationsActions.ts