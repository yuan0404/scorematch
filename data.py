import pdfplumber
import pandas as pd
import os
import re
import numpy as np

input_folder = "input"
pdf_files = {
    "114年校系分則": "114recruit.pdf", 
    "113年最低錄取分數": "113_04.pdf",
    "112年最低錄取分數": "112_04.pdf",
    "111年最低錄取分數": "111_04.pdf",
    "114年校系新增": "114dept_upd.pdf",
    "114年校系更新": "114dept_upd.pdf",
    "113年校系新增": "113dept_upd.pdf",
    "113年不參與分發": "113dept_upd.pdf",
    "113年校系更新": "113dept_upd.pdf",
    "112年校系新增": "112dept_upd.pdf",
    "112年不參與分發": "112dept_upd.pdf",
    "112年校系更新": "112dept_upd.pdf",
    "111年不參與分發": "111_dept_update.pdf",
}

with pd.ExcelWriter("data.xlsx", engine="openpyxl") as writer:
    score_data = {
        '科目': ['國', '英', '數A', '數B', '社', '自'],
        '頂標': [13, 13, 11, 12, 13, 13],
        '前標': [12, 11, 9, 10, 12, 12], 
        '均標': [10, 8, 6, 6, 10, 9],
        '後標': [9, 4, 4, 4, 8, 7],
        '底標': [7, 3, 3, 3, 7, 5]
    }
    df_score = pd.DataFrame(score_data)
    df_score.to_excel(writer, sheet_name="114年學測五標", index=False)

    for sheet_name, pdf_file in pdf_files.items():
        path = os.path.join(input_folder, pdf_file)

        if "校系分則" in sheet_name:
            csv_rows = []
            with pdfplumber.open(path) as pdf:  
                for i in range(25, 231):
                    page = pdf.pages[i]
                    table = page.extract_table()
                    if table:
                        columns = ["校名"] + [
                            re.sub(r'\(.*?\)', '', col.replace('\n', '').replace('\r', '').replace(' ', ''))
                            for col in table[1][:3]
                        ]
                        rows = []
                        for row in table[2:]:
                            
                            cleaned_row = [re.sub(r'\(.*?\)', '', table[0][0].replace('校名：', ''))] + [
                                cell.replace('\n', '').replace('\r', '').replace(' ', '').replace('---', '*').replace('--', '')
                                if cell else '' for cell in row[:3]
                            ]
                            rows.append(cleaned_row)

                        df = pd.DataFrame(rows, columns=columns)
                        df = df[~(df.iloc[:, 1:] == '').all(axis=1)]
                        df = df[~df.iloc[:, 1].apply(lambda x: str(x).isdigit())]
                        df = df[~df.iloc[:, 1].str.contains('本頁以下空白', case=False, na=False)]

                        merged_rows = []
                        for _, row in df.iterrows():
                            if row.iloc[1] != '':
                                merged_rows.append(row.tolist())
                            else:
                                if merged_rows:
                                    if row.iloc[2]:
                                        if merged_rows[-1][2]:
                                            merged_rows[-1][2] += ' ' + row.iloc[2]
                                        else:
                                            merged_rows[-1][2] = row.iloc[2]
                                    if row.iloc[3]:
                                        if merged_rows[-1][3]:
                                            merged_rows[-1][3] += ' ' + row.iloc[3]
                                        else:
                                            merged_rows[-1][3] = row.iloc[3]

                        df_merged = pd.DataFrame(merged_rows, columns=columns)
                        csv_rows.append(df_merged)

            final_df = pd.concat(csv_rows, ignore_index=True)

            final_df.iloc[:, 2] = final_df.iloc[:, 2].apply(
                lambda x: re.sub(r'\b1\.', '', x) if isinstance(x, str) else x
            )
            final_df.iloc[:, 2] = final_df.iloc[:, 2].apply(
                lambda x: re.sub(r'\b[2-9]\.', '、', x) if isinstance(x, str) else x
            )

            split_cols = final_df.iloc[:, 2].str.rpartition(' ')
            final_df.insert(2, '學測', split_cols[0])
            final_df.insert(3, '英聽', split_cols[2])
            final_df.drop(final_df.columns[4], axis=1, inplace=True)

            final_df = final_df.replace('*', '-', regex=False)
            final_df.iloc[:, 2:] = final_df.iloc[:, 2:].map(
                lambda x: x
                    .replace('數學甲', '數甲').replace('數學乙', '數乙')
                    .replace('地理', '地').replace('歷史', '歷').replace('公民與社會', '公')
                    .replace('物理', '物').replace('化學', '化').replace('生物', '生')
                    .replace('國文', '國').replace('英文', '英').replace('數學A', '數A').replace('數學B', '數B')
                    .replace('社會', '社').replace('自然', '自').replace('(學測)', '').replace('(分科)', '')
                    .replace('英聽(Ａ級)', 'A').replace('英聽(Ｂ級)', 'B').replace('英聽(Ｃ級)', 'C')
                    .replace('音樂(術科)', '音').replace('美術(術科)', '美').replace('體育(術科)', '體') 
                if isinstance(x, str) else x
            )
            final_df.to_excel(writer, sheet_name=sheet_name, index=False)

        elif "校系新增" in sheet_name:
            with pdfplumber.open(path) as pdf:
                first_page = pdf.pages[0]
                tables = first_page.extract_tables()

                if tables and len(tables) > 0:
                    table = tables[0]
                    df = pd.DataFrame(table[1:], columns=table[0])
                    final_df = df.drop(columns=["校碼"])
                    final_df.to_excel(writer, sheet_name=sheet_name, index=False)
        
        elif "不參與分發" in sheet_name:
            with pdfplumber.open(path) as pdf:
                if "111" in sheet_name:
                    first_page = pdf.pages[0]
                    tables = first_page.extract_tables()

                    if tables and len(tables) > 1:
                        table = tables[1]
                        df = pd.DataFrame(table[1:], columns=table[0])
                        final_df = df.drop(columns=["校碼"])
                        final_df.to_excel(writer, sheet_name=sheet_name, index=False)
                else:
                    second_page = pdf.pages[1]
                    tables = second_page.extract_tables()

                    if tables and len(tables) > 0:
                        table = tables[0]
                        df = pd.DataFrame(table[1:], columns=table[0])
                        final_df = df.drop(columns=["校碼"])
                        final_df.to_excel(writer, sheet_name=sheet_name, index=False)

        elif "校系更新" in sheet_name:
            all_rows = []
            columns = None

            with pdfplumber.open(path) as pdf:
                for page_num in range(2, len(pdf.pages)):
                    page = pdf.pages[page_num]
                    tables = page.extract_tables()
                    
                    if tables and len(tables) > 0:
                        table = tables[0]
                        
                        if columns is None:
                            columns = table[0]
                        
                        rows = table[1:]
                        all_rows.extend(rows)

            if columns is not None and all_rows:
                df = pd.DataFrame(all_rows, columns=columns)
                df.replace('- -', np.nan, inplace=True)
                df.replace('--', np.nan, inplace=True)
                df.ffill(inplace=True)
                final_df = df.map(lambda x: re.sub(r'\s+', '', x) if isinstance(x, str) else x)
                final_df = final_df.drop(columns=["校碼"])
                final_df.to_excel(writer, sheet_name=sheet_name, index=False)

        else:
            csv_rows = []
            with pdfplumber.open(path) as pdf:
                for page in pdf.pages:
                    table = page.extract_table()
                    if table:
                        columns = [
                            col.replace('\n', '').replace('\r', '').replace('系組名', '學系').replace('採計及加權', '採計科目及加權') 
                            if col else '' for col in table[0][1:7]
                        ]
                        rows = [
                            [cell.replace('\n', '').replace('\r', '') if cell else '' for cell in row[1:7]]
                            for row in table[1:]
                        ]

                        df = pd.DataFrame(rows, columns=columns)
                        csv_rows.append(df)
            
            if csv_rows:
                final_df = pd.concat(csv_rows, ignore_index=True)
                final_df.iloc[:, 2:] = final_df.iloc[:, 2:].map(
                    lambda x: x
                        .replace('數學甲', '數甲').replace('數學乙', '數乙')
                        .replace('地理', '地').replace('歷史', '歷').replace('公民與社會', '公')
                        .replace('物理', '物').replace('化學', '化').replace('生物', '生')
                        .replace('國文', '國').replace('英文', '英').replace('數學A', '數A').replace('數學B', '數B')
                        .replace('社會', '社').replace('自然', '自').replace('術科', '術') 
                    if isinstance(x, str) else x
                )
                final_df.to_excel(writer, sheet_name=sheet_name, index=False)
