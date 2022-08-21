// ==UserScript==
// @name         BorisChenDraftRankings
// @namespace    BorisChenDraftRankings
// @version      1
// @author       https://github.com/William-Bulovas
// @grant         GM.xmlHttpRequest
// ==/UserScript==

const getDraftRankings = async () => {
    return getHttp("https://s3-us-west-1.amazonaws.com/fftiers/out/weekly-ALL.csv")
        .then(response => {
            return parseCSV(response.responseText);
        })
}
 
const getHttp = (url) => {
    return new Promise(resolve => {
        GM.xmlHttpRequest({
            method: "GET",
            url: url,
            headers: {
                "Accept": "text/plain"
            },
                onload: resolve
            });
    });
}

const parseCSV = (rawStr) => {
    const str = rawStr.replace(/['"]+/g, '');
        
    const headers = str.slice(0, str.indexOf("\n")).split(",");

    const rows = str.slice(str.indexOf("\n") + 1).split("\n");
        
    const map = {};

    rows.forEach(function (row) {
        const values = row.split(',');
        const el = headers.reduce(function (object, header, index) {
            object[header] = values[index];
            return object;
        }, {});
        
        if (el["Player.Name"] !== undefined) {
            const sanitizedName = santizeString(el["Player.Name"]);
                
            map[sanitizedName] = el;
        }
        
    });

    return map;
};

const santizeString = (str) => {
    if (str === "Darrell Henderson") {
        return "darrell henderson jr";
    }
    if (str === "Elijah Mitchell") {
        return "eli mitchell"
    }
    if (str === "Ken Walker III") {
        return "kenneth walker";
    }

    return str.toLowerCase()
        .replace(/\./g, '')
        .replace(/'/g, '')
        .replace(' iii', '')
        .replace(' ii', '');
};
