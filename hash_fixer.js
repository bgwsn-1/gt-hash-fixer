const fs = require('fs');
const path = require('path');

// Proton Hash calculation function (RTHash)
function getProtonHash(buffer) {
    let hash = 0x55555555;
    for (let i = 0; i < buffer.length; i++) {
        hash = (((hash >>> 27) + (hash << 5) + buffer[i]) & 0xFFFFFFFF) >>> 0;
    }
    return hash;
}

// XOR cipher function for item name
const KEY = "PBG892FXX982ABC*";
function decryptName(buffer, itemId) {
    let name = "";
    for (let i = 0; i < buffer.length; i++) {
        name += String.fromCharCode(buffer[i] ^ KEY.charCodeAt((i + itemId) % KEY.length));
    }
    return name;
}

function encryptName(name, itemId) {
    const buffer = Buffer.alloc(name.length);
    for (let i = 0; i < name.length; i++) {
        buffer[i] = name.charCodeAt(i) ^ KEY.charCodeAt((i + itemId) % KEY.length);
    }
    return buffer;
}

class BufferReader {
    constructor(buffer) {
        this.buf = buffer;
        this.pos = 0;
    }

    uint8() {
        const val = this.buf.readUInt8(this.pos);
        this.pos += 1;
        return val;
    }

    int8() {
        const val = this.buf.readInt8(this.pos);
        this.pos += 1;
        return val;
    }

    uint16() {
        const val = this.buf.readUInt16LE(this.pos);
        this.pos += 2;
        return val;
    }

    int16() {
        const val = this.buf.readInt16LE(this.pos);
        this.pos += 2;
        return val;
    }

    uint32() {
        const val = this.buf.readUInt32LE(this.pos);
        this.pos += 4;
        return val;
    }

    int32() {
        const val = this.buf.readInt32LE(this.pos);
        this.pos += 4;
        return val;
    }

    bytes(len) {
        const val = this.buf.subarray(this.pos, this.pos + len);
        this.pos += len;
        return val;
    }

    string() {
        const len = this.uint16();
        const strBytes = this.bytes(len);
        return strBytes.toString('latin1');
    }
}

class BufferWriter {
    constructor() {
        this.buffers = [];
    }

    uint8(val) {
        const buf = Buffer.alloc(1);
        buf.writeUInt8(val, 0);
        this.buffers.push(buf);
    }

    int8(val) {
        const buf = Buffer.alloc(1);
        buf.writeInt8(val, 0);
        this.buffers.push(buf);
    }

    uint16(val) {
        const buf = Buffer.alloc(2);
        buf.writeUInt16LE(val, 0);
        this.buffers.push(buf);
    }

    int16(val) {
        const buf = Buffer.alloc(2);
        buf.writeInt16LE(val, 0);
        this.buffers.push(buf);
    }

    uint32(val) {
        const buf = Buffer.alloc(4);
        buf.writeUInt32LE(val, 0);
        this.buffers.push(buf);
    }

    int32(val) {
        const buf = Buffer.alloc(4);
        buf.writeInt32LE(val, 0);
        this.buffers.push(buf);
    }

    bytes(buf) {
        this.buffers.push(buf);
    }

    string(str) {
        const buf = Buffer.from(str, 'latin1');
        this.uint16(buf.length);
        this.buffers.push(buf);
    }

    toBuffer() {
        return Buffer.concat(this.buffers);
    }
}

