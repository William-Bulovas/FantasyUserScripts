// ==UserScript==
// @name     Yahoo Team BorisChen
// @description This script adds a row to the team page in Yahoo Football Fantasy with the boris chen tier
// @version  1.3
// @grant         GM.xmlHttpRequest
// @require https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js 
// @require https://greasyfork.org/scripts/31940-waitforkeyelements/code/waitForKeyElements.js?version=209282
// @require https://greasyfork.org/scripts/431916-borischentiers/code/BorisChenTiers.js?version=967348
// @include https://football.fantasysports.yahoo.com/f1/*/*/team*
// @include /^https?:\/\/football\.fantasysports\.yahoo\.com\/f1\/.*\/[0-9][0-9]?/
// @include https://football.fantasysports.yahoo.com/f1/*/players*
// ==/UserScript==

const TIER_TINTS = [
	"#1e6bb9",
  "#3479c0",
  "#4a88c7",
  "#6197ce",
  "#78a6d5",
  "#8eb5dc",
  "#a5c3e3",
  "#aec9e5",
  "#b7cfe8",
  "#c0d5eb",
  "#c9dbee",
  "#d2e1f1",
  "#dbe7f3",
  "#e4edf6",
  "#edf3f9",
  "#f6f9fc",
  "#ffffff"
];

(async () => {  
  const tierMap = await generateTiers(true);

  waitForKeyElements (
    "#statTable0", 
    (jNode) => {
      appendDataToTable(jNode, tierMap);
    }
  );  
  waitForKeyElements (
    "#statTable1",
    (jNode) => {
      appendDataToTable(jNode, tierMap);
    }
  );
  
  waitForKeyElements (
    "#players-table",
    (jNode) => {
      appendDataToTable(jNode, tierMap);
    }
  );
})();

const appendDataToTable = (jNode, data) => {  
  const rows = jNode.children().find('tr');
    
  let rowToInsert = 1;
  
  if ($(rows.get(0)).children().get(1).className.includes('Js-hidden')) {
    rowToInsert = 2;
  }
  
  rows.each((index, obj) => {
    if (index == 0) {
      
    } else if (index == 1) {
      $($($(obj).children()).eq(rowToInsert)).after(createYahooStyledHeader('BorisChen Tier'));
    } else {
      let tier = '-';
      const name = getName(obj);
      
      if (data[name] !== null && data[name] !== undefined) {
        tier = data[name] + 1;
      } else {
        console.log("could not match this player: " + name);
      }
                  
      $($($(obj).children()).eq(rowToInsert)).after(createTierCol(tier));
    }
  });
};


const createYahooStyledHeader = (title) => {
 return `<th class="ys-stat Hy(m)" title="${title}">
					<div class="ys-stat Whs-nw T-0 Pos-a P-4">
						${title}
						<i class="Icon Wpx-10 ys-dir0"></i>
					</div>
				</th>`
};

const createTierCol = (tier) => {
  const colour = tier < TIER_TINTS.length ? TIER_TINTS[tier - 1]
  								: TIER_TINTS[TIER_TINTS.length - 1];
  
	return `<td class="Alt Ta-c Bdrstart"
							style="background-color: ${colour}; opacity: 0.75">
						${tier}
					</td>`; 
};

const getName = (jQueryNode) => {  
  const nameCol = $($(jQueryNode).find('.player'));
	const nameRow = $(nameCol.find('.ysf-player-name'));
  const name = $(nameRow.children().get(0)).text();
    
  return santizeString(name);
};

