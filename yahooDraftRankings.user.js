// ==UserScript==
// @name         Yahoo Draft Boris Chen
// @namespace    YahooDraft
// @version      1
// @author       https://github.com/William-Bulovas
// @grant        GM.xmlHttpRequest
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js 
// @require      https://gist.github.com/raw/2625891/waitForKeyElements.js
// @require      https://raw.githubusercontent.com/William-Bulovas/FantasyUserScripts/main/borisChenDraftRankings.js
// @match        https://football.fantasysports.yahoo.com/draftclient/*
// @updateURL    https://raw.githubusercontent.com/William-Bulovas/FantasyUserScripts/main/yahooDraftRankings.user.js
// ==/UserScript==

let data = new Object();
let queue = [];
let setDashboard = false;
const playersSelected = [];

(async () => {
    data = await getDraftRankings(scoring.Standard);

    queue = JSON.parse(JSON.stringify(data));

    waitForKeyElements (
        "#player-listing", 
        (jNode) => {
            appendDataToTable(jNode);

            waitForKeyElements(
                "#draft",
                (suggestionsNode) => {
                    addScoringControl(jNode, suggestionsNode);
                    updateDraftScoutSuggests(suggestionsNode);
                    listenToChanges(jNode, suggestionsNode);
                })
            }
    );
})();

const addScoringControl = (jNode, suggestionsNode) => {
    const headerTab = $($(jNode).find(".ys-tab-header"));

    console.log(headerTab);

    $($(headerTab).children().get(0)).append(createYahooStyledHeaderWithSelect())

    $('#Tier-ScoringSelect').on('change', async function() {
        data = await getDraftRankings(scoring[this.value]);

        queue = JSON.parse(JSON.stringify(data));
        playersSelected.forEach(player => delete queue[player]);
        
        appendDataToTable(jNode);
        updateDraftScoutSuggests(suggestionsNode);
    });
}
  
const appendDataToTable = (jNode) => {  
    const rows = jNode.children().find('tr');

    rows.each((index, obj) => {
        if (index == 0) {
            if (!$(obj).find("#BCTier").length) {
                $(obj).prepend(createYahooStyledHeader('BC Tier', 'BCTier'));
                $(obj).prepend(createYahooStyledHeader('BC Rank', 'BCRank'));    
            }
        } else {
            addData(obj);
        }
    });
}

const addData = (obj) => {
    let tier = 'NR';
    let rank = 'NR';
    let correctCol = $($(obj).children().get(4));
    if ($(obj).find("#BorisChenTier").length) {
        correctCol = $($(obj).children().get(6));
    }
    const name = santizeString($(correctCol.children().get(1)).text());
    
    if (data[name] !== null && data[name] !== undefined) {
        tier = data[name]["Tier"];
        rank = data[name]["Rank"];
    } else {
        // Some names are in a different column 
        const name = santizeString($(correctCol.children().get(2)).text());
        if (data[name] !== null && data[name] !== undefined) {
            tier = data[name]["Tier"];
            rank = data[name]["Rank"];
        } else {
            console.log("could not match this player: " + name);
        }
    }
    
    if ($(obj).find("#BorisChenTier").length) {
        $(obj).find("#BorisChenTier").text(tier);
    } else {
        $(obj).prepend(`<td id="BorisChenTier">${tier}</td>`);
    }

    if ($(obj).find("#BorisChenRank").length) {
        $(obj).find("#BorisChenRank").text(rank);
    } else {
        $(obj).prepend(`<td id="BorisChenRank">${rank}</td>`);
    }
}

const listenToChanges = (jNode, suggestionsNode) => {
    const config = { attributes: true, childList: true, subtree: true };

    const callback = (mutationList, observer) => {
        mutationList.forEach(mutation => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeName == "TR") {
                        addData(node);
                    }
                });

                mutation.removedNodes.forEach(node => {
                    if (node.nodeName == "TR") {
                        const correctCol = $($(node).children().get(6));
                        const name1 = santizeString($(correctCol.children().get(1)).text());                    
                        const name2 = santizeString($(correctCol.children().get(2)).text());

                        if (name1 in queue) {
                            delete queue[name1];
                            playersSelected.push(name1);
                        } else if (name2 in queue) {
                            delete queue[name2];
                            playersSelected.push(name2);
                        }

                        updateDraftScoutSuggests(suggestionsNode);
                    }
                })
            }
        });
    };

    const observer = new MutationObserver(callback);
    observer.observe($(jNode)[0], config);
}

const createYahooStyledHeader = (title, id) => {
    return `<th id="${id}" class="ys-stat Hy(m)" title="${title}">
                <div class="ys-stat Whs-nw T-0 Pos-a P-4">
                    ${title}
                    <i class="Icon Wpx-10 ys-dir0"></i>
                </div>
            </th>`
}

const createTierCol = (tier) => {
    return `<td>${tier}</td>`; 
}