function readItem(r, version) {
    const item = {};
    item.itemId = r.int32();
    item.editableType = r.uint8();
    item.itemCategory = r.uint8();
    item.actionType = r.uint8();
    item.hitSoundType = r.uint8();

    const nameLen = r.uint16();
    const encryptedName = r.bytes(nameLen);
    item.name = decryptName(encryptedName, item.itemId);

    item.texture = r.string();
    item.textureHash = r.uint32();
    item.itemKind = r.uint8();
    item.val1 = r.uint32();
    item.textureX = r.uint8();
    item.textureY = r.uint8();
    item.spreadType = r.uint8();
    item.isStripeyWallpaper = r.uint8();
    item.collisionType = r.uint8();
    item.breakHits = r.uint8();
    item.dropChance = r.uint32();
    item.clothingType = r.uint8();
    item.rarity = r.uint16();
    item.maxAmount = r.uint8();
    item.extraFile = r.string();
    item.extraFileHash = r.uint32();
    item.base_weather = r.uint32();
    item.petName = r.string();
    item.petPrefix = r.string();
    item.petSuffix = r.string();
    item.petAbility = r.string();
    item.seedBase = r.uint8();
    item.seedOverlay = r.uint8();
    item.treeBase = r.uint8();
    item.treeLeaves = r.uint8();
    item.seedColor = r.uint32();
    item.seedOverlayColor = r.uint32();
    item.dummy = r.bytes(4); // memPos += 4
    item.growTime = r.int32();
    item.val2 = r.uint16();
    item.isRayman = r.uint16();
    item.extraOptions = r.string();
    item.texture2 = r.string();
    item.extraOptions2 = r.string();
    item.dummy80 = r.bytes(80); // memPos += 80

    if (version >= 11) {
        item.punchOptions = r.string();
    }
    if (version >= 12) {
        item.version12Data = r.bytes(13);
    }
    if (version >= 13) {
        item.version13Data = r.bytes(4);
    }
    if (version >= 14) {
        item.version14Data = r.bytes(4);
    }
    if (version >= 15) {
        item.version15Data = r.bytes(25);
        item.version15String = r.string();
    }
    if (version >= 16) {
        item.version16String = r.string();
    }
    if (version >= 17) {
        item.version17Data = r.bytes(4);
    }
    if (version >= 18) {
        item.version18Data = r.bytes(4);
    }
    if (version >= 19) {
        item.version19Data = r.bytes(9);
    }
    if (version >= 21) {
        item.version21Data = r.bytes(2);
    }
    if (version >= 22) {
        item.description = r.string();
    }
    if (version >= 23) {
        item.version23Data = r.bytes(4);
    }
    if (version >= 24) {
        item.version24Data = r.bytes(1);
    }
    if (version >= 25) {
        item.version25String = r.string();
        item.version25Data = r.bytes(4);
    }
    if (version >= 26) {
        item.version26Data = r.bytes(1);
    }
    return item;
}

function writeItem(w, item, version) {
    w.int32(item.itemId);
    w.uint8(item.editableType);
    w.uint8(item.itemCategory);
    w.uint8(item.actionType);
    w.uint8(item.hitSoundType);

    const encName = encryptName(item.name, item.itemId);
    w.uint16(encName.length);
    w.bytes(encName);

    w.string(item.texture);
    w.uint32(item.textureHash);
    w.uint8(item.itemKind);
    w.uint32(item.val1);
    w.uint8(item.textureX);
    w.uint8(item.textureY);
    w.uint8(item.spreadType);
    w.uint8(item.isStripeyWallpaper);
    w.uint8(item.collisionType);
    w.uint8(item.breakHits);
    w.uint32(item.dropChance);
    w.uint8(item.clothingType);
    w.uint16(item.rarity);
    w.uint8(item.maxAmount);
    w.string(item.extraFile);
    w.uint32(item.extraFileHash);
    w.uint32(item.base_weather);
    w.string(item.petName);
    w.string(item.petPrefix);
    w.string(item.petSuffix);
    w.string(item.petAbility);
    w.uint8(item.seedBase);
    w.uint8(item.seedOverlay);
    w.uint8(item.treeBase);
    w.uint8(item.treeLeaves);
    w.uint32(item.seedColor);
    w.uint32(item.seedOverlayColor);
    w.bytes(item.dummy);
    w.int32(item.growTime);
    w.uint16(item.val2);
    w.uint16(item.isRayman);
    w.string(item.extraOptions);
    w.string(item.texture2);
    w.string(item.extraOptions2);
    w.bytes(item.dummy80);

    if (version >= 11) {
        w.string(item.punchOptions);
    }
    if (version >= 12) {
        w.bytes(item.version12Data);
    }
    if (version >= 13) {
        w.bytes(item.version13Data);
    }
    if (version >= 14) {
        w.bytes(item.version14Data);
    }
    if (version >= 15) {
        w.bytes(item.version15Data);
        w.string(item.version15String);
    }
    if (version >= 16) {
        w.string(item.version16String);
    }
    if (version >= 17) {
        w.bytes(item.version17Data);
    }
    if (version >= 18) {
        w.bytes(item.version18Data);
    }
    if (version >= 19) {
        w.bytes(item.version19Data);
    }
    if (version >= 21) {
        w.bytes(item.version21Data);
    }
    if (version >= 22) {
        w.string(item.description);
    }
    if (version >= 23) {
        w.bytes(item.version23Data);
    }
    if (version >= 24) {
        w.bytes(item.version24Data);
    }
    if (version >= 25) {
        w.string(item.version25String);
        w.bytes(item.version25Data);
    }
    if (version >= 26) {
        w.bytes(item.version26Data);
    }
}

