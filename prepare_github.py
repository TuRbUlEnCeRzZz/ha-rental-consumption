#!/usr/bin/env python3
"""Prepare this repository for publication on a GitHub account."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
USERNAME_TOKEN = "__GITHUB_USERNAME__"
REPOSITORY_TOKEN = "__GITHUB_REPOSITORY__"
TEXT_SUFFIXES = {".md", ".json", ".yml", ".yaml", ".txt"}


def valid_repository_name(value: str) -> str:
    """Validate a GitHub repository name."""
    if not re.fullmatch(r"[A-Za-z0-9_.-]+", value):
        raise argparse.ArgumentTypeError(
            "Le nom du dépôt ne peut contenir que lettres, chiffres, _, - et ."
        )
    return value


def valid_username(value: str) -> str:
    """Validate a GitHub username."""
    if not re.fullmatch(r"[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?", value):
        raise argparse.ArgumentTypeError("Identifiant GitHub invalide")
    if "--" in value:
        raise argparse.ArgumentTypeError("Un identifiant GitHub ne peut pas contenir --")
    return value


def replace_tokens(path: Path, username: str, repository: str) -> bool:
    """Replace repository template tokens in a text file."""
    text = path.read_text(encoding="utf-8")
    updated = text.replace(USERNAME_TOKEN, username).replace(REPOSITORY_TOKEN, repository)
    if updated == text:
        return False
    path.write_text(updated, encoding="utf-8", newline="\n")
    return True


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Prépare le dépôt Consommation locative pour GitHub et HACS."
    )
    parser.add_argument("--username", required=True, type=valid_username)
    parser.add_argument(
        "--repository",
        default="ha-rental-consumption",
        type=valid_repository_name,
    )
    args = parser.parse_args()

    changed: list[Path] = []
    for path in ROOT.rglob("*"):
        if not path.is_file() or ".git" in path.parts:
            continue
        if path.name == Path(__file__).name:
            continue
        if path.suffix.lower() not in TEXT_SUFFIXES and path.name != "CODEOWNERS":
            continue
        if replace_tokens(path, args.username, args.repository):
            changed.append(path.relative_to(ROOT))

    manifest_path = ROOT / "custom_components" / "rental_consumption" / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    expected_owner = f"@{args.username}"
    if manifest.get("codeowners") != [expected_owner]:
        raise SystemExit("Le champ codeowners du manifest n'a pas été correctement préparé.")

    remaining: list[Path] = []
    for path in ROOT.rglob("*"):
        if not path.is_file() or ".git" in path.parts:
            continue
        if path.name == Path(__file__).name:
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        if USERNAME_TOKEN in text or REPOSITORY_TOKEN in text:
            remaining.append(path.relative_to(ROOT))

    if remaining:
        names = ", ".join(str(path) for path in remaining)
        raise SystemExit(f"Des marqueurs restent présents dans : {names}")

    print("Dépôt préparé avec succès.")
    print(f"Adresse : https://github.com/{args.username}/{args.repository}")
    if changed:
        print("Fichiers modifiés :")
        for path in changed:
            print(f"  - {path}")


if __name__ == "__main__":
    main()
