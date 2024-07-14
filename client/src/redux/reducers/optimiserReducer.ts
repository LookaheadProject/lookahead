import { v1 as uuid } from 'uuid';
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import { optimise as extOptimise, sortOptimsation, evaluate } from "optimiser";


const initialState = {
  optimising: false,
  reserved: [],
  timetables: null,
  currentView: 'generated',
  currentIndex: 0,
  currentCustomIndex: 0,
  failed: false,
  customTimetables: [
    /**
     * {
     *  id: unique uuid
     *  name: 'Name of Custom Timetable'
     *  timetable: [SubjectClass]
     * }
     */
  ],
};

export const optimiserSlice = createSlice({
  name: "optimiser",
  initialState,
  reducers: {
    addReservedEvent(state, action: PayloadAction<any>) {
      state.reserved = [...state.reserved, action.payload]
    },
    removeReservedEvent(state, action: PayloadAction<any>) {
      state.reserved = state.reserved.filter(e => e.start.valueOf() !== action.payload.start.valueOf())
    },
    changeToGeneratedView(state) {
      // regular timetable index
      if (state.currentIndex < 0 || state.currentIndex >= state.timetables.length) {
        state.currentIndex = 0;
      }
      state.currentView = "generated";
    },
    changeToCustomView(state, action: PayloadAction<any>) {
      const id = action.payload;
      let ctt_index = state.currentCustomIndex;
      if (id) {
        const match = state.customTimetables.find(val => val.id === id);
        if (match) {
          ctt_index = state.customTimetables.indexOf(match);
        }
      }
      if (ctt_index < 0 || ctt_index >= state.customTimetables.length) {
        ctt_index = 0;
      }

      state.currentCustomIndex = ctt_index;
      state.currentView = "custom";
    },
    createCustomTimetable(state, action: PayloadAction<{ name: any, timetable: any }>) {
      const newCustomTimetable = {
        id: uuid().split('-')[0],
        name: action.payload.name,
        timetable: action.payload.timetable,
      };
      state.customTimetables.push(newCustomTimetable);
      state.currentCustomIndex++;
    },
    updateTimetable(state, action: PayloadAction<{ index: any, timetable: any }>) {
      const updateIndex = action.payload.index;
      if (updateIndex >= 0 && updateIndex < state.timetables.length) {
        state.timetables[updateIndex] = action.payload.timetable;
      }
    },
    updateCustomTimetable(state, action: PayloadAction<{ id: any, name: any, timetable: any }>) {
      const customTTCopy = [...state.customTimetables];
      const customFound = customTTCopy.find(ctt => ctt.id === action.payload.id);
      if (!customFound) {
        return;
      }

      // Update timetable information
      customFound.name = action.payload.name;
      customFound.timetable = action.payload.timetable;

      state.customTimetables = customTTCopy;
    },
    nextTimetable(state) {
      if (state.currentIndex + 1 < state.timetables.length) {
        state.currentIndex++;
      }
    },
    previousTimetable(state) {
      if (state.currentIndex - 1 >= 0) {
        state.currentIndex--;
      }
    },
    optimise(state, action: PayloadAction<{ subjects: any, optimisations: any }>) {
      console.log("Input", action.payload.subjects, action.payload.optimisations)
      const timetables = extOptimise(action.payload.subjects, action.payload.optimisations, evaluate, sortOptimsation);

      console.log("Output timetables:", timetables);

      state.failed = false;
      state.optimising = false;
      state.currentIndex = 0;
      state.timetables = timetables;
    }
  }
});

export default optimiserSlice.reducer;