const updateDraftScoutSuggests = (jNode) => {
    const queueValues = Object.values(queue);
    if (!$(jNode).is(":visible")) return;

    const qbQueue = queueValues.filter(data => data["Position"] === "QB");
    const rbQueue = queueValues.filter(data => data["Position"] === "RB");
    const wrQueue = queueValues.filter(data => data["Position"] === "WR");
    const teQueue = queueValues.filter(data => data["Position"] === "TE");

    if ($("#borisChenDashboard").length) {
        $("#borisChenDashboard").replaceWith(
            `<div id="borisChenDashboard" class="ltTheme">
            <div class="Ov(h) Pos(a)" style="height: 100px; top: 166px; left: 210px; right: 240px;">
            <div class="W(100%) H(100%) Py(12px) Px(16px) Bxz(bb) Bgc(#f5f8fa) C(black)">
            <div id="assistant-recommendations" class="ys-playerdetails-table FancyBox ltTheme Mx-a Bd(n)" style="max-width: 1000px;">
            <table class="W-100 Ta-c M-0" aria-label="Selected player details">
                <thead>
                <tr class="Fz-xs">
                    <th class="Whs-nw Px-6">Best Overall</th>
                    <th class="Whs-nw Px-6">Best QB</th>
                    <th class="Whs-nw Px-6">Best RB</th>
                    <th class="Whs-nw Px-6">Best WR</th>
                    <th class="Whs-nw Px-6">Best TE</th>
                </tr>
                </thead>
                <tbody>
                <tr class="Fz-s">
                    <td class="Px-6">${queueValues[0]["Player.Name"]}</td>
                    <td class="Px-6">${qbQueue[0]["Player.Name"]}</td>
                    <td class="Px-6">${rbQueue[0]["Player.Name"]}</td>
                    <td class="Px-6">${wrQueue[0]["Player.Name"]}</td>
                    <td class="Px-6">${teQueue[0]["Player.Name"]}</td>
                </tr>
                <tr class="Fz-s">
                    <td class="Px-6">${queueValues[1]["Player.Name"]}</td>
                    <td class="Px-6">${qbQueue[1]["Player.Name"]}</td>
                    <td class="Px-6">${rbQueue[1]["Player.Name"]}</td>
                    <td class="Px-6">${wrQueue[1]["Player.Name"]}</td>
                    <td class="Px-6">${teQueue[1]["Player.Name"]}</td>
                </tr>
                <tr class="Fz-s">
                    <td class="Px-6">${queueValues[2]["Player.Name"]}</td>
                    <td class="Px-6">${qbQueue[2]["Player.Name"]}</td>
                    <td class="Px-6">${rbQueue[2]["Player.Name"]}</td>
                    <td class="Px-6">${wrQueue[2]["Player.Name"]}</td>
                    <td class="Px-6">${teQueue[2]["Player.Name"]}</td>
                </tr>
                </tbody>
                </table>
                </div>
                </div>
                </div>`
        );
    } else if (!setDashboard) {
        $($(jNode).children().get(3)).replaceWith(
            `<div id="borisChenDashboard" class="ltTheme">
            <div class="Ov(h) Pos(a)" style="height: 100px; top: 166px; left: 210px; right: 240px;">
            <div class="W(100%) H(100%) Py(12px) Px(16px) Bxz(bb) Bgc(#f5f8fa) C(black)">
            <div class="ys-playerdetails-table FancyBox ltTheme Mx-a Bd(n)" style="max-width: 1000px;">
            <table class="W-100 Ta-c M-0" aria-label="Selected player details">
                <thead>
                <tr class="Fz-xs">
                    <th class="Whs-nw Px-6">Best Overall</th>
                    <th class="Whs-nw Px-6">Best QB</th>
                    <th class="Whs-nw Px-6">Best RB</th>
                    <th class="Whs-nw Px-6">Best WR</th>
                    <th class="Whs-nw Px-6">Best TE</th>
                </tr>
                </thead>
                <tbody>
                <tr class="Fz-s">
                    <td class="Px-6">${queueValues[0]["Player.Name"]}</td>
                    <td class="Px-6">${qbQueue[0]["Player.Name"]}</td>
                    <td class="Px-6">${rbQueue[0]["Player.Name"]}</td>
                    <td class="Px-6">${wrQueue[0]["Player.Name"]}</td>
                    <td class="Px-6">${teQueue[0]["Player.Name"]}</td>
                </tr>
                <tr class="Fz-s">
                    <td class="Px-6">${queueValues[1]["Player.Name"]}</td>
                    <td class="Px-6">${qbQueue[1]["Player.Name"]}</td>
                    <td class="Px-6">${rbQueue[1]["Player.Name"]}</td>
                    <td class="Px-6">${wrQueue[1]["Player.Name"]}</td>
                    <td class="Px-6">${teQueue[1]["Player.Name"]}</td>
                </tr>
                <tr class="Fz-s">
                    <td class="Px-6">${queueValues[2]["Player.Name"]}</td>
                    <td class="Px-6">${qbQueue[2]["Player.Name"]}</td>
                    <td class="Px-6">${rbQueue[2]["Player.Name"]}</td>
                    <td class="Px-6">${wrQueue[2]["Player.Name"]}</td>
                    <td class="Px-6">${teQueue[2]["Player.Name"]}</td>
                </tr>
                </tbody>
                </table>
                </div>
                </div>
                </div>`
        );
    }
}

const createYahooStyledHeaderWithSelect = () => {
    return `<li class="Grid-U Grid Va-m Pstart-10">
            <div class="ys-stat Whs-nw T-0 Pos-a P-4">
              Boris Chen Scoring
              <select name="Tier-ScoringSelect" id="Tier-ScoringSelect">
                <option value="Standard">Std</option>
                <option value="PPR">PPR</option>
                <option value="Half">Half</option>
              </select>
            </div>
          </li>`
  };  
