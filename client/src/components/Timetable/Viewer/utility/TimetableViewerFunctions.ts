import moment from "moment";
import $ from "jquery";
import store from "../../../../redux/store";
import {
	createCustomTimetable,
	changeToCustomView,
	// updateCustomTimetable,
	updateTimetable,
	addReservedEvent,
	removeReservedEvent,
} from "../../../../redux/actions/optimiserActions";
import Timetable from "../../../../optimiser/Timetable";

import type { ProcessedSubject } from "redux/reducers/subjectReducer";
import type { ISubject, Time, Day } from "optimiser";
import { Days } from "optimiser";
import type { EventApi } from "@fullcalendar/core";

type Allocation = { lot: number, index: number };

export const getSubjects = () => {
	return store.getState().subjects;
};

export const getBackgroundEvents = () => {
	return store.getState().timetable.backgroundEvents;
};

export const getRegularEvents = () => {
	return store.getState().timetable.regularEvents;
};

const getCurrentTheme = () => {
	return store.getState().theme;
};

const getCurrentTimetable = () => {
	const { timetables, currentIndex } = store.getState().optimiser;
	return { currentIndex, timetable: timetables[currentIndex] };
};

export const getCurrentCustomTimetable = () => {
	const {
		customTimetables,
		currentCustomIndex,
		currentView,
		timetables,
		currentIndex,
	} = store.getState().optimiser;
	const timetable = customTimetables[currentCustomIndex];
	if (!timetable || currentView !== "custom") {
		console.log(
			"The current custom timetable does not exist... create a new one!",
		);
		const currentGeneratedTimetable = timetables[currentIndex];
		store.dispatch(
			createCustomTimetable("Custom Timetable", currentGeneratedTimetable),
		);
		store.dispatch(changeToCustomView());
		return getCurrentCustomTimetable();
	}
	return timetable;
};

export const allocationToEvents = (allocation: Allocation, subject: ProcessedSubject) => {
	const { lot, index } = allocation;

	const activity_group = subject.data.activity_group_list[lot];
	const stream = activity_group.stream_list[index];

	const calculateEventDate = (day: Day, time: string) => {
		const dayIndex = Days.indexOf(day);
		const duration = moment.duration(time);

		const today = moment();
		const startOfWeek = today.startOf("isoWeek"); // starts on a monday
		return startOfWeek.add(dayIndex, "days").add(duration).toDate();
	};

	let activity_type: string;
	let mandatory = false;
	if (activity_group.stream_list.length === 1) {
		activity_type = "Mandatory"
		mandatory = true;
	} else if (activity_group.stream_list[0].activity_list.length === 1) {
		activity_type = "Variable"
	} else {
		activity_type = "Stream"
	}

	const events = stream.activity_list.map(activity => {
		return {
			// basic information about the subject
			title: activity.name,
			code: subject.data.code,
			subjectName: subject.data.name,
			locations: [activity.location],
			type: activity_type,
			// event background colour
			backgroundColor: subject.color,
			// all alternative stream positions for the same activity:
			// - will share the same classCode
			// - will have different streamNumbers
			classCode: `${subject.data.code}-${lot}-${activity.activity_id}`,
			streamNumber: index,
			// TODO: can probably remove this
			codes: "ACTIVITY_CODE_1",
			online: false,
			// fixed value for styling purposes
			className: "lookahead-event-wrapper",
			// TODO: fix, as start/end are string not Time
			start: calculateEventDate(activity.day, activity.times.start as unknown as string),
			end: calculateEventDate(activity.day, activity.times.end as unknown as string),
			// change whether this is editable or not, depending on if it is mandatory
			editable: !mandatory,
			durationEditable: false,
			weeks: activity.weeks.join(", "),
		};
	});

	return events;
}


// When an event is clicked
// https://fullcalendar.io/docs/eventClick
export const handleEventClick = (eventClickInfo, eventCallback) => {
	const { event } = eventClickInfo;
	console.log("Event:", event);

	if (event.id === "reserved") {
		store.dispatch(removeReservedEvent(event));
		return;
	}
	eventCallback(event);
};

// Create reserved events
// https://fullcalendar.io/docs/select-callback
export const handleSelect = (selectionInfo) => {
	const { start, end } = selectionInfo;
	const newReservedEvent = createReservedEvent(start, end);
	if (start.getDay() !== end.getDay()) {
		alert("Sorry! No cross-day reserved events allowed.");
		return;
	}
	store.dispatch(addReservedEvent(newReservedEvent));
};

export const createReservedEvent = (start, end) => {
	const differenceInMinutes = (end - start) / 60000;
	if (differenceInMinutes < 30) {
		end.setMinutes(start.getMinutes() + 30);
	}
	return {
		id: "reserved",
		title: "Reserved",
		start: start,
		end: end,
		editable: false,
		stick: true,
		className: "reserved-event",
	};
};

let currentShownBackgroundEvents = [];
/**
 * Handles when an event has started to be dragged
 * Main actions: make regular events {REGULAR_EVENTS_OPACITY}% visible, show
 * relevant (allowed) background events
 * @param {[Event]} allEvents
 * @param {Event} currentEvent
 */
