$(document).ready(function () {
    const keyMap = {
        gs_chinese: "國",
        gs_english: "英",
        gs_mathA: "數A",
        gs_mathB: "數B",
        gs_social: "社",
        gs_science: "自",
        gs_listening: "英聽",
        sub_math1: "數甲",
        sub_math2: "數乙",
        sub_physics: "物",
        sub_chemistry: "化",
        sub_biology: "生",
        sub_history: "歷",
        sub_geography: "地",
        sub_civics: "公",
        pt_music: "音",
        pt_art: "美",
        pt_pe: "體"
    };

    const keyMapAll = {
        gs_chinese: "國文",
        gs_english: "英文",
        gs_mathA: "數Ａ",
        gs_mathB: "數Ｂ",
        gs_social: "社會",
        gs_science: "自然",
        gs_listening: "英聽",
        sub_math1: "數甲",
        sub_math2: "數乙",
        sub_physics: "物理",
        sub_chemistry: "化學",
        sub_biology: "生物",
        sub_history: "歷史",
        sub_geography: "地理",
        sub_civics: "公民",
        pt_music: "音樂",
        pt_art: "美術",
        pt_pe: "體育"
    };

    document.getElementById("scoreForm").addEventListener("submit", function (e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        form.style.display = "none";

        const resultArea = document.getElementById("resultArea");
        resultArea.style.display = "flex";

        let fiveLevels = null;

        fetch("output/114年學測五標.json")
            .then(response => {
                if (!response.ok) throw new Error("五標資料載入失敗");
                return response.json();
            })
            .then(data => {
                fiveLevels = data;

                let output = `<details><summary>我的成績</summary><ul class="scoreList">`;
                for (let [key, value] of formData.entries()) {
                    if (!value) value = "無";
                    output += `<li>${keyMapAll[key]}：${value}</li>`;
                }
                output += "</ul></details>";

                const scoresDiv = document.getElementById("scores");
                scoresDiv.innerHTML = output;
            })
            .catch(error => {
                console.error(error);
                alert("無法載入五標資料");
            });

        Promise.all([
            fetch("output/114年校系分則.json").then(response => response.json()),
            fetch("output/114年系名對照.json").then(response => response.json()),
            fetch("output/113年最低錄取分數.json").then(response => response.json()),
            fetch("output/112年最低錄取分數.json").then(response => response.json()),
            fetch("output/111年最低錄取分數.json").then(response => response.json()),
        ])
            .then(([data114, name114, data113, data112, data111]) => {
                allData = data114;

                const schoolsDiv = document.getElementById("schools");
                schoolsDiv.innerHTML = `<details open><summary>顯示學校</summary><div class="schoolCheckboxes"></div></details>`;

                const detailsList = document.querySelectorAll("#detailsContainer details");
                detailsList.forEach((detail) => {
                    const summary = detail.querySelector("summary");
                    summary.addEventListener("click", (e) => {
                        e.preventDefault();
                        detailsList.forEach((d) => {
                            if (d !== detail) d.open = false;
                        });
                        detail.open = !detail.open;
                    });
                });

                const schoolSet = new Set(data114.map(entry => entry.校名));
                const schools = Array.from(schoolSet).sort((a, b) => {
                    const aIsNational = a.includes("國立") || a.includes("市立");
                    const bIsNational = b.includes("國立") || b.includes("市立");
                    return bIsNational - aIsNational;
                });

                const checkboxesContainer = schoolsDiv.querySelector(".schoolCheckboxes");
                schools.forEach((school, index) => {
                    const label = document.createElement("label");
                    label.innerHTML = `
                        <input type="checkbox" class="school-filter" value="${school}" ${index === 0 || index === 5 || index === 6 ? "checked" : ""}> ${school}
                    `;
                    checkboxesContainer.appendChild(label);
                });

                function calculateScore(entry, formData) {
                    const subjects = entry.採計科目及加權.split(" ");
                    let total = 0;
                    let valid = true;

                    subjects.forEach(subject => {
                        const matched = subject.match(/^(.+?)x([\d.]+)$/);
                        if (!matched) return;

                        const subjectName = matched[1];
                        const weight = parseFloat(matched[2]);

                        let subjectKey = null;
                        for (let key in keyMap) {
                            if (keyMap[key] === subjectName) {
                                subjectKey = key;
                                break;
                            }
                        }

                        const score = parseFloat(formData.get(subjectKey));
                        if (!subjectKey || isNaN(score)) {
                            valid = false;
                            return;
                        }

                        total += score * weight;
                    });

                    return valid ? total.toFixed(2) : "無";
                }

                const trackedSet = new Set();

                function renderTrackTable() {
                    const trackTbody = document.querySelector("#trackTable tbody");

                    const expandedKeys = new Set();
                    trackTbody.querySelectorAll(".mainRow").forEach((mainRow, i) => {
                        const detailsRow = mainRow.nextElementSibling;
                        if (detailsRow && detailsRow.style.display !== "none") {
                            const school = mainRow.children[1].textContent;
                            const dept = mainRow.children[2].textContent;
                            expandedKeys.add(`${school}|${dept}`);
                        }
                    });

                    trackTbody.innerHTML = "";

                    const trackedArray = Array.from(trackedSet);

                    trackedArray.forEach((key, index) => {
                        const [school, dept] = key.split("|");
                        const entry = allData.find(e => e.校名 === school && e.學系 === dept);
                        if (!entry) return;

                        const mainRow = document.createElement("tr");
                        mainRow.classList.add("mainRow");
                        mainRow.setAttribute("draggable", "true");

                        const detailsRow = document.createElement("tr");
                        detailsRow.classList.add("detailsRow");

                        const isExpanded = expandedKeys.has(key);
                        detailsRow.style.display = isExpanded ? "table-row" : "none";

                        const score = calculateScore(entry, formData);

                        const exactMatch = data113.find(e => e.校名 === entry.校名 && e.學系 === entry.學系 && e.採計科目及加權 === entry.採計科目及加權.replace(/[音美體]/g, "術"));

                        const names = name114.find(e => e.校名 === entry.校名 && e.學系 === entry.學系);
                        const names113 = names["113年"].split(" ");
                        const names112 = names["112年"].split(" ");
                        const names111 = names["111年"].split(" ");

                        const match113 = data113.filter(e => e.校名 === entry.校名 && names113.includes(e.學系));
                        const match112 = data112.filter(e => e.校名 === entry.校名 && names112.includes(e.學系));
                        const match111 = data111.filter(e => e.校名 === entry.校名 && names111.includes(e.學系));

                        mainRow.innerHTML = `
                            <td>${index + 1}</td>
                            <td>${entry.校名}</td>
                            <td>${entry.學系}</td>
                            <td>${score}</td>
                            <td>${exactMatch ? exactMatch.普通生錄取分數 : "採計科目改變"}</td>
                        `;

                        const formatMatches = (matches) => {
                            if (matches.length === 0) return "-";
                            return matches.map(m => {
                                let str = `${m.普通生錄取分數}（${m.採計科目及加權}）`;
                                if (m.普通生同分參酌) str += `，同分參酌：${m.普通生同分參酌}`;
                                return str;
                            }).join("<br>&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&#8199;");
                        };

                        detailsRow.innerHTML = `
                            <td colspan="5">
                                學測條件：${entry.學測 || "-"}<br>
                                英聽條件：${entry.英聽 || "-"}<br>
                                採計科目及加權：${entry.採計科目及加權.replace(/[音美體]/g, "術")}<br><br>
                                113年錄取標準：${formatMatches(match113)}<br>
                                112年錄取標準：${formatMatches(match112)}<br>
                                111年錄取標準：${formatMatches(match111)}
                            </td>
                        `;

                        mainRow.addEventListener("click", () => {
                            detailsRow.style.display = detailsRow.style.display === "none" ? "table-row" : "none";
                        });

                        mainRow.addEventListener("dragstart", (e) => {
                            e.dataTransfer.setData("text/plain", index);
                        });

                        mainRow.addEventListener("dragover", (e) => {
                            e.preventDefault();
                            mainRow.style.backgroundColor = "#eee";
                        });

                        mainRow.addEventListener("dragleave", () => {
                            mainRow.style.backgroundColor = "";
                        });

                        mainRow.addEventListener("drop", (e) => {
                            e.preventDefault();
                            mainRow.style.backgroundColor = "";
                            const fromIndex = parseInt(e.dataTransfer.getData("text/plain"));
                            const toIndex = index;
                            if (fromIndex === toIndex) return;

                            const moved = trackedArray.splice(fromIndex, 1)[0];
                            trackedArray.splice(toIndex, 0, moved);

                            trackedSet.clear();
                            trackedArray.forEach(k => trackedSet.add(k));
                            renderTrackTable();
                        });

                        trackTbody.appendChild(mainRow);
                        trackTbody.appendChild(detailsRow);
                    });
                }

                function renderTables() {
                    const passTbody = document.querySelector("#passTable tbody");
                    const failTbody = document.querySelector("#failTable tbody");
                    passTbody.innerHTML = "";
                    failTbody.innerHTML = "";

                    const checkedSchools = new Set(
                        Array.from(document.querySelectorAll(".school-filter:checked")).map(input => input.value)
                    );

                    const filteredData = allData
                        .filter(entry => checkedSchools.has(entry.校名))
                        .slice()
                        .sort((a, b) => {
                            const aIsNational = a.校名.includes("國立") || a.校名.includes("市立");
                            const bIsNational = b.校名.includes("國立") || b.校名.includes("市立");
                            return bIsNational - aIsNational;
                        });

                    filteredData.forEach(entry => {
                        let pass = true;

                        if (entry.學測 != "-") {
                            const andParts = entry.學測.split(/[、]/);

                            for (let andPart of andParts) {
                                const orParts = andPart.split("或");
                                let orPass = false;

                                for (let orPart of orParts) {
                                    orPart = orPart.trim();
                                    let matched = orPart.match(/^(.+?)\((頂標|前標|均標|後標|底標)\)$/);
                                    let subjectName = matched[1];
                                    let requiredLevel = matched[2];

                                    let subjectKey = null;
                                    for (let key in keyMap) {
                                        if (keyMap[key] === subjectName) {
                                            subjectKey = key;
                                            break;
                                        }
                                    }

                                    let value = parseInt(formData.get(subjectKey), 10);
                                    let level = Math.ceil(value / 4);
                                    let subjectObj = fiveLevels.find(item => item.科目 === subjectName);
                                    let userLevelName = "";

                                    if (level >= subjectObj.頂標) userLevelName = "頂標";
                                    else if (level >= subjectObj.前標) userLevelName = "前標";
                                    else if (level >= subjectObj.均標) userLevelName = "均標";
                                    else if (level >= subjectObj.後標) userLevelName = "後標";
                                    else if (level >= subjectObj.底標) userLevelName = "底標";
                                    else userLevelName = "低於底標";

                                    const order = { "頂標": 1, "前標": 2, "均標": 3, "後標": 4, "底標": 5, "低於底標": 6 };
                                    if (order[userLevelName] <= order[requiredLevel]) {
                                        orPass = true;
                                    }
                                }

                                if (!orPass) {
                                    pass = false;
                                    break;
                                }
                            }
                        }

                        if (pass && entry.英聽 != "-") {
                            const userListening = formData.get("gs_listening");
                            const order = { A: 1, B: 2, C: 3, F: 4 };
                            if (!userListening || order[userListening] > order[entry.英聽]) {
                                pass = false;
                            }
                        }

                        if (pass) {
                            const subjects = entry.採計科目及加權.split(" ");
                            for (let subject of subjects) {
                                let matched = subject.match(/^(.+?)x([\d.]+)$/);
                                let subjectName = matched[1];

                                let subjectKey = null;
                                for (let key in keyMap) {
                                    if (keyMap[key] === subjectName) {
                                        subjectKey = key;
                                        break;
                                    }
                                }

                                if (!subjectKey || !formData.get(subjectKey)) {
                                    pass = false;
                                    break;
                                }
                            }
                        }

                        if (pass) {
                            const mainRow = document.createElement("tr");
                            mainRow.classList.add("mainRow");

                            const heartTd = document.createElement("td");
                            const key = `${entry.校名}|${entry.學系}`;
                            heartTd.classList.add("heart");
                            if (trackedSet.has(key)) {
                                heartTd.classList.add("liked");
                            } else {
                                heartTd.classList.add("unliked");
                            }
                            heartTd.textContent = "❤";

                            heartTd.addEventListener("click", (e) => {
                                e.stopPropagation();
                                heartTd.classList.toggle("liked");
                                heartTd.classList.toggle("unliked");

                                if (trackedSet.has(key)) {
                                    trackedSet.delete(key);
                                } else {
                                    trackedSet.add(key);
                                }

                                renderTrackTable();
                            });

                            const schoolTd = document.createElement("td");
                            schoolTd.textContent = entry.校名;

                            const deptTd = document.createElement("td");
                            deptTd.textContent = entry.學系;

                            const scoreTd = document.createElement("td");
                            scoreTd.textContent = calculateScore(entry, formData);

                            const exactMatch = data113.find(e => e.校名 === entry.校名 && e.學系 === entry.學系 && e.採計科目及加權 === entry.採計科目及加權.replace(/[音美體]/g, "術"));

                            const names = name114.find(e => e.校名 === entry.校名 && e.學系 === entry.學系);
                            const names113 = names["113年"].split(" ");
                            const names112 = names["112年"].split(" ");
                            const names111 = names["111年"].split(" ");

                            const match113 = data113.filter(e => e.校名 === entry.校名 && names113.includes(e.學系));
                            const match112 = data112.filter(e => e.校名 === entry.校名 && names112.includes(e.學系));
                            const match111 = data111.filter(e => e.校名 === entry.校名 && names111.includes(e.學系));

                            const historicalTd = document.createElement("td");
                            historicalTd.textContent = `
                                ${exactMatch ? exactMatch.普通生錄取分數 : "採計科目改變"}
                            `;

                            mainRow.appendChild(heartTd);
                            mainRow.appendChild(schoolTd);
                            mainRow.appendChild(deptTd);
                            mainRow.appendChild(scoreTd);
                            mainRow.appendChild(historicalTd);

                            const detailsRow = document.createElement("tr");
                            detailsRow.classList.add("detailsRow");
                            detailsRow.style.display = "none";

                            const formatMatches = (matches) => {
                                if (matches.length === 0) return "-";
                                return matches.map(m => {
                                    let str = `${m.普通生錄取分數}（${m.採計科目及加權}）`;
                                    if (m.普通生同分參酌) str += `，同分參酌：${m.普通生同分參酌}`;
                                    return str;
                                }).join("<br>&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&#8199;");
                            };

                            detailsRow.innerHTML = `
                                <td colspan="5">
                                    學測條件：${entry.學測 || "-"}<br>
                                    英聽條件：${entry.英聽 || "-"}<br>
                                    採計科目及加權：${entry.採計科目及加權.replace(/[音美體]/g, "術")}<br><br>
                                    113年錄取標準：${formatMatches(match113)}<br>
                                    112年錄取標準：${formatMatches(match112)}<br>
                                    111年錄取標準：${formatMatches(match111)}
                                </td>
                            `;

                            mainRow.addEventListener("click", () => {
                                detailsRow.style.display = detailsRow.style.display === "none" ? "table-row" : "none";
                            });

                            passTbody.appendChild(mainRow);
                            passTbody.appendChild(detailsRow);
                        } else {
                            const mainRow = document.createElement("tr");
                            mainRow.classList.add("mainRow");

                            mainRow.innerHTML = `
                                <td>${entry.校名}</td>
                                <td>${entry.學系}</td>
                            `;

                            const names = name114.find(e => e.校名 === entry.校名 && e.學系 === entry.學系);
                            const names113 = names["113年"].split(" ");
                            const names112 = names["112年"].split(" ");
                            const names111 = names["111年"].split(" ");

                            const match113 = data113.filter(e => e.校名 === entry.校名 && names113.includes(e.學系));
                            const match112 = data112.filter(e => e.校名 === entry.校名 && names112.includes(e.學系));
                            const match111 = data111.filter(e => e.校名 === entry.校名 && names111.includes(e.學系));

                            const detailsRow = document.createElement("tr");
                            detailsRow.classList.add("detailsRow");
                            detailsRow.style.display = "none";

                            const formatMatches = (matches) => {
                                if (matches.length === 0) return "-";
                                return matches.map(m => {
                                    let str = `${m.普通生錄取分數}（${m.採計科目及加權}）`;
                                    if (m.普通生同分參酌) str += `，同分參酌：${m.普通生同分參酌}`;
                                    return str;
                                }).join("<br>&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&#8199;");
                            };

                            detailsRow.innerHTML = `
                                <td colspan="2">
                                    學測條件：${entry.學測 || "-"}<br>
                                    英聽條件：${entry.英聽 || "-"}<br>
                                    採計科目及加權：${entry.採計科目及加權.replace(/[音美體]/g, "術")}<br><br>
                                    113年錄取標準：${formatMatches(match113)}<br>
                                    112年錄取標準：${formatMatches(match112)}<br>
                                    111年錄取標準：${formatMatches(match111)}
                                </td>
                            `;

                            mainRow.addEventListener("click", () => {
                                detailsRow.style.display = detailsRow.style.display === "none" ? "table-row" : "none";
                            });

                            failTbody.appendChild(mainRow);
                            failTbody.appendChild(detailsRow);
                        }
                    });

                    renderTrackTable();
                }

                document.querySelectorAll(".school-filter").forEach(cb => {
                    cb.addEventListener("change", renderTables);
                });

                renderTables();
            })
            .catch(error => {
                console.error(error);
                alert("無法載入校系分則資料");
            });
    });

    const showTrackBtn = document.getElementById("showTrack");
    const showPassBtn = document.getElementById("showPass");
    const showFailBtn = document.getElementById("showFail");

    showTrackBtn.addEventListener("click", () => {
        document.getElementById("track").style.display = "block";
        document.getElementById("pass").style.display = "none";
        document.getElementById("fail").style.display = "none";

        showTrackBtn.classList.add("active");
        showPassBtn.classList.remove("active");
        showFailBtn.classList.remove("active");
    });

    showPassBtn.addEventListener("click", () => {
        document.getElementById("pass").style.display = "block";
        document.getElementById("fail").style.display = "none";
        document.getElementById("track").style.display = "none";

        showPassBtn.classList.add("active");
        showFailBtn.classList.remove("active");
        showTrackBtn.classList.remove("active");
    });

    showFailBtn.addEventListener("click", () => {
        document.getElementById("fail").style.display = "block";
        document.getElementById("pass").style.display = "none";
        document.getElementById("track").style.display = "none";

        showFailBtn.classList.add("active");
        showPassBtn.classList.remove("active");
        showTrackBtn.classList.remove("active");
    });

    document.getElementById("print").addEventListener("click", () => {
        const table = document.getElementById("trackTable");
        const headerCells = table.querySelectorAll("thead tr th");
        let csvContent = "";

        const headers = Array.from(headerCells).map(th =>
            th.textContent.trim().replace(/[\r\n]+/g, " ").replace(/,/g, "，")
        );
        csvContent += headers.join(",") + "\n";

        const mainRows = table.querySelectorAll("tbody tr.mainRow");
        mainRows.forEach(row => {
            const cols = row.querySelectorAll("td");
            const rowData = Array.from(cols).map(td =>
                td.textContent.trim().replace(/[\r\n]+/g, " ").replace(/,/g, "，")
            );
            csvContent += rowData.join(",") + "\n";
        });

        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "追蹤清單.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
});


