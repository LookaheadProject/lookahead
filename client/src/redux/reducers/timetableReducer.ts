import { UPDATE_EVENTS } from "../actionTypes";
import type { EventApi } from "@fullcalendar/core";

import type { Reducer } from "redux";
import type { UnknownAction } from "@reduxjs/toolkit";

export interface TimetableState {
	allEvents: EventApi[],
	regularEvents: EventApi[],
	backgroundEvents: EventApi[]
}
const initialState: TimetableState = { allEvents: [], regularEvents: [], backgroundEvents: [] };

const reducer: Reducer<TimetableState, UnknownAction> = (state = initialState, action: any) => {
	switch (action.type) {
		case UPDATE_EVENTS: {
			const allEvents = action.payload;
			const newState = {
				...state,
				allEvents,
				regularEvents: allEvents.filter(
					(event) => event.rendering !== "background",
				),
				backgroundEvents: allEvents.filter(
					(event) => event.rendering === "background",
				),
			};
			console.log("newEvents", newState);
			return newState;
		}
		default:
			return state;
	}
};
export default reducer;
