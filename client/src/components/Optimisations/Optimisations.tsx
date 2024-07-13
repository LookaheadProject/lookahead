import "./CustomCheckbox.scss";
import "rc-time-picker/assets/index.css";
import "./InputRange.css";

import {
	ButtonGroup,
	Header,
	HourInputWrapper,
	Input,
	Optimisation,
	OptimisationsContainer,
	OptimisationsWrapper,
	Subheader,
	TimeOptimisation,
} from "./OptimisationsStyles";
import React, { useEffect, useState } from "react";
import { updatePreferences } from "../../redux/actions/optimisationsActions";

import DayAvoidButton from "./DayAvoidButton/DayAvoidButton";
import InputRange from "react-input-range";
import type { IPreferences } from "optimiser";

import { useAppSelector, useAppDispatch } from "redux/hooks";

const formatRangeLabel = (value) => {
	const remainder = value % 1;
	const postColon = remainder === 0.5 ? "30" : "00";
	const meridian = value >= 12 ? "pm" : "am";
	if (value >= 13) {
		value -= 12;
	}
	return `${Math.floor(value)}:${postColon}${meridian}`;
};

function Optimisations() {
	const dispatch = useAppDispatch();

	// set up selectors
	const optimisations = useAppSelector((state) => state.optimisations);

	// load optimisations from localStorage on startup
	useEffect(() => {
		const preferences: IPreferences = JSON.parse(
			localStorage.getItem("preferences"),
		);
		console.log(
			"Load preferences from saved state",
			preferences,
			localStorage.getItem("preferences"),
		);

		if (preferences) {
			dispatch(updatePreferences(preferences));

			// manually make any changes needed:
			// set avoid buttons
			for (const i of preferences.avoidDays) {
				const setActivated = buttonStates[i][1];
				setActivated(true);
			}

			// set input range
			const { start, end } = preferences.timeRestriction;
			setInputRange({
				min: start.hour + start.minute / 60,
				max: end.hour + end.minute / 60,
			});
		}
	}, [dispatch]);

	const longestRunChanged = (e) => {
		e.target.value = e.target.value.replace(/[^0-9]/gi, "");
		let intVal = Number.parseInt(e.target.value);
		if (!intVal) {
			setLongestRun("");
			return;
		}
		if (intVal < 1) {
			intVal = 1;
		} else if (intVal > 12) {
			intVal = 24;
		}
		e.target.value = intVal;
		setLongestRun(intVal);
	};

	const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
	const buttonStates = days.map(() => useState(false));

	// this one is only stored locally, so is in a different format to optimisations.timeRestrictions.
	const [inputRange, setInputRange] = useState({ min: 8, max: 22 });
	return (
		<OptimisationsWrapper>
			<Header>Optimisations</Header>
			<OptimisationsContainer>
				{/*
				 * -------------------------------------------------
				 * TIME RESTRICTION
				 * -------------------------------------------------
				 */}
				<Optimisation center style={{ marginBottom: "50px" }}>
					<Subheader>Time Restriction</Subheader>
					<TimeOptimisation>
						<InputRange
							formatLabel={formatRangeLabel}
							maxValue={22}
							minValue={8}
							step={0.5}
							// in Preferences, Time is stored as a {hour, minute}
							value={inputRange}
							onChange={(newRange_) => {
								// onChange is guaranteed to return a Range, not a number, in this case
								// biome-ignore lint/suspicious/noExplicitAny:
								const newRange = newRange_ as any;

								// this will update the widget display
								setInputRange(newRange);
								const { min: start, max: end } = newRange;

								dispatch(
									updatePreferences({
										timeRestriction: {
											start: {
												hour: Math.floor(start),
												minute: (start % 1) * 60,
											},
											end: {
												hour: Math.floor(end),
												minute: (end % 1) * 60,
											},
										},
									}),
								);
							}}
						/>
					</TimeOptimisation>
				</Optimisation>

				{/*
				 * -------------------------------------------------
				 * TIME RESTRICTION
				 * -------------------------------------------------
				 */}
				<Optimisation center>
					<Subheader>If possible, avoid classes on these days:</Subheader>
					<ButtonGroup>
						{days.map((day, idx) => (
							<DayAvoidButton
								key={day}
								activated={buttonStates[idx][0]}
								setActivated={buttonStates[idx][1]}
								onToggled={(val: boolean) => {
									let avoidDays = optimisations.avoidDays;
									if (val) {
										avoidDays = [...avoidDays, idx];
									} else {
										avoidDays = avoidDays.filter((x) => x !== idx);
									}

									// I don't anticipate order to matter too much here,
									// but I will sort this, in case it affects the optimisation function.
									avoidDays = avoidDays.slice().sort();
									dispatch(
										updatePreferences({
											avoidDays,
										}),
									);
								}}
							>
								{day}
							</DayAvoidButton>
						))}
					</ButtonGroup>
				</Optimisation>

				{/*
				 * -------------------------------------------------
				 * TIME RESTRICTION
				 * -------------------------------------------------
				 */}
				<Optimisation>
					<input
						className="styled-checkbox"
						id="minimise-clashes"
						type="checkbox"
						checked={optimisations.minimiseClashes}
						onChange={({ target: { checked } }) =>
							dispatch(
								updatePreferences({
									minimiseClashes: checked,
								}),
							)
						}
					/>
					<label htmlFor="minimise-clashes">Minimise clashes</label>
				</Optimisation>

				{/*
				 * -------------------------------------------------
				 * CHECKBOXES FOR OTHER FEATURES
				 * -------------------------------------------------
				 */}
				<Optimisation>
					<input
						className="styled-checkbox"
						id="skip-lectures"
						type="checkbox"
						checked={optimisations.skipLectures}
						onChange={({ target: { checked } }) =>
							dispatch(
								updatePreferences({
									skipLectures: checked,
								}),
							)
						}
					/>
					<label htmlFor="skip-lectures">I skip most of my lectures</label>
				</Optimisation>
				<Optimisation>
					<input
						className="styled-checkbox"
						id="minimise-days"
						type="checkbox"
						checked={optimisations.minimiseDaysOnCampus}
						onChange={({ target: { checked } }) =>
							dispatch(
								updatePreferences({
									minimiseDaysOnCampus: checked,
								}),
							)
						}
					/>
					<label htmlFor="minimise-days">Minimise days on campus</label>
				</Optimisation>
				<Optimisation>
					<input
						className="styled-checkbox"
						id="longest-run-toggle"
						type="checkbox"
						checked={optimisations.allocateBreaks}
						onChange={({ target: { checked } }) => {
							dispatch(
								updatePreferences({
									allocateBreaks: checked,
								}),
							);
						}}
					/>
					<label htmlFor="longest-run-toggle">
						Allocate a break after consecutive classes
					</label>
				</Optimisation>
				{false && (
					<Optimisation child>
						Longest time without a break:
						<HourInputWrapper>
							<Input type="text" onChange={longestRunChanged} />
							{breakHours ? `hour${breakHours !== 1 ? "s" : ""}` : ""}
						</HourInputWrapper>
					</Optimisation>
				)}
				<Optimisation>
					<input
						className="styled-checkbox"
						id="minimise-breaks"
						type="checkbox"
						checked={optimisations.minimiseBreaks}
						onChange={({ target: { checked } }) =>
							dispatch(
								updatePreferences({
									minimiseBreaks: checked,
								}),
							)
						}
					/>
					<label htmlFor="minimise-breaks">
						Minimise breaks between classes
					</label>
				</Optimisation>
			</OptimisationsContainer>
		</OptimisationsWrapper>
	);
}

export default Optimisations;
