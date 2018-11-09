/* Temporary work file

Purpose to prove different levels of getting metadata

 TODO - stepwise integration
    * MetaDataService.get(commute) DONE
    * integrate into ArchiveItem DONE
    * Make IAJS use proxy, transports etc, conditional on DwebTransport DONE
    * Do contract enforcement
      * Make AI & AIC use [description] and make that an array, not singleton
      * Make process use the list from Arthur
      * Put process into Metadata.get

TODO discuss
    * Please move to debug, rather than console.log so we can selectively turn on/off debugging - I'm seeing all your debugging making it hard to find mine.
    * Can we have non-async versions of get_metadataField, in fact I'd prefer them to default to async so we explicitly fetch the metadta for the obj which matches my semantics
    * Would love to NOT get singleton fields as arrays, that is going to take a LOT of rewriting.
        * I have a config table and enforce single/array to match the IA spec (description may be one that I do differently and am willing to fix)
    * Why is MetaDataService.get not static ?
    * Why doesnt MetaDataService.get give access to the datastructure and require going through "getSafe"
    * RawMetadataAPIResponse.getSafe() doesnt work *AND* why is RawMetadataAPIResponse.metadata not exposed - just makes code more complex and somehow item.ts/js can see it
    * When I pull the metadata in, I store an array of ArchiveFiles - cant easily do this with "RawMeta..."
    * AudioFile does not have a File superclass - would be good to as do common things across files.
    * Would be nice not to bury stuff so deep e.g. IAJSItem.metadataCache.data.metadata  cf ArchiveItem.metadata
 */

process.env.DEBUG="dweb-archive:sandbox dweb-transports dweb-transports:*"; //iajs:* dweb-mirror:* parallel-streams:* dweb-transports dweb-transports:* dweb-objects dweb-objects:* dweb-archive dweb-archive:*";
const debug = require('debug')("dweb-archive:sandbox");

const itemid = "commute";


// ========== Example test using existing Dweb library CURRENTLY FAILING ==============
const ArchiveItemPreIAJS = require("./ArchiveItemOrig");
const ArchiveItem = require("./ArchiveItem");
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
async function test_dwebPREIAJS() {
    try {
        const ai = new ArchiveItemPreIAJS({itemid});
        await ai.fetch_metadata();
        debug("Test of Dweb API PREIAJS complete %o", ai.metadata.description);
    } catch(err) {
        debug("Test of IAJS API PREIAJS failed %o", err);
    }
    return undefined
}

async function test_dweb() {
    try {
        const ai = new ArchiveItem({itemid});
        await ai.fetch_metadata();
        debug("Test of Dweb API complete %o", ai.metadata.description);
    } catch(err) {
        debug("Test of IAJS API failed %o", err);
    }
    return undefined
}

// ========== Example test using IAJS new library - CURRENTLY FAILING ==========

const IAJS = require("iajs");

const MetadataService = IAJS.MetadataService;

async function test_iajs() {
    try {
        const ms = new MetadataService;
        const mdcache = await ms.get({identifier: itemid}); //  YUCK - Seems unneccessarily complex, why not make "get" static
        // Needs cb()
        const description = mdcache.data.getSafe("description"); // YUCK - Doesnt appear to be access to metadata as a structure e.g. mdcache.data.metadata["description"] works in item.js#74 but not here
        debug("Test of IAJS API complete %o", description);
    } catch(err) {
        debug("Test of IAJS API failed %O", err);
    }
    return undefined
}

// ========== Example test using IAJS new library at Controller level - CURRENTLY WORKS ==========

const Item = IAJS.Item;
async function test_iajs_c1() {
    try {
        const iajsItem = new Item(itemid);
        const desc = await iajsItem.getMetadataField("description"); // YUCK - need async on every field access just in case not fetched
        debug("IAJS_C1 Description= %o", desc);
    } catch (err) {
        debug("IAJS_C1 FAIL err = %O", err);
    }
    return undefined;
}
// ========== Example test using IAJS new library at Controller level WITH PRELOAD - CURRENTLY WORKS ==========
async function test_iajs_c2() {
    try {
        const iajsItem2 = new Item(itemid);
        const mdcache = await iajsItem2.getMetadata(); // FAIL - Never returns
        // Looks like I'm going to use mdcache !
        const desc = await iajsItem2.getMetadataField("description"); // YUCK - need async on every field access just in case not fetched
        debug("IAJS C2 Description= %o", desc);
    } catch(err) {
        debug("IAJS Controller test 2 Failed %O",err);
    }
    return undefined;
}

// ===================

async function test() {
    // Without DwebTransports
    await test_dweb();        // WORKS
    await test_iajs();        // FAILING
    await test_iajs_c1();     // WORKS
    await test_iajs_c2();     // WORKS

    global.DwebTransports = require('@internetarchive/dweb-transports'); // Needed by IAUX
    global.DwebObjects = require('@internetarchive/dweb-objects'); //Includes initializing support for names // Needed by IAUX
    await start();
    await test_dwebPREIAJS(); // WORKS
    await test_dweb();        // WORKS
    await test_iajs();        // FAILING
    await test_iajs_c1();     // WORKS
    await test_iajs_c2();     // WORKS
}
test()
console.log("Outer test complete waiting on async");

/*
Example of DEPROMISIFY pattern
    static fetch_json(url, cb) {
        //TODO-PROMISIFY this is a temp patch between cb and promise till p_fetch_json handles cb
        if (cb) {
            this.p_fetch_json(url).then(j => cb(null, j)).catch(err => cb(err));
        } else {
            return this.p_fetch_json(url); // Return a promise
        }
    }

 */