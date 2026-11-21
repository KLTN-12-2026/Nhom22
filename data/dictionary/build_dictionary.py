import gzip
import json
import re
import sys
from pathlib import Path

HEAD = re.compile(r"^@(.*?)(?:\s+(/[^/]*/).*)?\s*$")
FRAGMENT = re.compile(r"^-\S*\)\s*$")
IPA = re.compile(r"^/[^/]+/\s*$")
SPACES = re.compile(r"\s+")


def clean(text):
    return SPACES.sub(" ", text).strip()


class Entry:
    def __init__(self, tu, phien_am):
        self.tu = tu
        self.phien_am = phien_am
        self.nhom = []
        self.idiom = None
        self.last = None

    def group(self, tu_loai=None):
        g = {"tuLoai": tu_loai, "nghia": [], "thanhNgu": []}
        self.nhom.append(g)
        self.idiom = None
        self.last = None
        return g

    def current(self):
        return self.nhom[-1] if self.nhom else self.group()

    def meaning(self, text):
        m = {"noiDung": text, "viDu": []}
        target = self.idiom["nghia"] if self.idiom is not None else self.current()["nghia"]
        target.append(m)
        self.last = m
        return m

    def ensure_meaning(self):
        return self.last if self.last is not None else self.meaning("")

    def payload(self):
        nhom = []
        for g in self.nhom:
            g["thanhNgu"] = [t for t in g["thanhNgu"] if t["cum"]]
            if g["nghia"] or g["thanhNgu"]:
                nhom.append({k: v for k, v in g.items() if v})
        return nhom

    def summary(self):
        for g in self.nhom:
            for m in g["nghia"]:
                if m["noiDung"]:
                    return m["noiDung"][:200]
        for g in self.nhom:
            for t in g["thanhNgu"]:
                for m in t["nghia"]:
                    if m["noiDung"]:
                        return m["noiDung"][:200]
        return None


def parse(path):
    entries = {}
    order = []
    entry = None
    with open(path, encoding="utf-8-sig", errors="replace") as fh:
        for raw in fh:
            line = raw.rstrip("\r\n")
            if not line.strip():
                continue
            mark = line[0]
            body = clean(line[1:])
            if mark == "@":
                m = HEAD.match(line)
                tu = clean(m.group(1)) if m else body
                if not tu or tu.startswith("00-"):
                    entry = None
                    continue
                ipa = m.group(2) if m else None
                if tu in entries:
                    entry = entries[tu]
                    if ipa and not entry.phien_am:
                        entry.phien_am = ipa
                    entry.idiom = None
                    entry.last = None
                else:
                    entry = Entry(tu, ipa)
                    entries[tu] = entry
                    order.append(tu)
                entry.fresh = True
                continue
            if entry is None:
                continue
            if mark == "/" and IPA.match(line.strip()):
                if not entry.phien_am:
                    entry.phien_am = line.strip()
                continue
            if mark == "*":
                entry.group(body or None)
                entry.fresh = False
                continue
            if mark == "-":
                if entry.fresh and not entry.nhom and FRAGMENT.match(line):
                    continue
                if entry.fresh and entry.nhom:
                    entry.group(None)
                entry.fresh = False
                if body:
                    entry.meaning(body)
                continue
            if mark == "!":
                g = entry.current()
                entry.idiom = {"cum": body, "nghia": []}
                g["thanhNgu"].append(entry.idiom)
                entry.last = None
                entry.fresh = False
                continue
            if mark == "=":
                cau, _, dich = line[1:].partition("+")
                ex = {"cau": clean(cau)}
                if clean(dich):
                    ex["dich"] = clean(dich)
                if ex["cau"]:
                    entry.ensure_meaning()["viDu"].append(ex)
                continue
            if mark in "+#":
                if body:
                    m = entry.ensure_meaning()
                    m["ghiChu"] = clean((m.get("ghiChu", "") + " " + body))
                continue
            if entry.last is not None:
                entry.last["noiDung"] = clean(entry.last["noiDung"] + " " + line)
    return [entries[t] for t in order]


def compact(nhom):
    for g in nhom:
        for m in g.get("nghia", []):
            if not m["viDu"]:
                del m["viDu"]
        for t in g.get("thanhNgu", []):
            for m in t["nghia"]:
                if not m["viDu"]:
                    del m["viDu"]
    return nhom


def write(entries, out):
    out.parent.mkdir(parents=True, exist_ok=True)
    count = 0
    with gzip.open(out, "wt", encoding="utf-8", compresslevel=9) as fh:
        for e in entries:
            nhom = compact(e.payload())
            if not nhom or len(e.tu) > 120:
                continue
            row = {"tu": e.tu, "phienAm": e.phien_am, "tomTat": e.summary(), "noiDung": {"nhom": nhom}}
            fh.write(json.dumps(row, ensure_ascii=False, separators=(",", ":")))
            fh.write("\n")
            count += 1
    return count


def main():
    if len(sys.argv) != 4:
        print("usage: build_dictionary.py <anhviet.txt> <vietanh.txt> <out-dir>")
        sys.exit(1)
    out = Path(sys.argv[3])
    for src, name in ((sys.argv[1], "anh-viet.jsonl.gz"), (sys.argv[2], "viet-anh.jsonl.gz")):
        n = write(parse(src), out / name)
        print(name, n)


if __name__ == "__main__":
    main()
