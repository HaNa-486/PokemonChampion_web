# Champions Battle Data API：官方 Sample 全數實測報告

實測日期：2026-07-30（Asia/Taipei）  
官方資料產生時間：`2026-07-29T09:03:13.995Z`  
官方文件：[API Guide](https://championsbattledata.com/api_guide) · [API Rules](https://championsbattledata.com/api-rules/)

## 結論

- 官方 Guide 中共有 **22 個不重複的 sample URL**：14 個 JSON、5 個 CSV、3 個 PNG。
- 實測結果為 **22/22 HTTP 200 且成功解析**。
- 所有回應都有 `Access-Control-Allow-Origin: *`，可由其他網域的瀏覽器前端讀取。
- `/api`、`/api/index`、`/data/pokemon-index.json` 的內容與 SHA-256 完全相同。
- API 資料會更新，文件中的數值是示意快照，不是固定預期值。

完整機器可讀結果在 `champions_api_sample_results.json`；可重跑程式在 `champions_api_samples.py`。

## A. Quick Start 與 Index samples

### 1. `GET /api`

實測：200、JSON、2,959,351 bytes、236 筆 `pokemon`。

這同時是 Quick Start 的 `index` sample 和 Filtering sample 的資料來源。頂層欄位為：

`generatedAt`, `dataVersion`, `assetRoot`, `battleDataFolders`, `dailyDataFolders`, `seasons`, `defaultSeason`, `topicPages`, `pokemonPages`, `pokemon`。

解讀：

- `generatedAt`：整份索引產生時間。
- `dataVersion`：資料版本，可用來判斷快取是否需要更新。
- `defaultSeason: "Current"`：未指定歷史日期時使用 Current 資料。
- `seasons: ["Current", "M4"]`：目前索引知道的賽季。
- `dailyDataFolders`：可用的日期快照；實測有 13 日，從 `M4/28_07_2026` 到 `M4/16_07_2026`。
- `pokemon[]`：每隻寶可夢的完整索引紀錄，包含 Showdown ID、metadata/CSV 路徑、可學招式、型態、能力值和 battle summary。

這份回應約 2.96 MB；正式應用應快取，不要每查一隻寶可夢就重抓。

### 2. `GET /api/index`

實測：200、JSON、2,959,351 bytes、236 筆。

回傳和 `/api` **逐 byte 相同**。它只是語意比較明確的 alias；程式選一個固定使用即可。

### 3. `GET /data/pokemon-index.json`

實測：200、JSON、2,959,351 bytes、236 筆。

回傳也和 `/api` **逐 byte 相同**。差別在 URL 表達它是靜態 JSON 資產；若 CDN／靜態檔快取符合需求，可以使用這條。

### 4. 官方 Filtering sample

官方程式條件是：

```js
entry.summary.types.includes("Ground") &&
Number(entry.summary.baseStats.speed ?? 0) >= 100
```

實際得到 5 筆：

| Pokémon | Showdown ID | Speed | Types |
|---|---|---:|---|
| Excadrill | `excadrill` | 108 | Ground / Steel |
| Garchomp | `garchomp` | 122 | Dragon / Ground |
| Gliscor | `gliscor` | 115 | Ground / Flying |
| Krookodile | `krookodile` | 112 | Ground / Dark |
| Mamoswine | `mamoswine` | 100 | Ice / Ground |

這是 client-side filter，不是伺服器 query；API 仍先回傳全部 236 筆。

## B. Pokemon record samples

### 5. `GET /api/pokemon/garchomp?format=Doubles`

實測：200、JSON、357,140 bytes。

辨識結果：`name=Garchomp`、`showdownId=garchomp`、`requestedFormat=Doubles`、`requestedSeason=Current`。

主要內容：

- `metadataCsv`：Garchomp metadata 檔案路徑。
- `battleDataCsvs`：共 28 個 current/daily、Singles/Doubles 檔案位置。
- `learnableMoveNames`：58 個可學招式名稱。
- `summary.types`：Dragon / Ground。
- `summary.baseStats`：HP 183、Atk 150、Def 115、SpA 100、SpD 105、Spe 122；這是 Champions 網站採用的數值，不應當作本傳遊戲原始種族值。
- `summary.forms`：Garchomp、Mega Garchomp。
- `battleDataCsv`：本次 `format=Doubles` 對應的 Current CSV。
- `battleSummary`：已聚合的 Top／各分類 values／完整 rows，適合卡片或列表顯示。

實測 battle summary 的 Top：Dragon Claw 85.6%、Life Orb 64.7%、隊友 Charizard、Jolly 67.5%、配點 `2/32/0/0/0/32`、Rough Skin 97.4%。

### 6. `GET /api/pokemon/taurospaldeaaqua?format=Doubles&season=M4&days=7`

實測：200、JSON、495,313 bytes。

辨識結果：

- 路由 ID `taurospaldeaaqua` 被解析成 `Paldean Tauros Aqua Breed`。
- 標準 Showdown 名為 `Tauros-Paldea-Aqua`。
- `requestedFormat=Doubles`、`requestedSeason=M4`、`requestedDays=7`。
- `battleDataCsv` 指向 M4 最新日 `28_07_2026`，不是 Current。
- `dailyBattleDataCsvs` 和 `dailyBattleSummary` 各 7 筆，日期為 28 日到 22 日，新到舊。
- 52 個可學招式、Fighting / Water、4 個 Tauros 型態。

`dailyBattleDataCsvs` 只給檔案定位；`dailyBattleSummary` 給各日已整理的 Top 與 rows。若只要畫趨勢，先用 summary；要完整逐列才抓 CSV 或 battle daily endpoint。

## C. Current battle rows 與名稱匹配 samples

所有 current battle 回應的共通結構：

```text
pokemon, showdownId, format, season, date, source, columns, rows
```

`rows` 不是一筆完整 build，而是多種排行混在同一陣列，必須先依 `category` 分組。

| # | Sample | 解析出的 Pokémon | Rows | Top move | Top item | Top teammate | Top nature | Top ability |
|---:|---|---|---:|---|---|---|---|---|
| 7 | `/api/battle/Doubles/garchomp` | Garchomp | 50 | Dragon Claw 85.6% | Life Orb | Charizard | Jolly | Rough Skin |
| 8 | `/api/battle/Doubles/rotomwash` | Rotom Wash | 49 | Hydro Pump 96.4% | Sitrus Berry | Tyranitar | Modest | Levitate |
| 9 | `/api/battle/Doubles/taurospaldeaaqua` | Paldean Tauros Aqua Breed | 51 | Protect 72.5% | Life Orb | Whimsicott | Adamant | Intimidate |
| 10 | `/api/battle/Singles/raichualola` | Alolan Raichu | 49 | Psychic 56.3% | Focus Sash | Garchomp | Modest | Surge Surfer |
| 11 | `/api/battle/Singles/taurospaldeaaqua` | Paldean Tauros Aqua Breed | 51 | Raging Bull 85.5% | Sitrus Berry | Garchomp | Adamant | Intimidate |
| 12 | `/api/battle/Singles/basculegionf` | Basculegion Female | 51 | Aqua Jet 66.8% | Choice Scarf | Garchomp | Modest | Adaptability |

Rows 數不同不是錯誤。固定的五個主要排行通常各 10 筆，`stat_points` 實測 8 筆；特性依寶可夢只有 1～3 筆，所以總數為 49～51。

每列欄位的解讀：

- `column_position`：這隻寶可夢在來源排行中的位置；同一回應的 rows 通常相同。文件示例寫 `position`，但 live battle endpoint 目前回傳的是 `column_position`。
- `category`：`move`, `held_item`, `teammate`, `stat_alignment`, `stat_points`, `ability`。
- `rank`：該 category 內的名次，不是全體寶可夢排名。
- `name`：招式／道具／隊友／性格／特性名稱；`stat_points` 通常為空。
- `percentage`：顯示字串，例如 `85.6%`。
- `percentage_value`：JSON API 補出的數字，運算與排序應使用它。
- `stat_up`, `stat_down`：只對 `stat_alignment` 有意義。
- 六個 `*_points`：只對 `stat_points` 有意義；它是 Champions 的點數配置，不要直接當作本傳 EV。
- `source_time_seconds`：current 資料中的未文件化來源時間欄位；除非網站另有承諾，不宜拿它當穩定業務欄位。
- 隊友目前常見 `percentage=""`、`percentage_value=null`；表示只有排行、沒有可用百分比，不能當成 0%。

名稱匹配 samples 證明 Showdown ID 能正確處理一般別名、地區型態、特殊型態和性別型態。原始檔案仍使用人類可讀的 `saved_name`。

## D. Daily battle samples

### 13. `GET /api/battle/Doubles/garchomp?days=7`

實測：200、JSON、104,395 bytes、7 個快照。

外層 `season=null` 表示沒有指定賽季；`daily[]` 實際全屬 M4，日期從 `28_07_2026` 到 `22_07_2026`。每個快照有 `season`, `date`, `source`, `columns`, `rows`，每日本例都是 50 rows。

第一日（28 日）Top：Dragon Claw 85.6%、Life Orb 64.7%、Charizard、Jolly 67.5%、Rough Skin 97.4%。

### 14. `GET /api/battle/Doubles/garchomp?season=M4&days=7`

實測：200、JSON、104,395 bytes、7 個快照。

外層 `season="M4"`；日期和內容目前與上一個 sample 相同，因為現有歷史資料只有 M4。未來有多個賽季時：

- 不傳 `season`：跨賽季取最新 7 個可用日。
- 傳 `season=M4`：只在 M4 內取最新 7 個可用日。

`days` 是「最多取幾個可用快照」，不是保證涵蓋連續 7 個曆日。

## E. Metadata sample

### 15. `GET /api/metadata/tauros`

實測：200、JSON、1,557 bytes、4 rows。

每 row 是一個型態：

1. Paldean Tauros Aqua Breed
2. Paldean Tauros Blaze Breed
3. Paldean Tauros Combat Breed
4. Tauros

欄位解讀：

- `base_name`：型態群組鍵，本例都是 Tauros。
- `saved_name`：真正用於 battle CSV、sprite 檔名的型態名稱。
- `form`：顯示用型態標籤；一般型態可能是空字串。
- `types`：以 `/` 分隔，例如 `Fighting/Water`。
- `abilities`：以 `|` 分隔，例如 `Intimidate|Anger Point|Cud Chew`。
- `hp/atk/def/spa/spd/spe/total`：Champions 採用的能力值。
- `image_path`：live JSON 實測含 Windows 反斜線；組 URL 前應把 `\\` 正規化為 `/`，並 URL encode 空白。

文件展示 3 個型態、`total=610`，live API 已是 4 個型態且 Aqua 第一列 `total=665`；這證明文件 JSON 是示例，不能拿來寫死測試值。

## F. Raw CSV samples

### 16. Current Doubles Garchomp CSV

`GET /pokemon_champions_assets/battle_data/Doubles/Garchomp.csv`

200、2,866 bytes、50 rows。第一列是 Dragon Claw 85.6%。欄位 15 個，包含 `source_time_seconds`。

### 17. Current Singles Garchomp CSV

`GET /pokemon_champions_assets/battle_data/Singles/Garchomp.csv`

200、3,011 bytes、50 rows。第一列是 Earthquake 99.3%。欄位同 Current Doubles。

### 18. M4 2026-07-16 Doubles Garchomp CSV

`GET /pokemon_champions_assets/battle_data/M4/16_07_2026/Doubles/Garchomp.csv`

200、2,554 bytes、50 rows。第一列是 Dragon Claw 88.3%。歷史 CSV 只有 14 欄，沒有 `source_time_seconds`。

### 19. M4 2026-07-16 Singles Garchomp CSV

`GET /pokemon_champions_assets/battle_data/M4/16_07_2026/Singles/Garchomp.csv`

200、2,547 bytes、50 rows。第一列是 Earthquake 99.4%。同樣沒有 `source_time_seconds`。

### 20. Tauros metadata CSV

`GET /pokemon_champions_assets/metadata/Tauros.csv`

200、896 bytes、4 rows。欄位與 metadata JSON 的 rows 相同，但 CSV 中數字仍是文字，使用者端需自行轉型。

CSV 與 JSON 的選擇：

- JSON battle endpoint 會補 `percentage_value` 並轉換點數為數字，前端較方便。
- CSV 保留較原始資料，適合 pandas、Excel、批次匯入。
- 不要假設 current CSV 與 dated CSV 永遠有相同欄數；按 header 名稱解析。

## G. Image samples

### 21. Tauros sprite

`GET /pokemon_champions_assets/pokemon/Tauros.png`

200、`image/png`、20,347 bytes、有效 PNG、128×128。

### 22. Paldean Tauros Aqua Breed sprite

`GET /pokemon_champions_assets/pokemon/Paldean%20Tauros%20Aqua%20Breed.png`

200、`image/png`、14,101 bytes、有效 PNG、128×128。這個 sample 示範 sprite 使用 `saved_name`，且 URL 的空白要 encode 成 `%20`。

### 23. Dragon type icon

`GET /pokemon_champions_assets/types/Dragon.png`

200、`image/png`、1,535 bytes、有效 PNG、64×64。

> 編號到 23 是因為「官方 Filtering 程式」是額外實作，不是額外 HTTP URL；實際不重複請求數仍為 22。

## 文件示例與 live API 的差異

| 項目 | 文件示例 | 2026-07-30 實測 |
|---|---|---|
| Garchomp Doubles Top move | Earthquake 90.3% | Dragon Claw 85.6% |
| Battle row 位置欄位 | `position` | endpoint 的 `columns/rows` 使用 `column_position` |
| Tauros metadata | 3 型態 | 4 型態，新增 Combat Breed |
| Tauros Aqua total | 610 | 665 |
| Guide daily 日期 | 示意為 23 日 | 最新為 28 日 |
| Current vs dated CSV | 未強調差異 | Current 多 `source_time_seconds` |

因此，穩健程式應檢查 HTTP status、以欄位名稱解析、允許未知欄位、處理 `null`／空字串，並避免把 Top 名稱、百分比、型態數量或 rows 數寫死。

## API Rules 對實作的影響

- 公開專案必須註明資料來源並盡可能連回網站／API 文件。
- 商業使用允許，但不能把原始 API／資料當獨立資料服務轉售或建立競爭 API、mirror、dump、bulk-download service。
- 合理快取允許且建議，但不能做永久鏡像或替代服務。
- 目前沒有固定公開 rate limit；網站仍可因過度負載而限制或封鎖。
- 端點、欄位、規則、正確性和可用性都不保證永久不變。

建議架構是每日或依 `dataVersion` 更新一次 `/api` 快取；畫面需要完整排行時才呼叫 `/api/battle/...`；歷史圖表使用 `days`；圖片與 CSV 依 API 回傳路徑組 URL。
