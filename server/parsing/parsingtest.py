from classes import *
import json

with open("MAST10008-allocate.json", "r") as f:
    data1 = json.load(f)

with open("FNCE10002-allocate.json", "r") as f:
    data2 = json.load(f)

MAST10008 = Subject(data1)
FNCE10002 = Subject(data2)
# print(MAST10008)
print(FNCE10002)

print(MAST10008._Subject__activity_group_list)


# thanks https://stackoverflow.com/questions/26033239/list-of-objects-to-json-with-python
# def obj_dict(obj):
#     return vars(obj)


# print(json.dumps(MAST10008.to_dict(), indent=2))
print(json.dumps(FNCE10002.to_dict(), indent=2))
# with open("dumptest.json", "w") as f:
#     json.dump(MAST10008, f)
