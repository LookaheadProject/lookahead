var error_subjects = [];
var DB_URI = "http://localhost:8096/api/upload";

async function getSubject(subjects, callback) {
	// retrive the results for a certain subject
	let total = 0;
	let success = 0;

	for (subj of subjects) {
		total++;

		let endpoint = `https://mytimetable.students.unimelb.edu.au/even/rest/student/${data.student.student_code}/electivesearch/${subj}/activities/?ss=${ss}`;

		let result = await fetch(endpoint);
		let json = await result.json();

		// check if the json object is empty - if so, there has been an error
		if (Object.keys(json).length === 0) {
			console.warn(`Error retrieving: ${subj}`);
			error_subjects.push(subj);
			continue;
		}

		success++;

		await callback(json, subj);
	}

	console.info(
		`Successfully retrieved ${success} out of ${total} total entries.`,
	);
	console.info(`Failed retrievals: ${error_subjects}`);
}

await getSubject(SUBJECT_LIST_GOES_HERE, async (r, subj) => {
	let resp = await fetch(DB_URI + "?" + new URLSearchParams({ code: subj }), {
		method: "POST",
		body: JSON.stringify(r),
	});

	if (!resp.ok) {
		console.error(resp);
		throw new Error("Network response was not OK");
	}
});
