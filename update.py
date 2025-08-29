import json

json_files = {
    "data114": "114年校系分則.json",
    "data113": "113年最低錄取分數.json",
    "data112": "112年最低錄取分數.json",
    "data111": "111年最低錄取分數.json",
    "upd114": "114年校系更新.json",
    "upd113": "113年校系更新.json",
    "upd112": "112年校系更新.json",
    "add114": "114年校系新增.json",
    "add113": "113年校系新增.json",
    "add112": "112年校系新增.json",
    "no113": "113年不參與分發.json",
    "no112": "112年不參與分發.json",
    "no111": "111年不參與分發.json",
}

data = {}
for key, filepath in json_files.items():
    with open("output/" + filepath, "r", encoding="utf-8") as f:
        data[key] = json.load(f)

data114 = [(entry["校名"], entry["學系"]) for entry in data["data114"]]
data113 = [(entry["校名"], entry["學系"]) for entry in data["data113"]]
data112 = [(entry["校名"], entry["學系"]) for entry in data["data112"]]
data111 = [(entry["校名"], entry["學系"]) for entry in data["data111"]]

upd114 = [(entry["校名"], entry["114學年度招生系組名稱"], entry["113學年度原系組名稱"]) for entry in data["upd114"]]
upd113 = [(entry["校名"], entry["113學年度招生系組名稱"], entry["112學年度原系組名稱"]) for entry in data["upd113"]]
upd112 = [(entry["校名"], entry["112學年度招生系組名稱"], entry["111學年度原系組名稱"]) for entry in data["upd112"]]

add114 = [(entry["學校名稱"], entry["系組名稱"]) for entry in data["add114"]]
add113 = [(entry["學校名稱"], entry["系組名稱"]) for entry in data["add113"]]
add112 = [(entry["學校名稱"], entry["系組名稱"]) for entry in data["add112"]]

no113 = [(entry["學校名稱"], entry["系組名稱"]) for entry in data["no113"]]
no112 = [(entry["學校名稱"], entry["系組名稱"]) for entry in data["no112"]]
no111 = [(entry["學校名稱"], entry["系組名稱"]) for entry in data["no111"]]

fields = ["校名", "學系", "113年", "112年", "111年"]

result = []

for school, name114 in data114:
    name113 = ""
    name112 = ""
    name111 = ""

    departments = name114
    matches113 = []

    for department in departments.split(" "):
        if (school, department) in add114:
            matches113 += ["無校系資料"]
        elif (school, department) in no113:
            matches113 += ["不參與分發"]
        elif (school, department) in data113:
            matches113 += [department]
        else:
            matches = [(s, new, old) for (s, new, old) in upd114 if s == school and new == department]
            for match in matches:
                matches113 += [match[2]]

    if len(matches113) > 1 and "無校系資料" in matches113:
        matches113.remove("無校系資料")

    if len(matches113) > 1 and "不參與分發" in matches113:
        matches113.remove("不參與分發")

    name113 = " ".join(dict.fromkeys(matches113))
    departments = name113
    matches112 = []

    for department in departments.split(" "):
        if (school, department) in data112:
            matches112 += [department]
        elif (school, department) in no112:
            matches112 += ["不參與分發"]
        elif (school, department) in add113 or department == "無校系資料":
            matches112 += ["無校系資料"]
        else:
            matches = [(s, new, old) for (s, new, old) in upd113 if s == school and new == department]
            for match in matches:
                matches112 += [match[2]]

    if len(matches112) > 1 and "無校系資料" in matches112:
        matches112.remove("無校系資料")

    if len(matches112) > 1 and "不參與分發" in matches112:
        matches112.remove("不參與分發")

    name112 = " ".join(dict.fromkeys(matches112))
    departments = name112
    matches111 = []

    for department in departments.split(" "):
        if (school, department) in data111:
            matches111 += [department]
        elif (school, department) in no111:
            matches111 += ["不參與分發"]
        elif (school, department) in add112 or department == "無校系資料":
            matches111 += ["無校系資料"]
        else:
            matches = [(s, new, old) for (s, new, old) in upd112 if s == school and new == department]
            for match in matches:
                matches111 += [match[2]]

    if len(matches111) > 1 and "無校系資料" in matches111:
        matches111.remove("無校系資料")

    if len(matches111) > 1 and "不參與分發" in matches111:
        matches111.remove("不參與分發")

    name111 = " ".join(dict.fromkeys(matches111))

    result.append({
        "校名": school,
        "學系": name114,
        "113年": name113,
        "112年": name112,
        "111年": name111
    })

with open("output/114年系名對照.json", "w", encoding="utf-8-sig") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)