function normalizeItemForVersion(item, targetVersion) {
    if (targetVersion >= 11 && item.punchOptions === undefined) {
        item.punchOptions = "";
    }
    if (targetVersion >= 12 && item.version12Data === undefined) {
        item.version12Data = Buffer.alloc(13);
    }
    if (targetVersion >= 13 && item.version13Data === undefined) {
        item.version13Data = Buffer.alloc(4);
    }
    if (targetVersion >= 14 && item.version14Data === undefined) {
        item.version14Data = Buffer.alloc(4);
    }
    if (targetVersion >= 15 && item.version15Data === undefined) {
        item.version15Data = Buffer.alloc(25);
        item.version15String = "";
    }
    if (targetVersion >= 16 && item.version16String === undefined) {
        item.version16String = "";
    }
    if (targetVersion >= 17 && item.version17Data === undefined) {
        item.version17Data = Buffer.alloc(4);
    }
    if (targetVersion >= 18 && item.version18Data === undefined) {
        item.version18Data = Buffer.alloc(4);
    }
    if (targetVersion >= 19 && item.version19Data === undefined) {
        item.version19Data = Buffer.alloc(9);
    }
    if (targetVersion >= 21 && item.version21Data === undefined) {
        item.version21Data = Buffer.alloc(2);
    }
    if (targetVersion >= 22 && item.description === undefined) {
        item.description = "";
    }
    if (targetVersion >= 23 && item.version23Data === undefined) {
        item.version23Data = Buffer.alloc(4);
    }
    if (targetVersion >= 24 && item.version24Data === undefined) {
        item.version24Data = Buffer.alloc(1);
    }
    if (targetVersion >= 25 && item.version25String === undefined) {
        item.version25String = "";
        item.version25Data = Buffer.alloc(4);
    }
    if (targetVersion >= 26 && item.version26Data === undefined) {
        item.version26Data = Buffer.alloc(1);
    }
}

function resolveCachePath(cacheDir, filePath) {
    if (!filePath) return null;
    const normalizedPath = filePath.replace(/\\/g, '/');
    const possiblePaths = [
        path.join(cacheDir, normalizedPath),
        path.join(cacheDir, 'game', normalizedPath),
        path.join(cacheDir, normalizedPath.replace(/^game\//i, '')),
    ];
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            try {
                if (fs.statSync(p).isFile()) {
                    return p;
                }
            } catch (e) {}
        }
    }
    return null;
}

