#!/usr/bin/env python3
"""Run and summarize every unique sample request in Champions Battle Data's API guide."""

from __future__ import annotations

import csv
import hashlib
import io
import json
import struct
import sys
import urllib.error
import urllib.request
from collections import Counter
from pathlib import Path
from typing import Any


BASE_URL = "https://championsbattledata.com"
OUTPUT_PATH = Path(__file__).with_name("champions_api_sample_results.json")

SAMPLES = [
    ("index_api", "/api", "json", "Index endpoint and Quick Start index"),
    ("index_alias", "/api/index", "json", "Index alias"),
    ("index_static", "/data/pokemon-index.json", "json", "Static index JSON"),
    ("pokemon_garchomp", "/api/pokemon/garchomp?format=Doubles", "json", "Pokemon record"),
    ("pokemon_tauros_aqua_daily", "/api/pokemon/taurospaldeaaqua?format=Doubles&season=M4&days=7", "json", "Pokemon record with daily summaries"),
    ("battle_doubles_garchomp", "/api/battle/Doubles/garchomp", "json", "Current battle rows"),
    ("name_rotom_wash", "/api/battle/Doubles/rotomwash", "json", "Showdown name matching"),
    ("name_tauros_aqua_doubles", "/api/battle/Doubles/taurospaldeaaqua", "json", "Showdown form name matching"),
    ("battle_singles_raichu_alola", "/api/battle/Singles/raichualola", "json", "Singles and Showdown form name"),
    ("name_tauros_aqua_singles", "/api/battle/Singles/taurospaldeaaqua", "json", "Singles form name matching"),
    ("name_basculegion_f", "/api/battle/Singles/basculegionf", "json", "Gender form name matching"),
    ("daily_garchomp_cross_season", "/api/battle/Doubles/garchomp?days=7", "json", "Newest daily snapshots across seasons"),
    ("daily_garchomp_m4", "/api/battle/Doubles/garchomp?season=M4&days=7", "json", "Daily snapshots restricted to M4"),
    ("metadata_tauros", "/api/metadata/tauros", "json", "Metadata rows for all Tauros forms"),
    ("csv_current_doubles", "/pokemon_champions_assets/battle_data/Doubles/Garchomp.csv", "csv", "Current Doubles CSV"),
    ("csv_current_singles", "/pokemon_champions_assets/battle_data/Singles/Garchomp.csv", "csv", "Current Singles CSV"),
    ("csv_daily_doubles", "/pokemon_champions_assets/battle_data/M4/16_07_2026/Doubles/Garchomp.csv", "csv", "Dated Doubles CSV"),
    ("csv_daily_singles", "/pokemon_champions_assets/battle_data/M4/16_07_2026/Singles/Garchomp.csv", "csv", "Dated Singles CSV"),
    ("csv_metadata_tauros", "/pokemon_champions_assets/metadata/Tauros.csv", "csv", "Metadata CSV"),
    ("png_tauros", "/pokemon_champions_assets/pokemon/Tauros.png", "png", "Base-form sprite"),
    ("png_tauros_aqua", "/pokemon_champions_assets/pokemon/Paldean%20Tauros%20Aqua%20Breed.png", "png", "Form sprite using saved_name"),
    ("png_type_dragon", "/pokemon_champions_assets/types/Dragon.png", "png", "Type icon"),
]


