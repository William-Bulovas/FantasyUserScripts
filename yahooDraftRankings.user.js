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

(async () => {
    data = await getDraftRankings(scoring.Standard);

    console.log(data);

    const queue = JSON.parse(JSON.stringify(data));

    waitForKeyElements (
        "#player-listing", 
        (jNode) => {
            addScoringControl(jNode);
            appendDataToTable(jNode);
            listenToChanges(jNode, queue);
        }
    );
})();

const addScoringControl = (jNode) => {
    const headerTab = $($(jNode).find(".ys-tab-header"));

    console.log(headerTab);

    $($(headerTab).children().get(0)).append(createYahooStyledHeaderWithSelect())

    $('#Tier-ScoringSelect').on('change', async function() {
        data = await getDraftRankings(scoring[this.value]);
        
        appendDataToTable(jNode);
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

const listenToChanges = (jNode, queue) => {
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
                        console.log(node);
                        console.log("name1 = " + name1);
                        console.log("name1 = " + name2);

                        if (name1 in queue) {
                            delete queue[name1];
                        } else if (name2 in queue) {
                            delete queue[name2];
                        }
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
