import { UPDATE_EVENTS } from "../actionTypes";

const initialState = { allEvents: [], regularEvents: [], backgroundEvents: [] };

export default (state = initialState, action) => {
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
