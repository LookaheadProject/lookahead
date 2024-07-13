import React from "react";
import {
	removeSubject,
	changeSubjectColor,
} from "../../redux/actions/subjectActions";
import { useSelector, useDispatch } from "react-redux";
import ColorPickButton from "./ColorPickButton";
import { viewSubject } from "../../redux/actions/viewSubjectActions";
import Warning from "./Warning";
import {
	DeleteButton,
	ErrorMsg,
	LoadingDots,
	SubjectCard,
	SubjectCode,
	SubjectCodeLoading,
	SubjectName,
	SubjectNameLoading,
	SubjectToolbox,
	SubjectWrapper,
	SubjectsWrapper,
	ToolboxButton,
} from "./SubjectItemStyles";
const studyPeriods = {
	summer_term: "Summer",
	semester_1: "Sem 1",
	winter_term: "Winter",
	semester_2: "Sem 2",
	january: "January",
	february: "February",
	march: "March",
	april: "April",
	may: "May",
};
const empty = (array) => !Array.isArray(array) || !array.length;

function Subjects() {
	const subjects = useSelector((state) => state.subjects);
	const dispatch = useDispatch();
	if (!subjects) {
		return <div>No subjects...</div>;
	}

	const openHandbook = (year, code) => {
		const handbookURL = `https://handbook.unimelb.edu.au/${year}/subjects/${code.toLowerCase()}`;
		window.open(handbookURL, "_blank");
	};

	const openTimetable = (year, code) => {
		const URL = `https://cloud.timeedit.net/au_unimelb/web/handbook/s.html?sid=4&object=subject.${code}_${year}&type=subject&startdate=${year}0101&enddate=${year}1231&p=0.m%2C0.w&h=t`;
		window.open(URL, "_blank");
	};

	const deleteSubject = (_year, code) => {
		dispatch(removeSubject(code));
	};

	console.error("Helloooo");

	const uniquePeriods = [
		...new Set(Object.entries(subjects).map(([k, v]) => v.studyPeriod)),
	];

	return (
		<SubjectsWrapper>
			{uniquePeriods.length > 1 && <Warning />}

			{Object.keys(subjects).map((code) => {
				const subject = subjects[code];

				const { year, studyPeriod, name, online, loading, data, color, error } =
					subject;

				const bgColor = color;
				const textColor = "white";
				const isEmpty = data === null || !Object.keys(data).length;

				return (
					<SubjectWrapper key={code}>
						<SubjectCard error={error} $loading={loading} color={bgColor}>
							{!loading ? (
								<SubjectCode>
									{code}
									<span>•</span>
									{error ? (
										<span>
											<i className="fas fa-exclamation-triangle" />
										</span>
									) : (
										<span>
											{studyPeriod} {year}
										</span>
									)}
									{isEmpty && (
										<>
											<span>•</span>
											{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
											<span
												onClick={() =>
													alert(
														'No timetable data could be loaded for this subject. Confirm this by clicking "View Timetable" in the handbook entry for this subject. If you believe this is incorrect, shoot us an email.',
													)
												}
											>
												EMPTY
											</span>
										</>
									)}
								</SubjectCode>
							) : (
								<SubjectCodeLoading />
							)}
							{!loading ? (
								<SubjectName>{name}</SubjectName>
							) : (
								<SubjectNameLoading />
							)}
							{loading ? (
								<LoadingDots>
									<span />
									<span />
									<span />
									<span />
								</LoadingDots>
							) : (
								<>
									{error && (
										<ErrorMsg>
											Oops! We had trouble loading your subject.
										</ErrorMsg>
									)}
									<SubjectToolbox iconColor={textColor}>
										{!error && (
											<ToolboxButton
												title="View Subject Information"
												onClick={() => dispatch(viewSubject(subject))}
											>
												<i className="fa fa-list" />
											</ToolboxButton>
										)}
										{!error && (
											<ColorPickButton
												onColorChange={(color) => {
													dispatch(
														changeSubjectColor(
															year,
															studyPeriod,
															code,
															color.hex,
														),
													);
												}}
												buttonStyle={ToolboxButton}
											/>
										)}
										<ToolboxButton
											title="View Official Timetable"
											onClick={() => openTimetable(year, code)}
										>
											<i className="fa fa-calendar-alt" />
										</ToolboxButton>
										<ToolboxButton
											title="View Handbook Entry"
											onClick={() => openHandbook(year, code)}
										>
											<i className="fa fa-book" />
										</ToolboxButton>
									</SubjectToolbox>
								</>
							)}
						</SubjectCard>
						<DeleteButton onClick={() => deleteSubject(year, code)}>
							×
						</DeleteButton>
					</SubjectWrapper>
				);
			})}
		</SubjectsWrapper>
	);
}

export default Subjects;
