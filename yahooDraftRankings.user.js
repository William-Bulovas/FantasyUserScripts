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

(async () => {
    const data = await getDraftRankings();

    const queue = JSON.parse(JSON.stringify(data));

    waitForKeyElements (
        ".ys-playertable", 
        (jNode) => {
            appendDataToTable(jNode, data);

            waitForKeyElements(
                "#draft",
                (suggestionsNode) => {
                    updateDraftScoutSuggests(suggestionsNode, queue);
                    listenToChanges(jNode, suggestionsNode, data, queue);
                })
        }
    );
})();
  
const appendDataToTable = (jNode, data) => {  
    const rows = jNode.children().find('tr');

    rows.each((index, obj) => {
        if (index == 0) {
            $(obj).prepend(createYahooStyledHeader('BC Tier'));
            $(obj).prepend(createYahooStyledHeader('BC Rank'));
        } else {
            addData(obj, data);
        }
    });
}

const addData = (obj, data) => {
    let tier = 'NR';
    let rank = 'NR';
    const correctCol = $($(obj).children().get(4));
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
            
    $(obj).prepend(createTierCol(tier));
    $(obj).prepend(createTierCol(rank));

}

const listenToChanges = (jNode, suggestionsNode, data, queue) => {
    const config = { attributes: true, childList: true, subtree: true };

    const callback = (mutationList, observer) => {
        mutationList.forEach(mutation => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeName == "TR") {
                        addData(node, data);
                    }
                });

                mutation.removedNodes.forEach(node => {
                    if (node.nodeName == "TR") {
                        const correctCol = $($(node).children().get(6));
                        const name1 = santizeString($(correctCol.children().get(1)).text());                    
                        const name2 = santizeString($(correctCol.children().get(2)).text());
                        console.log(node);
                        console.log("name1 = " + name1);
                        console.log("name1 = " + name2);

                        if (name1 in queue) {
                            delete queue[name1];
                        } else if (name2 in queue) {
                            delete queue[name2];
                        }
                        updateDraftScoutSuggests(suggestionsNode, queue);
                    }
                })
            }
        });
    };

    const observer = new MutationObserver(callback);
    observer.observe($(jNode)[0], config);
}

const updateDraftScoutSuggests = (jNode, queue) => {
    queue = Object.values(queue);
    console.log(queue);
    if (!$(jNode).is(":visible")) return;
    if ($(jNode).children() === 6) return;

    const qbQueue = queue.filter(data => data["Position"] === "QB");
    const rbQueue = queue.filter(data => data["Position"] === "RB");
    const wrQueue = queue.filter(data => data["Position"] === "WR");
    const teQueue = queue.filter(data => data["Position"] === "TE");

    $($(jNode).children().get(3)).replaceWith(
        `<div id="player-details" class="ltTheme">
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
                <td class="Px-6">${queue[0]["Player.Name"]}</td>
                <td class="Px-6">${qbQueue[0]["Player.Name"]}</td>
                <td class="Px-6">${rbQueue[0]["Player.Name"]}</td>
                <td class="Px-6">${wrQueue[0]["Player.Name"]}</td>
                <td class="Px-6">${teQueue[0]["Player.Name"]}</td>
            </tr>
            <tr class="Fz-s">
                <td class="Px-6">${queue[1]["Player.Name"]}</td>
                <td class="Px-6">${qbQueue[1]["Player.Name"]}</td>
                <td class="Px-6">${rbQueue[1]["Player.Name"]}</td>
                <td class="Px-6">${wrQueue[1]["Player.Name"]}</td>
                <td class="Px-6">${teQueue[1]["Player.Name"]}</td>
            </tr>
            <tr class="Fz-s">
                <td class="Px-6">${queue[2]["Player.Name"]}</td>
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

const createYahooStyledHeader = (title) => {
    return `<th class="ys-stat Hy(m)" title="${title}">
                <div class="ys-stat Whs-nw T-0 Pos-a P-4">
                    ${title}
                    <i class="Icon Wpx-10 ys-dir0"></i>
                </div>
            </th>`
}

const createTierCol = (tier) => {
    return `<td>${tier}</td>`; 
}
