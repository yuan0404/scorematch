import pandas as pd
import re
import os

xlsx_file = "data.xlsx"

xls = pd.ExcelFile(xlsx_file)
sheet_names = xls.sheet_names

output_folder = "output"
os.makedirs(output_folder, exist_ok=True)

for sheet in sheet_names:
    df = pd.read_excel(xlsx_file, sheet_name=sheet)

    safe_name = re.sub(r"[^\w\u4e00-\u9fff]+", "_", sheet)
    path = os.path.join(output_folder, f"{safe_name}.json")

    df.to_json(path, orient='records', force_ascii=False, indent=2)
