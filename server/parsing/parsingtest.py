from classes import *
import json

with open("MAST10007-allocate.json", "r") as f:
    data1 = json.load(f)

with open("FNCE10002-allocate.json", "r") as f:
    data2 = json.load(f)

MAST10007 = Subject(data1)
FNCE10002 = Subject(data2)

print(json.dumps(FNCE10002.to_dict(), indent=2))
with open("MAST10007-output.json", "w") as f:
    json.dump(MAST10007.to_dict(), f, indent=2)
