# Growtopia items.dat Hash Fixer & Version Upgrader

A robust Node.js command-line utility designed to read, verify, repair, and upgrade Growtopia's `items.dat` database files up to version 26.

This tool automatically detects mismatches between the texture hashes stored in `items.dat` and the actual physical assets in your cache folder, calculates correct **Proton RTHashes**, applies **XOR decryption/encryption** for item names, and migrates database schemas to version 26.

---

## 🚀 Key Features

* **Proton Hash Verification**: Calculates and repairs hashes for item textures (`.rttex`) and accessory render files (`.xml`) using the standard Proton engine hashing algorithm.
* **XOR Cipher Handling**: Seamlessly decrypts item names for analysis and encrypts them back on write using the default cipher key.
* **Automatic Schema Upgrade**: Upgrades older `items.dat` files (v11–v25) to version 26 by adding the required binary padding, descriptions, and structural arrays.
* **Safety Verification**: Runs a post-encode validation decode test on the modified database structure before writing back to disk to prevent data corruption.
* **Smart Asset Resolution**: Automatically resolves asset file paths in nested structures like `/game/` or direct cache routes.
* **Automated Log Auditing**: Tracks all changes made to item textures and extra files inside a detailed `update.txt` log.

---

## 📂 Directory Layout

Keep your files arranged as follows inside the workspace:

```text
hash-fixer/
├── cache/
│   ├── items.dat          <-- The active items database to scan and repair
│   ├── GameData/          <-- Extra files (e.g. ItemRenderers, XMLs)
│   └── game/              <-- Texture folders (e.g. rttex, png, sprites)
├── hash_fixer.js          <-- Core Node.js script
├── update.txt             <-- Change log generated after running the tool
└── README.md              <-- This file
```

---

## ⚙️ Technical Mechanics

### 1. Proton RTHash Algorithm
The Proton engine calculates file hashes using the custom **RTHash** function:
```javascript
function getProtonHash(buffer) {
    let hash = 0x55555555;
    for (let i = 0; i < buffer.length; i++) {
        hash = (((hash >>> 27) + (hash << 5) + buffer[i]) & 0xFFFFFFFF) >>> 0;
    }
    return hash;
}
```

### 2. Item Name XOR Cipher
Item names are stored in `items.dat` encrypted with a repeating XOR key. The decryption/encryption algorithm incorporates the item's unique `itemId` to determine the key offset:
* **XOR Key**: `PBG892FXX982ABC*`
* **Cipher Logic**:
  ```javascript
  charByte ^ KEY.charCodeAt((index + itemId) % KEY.length)
  ```

### 3. Path Resolution Strategy
The script tries to match relative texture and extraFile paths (e.g., `interface/large/btn.rttex`) in the cache using three distinct lookups:
1. `cache/<filePath>`
2. `cache/game/<filePath>`
3. `cache/<filePath minus the leading game/>`

---

## 🛠️ Usage Instructions

### Prerequisites
* [Node.js](https://nodejs.org/) (v14 or higher recommended)

### Running the Utility
1. Place the target `items.dat` file you want to verify/update inside the `cache/` directory.
2. Ensure the associated texture files (`.rttex`) and renderer configurations (`.xml`) are located in their respective subdirectories inside `cache/`.
3. Open a terminal (PowerShell, Command Prompt, or Bash) in the `hash-fixer/` directory.
4. Execute the following command:
   ```bash
   node hash_fixer.js
   ```

### Output Results
* **Successful Execution**: The tool updates the hashes in `items.dat`, creates a backup named `items.dat.bak` in the cache directory, and writes the updated database.
* **Audit History**: Check `update.txt` for details of what changes were applied.

---

## 📄 Audit Logging Format (`update.txt`)

When changes are detected, a log is written to `update.txt` detailing the date, item ID, item name, path of the asset, old hash, and newly computed hash:

```text
[2026-06-21T04:09:36.801Z] Item ID 16958 (Samurai Outfit): texture 'samurai_motion.rttex' hash updated: 3606537309 -> 1127270179
[2026-06-21T04:09:36.804Z] Item ID 16958 (Samurai Outfit): extraFile 'GameData/ItemRenderers/Samurai.xml' hash updated: 3418089127 -> 1006509811

Total hash updates: 2
```

---

## 🛡️ Database Schema Reference

The utility reads and writes the following structure for each item:

| Field name | DataType | Version / Notes |
|---|---|---|
| `itemId` | `int32` | Unique Item Identifier |
| `editableType` | `uint8` | |
| `itemCategory` | `uint8` | |
| `actionType` | `uint8` | |
| `hitSoundType` | `uint8` | |
| `name` | `string` | Encrypted/Decrypted via XOR |
| `texture` | `string` | Relates to the main `.rttex` filename |
| `textureHash` | `uint32` | Proton RTHash of the texture file |
| `itemKind` | `uint8` | |
| `val1` | `uint32` | |
| `textureX` | `uint8` | |
| `textureY` | `uint8` | |
| `spreadType` | `uint8` | |
| `isStripeyWallpaper` | `uint8` | |
| `collisionType` | `uint8` | |
| `breakHits` | `uint8` | Block health |
| `dropChance` | `uint32` | Seed drop chance |
| `clothingType` | `uint8` | Inventory slot / wear category |
| `rarity` | `uint16` | |
| `maxAmount` | `uint8` | Max inventory stack size |
| `extraFile` | `string` | External config file (e.g. XML paths) |
| `extraFileHash` | `uint32` | Proton RTHash of the extra file |
| `base_weather` | `uint32` | |
| `petName`, `petPrefix`, `petSuffix`, `petAbility` | `string` | Custom pet identifiers |
| `seedBase`, `seedOverlay`, `treeBase`, `treeLeaves` | `uint8` | Visual sprites offsets |
| `seedColor`, `seedOverlayColor` | `uint32` | Sprite hue modifiers |
| `growTime` | `int32` | Tree growth time in seconds |
| `val2`, `isRayman` | `uint16` | Modifiers |
| `extraOptions`, `texture2`, `extraOptions2` | `string` | Strings for customized items |
| `punchOptions` | `string` | Added in **Version >= 11** |
| `description` | `string` | Added in **Version >= 22** |