export const handleEventDragStart = (allEvents: Event[], currentEvent: EventApi) => {
	console.log("Current event", currentEvent.extendedProps);

	let REGULAR_EVENTS_OPACITY = getCurrentTheme().dragDropRegularEventOpacity;
	for (const elem of Array.from(document.querySelectorAll(".lookahead-event-wrapper")) as HTMLElement[]) {
		elem.style.opacity = REGULAR_EVENTS_OPACITY;
	}

	// Get all allowed drop events
	console.log("Background", getBackgroundEvents());
	const backgroundEvents = getBackgroundEvents().filter(
		// TODO: properly type all this up
		(e: any) =>
			e.classCode === currentEvent.extendedProps.classCode
	);
	// Show all allowed background events
	backgroundEvents.forEach(showBackgroundEvent);
};

let currentStreamIndicators = [];
/**
 * Determines whether or not an event being dragged can be placed at a certain
 * location.
 * @param {DropLocation} dropLocation
 * @param {Event} draggedEvent
 * @param {[Event]} allEvents
 */
export const handleEventAllow = (dropLocation, draggedEvent, allEvents) => {
	const intersects = currentShownBackgroundEvents.filter((event) => {
		const sameDay = dropLocation.start.getDay() === event.start.getDay();
		const sameHour = dropLocation.start.getHours() === event.start.getHours();
		const sameMinutes =
			dropLocation.start.getMinutes() === event.start.getMinutes();
		return sameDay && sameHour && sameMinutes;
	});

	const onAClass = intersects.length > 0;
	const isStream = draggedEvent.extendedProps.type === "Stream";

	if (!isStream) {
		return onAClass;
	}

	if (onAClass) {
		const intersectingEvent = intersects[0];
		// Find all events that are a part of this stream
		const sameStream = getBackgroundEvents().filter(
			(event: any) =>
				event.classCode === intersectingEvent.classCode &&
				event.streamNumber === intersectingEvent.streamNumber &&
				event.className !== intersectingEvent.className,
		);

		for (const e of sameStream) {
			currentStreamIndicators.push(e);
			showEventIndicator(e);
		}

		return true;
	}

	currentStreamIndicators.forEach(hideBackgroundEvent);
	currentStreamIndicators = [];
	return false;
};

/**
 * Handles when an event is stopped being dragged.
 * Main actions: make regular events 100% visible, hide all background events
 * @param {[Event]} allEvents
 * @param {Event} currentEvent
 */
export const handleEventDragStop = (allEvents, currentEvent) => {
	// Get all foreground events
	const regularEvents = allEvents.filter((e) => e.rendering !== "background");
	regularEvents.forEach((event) => {
		$(`.${event.className}`).css("opacity", 1);
	});
	// Hide all background events
	getBackgroundEvents().forEach(hideBackgroundEvent);
	currentShownBackgroundEvents = [];
};

/**
 * Triggered when an event is dropped into a new timeslot.
 */
export const handleEventDrop = ({ event, oldEvent }) => {
	// Better name - L O W E R S~T H E~R E P R E S E N T A T I O N A L~G A P
	const newEvent = event;
	// Destructure information about the new class time
	const {
		start,
		// title,
		extendedProps: { classCode, type, /*streamNumber,*/ code, codes },
	} = newEvent;
	const subjects = getSubjects();
	// Extract all regular classes for this subject
	const regularClasses = subjects[code].data._regularClasses;
	const streamContainers = subjects[code].data._streamContainers;
	const startHoursFractional = start.getHours() + start.getMinutes() / 60;
	const dayIndex = start.getDay() - 1;
	const destinationMatch = (cls) =>
		cls.classCode.type === classCode.type &&
		cls.subjectCode === code &&
		cls.start === startHoursFractional &&
		cls.day === dayIndex;
	if (type === "Stream") {
		const relevantStreams = streamContainers.find(
			(container) => container.type === classCode.type,
		).streams;
		const fromStreamNumber = oldEvent.extendedProps.streamNumber;
		const destinationStream = relevantStreams.find((stream) =>
			stream.classes.some(destinationMatch),
		);
		const destinationStreamNumber = destinationStream.streamNumbers[0];
		console.log(fromStreamNumber, destinationStreamNumber);
		// Todo: make this update the timetable properly
		if (getKeepClassesStreamed())
			moveStream(
				code,
				classCode.type,
				fromStreamNumber,
				destinationStreamNumber,
			);
		return;
	}
	const matchingClasses = regularClasses.filter(destinationMatch);
	// if (matchingClasses.length === 0) {
	//   // This reaaallly shouldn't happen - but if it does...?
	//   console.error("This shouldn't happen.", oldEvent, newEvent);
	//   return;
	// }
	// Yay, we found the class we've moved to!
	const newClass = matchingClasses[0];
	const subject = code;
	const fromCode = codes[0];
	const toCode = newClass.codes[0];
	moveRegularClassByCode(subject, fromCode, toCode);
};

