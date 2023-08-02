"use strict";
const HTMLTableParser = require("./HTMLTableParser.js");
const fs = require('fs');

async function main() {
    await saveChoppedHTMLResponse();

    const htmlFromFile = fs.readFileSync("htmlChopped", "utf-8");
    console.log(HTMLTableParser.parse(htmlFromFile));
}

async function saveChoppedHTMLResponse() {
    fs.rmSync('htmlChopped', { force: true});

    const response = await fetch('https://aurora.umanitoba.ca/ssb/bwckschd.p_get_crse_unsec', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': '353',
            'Origin': 'https://aurora.umanitoba.ca',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'same-origin'
        },
        body: 'term_in=202290&sel_subj=dummy&sel_day=dummy&sel_schd=dummy&sel_insm=dummy&sel_camp=dummy&sel_levl=dummy&sel_sess=dummy&sel_instr=dummy&sel_ptrm=dummy&sel_attr=dummy&sel_subj=COMP&sel_crse=&sel_title=&sel_from_cred=&sel_to_cred=&sel_camp=%25&sel_levl=%25&sel_ptrm=%25&sel_instr=%25&sel_attr=%25&begin_hh=0&begin_mi=0&begin_ap=a&end_hh=0&end_mi=0&end_ap=a'
    });
    const html = await response.text();
    const htmlChopped = html.substring(html.indexOf("<table  CLASS=\"datadisplaytable\""), html.lastIndexOf("<br />"));
    fs.writeFileSync('htmlChopped', htmlChopped);
}

main().catch(err => console.log(err));