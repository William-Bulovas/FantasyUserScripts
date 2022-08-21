// ==UserScript==
// @name         ESPN Draft Boris Chen
// @namespace    ESPNDraft
// @version      1
// @author       https://github.com/William-Bulovas
// @grant        GM.xmlHttpRequest
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js 
// @require      https://gist.github.com/raw/2625891/waitForKeyElements.js
// @require      https://raw.githubusercontent.com/William-Bulovas/FantasyUserScripts/main/borisChenDraftRankings.js
// @match        https://fantasy.espn.com/football/draft?*
// @updateURL    https://raw.githubusercontent.com/William-Bulovas/FantasyUserScripts/main/espnDraftRankings.user.js
// ==/UserScript==

(async () => {
    console.log("hello");


    const data = await getDraftRankings();

    const queue = JSON.parse(JSON.stringify(data));


    waitForKeyElements (
        ".players-table", 
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
    const rows = jNode.children().find('[role="row"]');

    console.log(rows);

    rows.each((index, obj) => {
        if (index == 0) {
            // $(obj).children().prepend(createYahooStyledHeader('BC Tier'));
            // $(obj).children().prepend(createYahooStyledHeader('BC Rank'));
        } else {
            addData(obj, data);
        }
    });
}

const addData = (obj, data) => {
    let tier = 'NR';
    let rank = 'NR';
    const correctCol = $(obj).find(".playerinfo__playername");
    const name = santizeString(correctCol.text());

    console.log(name);
    
    if (data[name] !== null && data[name] !== undefined) {
        tier = data[name]["Tier"];
        rank = data[name]["Rank"];
    } else {
        console.log("could not match this player: " + name);
    }
            
    $(obj).children().prepend(createTierCol(tier));
    $(obj).children().prepend(createTierCol(rank));

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

    if (!$(jNode).find("#assistant-recommendations").length) return;

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

const createTierCol = (tier) => {
    return `<div id="borischen" class="fixedDataTableCellLayout_main fixedDataTableCellLayout_alignRight public_fixedDataTableCell_alignRight public_fixedDataTableCell_main" role="gridcell" style="height: 40px; width: 45px; left: 0px;">
      <div class="fixedDataTableCellLayout_wrap1 public_fixedDataTableCell_wrap1 cell sortable" style="height: 40px; width: 45px;">
      <div class="fixedDataTableCellLayout_wrap2 public_fixedDataTableCell_wrap2">
      <div class="fixedDataTableCellLayout_wrap3 public_fixedDataTableCell_wrap3">
      <div class="public_fixedDataTableCell_cellContent">
        ${tier}
      </div>
      </div>
      </div>
      </div>
      </div>`; 
};