export const moveStream = (
	subjectCode,
	type,
	oldStreamNumber,
	newStreamNumber,
) => {
	console.log(
		`${subjectCode}: Moving Stream Type ${type}, ${oldStreamNumber} to ${newStreamNumber}`,
	);
	// Get current timetable
	const {
		currentIndex,
		timetable: { classList },
	} = getCurrentTimetable();
	if (!classList) {
		return;
	}
	console.log(
		"Proceeding to update this classlist:",
		Object.assign({}, classList),
	);
	// Extract the old stream classes from the classList
	const newClassList = classList.filter(
		(cls) =>
			cls.subjectCode !== subjectCode ||
			cls.classCode.type !== type ||
			cls.streamNumber !== oldStreamNumber,
	);
	// Add the new stream classes to the classList
	// First, get the new stream classes
	const subject = getSubjects()[subjectCode].data;
	const newClasses = subject._streamContainers
		.find((container) => container.type === type)
		.streams.find((stream) =>
			stream.streamNumbers.includes(newStreamNumber),
		).classes;
	// Add each new class to the class list
	newClasses.forEach((cls) => newClassList.push(cls));
	console.log("Updated classlist:", Object.assign({}, newClassList));
	const newTimetable = new Timetable(newClassList);
	store.dispatch(updateTimetable(currentIndex, newTimetable));
};

/**
 * Moves a class type (Workshop 1, Lecture 2, e.t.c) to a new class time by class
 */
export const moveRegularClassByNewClass = (newClass) => {
	console.log(` Moving to a new class`, newClass);
	// Get current timetable
	const {
		currentIndex,
		timetable: { classList },
	} = getCurrentTimetable();
	if (!classList) {
		return;
	}
	console.log(
		"Proceeding to update this classlist:",
		Object.assign({}, classList),
	);
	const {
		classCode: { type, name },
	} = newClass;
	// We filter the timetable to get the old class
	const oldClass = classList.filter(
		(cls) => cls.classCode.type === type && cls.classCode.name === name,
	)[0];
	// Remove old class, and insert new class
	classList.splice(classList.indexOf(oldClass), 1, newClass);
	// Create a new timetable off this information
	const newTimetable = new Timetable(classList);
	store.dispatch(updateTimetable(currentIndex, newTimetable));
};

/**
 * Moves a class type (Workshop 1, Lecture 2, e.t.c) to a new class time by code
 */
const moveRegularClassByCode = (subject, oldCode, newCode) => {
	console.log(`${subject}: Moving class, ${oldCode} to ${newCode}`);
	// Get current timetable
	const {
		currentIndex,
		timetable: { classList },
	} = getCurrentTimetable();
	console.log(
		"Proceeding to update this classlist:",
		Object.assign({}, classList),
	);
	// We filter the subject to get the new class
	const newClass = getSubjects()[subject].data._regularClasses.filter(
		(cls) => cls.codes[0] === newCode,
	)[0];
	const oldClass = classList.filter((cls) => cls.codes[0] === oldCode)[0];
	// Remove old class, and insert new class
	classList.splice(classList.indexOf(oldClass), 1, newClass);
	// Create a new timetable off this information
	const newTimetable = new Timetable(classList);
	store.dispatch(updateTimetable(currentIndex, newTimetable));
};

const showBackgroundEvent = (event) => {
	const className = event.className;
	currentShownBackgroundEvents.push(event);
	if (event.type === "Stream") {
		$(`.${className}`).append("Stream #" + event.streamNumber);
	}
	$(`.${className}`).addClass("show-background-event");
};

const hideBackgroundEvent = (event) => {
	const className = event.className;
	// Removes all child elements, clearing out rendered text like "Stream #x"
	$(`.${className}`).empty();
	$(`.${className}`).removeClass("show-background-event");
	$(`.${className}`).removeClass("show-background-stream-event");
};

const showEventIndicator = (event) => {
	const className = event.className;
	$(`.${className}`).addClass("show-background-stream-event");
};

export const generateBackgroundEvents = () => {
	const bgEvents = [];
	const subjects = getSubjects();

	// Loop through each subject, generating background events for them 1-by-1
	for (const subject of Object.values(subjects)) {
		// Check if the data for the subject has been retrieved yet
		if (!subject.data) {
			// If not, continue to the next subject
			continue;
		}
		// Helper function to generate unique class names for each background event
		const generateClassName = ({ code, title }, lot, index) =>
			`lookahead-background-${code}-${title}-${lot}-${index}`
				.replace(/\W+/g, "-")
				.toLowerCase();

		// Generate bg events for Variable classes
		for (const activity_group of subject.data.activity_group_list) {
			for (const stream of activity_group.stream_list) {
				const lot = activity_group.group_id;
				const index = stream.stream_id;

				const allocations = allocationToEvents(
					{ lot, index },
					subject
				);
				const events = allocations.map(e => (
					{
						...e,
						className: generateClassName(e, lot, index),
						backgroundColor: "transparent",
						rendering: "background"
					}
				));
				bgEvents.push(...events);
			}
		}
	}
	return bgEvents;
};
