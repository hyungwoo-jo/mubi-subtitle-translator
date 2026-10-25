#!/usr/bin/env python3
"""Register the native host for one explicitly named browser and extension."""
import argparse
import json
import os
from pathlib import Path
import re
import shlex
import shutil
import sys

NAME = "com.hw.subtitle_translator"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("extension_id")
    parser.add_argument("--browser", choices=["chrome", "chromium", "edge", "brave"], default="chrome")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--reuse", action="store_true", help="Reuse only an identical existing registration")
    parser.add_argument("--provider", choices=["codex", "ollama"], default="codex")
    parser.add_argument("--codex", help="Absolute path to the Codex executable")
    args = parser.parse_args()
    if not re.fullmatch(r"[a-p]{32}", args.extension_id):
        parser.error("Enter the 32-letter extension ID.")
    base = Path(__file__).resolve().parent
    host = base / ("launch.cmd" if os.name == "nt" else "launch.sh")
    manifest = {"name": NAME, "description": "Subtitle Translator for MUBI translation bridge", "path": str(host),
                "type": "stdio", "allowed_origins": [f"chrome-extension://{args.extension_id}/"]}
    if os.name == "nt":
        destination = base / f"{NAME}.json"
        browser_key = {"chrome": "Google\\Chrome", "chromium": "Chromium", "edge": "Microsoft\\Edge", "brave": "BraveSoftware\\Brave-Browser"}[args.browser]
    elif sys.platform == "darwin":
        folder = {"chrome": "Google/Chrome", "chromium": "Chromium", "edge": "Microsoft Edge", "brave": "BraveSoftware/Brave-Browser"}[args.browser]
        destination = Path.home() / "Library/Application Support" / folder / "NativeMessagingHosts" / f"{NAME}.json"
    else:
        folder = {"chrome": "google-chrome", "chromium": "chromium", "edge": "microsoft-edge", "brave": "BraveSoftware/Brave-Browser"}[args.browser]
        destination = Path.home() / ".config" / folder / "NativeMessagingHosts" / f"{NAME}.json"
    if args.dry_run:
        print(json.dumps({"destination": str(destination), "manifest": manifest}, ensure_ascii=False, indent=2))
        return
    executable = shutil.which(args.codex or "codex")
    if not executable and args.provider == "codex":
        parser.error("Install Codex CLI first, or specify its path with --codex.")
    reuse = destination.exists()
    if reuse:
        try:
            existing = json.loads(destination.read_text(encoding="utf-8"))
            matches = all(existing.get(key) == manifest[key] for key in ("name", "path", "type", "allowed_origins")) and host.is_file()
        except (OSError, ValueError):
            matches = False
        if not args.reuse or not matches:
            parser.error(f"Existing registration differs or --reuse was not supplied. Inspect and archive first: {destination}")
    if os.name == "nt":
        launcher = f'@echo off\r\nset "HW_SUBTITLE_CODEX={executable or "codex"}"\r\n"{sys.executable}" "{base / "host.py"}"\r\n'
    else:
        launcher = f'#!/bin/sh\nexport HW_SUBTITLE_CODEX={shlex.quote(executable or "codex")}\nexec {shlex.quote(sys.executable)} {shlex.quote(str(base / "host.py"))}\n'
    if not reuse:
        host.write_text(launcher, encoding="utf-8")
    if os.name != "nt":
        host.chmod(0o700)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    if os.name == "nt":
        import winreg
        key = f"Software\\{browser_key}\\NativeMessagingHosts\\{NAME}"
        with winreg.CreateKey(winreg.HKEY_CURRENT_USER, key) as registry:
            winreg.SetValueEx(registry, "", 0, winreg.REG_SZ, str(destination))
    print(f"Registered: {destination}")
    print("Reopen the browser and choose Check helper connection in Subtitle Translator for MUBI settings.")


if __name__ == "__main__":
    main()
