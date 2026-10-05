#!/usr/bin/env python3
"""Build database/onecompiler_all_in_one.sql from the split SQL files.

OneCompiler gives you a ready database and runs the whole script at once, so
this removes CREATE DATABASE / USE and the DELIMITER client commands.
Run from the repo root:  python3 scripts/build_onecompiler.py
"""
import re
from pathlib import Path

DB = Path(__file__).resolve().parent.parent / "database"
PARTS = ["01_schema.sql", "02_data.sql", "03_routines.sql", "queries.sql", "demo.sql"]


def for_onecompiler(sql: str) -> str:
    sql = re.sub(r"^CREATE DATABASE[^;]*;\n", "", sql, flags=re.M)
    sql = re.sub(r"^USE campus_events_db;\n", "", sql, flags=re.M)
    sql = re.sub(r"^DELIMITER .*\n", "", sql, flags=re.M)
    return sql.replace("$$", ";")


out = [
    "-- ============================================================\n"
    "-- onecompiler_all_in_one.sql  (GENERATED - do not edit by hand)\n"
    "-- Built by scripts/build_onecompiler.py from the files in database/.\n"
    "-- Paste into https://onecompiler.com/mysql and run.\n"
    "-- ============================================================\n"
]
for name in PARTS:
    out.append(f"\n-- >>>>>>>>>> {name}\n")
    out.append(for_onecompiler((DB / name).read_text()))

(DB / "onecompiler_all_in_one.sql").write_text("".join(out))
print("wrote", DB / "onecompiler_all_in_one.sql")
