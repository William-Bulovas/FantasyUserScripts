// ==UserScript==
// @name         Yahoo Draft Boris Chen
// @namespace    YahooDraft
// @version      1
// @author       https://github.com/William-Bulovas
// @grant        GM.xmlHttpRequest
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js 
// @require      https://gist.github.com/raw/2625891/waitForKeyElements.js
// @require      https://raw.githubusercontent.com/William-Bulovas/FantasyUserScripts/main/borisChenDraftRankings.js
// @match        https://sleeper.com/draft/nfl/*
// @updateURL    https://raw.githubusercontent.com/William-Bulovas/FantasyUserScripts/main/yahooDraftRankings.user.js
// ==/UserScript==

let data = new Object();

(async () => {
    data = await getDraftRankings(scoring.Standard);

    const queue = JSON.parse(JSON.stringify(data));

    waitForKeyElements (
        ".draft-rankings", 
        (jNode) => {
            addScoringControl(jNode);
            appendHeaderToTable(jNode);
            appendDataToTable(jNode);
            listenToChanges(jNode, queue);
        }
    );
})();

const addScoringControl = (jNode) => {
    const headerTab = $($(jNode).find(".header-tab-container"));

    $(createSelect()).insertAfter($(headerTab.find(".player-search")));

    $('#Tier-ScoringSelect').on('change', async function() {
        data = await getDraftRankings(scoring[this.value]);
        
        appendDataToTable(jNode);
    });
}

const appendHeaderToTable = (jNode) => {
    const header = $($(jNode).find(".header"));

    console.log($(header.children().get(0)).find(".name"));

    $(`<div class="pts-and-proj col-border-right stat-section-header">BORIS CHEN</div>`)
        .insertAfter($($(header.children().get(0)).find(".name")));

    $('<div class="bye col-sml col-border-right">TIER</div>')
        .insertAfter($($(header.children().get(1)).find(".name")));
    $('<div class="adp col-sml">RANK</div>')
        .insertAfter($($(header.children().get(1)).find(".name")));
};
  
const appendDataToTable = (jNode) => {  
    const rows = jNode.children().find('.player-rank-item2');

    rows.each((index, obj) => {
        addData(obj, data);
    });
}

const addData = (obj) => {
    let tier = 'NR';
    let rank = 'NR';
    const nameCol = $(obj).find(".name-wrapper");
    const name = santizeString($(nameCol).contents().get(0).nodeValue);
    console.log("name = " + name);
    if (data[name] !== null && data[name] !== undefined) {
        tier = data[name]["Tier"];
        rank = data[name]["Rank"];
    } else {
        console.log("could not match this player: " + name);
    }

    if ($(obj).find("#BorisChenTier").length) {
        $(obj).find("#BorisChenTier").find(".value").text(tier)
    } else {
        $(`<div id="BorisChenTier" class="bye col-sml stat-cell col-border-right">
            <span class="value">
                ${tier}
            </span>
            </div>`).insertAfter($(obj).find(".name"));
    }

    if ($(obj).find("#BorisChenRank").length) {
        $(obj).find("#BorisChenRank").find(".value").text(rank)
    } else {
        $(`<div id="BorisChenRank" class="adp col-sml stat-cell">
            <span class="value">
                ${rank}
            </span>
            </div>`).insertAfter($(obj).find(".name"));
    }
}

const listenToChanges = (jNode, queue) => {
    const config = { attributes: true, childList: true, subtree: true };

    const callback = (mutationList, observer) => {
        mutationList.forEach(mutation => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    console.log(node);
                    if ($(node).find(".player-rank-item2").length) {
                        console.log("here");
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

const createSleeperStyledHeader = (title) => {
    return `<div class="adp col-sml">${title}</div>`
}

const createTierCol = (tier) => {
    return `<td>${tier}</td>`; 
}

const createSelect = () => {
    return `<select class="week-selector-dropdown" name="Tier-ScoringSelect" id="Tier-ScoringSelect" style="border:0px">
                <option value="Standard">Std</option>
                <option value="PPR">PPR</option>
                <option value="Half">Half</option>
            </select>`
}
