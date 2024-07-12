import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import { fetchStudyPeriod } from "../../../redux/actions/studyPeriodActions";
import { getSubject } from "../../../redux/actions/subjectActions";

import { withTheme } from "styled-components";
import { SelectContainer } from "./SubjectSelectStyles";

import Select from "react-select";
import AsyncSelect from "react-select/async";
import axios from "axios";

const INPUT_VALUE_CUTOFF = 3;

const SubjectSelect = (props) => {
	// Redux hooks
	const subjectLists = useSelector((state) => state.subjectLists);
	const studyPeriod = useSelector((state) => state.studyPeriod);

	const dispatch = useDispatch();

	// React hooks
	const [selectedStudyPeriod, setSelectedStudyPeriod] = useState(null);

	// ---------------------------------------------------------------
	// Loads on start - retrieve available study periods
	// ---------------------------------------------------------------

	// TODO: fix local storage
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

	useEffect(() => {
		if (studyPeriod.lists.length > 0) {
			setSelectedStudyPeriod(studyPeriod.lists[0]);
		}
	}, [studyPeriod]);

	const loadOptions = (inputValue, callback) => {
		if (selectedStudyPeriod === null) {
			callback([]);
			return;
		}
		if (!inputValue) {
			callback([]);
			return;
		}

		// only return results after typing cutoff characters
		if (inputValue.length < INPUT_VALUE_CUTOFF) {
			callback([]);
			return;
		}

		// TODO: update when sSP.value changes
		const [studyPeriod, year] = selectedStudyPeriod.value.split(" ");
		const listURL = `/searchSubject?query=${inputValue}&year=${year}&period=${studyPeriod}`;
		console.log("List:", listURL);
		axios
			.get(listURL)
			.then((res) => {
				const result = res.data.map((x) => {
					return { value: x.code, label: x.code };
				});
				console.log(result);
				callback(result);
			})
			.catch((err) =>
				callback([
					{
						value: "error",
						label: err.message || "Oops! Something went wrong!",
						isDisabled: true,
					},
				]),
			);
	};

	// Determines what message to display if there are no options provided
	const noOptionsMessage = (inputValue) => {
		// Filter returned 'undefined', so we need more text!
		if (inputValue.length < INPUT_VALUE_CUTOFF) {
			return inputValue
				? "Enter more characters..."
				: "Enter some characters ⌨";
		}

		return `No matching subjects found in ${selectedStudyPeriod.label}`;
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

	const applySelectTheme = (theme) => {
		return {
			...theme,
			borderRadius: "3px",
		};
	};

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
				placeholder="Loading..."
				theme={applySelectTheme}
				styles={customStyles}
			/>
			<AsyncSelect
				className="subject-select"
				styles={customStyles}
				loadOptions={loadOptions}
				placeholder={
					selectedStudyPeriod === null
						? "Loading..."
						: "Search for a subject..."
				}
				theme={applySelectTheme}
				defaultOptions={true}
				onChange={handleSubjectSelect}
				noOptionsMessage={(obj) => noOptionsMessage(obj.inputValue)}
			/>
		</SelectContainer>
	);
};

export default withTheme(SubjectSelect);
