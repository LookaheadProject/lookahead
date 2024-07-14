import { OptimiseButton, OptimiseButtonWrapper } from "./OptimiseButtonStyles";
import {
	PossibilitiesStat,
	PossibilitiesDisclaimer,
	TimeRestrictMsgWrapper,
} from "../TimeRestrictMsg/TimeRestrictMsgStyles";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { optimise } from "../../../redux/actions/optimiserActions";

import { useAppDispatch, useAppSelector } from "redux/hooks";

const OptimiseButtonConstructor = ({ offset, children }: any) => {
	const subjects = useAppSelector((state) => state.subjects);
	const allSubjectsLoaded = !Object.entries(subjects).some(
		([k, v]) => (v as any).data === null,
	);

	const optimisations = useAppSelector((state) => state.optimisations);
	const optimiser = useAppSelector((state) => state.optimiser);
	const dispatch = useAppDispatch();

	const invokeOptimisation = () => {
		console.log("Optimise time");

		// use (deterministic) sorted order to allocate
		const subjectData = Object.keys(subjects)
			.sort()
			.map((key) => subjects[key].data);

		dispatch(
			optimise({
				subjects: subjectData,
				optimisations: {
					...optimisations,
					allocateBreaks: 0,
				},
			}),
		);
	};

	return (
		<>
			<OptimiseButtonWrapper>
				<OptimiseButton
					disabled={!allSubjectsLoaded}
					onClick={() => invokeOptimisation()}
				>
					{allSubjectsLoaded ? "Optimise" : "Loading..."}
				</OptimiseButton>
			</OptimiseButtonWrapper>
		</>
	);
};

export default OptimiseButtonConstructor;
