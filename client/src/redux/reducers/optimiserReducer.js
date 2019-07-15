import {
  BEGIN_OPTIMISATION,
  COMPLETE_OPTIMISATION,
  NEXT_TIMETABLE,
  PREVIOUS_TIMETABLE,
  CREATE_CUSTOM_TIMETABLE,
  UPDATE_CUSTOM_TIMETABLE,
  VIEW_GENERATED_TIMETABLES,
  VIEW_CUSTOM_TIMETABLES,
  UPDATE_TIMETABLE
} from "../actionTypes";
import uuid from "uuid/v1";

const initialState = {
  optimising: false,
  timetables: null,
  currentView: "generated",
  currentIndex: 0,
  currentCustomIndex: 0,
  customTimetables: [
    /**
     * {
     *  id: unique uuid
     *  name: 'Name of Custom Timetable'
     *  timetable: [SubjectClass]
     * }
     */
  ]
};

export default (state = initialState, action) => {
  switch (action.type) {
    case VIEW_GENERATED_TIMETABLES:
      // Regular timetable index
      let tt_index = state.currentIndex;
      if (tt_index < 0 || tt_index >= state.timetables.length) {
        tt_index = 0;
      }
      return { ...state, currentView: "generated", currentIndex: tt_index };
    case VIEW_CUSTOM_TIMETABLES:
      // Custom timetable index
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
      return {
        ...state,
        currentView: "custom",
        currentCustomIndex: ctt_index
      };
    case CREATE_CUSTOM_TIMETABLE:
      const newCustomTimetable = {
        id: uuid().split("-")[0],
        name: action.payload.name,
        timetable: action.payload.timetable
      };
      return {
        ...state,
        customTimetables: [...state.customTimetables, newCustomTimetable],
        currentCustomIndex: state.currentCustomIndex + 1
      };
    case UPDATE_TIMETABLE:
      const updateIndex = action.payload.index;
      const allTimetables = [...state.timetables];
      if (updateIndex >= 0 && updateIndex < allTimetables.length) {
        allTimetables[updateIndex] = action.payload.timetable;
      }
      return { ...state, timetables: allTimetables };
    case UPDATE_CUSTOM_TIMETABLE:
      const customTTCopy = [...state.customTimetables];
      const customFound = customTTCopy.find(
        ctt => ctt.id === action.payload.id
      );
      if (!customFound) {
        return state;
      } else {
        // Update timetable information
        customFound.name = action.payload.name;
        customFound.timetable = action.payload.timetable;
      }
      return { ...state, customTimetables: customTTCopy };
    case NEXT_TIMETABLE:
      if (state.currentIndex + 1 < state.timetables.length) {
        return { ...state, currentIndex: state.currentIndex + 1 };
      }
      return state;
    case PREVIOUS_TIMETABLE:
      if (state.currentIndex - 1 >= 0) {
        return { ...state, currentIndex: state.currentIndex - 1 };
      }
      return state;
    case BEGIN_OPTIMISATION:
      return { ...state, optimising: true };
    case COMPLETE_OPTIMISATION:
      const { timetables } = action.payload;
      console.log(timetables.length + " timetables generated.");
      return {
        ...state,
        optimising: false,
        currentIndex: 0,
        timetables
      };

    default:
      return state;
  }
};