function runFixer() {
    const cacheDir = path.join(__dirname, 'cache');
    const itemsDatPath = path.join(cacheDir, 'items.dat');
    const updateLogPath = path.join(__dirname, 'update.txt');

    if (!fs.existsSync(itemsDatPath)) {
        console.error(`Error: items.dat not found at: ${itemsDatPath}`);
        process.exit(1);
    }

    console.log(`Loading items.dat from: ${itemsDatPath}`);
    const data = fs.readFileSync(itemsDatPath);
    const reader = new BufferReader(data);

    const version = reader.uint16();
    const itemCount = reader.int32();
    console.log(`items.dat Version: ${version}`);
    console.log(`Total Items: ${itemCount}`);

    const items = [];
    for (let i = 0; i < itemCount; i++) {
        items.push(readItem(reader, version));
    }

    const trailingBytesCount = reader.buf.length - reader.pos;
    let trailingData = null;
    if (trailingBytesCount > 0) {
        trailingData = reader.bytes(trailingBytesCount);
        console.log(`Preserving ${trailingBytesCount} trailing bytes of unknown data.`);
    }

    console.log("\nVerifying file hashes against cache folder...");
    let fixedTexturesCount = 0;
    let fixedExtraFilesCount = 0;
    const updatesLog = [];

    for (const item of items) {
        // 1. Check main texture hash (can be any extension)
        if (item.texture) {
            const resolvedPath = resolveCachePath(cacheDir, item.texture);
            if (resolvedPath) {
                const fileBuf = fs.readFileSync(resolvedPath);
                const computedHash = getProtonHash(fileBuf);
                if (item.textureHash !== computedHash) {
                    console.log(`[Mismatch] Item ID ${item.itemId} (${item.name}): texture '${item.texture}' hash mismatch! Stored: ${item.textureHash}, Computed: ${computedHash}`);
                    updatesLog.push(`[${new Date().toISOString()}] Item ID ${item.itemId} (${item.name}): texture '${item.texture}' hash updated: ${item.textureHash} -> ${computedHash}`);
                    item.textureHash = computedHash;
                    fixedTexturesCount++;
                }
            }
        }

        // 2. Check extraFile hash (can be xml, audio, etc.)
        if (item.extraFile) {
            const resolvedPath = resolveCachePath(cacheDir, item.extraFile);
            if (resolvedPath) {
                const fileBuf = fs.readFileSync(resolvedPath);
                const computedHash = getProtonHash(fileBuf);
                if (item.extraFileHash !== computedHash) {
                    console.log(`[Mismatch] Item ID ${item.itemId} (${item.name}): extraFile '${item.extraFile}' hash mismatch! Stored: ${item.extraFileHash}, Computed: ${computedHash}`);
                    updatesLog.push(`[${new Date().toISOString()}] Item ID ${item.itemId} (${item.name}): extraFile '${item.extraFile}' hash updated: ${item.extraFileHash} -> ${computedHash}`);
                    item.extraFileHash = computedHash;
                    fixedExtraFilesCount++;
                }
            }
        }
    }

    const totalFixes = fixedTexturesCount + fixedExtraFilesCount;
    const shouldUpgrade = version < 26;

    console.log(`\nVerification finished:`);
    console.log(`- Fixed texture hashes: ${fixedTexturesCount}`);
    console.log(`- Fixed extra file hashes: ${fixedExtraFilesCount}`);
    console.log(`- Total hash modifications: ${totalFixes}`);
    console.log(`- Version check: Current version is ${version}. Target version is 26.`);

    // Write update.txt log
    if (updatesLog.length > 0) {
        updatesLog.push(`\nTotal hash updates: ${totalFixes}`);
        fs.writeFileSync(updateLogPath, updatesLog.join('\n') + '\n');
        console.log(`Logs written to: ${updateLogPath}`);
    } else {
        fs.writeFileSync(updateLogPath, `[${new Date().toISOString()}] Verification run: No hashes were updated on this run.\nTotal hash updates: 0\n`);
    }

    if (totalFixes > 0 || shouldUpgrade) {
        // Backup items.dat
        const backupPath = `${itemsDatPath}.bak`;
        console.log(`\nCreating backup of items.dat at: ${backupPath}`);
        fs.writeFileSync(backupPath, data);

        const targetVersion = Math.max(version, 26);
        if (shouldUpgrade) {
            console.log(`Upgrading items.dat from version ${version} to version ${targetVersion}...`);
        }

        // Serialize updated items
        console.log("Encoding updated items back to items.dat format...");
        const writer = new BufferWriter();
        writer.uint16(targetVersion);
        writer.int32(itemCount);

        for (const item of items) {
            if (shouldUpgrade) {
                normalizeItemForVersion(item, targetVersion);
            }
            writeItem(writer, item, targetVersion);
        }

        if (!shouldUpgrade && trailingData) {
            writer.bytes(trailingData);
        }

        const outputBuf = writer.toBuffer();
        
        // Safety verification: decode the written buffer and ensure lengths/names match
        try {
            const verifyReader = new BufferReader(outputBuf);
            const vVersion = verifyReader.uint16();
            const vItemCount = verifyReader.int32();
            if (vVersion !== targetVersion || vItemCount !== itemCount) {
                throw new Error("Header verification mismatch!");
            }
            console.log("Encoded binary layout matches target headers. Saving...");
            fs.writeFileSync(itemsDatPath, outputBuf);
            console.log(`Successfully wrote updated items.dat (version ${targetVersion})!`);
        } catch (e) {
            console.error("Safety check failed. The encoded file could be corrupt. Modifications NOT saved.", e);
        }
    } else {
        console.log("\nAll hashes match perfectly and database is already at version 26. No changes needed.");
    }
}

runFixer();