def fetch(path: str) -> tuple[int, dict[str, str], bytes]:
    request = urllib.request.Request(
        BASE_URL + path,
        headers={"User-Agent": "PokemonChampion API sample verifier/1.0"},
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return response.status, dict(response.headers.items()), response.read()
    except urllib.error.HTTPError as error:
        return error.code, dict(error.headers.items()), error.read()


def category_summary(rows: list[dict[str, Any]]) -> dict[str, Any]:
    counts = Counter(str(row.get("category", "")) for row in rows)
    top: dict[str, Any] = {}
    for row in rows:
        category = str(row.get("category", ""))
        if category and category not in top:
            top[category] = {
                key: row.get(key)
                for key in (
                    "rank", "name", "percentage", "percentage_value", "stat_up",
                    "stat_down", "hp_points", "attack_points", "defense_points",
                    "sp_atk_points", "sp_def_points", "speed_points",
                )
                if row.get(key) not in (None, "")
            }
    return {"rowCount": len(rows), "categoryCounts": dict(counts), "topByCategory": top}


def summarize_index(data: dict[str, Any]) -> dict[str, Any]:
    pokemon = data.get("pokemon", [])
    fast_ground = []
    for entry in pokemon:
        summary = entry.get("summary") or {}
        stats = summary.get("baseStats") or {}
        types = summary.get("types") or []
        if "Ground" in types and float(stats.get("speed") or 0) >= 100:
            fast_ground.append({
                "name": entry.get("name"),
                "showdownId": entry.get("showdownId"),
                "speed": stats.get("speed"),
                "types": types,
            })
    return {
        "topLevelKeys": list(data),
        "generatedAt": data.get("generatedAt"),
        "dataVersion": data.get("dataVersion"),
        "assetRoot": data.get("assetRoot"),
        "battleDataFolders": data.get("battleDataFolders"),
        "defaultSeason": data.get("defaultSeason"),
        "formats": data.get("formats"),
        "seasons": data.get("seasons"),
        "dailyDataFolderCount": len(data.get("dailyDataFolders", [])),
        "dailyDataFoldersFirst7": data.get("dailyDataFolders", [])[:7],
        "dailyDataFoldersLast7": data.get("dailyDataFolders", [])[-7:],
        "pokemonCount": len(pokemon),
        "firstPokemon": ({
            "name": pokemon[0].get("name"),
            "slug": pokemon[0].get("slug"),
            "showdownId": pokemon[0].get("showdownId"),
            "showdownName": pokemon[0].get("showdownName"),
            "metadataCsv": pokemon[0].get("metadataCsv"),
            "battleDataCsvCount": len(pokemon[0].get("battleDataCsvs", [])),
            "learnableMoveCount": len(pokemon[0].get("learnableMoveNames", [])),
            "summaryKeys": list((pokemon[0].get("summary") or {}).keys()),
        } if pokemon else None),
        "officialFilteringExample": {
            "rule": "summary.types includes Ground AND summary.baseStats.speed >= 100",
            "matchCount": len(fast_ground),
            "matches": fast_ground,
        },
    }


def summarize_json(data: Any) -> dict[str, Any]:
    if not isinstance(data, dict):
        return {"jsonType": type(data).__name__, "itemCount": len(data) if isinstance(data, list) else None}
    if "pokemon" in data and isinstance(data.get("pokemon"), list):
        return summarize_index(data)
    result: dict[str, Any] = {"topLevelKeys": list(data)}
    for key in (
        "pokemon", "name", "showdownId", "showdownName", "saved_name", "format",
        "season", "requestedSeason", "requestedFormat", "requestedDays", "date", "source",
    ):
        if key in data:
            result[key] = data[key]
    if "battleDataCsv" in data:
        result["battleDataCsv"] = data["battleDataCsv"]
    if isinstance(data.get("summary"), dict):
        summary = data["summary"]
        primary = summary.get("primary") or {}
        result["pokemonRecord"] = {
            "battleName": data.get("battleName"),
            "slug": data.get("slug"),
            "metadataCsv": data.get("metadataCsv"),
            "battleDataCsvCount": len(data.get("battleDataCsvs", [])),
            "learnableMoveCount": len(data.get("learnableMoveNames", [])),
            "types": summary.get("types"),
            "sprite": summary.get("sprite"),
            "baseStats": summary.get("baseStats"),
            "baseStatTotal": summary.get("baseStatTotal"),
            "primarySavedName": primary.get("saved_name"),
            "abilities": primary.get("abilities"),
            "formCount": len(summary.get("forms", [])),
            "formSavedNames": [form.get("saved_name") for form in summary.get("forms", [])],
        }
    if isinstance(data.get("battleSummary"), dict):
        battle_summary = data["battleSummary"]
        result["battleSummary"] = {
            "keys": list(battle_summary),
            "position": battle_summary.get("position"),
            "top": battle_summary.get("top"),
            "valueCategories": list((battle_summary.get("values") or {}).keys()),
        }
    if isinstance(data.get("rows"), list):
        rows = data["rows"]
        result["columns"] = data.get("columns")
        if rows and "category" in rows[0]:
            result["rows"] = category_summary(rows)
        else:
            result["rowCount"] = len(rows)
            result["firstRow"] = rows[0] if rows else None
            result["savedNames"] = [row.get("saved_name") for row in rows]
    for key in ("dailyBattleDataCsvs", "dailyBattleSummary"):
        if isinstance(data.get(key), list):
            result[key] = {
                "count": len(data[key]),
                "dates": [item.get("date") for item in data[key]],
                "first": data[key][0] if data[key] else None,
            }
    if isinstance(data.get("daily"), list):
        daily = data["daily"]
        result["daily"] = {
            "count": len(daily),
            "dates": [item.get("date") for item in daily],
            "snapshots": [
                {
                    "season": item.get("season"),
                    "date": item.get("date"),
                    "source": item.get("source"),
                    **category_summary(item.get("rows", [])),
                }
                for item in daily
            ],
        }
    return result


def summarize_csv(body: bytes) -> dict[str, Any]:
    text = body.decode("utf-8-sig")
    rows = list(csv.DictReader(io.StringIO(text)))
    categories = Counter(row.get("category", "") for row in rows if "category" in row)
    return {
        "columns": list(rows[0]) if rows else [],
        "rowCount": len(rows),
        "categoryCounts": dict(categories),
        "firstRow": rows[0] if rows else None,
    }


def summarize_png(body: bytes) -> dict[str, Any]:
    valid = body.startswith(b"\x89PNG\r\n\x1a\n") and len(body) >= 24
    width, height = struct.unpack(">II", body[16:24]) if valid else (None, None)
    return {"validPng": valid, "width": width, "height": height}


def main() -> int:
    report: dict[str, Any] = {
        "sourceGuide": BASE_URL + "/api_guide",
        "baseUrl": BASE_URL,
        "requestCount": len(SAMPLES),
        "samples": [],
    }
    raw_hashes: dict[str, str] = {}
    for sample_id, path, kind, purpose in SAMPLES:
        print(f"GET {path}", file=sys.stderr, flush=True)
        status, headers, body = fetch(path)
        item: dict[str, Any] = {
            "id": sample_id,
            "purpose": purpose,
            "method": "GET",
            "url": BASE_URL + path,
            "status": status,
            "contentType": headers.get("Content-Type"),
            "contentLength": len(body),
            "accessControlAllowOrigin": headers.get("Access-Control-Allow-Origin"),
            "sha256": hashlib.sha256(body).hexdigest(),
        }
        try:
            if kind == "json":
                data = json.loads(body)
                item["returnData"] = summarize_json(data)
                raw_hashes[sample_id] = item["sha256"]
            elif kind == "csv":
                item["returnData"] = summarize_csv(body)
            else:
                item["returnData"] = summarize_png(body)
        except Exception as error:  # keep failures visible in the generated audit
            item["parseError"] = f"{type(error).__name__}: {error}"
            item["bodyPreview"] = body[:500].decode("utf-8", errors="replace")
        report["samples"].append(item)

    report["indexEquivalence"] = {
        "apiEqualsApiIndex": raw_hashes.get("index_api") == raw_hashes.get("index_alias"),
        "apiEqualsStaticIndex": raw_hashes.get("index_api") == raw_hashes.get("index_static"),
        "hashes": {key: raw_hashes.get(key) for key in ("index_api", "index_alias", "index_static")},
    }
    report["successfulCount"] = sum(item["status"] == 200 and "parseError" not in item for item in report["samples"])
    OUTPUT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({
        "output": str(OUTPUT_PATH),
        "requestCount": report["requestCount"],
        "successfulCount": report["successfulCount"],
        "indexEquivalence": report["indexEquivalence"],
    }, ensure_ascii=False, indent=2))
    return 0 if report["successfulCount"] == report["requestCount"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
