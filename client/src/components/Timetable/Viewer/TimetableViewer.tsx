import React, { useEffect, useState, useRef } from "react";
import { useAppSelector, useAppDispatch } from "redux/hooks";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import "@fullcalendar/core/main.css";
import "@fullcalendar/timegrid/main.css";

import handleClassRender from "../../../utility/ClassRender";
import {
	classToEvent,
	handleEventAllow,
	handleEventDragStart,
	handleEventDragStop,
	generateBackgroundEvents,
	handleEventDrop,
	handleSelect,
	handleEventClick,
	allocationToEvents,
} from "./utility/TimetableViewerFunctions";
import { updateEvents } from "../../../redux/actions/timetableActions";
import TimetableHeaderControl from "../Header/TimetableHeaderControl";
import NoTimetables from "../NoTimetables/NoTimetables";
import TimetableTips from "../Tips/TimetableTips";
import TimetableViewerWrapper from "./TimetableViewerStyles";
import ClassModal from "../ClassModal/ClassModal";
import moment from "moment";

let modalEvent = null;

export default function TimetableViewer() {
	const optimiser = useAppSelector((state) => state.optimiser);
	const dispatch = useAppDispatch();

	const subjectsObj = useAppSelector((state) => state.subjects);
	// subjects will be a sorted, in order array of subjectsObj.
	// TODO: do something better... this is ugly as heck
	const [subjects, setSubjects] = useState([]);
	useEffect(() => {
		if (subjectsObj !== null) {
			setSubjects(
				Object.keys(subjectsObj)
					.sort()
					.map((key) => subjectsObj[key]),
			);
		}
	}, [subjectsObj]);

	const timetable = useAppSelector((state) => state.timetable);
	const {
		timetables,
		currentIndex,
		customTimetables,
		currentCustomIndex,
		currentView,
		reserved,
	} = optimiser;

	const [modalIsOpen, setModalOpen] = useState(false);
	const viewerRef = useRef(null);
	const calendarRef = useRef(null);

	// Check if any subject has a class on the weekend
	// const hasWeekendClasses = Object.entries(subjects).some(
	// 	([_, { data }]) => data?._weekendClasses,
	// );
	const hasWeekendClasses = false;
	useEffect(() => {
		if (!timetables || !subjects.length) {
			return;
		}

		let currentTimetable;
		if (currentView === "custom") {
			currentTimetable = customTimetables[currentCustomIndex].timetable;
		} else {
			currentTimetable = timetables[currentIndex];
			// const { id, name, timetable } = customTimetables[currentCustomIndex];
			// headerText = `Custom Timetable ${id}: ${name}`;
		}

		console.log(`\n\n${"-".repeat(100)}\nBEGIN TIMETABLE VIEWING\n\n\n`);
		console.log("Current Timetable:", currentTimetable);
		console.log("SubjectsObj", subjectsObj);
		console.log("Subjects", subjects);

		// Map timetable classes to events
		const events = currentTimetable.allocation.flatMap((subjAlloc, subjIndex) =>
			subjAlloc.flatMap((index, lot) =>
				allocationToEvents({ lot, index }, subjects[subjIndex]),
			),
		);
		console.log("\n\n\n\nGenerated events:", events);
		//events.push(...generateBackgroundEvents());
		console.log(reserved);
		events.push(...reserved);
		console.log("Dispatching events...");
		dispatch(updateEvents(events));
	}, [
		currentCustomIndex,
		currentIndex,
		currentView,
		customTimetables,
		dispatch,
		subjects,
		timetables,
		reserved,
		subjectsObj,
	]);

	useEffect(() => {
		if (!timetables) {
			return;
		}
		setTimeout(() => {
			viewerRef.current.scrollIntoView({
				behavior: "smooth",
			});
		}, 100);
	}, [timetables]);

	const showEvent = (event) => {
		if (event.background) {
			return;
		}
		modalEvent = event;
		console.log("Showing:", modalEvent);
		setModalOpen(true);
	};

	if (!timetables || (timetables.length === 1 && !timetables[0].classList)) {
		return <NoTimetables hasSubjects={Object.keys(subjects).length > 0} />;
	}

	const events = timetable.allEvents;

	const numberWithCommas = (x) =>
		x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	let headerText = `${currentIndex + 1} of ${numberWithCommas(timetables.length)}`;
	if (currentView === "custom") {
		headerText = customTimetables[currentCustomIndex].name;
	}

	console.log("Modal Event:", modalEvent);

	return (
		<>
			<TimetableTips ref={viewerRef} />
			<TimetableHeaderControl header={headerText} />
			{/* <CustomTimetableControl /> */}
			<TimetableViewerWrapper>
				<FullCalendar
					ref={calendarRef}
					defaultView="timeGridWeek"
					height="parent"
					plugins={[timeGridPlugin, interactionPlugin]}
					weekends={hasWeekendClasses}
					initialDate={moment()}
					slotLabelFormat={{
						hour: "numeric",
						minute: "2-digit",
						omitZeroMinute: true,
						hour12: false,
						meridiem: "narrow",
					}}
					events={events}
					eventClick={(eInfo) => handleEventClick(eInfo, showEvent)}
					select={handleSelect}
					eventDrop={handleEventDrop}
					eventDragStart={({ event }) => handleEventDragStart(events, event)}
					eventAllow={(dropLocation, draggedEvent) =>
						handleEventAllow(dropLocation, draggedEvent, events)
					}
					eventDragStop={({ event }) => handleEventDragStop(events, event)}
					eventPositioned={handleClassRender}
					header={false}
					handleWindowResize={true}
					contentHeight="auto"
					selectable={true}
					columnHeaderFormat={{ weekday: "short" }}
					minTime="08:00:00"
					maxTime="22:30:00"
					snapDuration="00:15"
					firstDay={1}
					editable={true}
					slotEventOverlap={false}
					allDaySlot={false}
					eventResourceEditable={true}
				/>
			</TimetableViewerWrapper>

			{modalEvent && (
				<ClassModal
					isOpen={modalIsOpen}
					closeModal={() => setModalOpen(false)}
					color={modalEvent.backgroundColor}
					{...modalEvent.extendedProps}
				/>
			)}
		</>
	);
}
