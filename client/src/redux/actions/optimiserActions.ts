// re-exporting the actions from the slice
import { optimiserSlice } from 'redux/reducers/optimiserReducer';
export const {
	nextTimetable,
	previousTimetable,
	createCustomTimetable,
	updateCustomTimetable,
	updateTimetable,
	changeToGeneratedView,
	changeToCustomView,
	addReservedEvent,
	removeReservedEvent,
	optimise
} = optimiserSlice.actions;