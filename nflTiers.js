// ==UserScript==
// @name     NFL.com BorisChenTiers
// @description This script adds a row to the team and player page in NFL.com Football Fantasy website with the boris chen tier
// @version  1
// @grant         GM.xmlHttpRequest
// @require https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js 
// @require https://greasyfork.org/scripts/31940-waitforkeyelements/code/waitForKeyElements.js?version=209282
// @require https://greasyfork.org/scripts/431916-borischentiers/code/BorisChenTiers.js?version=967341
// @include https://*.fantasy.nfl.com/league/*/team/*
// @include https://*.fantasy.nfl.com/league/9504752/players
// ==/UserScript==

(async () => {  
  const tierMap = await generateTiers();
  
  console.log(tierMap);

  waitForKeyElements (
    ".tableType-player", 
    (jNode) => {
      appendDataToTable(jNode, tierMap);
    }
  );  
})();

const appendDataToTable = (jNode, data) => {  
  const rows = jNode.children().find('tr');
    
  
  rows.each((index, obj) => {
    if (index == 0) {
      
    } else if (index == 1) {
      $($($(obj).children()).eq(1)).after(createNFLStyledHeader('BorisChen Tier'));
    } else {
      let tier = '-';
      const name = getName(obj);
      
      if (data[name] !== null && data[name] !== undefined) {
        tier = data[name] + 1;
      } else {
        console.log("could not match this player: " + name);
      }
                  
      $($($(obj).children()).eq(1)).after(createTierCol(tier));
    }
  });
};


const createNFLStyledHeader = (title) => {
 return `<th class="BorisChenTier">
						${title}
				</th>`
};

const createTierCol = (tier) => {
	return `<td class="playerOpponent">
						<span>${tier}</span>
					</td>`; 
};

const getName = (jQueryNode) => {  
  const name = $($(jQueryNode).find('.playerNameFull')).text();
    
  return santizeString(name);
};

