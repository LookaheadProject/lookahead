import { OptimiseButton, OptimiseButtonWrapper } from "./OptimiseButtonStyles";
import {
	PossibilitiesStat,
	PossibilitiesDisclaimer,
	TimeRestrictMsgWrapper,
} from "../TimeRestrictMsg/TimeRestrictMsgStyles";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { optimise } from "../../../redux/actions/optimiserActions";

import { useAppDispatch, useAppSelector } from "redux/hooks";

const OptimiseButtonConstructor: FunctionComponent = ({
	offset,
	children,
}: any) => {
	const subjects = useAppSelector((state) => state.subjects);
	const allSubjectsLoaded = !Object.entries(subjects).some(
		([k, v]) => (v as any).data === null,
	);

	const optimisations = useAppSelector((state) => state.optimisations);
	const optimiser = useAppSelector((state) => state.optimiser);
	const dispatch = useAppDispatch();

	const invokeOptimisation = () => {
		console.log("Optimise time");

		const subjectData = Object.values(subjects).map((x: any) => x.data);

		dispatch(
			optimise({
				subjects: subjectData,
				optimisations: {
					...optimisations,
					allocateBreaks: 1,
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
