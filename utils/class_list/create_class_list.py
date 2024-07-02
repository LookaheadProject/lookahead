import argparse
import csv
import json

parser = argparse.ArgumentParser()
parser.add_argument("output", help="output file")
parser.add_argument("file", help=".csv files to extract subject lists from", nargs="+")
args = parser.parse_args()

subject_codes = set()

for file in args.file:
    with open(file, "r") as file:
        # skip first 3 lines, which are not CSV content
        for _ in range(3):
            next(file)

        reader = csv.DictReader(file)
        for row in reader:
            class_id = row["Class"].split("_")
            class_id_fmt = "_".join(class_id[:4])
            if class_id_fmt:
                subject_codes.add(class_id_fmt)

result = {"subjects": list(subject_codes)}
json.dump(result, open(args.output, "w"))
