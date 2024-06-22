from . import Subject

import argparse
import json

parser = argparse.ArgumentParser()
parser.add_argument("file", type=str, help="input .json file from Allocate+")
args = parser.parse_args()

with open(args.file, "r") as f:
    subj = Subject(json.load(f))

print(json.dumps(subj.to_dict(), indent=2))
