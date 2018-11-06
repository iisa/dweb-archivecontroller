/* Temporary work file

Purpose to prove different levels of getting metadata

 TODO - stepwise integration
    * install
    * MetaDataService.get(commute)
    * integrate into ArchiveItem
    * modify to use proxy etc
 */

process.env.DEBUG="dweb-archive:sandbox"; //dweb-mirror:* parallel-streams:* dweb-transports dweb-transports:* dweb-objects dweb-objects:* dweb-archive dweb-archive:*";
const debug = require('debug')("dweb-archive:sandbox");

const itemid = "commute";


// ========== Example test using existing Dweb library CURRENTLY FAILING ==============
const ArchiveItem = require("./ArchiveItem");
global.DwebTransports = require("@internetarchive/dweb-transports");
global.DwebObjects = require('@internetarchive/dweb-objects'); //Includes initializing support for names
//const wrtc = require('wrtc'); // If using webtorrent over webRTC

async function start() {
    return DwebTransports.p_connect({
        //transports: ["HTTP", "WEBTORRENT", "GUN", "IPFS"],
        transports: ["HTTP"],
        //webtorrent: {tracker: {wrtc}},
    }).then(() => {
        const Thttp = DwebTransports.http();
        if (Thttp) Thttp.supportFunctions.push("createReadStream"); // Allow streaming in HTTP, overrides default
    });
}
async function test_dweb() {
    try {
        await start();
        const ai = new ArchiveItem({itemid});
        await ai.fetch_metadata();
        debug("Test of Dweb API complete %o", ai.metadata);
    } catch(err) {
        debug("Test of IAJS API failed %o", err);
    }
}

// ========== Example test using IAJS new library - CURRENTLY FAILING ==========

const IAJS = require("iajs");

const MetadataService = IAJS.MetadataService;

async function test_iajs() {
    try {
        const ms = new MetadataService;
        const meta = await ms.get(itemid); //  YUCK - Seems unneccessarily complex, why not make "get" static
        // Needs cb()
        const description = meta.data.getSafe("description"); // YUCK - Doesnt appear to be access to metadata as a structure
        debug("Test of IAJS API complete %o", metadata);
    } catch(err) {
        debug("Test of IAJS API failed %O", err);
    }
}

// ========== Example test using IAJS new library at Controller level - CURRENTLY WORKS ==========

const Item = IAJS.Item;
async function test_iajs_c1() {
    const iajsItem = new Item(itemid);
    debug("progress so far ...%O", iajsItem);
    const desc = await iajsItem.getMetadataField("description"); // YUCK - need async on every field access just in case not fetched
    debug("Description= %o", desc);
}
// ========== Example test using IAJS new library at Controller level WITH PRELOAD - CURRENTLY UNDER CONSTRUCTION ==========
async function test_iajs_c2() {
    try {
        const iajsItem = new Item(itemid);
        debug("progress so far ...%O", iajsItem);
        await iajsItem.getMetadata(); // FAIL - Never returns
        const desc = await iajsItem.getMetadataField("description"); // YUCK - need async on every field access just in case not fetched
        debug("Description= %o", desc);
    } catch(err) {
        debug("IAJS Controller test 2 Failed %O",err);
    }
}

// ===================

//test_dweb();
//test_iajs();
//test_iajs_c1();
test_iajs_c2();

console.log("Outer test complete waiting on async");