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

let data = new Object();

(async () => {
    data = await getDraftRankings(scoring.Standard);

    const queue = JSON.parse(JSON.stringify(data));

    waitForKeyElements (
        ".tableWrapper", 
        (jNode) => {
            addScoringControl(jNode);
            appendHeader(jNode);
            appendDataToTable(jNode, data);
            listenToChanges(jNode, queue);
        }
    );
})();

const addScoringControl = (jNode) => {
    $($($(".filters").children()).get(0)).append(createSelect());

    $('#Tier-ScoringSelect').on('change', async function() {
        data = await getDraftRankings(scoring[this.value]);
        appendDataToTable(jNode);
    });
}

const appendHeader = (jNode) => {
    const header = $(jNode).find(".fixedDataTableLayout_header");
    const playerSection = $($(header).find(".fixedDataTableCellGroupLayout_cellGroupWrapper").get(0)).children().get(0);
    const statSection = $(header).find(".fixedDataTableCellGroupLayout_cellGroupWrapper").get(1);
    $(playerSection).css('width', '430px');
    $(statSection).css('left', '430px');

    $(playerSection).append(`
    <div class="fixedDataTableCellLayout_main fixedDataTableCellLayout_alignRight public_fixedDataTableCell_alignRight public_fixedDataTableCell_main" role="columnheader" style="height: 24px; width: 45px; left: 332px;">
    <div class="fixedDataTableCellLayout_wrap1 public_fixedDataTableCell_wrap1 cell header-cell sortable" style="height: 24px; width: 45px;">
    <div class="fixedDataTableCellLayout_wrap2 public_fixedDataTableCell_wrap2">
    <div class="fixedDataTableCellLayout_wrap3 public_fixedDataTableCell_wrap3">
    <div class="public_fixedDataTableCell_cellContent">
    <span class="sorter" style="height: 24px; line-height: 24px;">
       <small>BC RANK</small>
    </span></div></div></div></div></div>`);

    $(playerSection).append(`
    <div class="fixedDataTableCellLayout_main fixedDataTableCellLayout_alignRight public_fixedDataTableCell_alignRight public_fixedDataTableCell_main" role="columnheader" style="height: 24px; width: 45px; left: 377px;">
    <div class="fixedDataTableCellLayout_wrap1 public_fixedDataTableCell_wrap1 cell header-cell sortable" style="height: 24px; width: 45px;">
    <div class="fixedDataTableCellLayout_wrap2 public_fixedDataTableCell_wrap2">
    <div class="fixedDataTableCellLayout_wrap3 public_fixedDataTableCell_wrap3">
    <div class="public_fixedDataTableCell_cellContent">
    <span class="sorter" style="height: 24px; line-height: 24px;">
       <small>BC TIER</small>
    </span></div></div></div></div></div>`);
}
  
const appendDataToTable = (jNode) => {  
    const rows = jNode.children().find('[role="row"]');

    rows.each((index, obj) => {
        addData(obj);
    });
}

const addData = (obj) => {
    let tier = 'NR';
    let rank = 'NR';
    const correctCol = $(obj).find(".playerinfo__playername");
    const name = santizeString(correctCol.text());
    
    if (data[name] !== null && data[name] !== undefined) {
        tier = data[name]["Tier"];
        rank = data[name]["Rank"];
    } else {
        console.log("could not match this player: " + name);
    }

    $($(obj).find(".fixedDataTableCellGroupLayout_cellGroupWrapper").get(0)).css('width', '430px');
    $($(obj).find(".fixedDataTableCellGroupLayout_cellGroupWrapper").get(1)).css('left', '430px');
            
    if ($(obj).find("#BorisChenTier").length) {
        $(obj).find("#BorisChenTier").text(tier);
    } else {
        $($(obj).find(".fixedDataTableCellGroupLayout_cellGroupWrapper").get(0)).append(
            `<div id="borischen" class="fixedDataTableCellLayout_main fixedDataTableCellLayout_alignRight public_fixedDataTableCell_alignRight public_fixedDataTableCell_main" role="gridcell" style="height: 40px; width: 45px; left: 332px;">
              <div class="fixedDataTableCellLayout_wrap1 public_fixedDataTableCell_wrap1 cell sortable" style="height: 40px; width: 45px;">
              <div class="fixedDataTableCellLayout_wrap2 public_fixedDataTableCell_wrap2">
              <div class="fixedDataTableCellLayout_wrap3 public_fixedDataTableCell_wrap3">
              <div id="BorisChenTier" class="public_fixedDataTableCell_cellContent">
                ${tier}
              </div>
              </div>
              </div>
              </div>
              </div>`
            );        
    }
    if ($(obj).find("#BorisChenRank").length) {
        $(obj).find("#BorisChenRank").text(rank);
    } else {
        $($(obj).find(".fixedDataTableCellGroupLayout_cellGroupWrapper").get(0)).append(
        `<div id="borischen" class="fixedDataTableCellLayout_main fixedDataTableCellLayout_alignRight public_fixedDataTableCell_alignRight public_fixedDataTableCell_main" role="gridcell" style="height: 40px; width: 45px; left: 377px;">
        <div class="fixedDataTableCellLayout_wrap1 public_fixedDataTableCell_wrap1 cell sortable" style="height: 40px; width: 45px;">
        <div class="fixedDataTableCellLayout_wrap2 public_fixedDataTableCell_wrap2">
        <div class="fixedDataTableCellLayout_wrap3 public_fixedDataTableCell_wrap3">
        <div id="BorisChenRank" class="public_fixedDataTableCell_cellContent">
            ${rank}
        </div>
        </div>
        </div>
        </div>
        </div>`
        );
    }
}

const listenToChanges = (jNode, suggestionsNode, data, queue) => {
    const config = { attributes: true, childList: true, subtree: true };

    const callback = (mutationList, observer) => {
        mutationList.forEach(mutation => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if ($(node).find('.player-news').length && $(node).find('.player-news').text() == $(node).find('.player-news').attr('title')) {
                        appendDataToTable(jNode);
                    }
                });

                mutation.removedNodes.forEach(node => {
                    if (node.nodeName == "TR") {
                        const correctCol = $($(node).children().get(6));
                        const name1 = santizeString($(correctCol.children().get(1)).text());                    
                        const name2 = santizeString($(correctCol.children().get(2)).text());

                        if (name1 in queue) {
                            delete queue[name1];
                        } else if (name2 in queue) {
                            delete queue[name2];
                        }
                    }
                })
            }
            if (mutation.type === 'attributes') {
                
            }
        });
    };

    const observer = new MutationObserver(callback);
    observer.observe($(jNode)[0], config);
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

const createSelect = () => {
    return `
        <div class="dropdown">
            <svg aria-hidden="true" class="dropdown__arrow icon__svg" viewBox="0 0 24 24">
                <use xlink:href="#icon__caret__down">
                </use>
                </svg>
            <select id="Tier-ScoringSelect" class="dropdown__select" style="text-overflow: ellipsis; overflow: hidden; width: 100%;" name="1631051433931::e050000::aaa5ae95:8084:6f31:d2e9:171201276870">
                <option value="Standard">Std</option>
                <option value="PPR">PPR</option>
                <option value="Half">Half</option>
            </select>
        </div>`
}

