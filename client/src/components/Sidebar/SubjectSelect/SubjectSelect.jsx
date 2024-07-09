import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import { fetchSubjectList } from "../../../redux/actions/subjectListActions";
import { fetchStudyPeriod } from "../../../redux/actions/studyPeriodActions";

import { getSubject } from "../../../redux/actions/subjectActions";
import { withTheme } from "styled-components";
import { SelectContainer } from "./SubjectSelectStyles";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import moment from "moment";

const SubjectSelect = (props) => {
	// Redux hooks
	const subjectLists = useSelector((state) => state.subjectLists);
	const studyPeriod = useSelector((state) => state.studyPeriod);

	const dispatch = useDispatch();

	// React hooks
	const [selectedStudyPeriod, setSelectedStudyPeriod] = useState(null);

	// Tracks the currently entered text in the subject filter
	const [inputValue, setInputValue] = useState("test");

	// ---------------------------------------------------------------
	// Loads on start - retrieve available study periods
	// ---------------------------------------------------------------

	useEffect(() => {
		return;
		//let localStorageSubjects = JSON.parse(localStorage.getItem('subjects'));
		if (!localStorageSubjects) return;
		for (const subject of localStorageSubjects) {
			const { year, code, name, studyPeriod, online } = subject;
			dispatch(getSubject(year, studyPeriod, code, name, online));
		}
		if (!(!process.env.NODE_ENV || process.env.NODE_ENV === "development"))
			return;
		localStorage.removeItem("notifications");
	}, [dispatch]);

	// fetch study period list
	useEffect(() => {
		dispatch(fetchStudyPeriod());
	}, [dispatch]);

	// fetch subject list
	useEffect(() => {
		return;
		const studyPeriod = selectedStudyPeriod.value;
		const studyPeriodYear = selectedStudyPeriod.year;
		if (!subjectLists.lists[studyPeriod]) {
			setInputValue("");
			dispatch(fetchSubjectList(studyPeriodYear, studyPeriod));
		}
	}, [dispatch, selectedStudyPeriod, subjectLists.lists]);

	// update selected study period, whenever the study period list changes
	useEffect(() => {
		console.log("Study Period", studyPeriod);
		if (studyPeriod.lists.length) {
			console.log("Success");
			const value = studyPeriod.lists[0].value;
			setSelectedStudyPeriod({ value, label: value });
		}
	}, [studyPeriod]);

	//const currentList = subjectLists.lists[selectedStudyPeriod.value];
	const currentList = subjectLists.lists[0];

	// Filters input to provide relevant subjects
	const filterSubjects = (inputValue) => {
		if (!currentList) {
			return [];
		}

		if (!inputValue) {
			return currentList;
		}

		const returnList = currentList.filter((i) => {
			return (
				i.code.toLowerCase().includes(inputValue.toLowerCase().trim()) ||
				i.value.toLowerCase().includes(inputValue.toLowerCase().trim())
			);
		});
		console.log("Filter:", inputValue, currentList, returnList);
		return returnList;
	};

	const loadOptions = (inputValue, callback) => {
		// Filter the subject list based on the input value
		const filtered = filterSubjects(inputValue);
		if (filtered && filtered.length > 300) {
			callback(null);
			return;
		}
		callback(filterSubjects(inputValue));
	};

	// Determines what message to display if there are no options provided
	const noOptionsMessage = (inputValue) => {
		const optionLength = filterSubjects(inputValue);
		// Filter returned 'undefined', so we need more text!
		if (optionLength.length) {
			let prefix = `${optionLength.length} possibilities`;
			let suffix = inputValue
				? "Enter more characters..."
				: "Enter some characters ⌨";
			return `${prefix}. ${suffix}.`;
		}
		if (optionLength.length === 0) {
			return `No matching subjects found for: ${selectedStudyPeriod.label}`;
		}
		return null;
	};
	const applySelectTheme = (theme) => {
		return {
			...theme,
			borderRadius: "3px",
		};
	};

	const handleSubjectSelect = ({ code, value, online }) => {
		dispatch(
			getSubject(
				CURRENT_SUBJECT_LIST_YEAR,
				selectedStudyPeriod,
				code,
				value,
				online,
			),
		);
	};

	// ---------------------------------------------------------------
	// Theming
	// ---------------------------------------------------------------

	const customStyles = {
		input: (provided) => ({
			...provided,
			fontSize: "12px",
			color: props.theme.color,
		}),
		placeholder: (provided) => ({
			...provided,
			fontSize: "12px",
			color: props.theme.color,
		}),
		menu: (base) => ({
			...base,
			zIndex: 100,
			marginTop: "2px",
		}),
		option: (provided, { data, isDisabled, isFocused, isSelected }) => ({
			...provided,
			backgroundColor: isFocused ? "lightsteelblue" : null,
			color: isFocused ? "#62656E" : null,
			fontSize: "13px",
			height: "100%",
		}),
		singleValue: (provided, state) => {
			const opacity = state.isDisabled ? 0.5 : 1;
			const transition = "opacity 3000ms";
			return {
				...provided,
				color: props.theme.color,
				opacity,
				transition,
				fontSize: "12px",
			};
		},
	};

	return (
		<SelectContainer>
			<Select
				className="study-period-select"
				value={selectedStudyPeriod}
				onChange={(option) => setSelectedStudyPeriod(option)}
				options={studyPeriod.lists}
				searchable={false}
				isLoading={studyPeriod.loading}
				isDisabled={studyPeriod.loading}
				//placeholder="Loading..."
				theme={applySelectTheme}
				styles={customStyles}
			/>
			<AsyncSelect
				className="subject-select"
				styles={customStyles}
				loadOptions={loadOptions}
				placeholder={
					subjectLists.loading ? "Loading..." : "Search for a subject..."
				}
				theme={applySelectTheme}
				value={inputValue}
				defaultOptions
				isDisabled={subjectLists.loading}
				onChange={handleSubjectSelect}
				noOptionsMessage={(obj) => noOptionsMessage(obj.inputValue)}
			/>
		</SelectContainer>
	);
};

export default withTheme(SubjectSelect);
