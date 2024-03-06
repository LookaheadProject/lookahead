from classes import *
import json

with open("MAST10008-allocate.json", "r") as f:
    data = json.load(f)

MAST10008 = Subject(data)
print(MAST10008)
print(json.dumps(vars(MAST10008), indent=2))
