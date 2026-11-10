import csv
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

BASE = os.environ.get("VOCAB_API", "http://localhost:8080/api/v1")
EMAIL = os.environ.get("VOCAB_EMAIL", "admin@vocab.local")
PASSWORD = os.environ.get("VOCAB_PASSWORD")
CSV_DIR = Path(__file__).resolve().parent / "csv"

DECKS = {
    "van-phong": ("Văn phòng & công sở", "TOEIC", "CO_BAN"),
    "tai-chinh": ("Tài chính & kế toán", "TOEIC", "TRUNG_CAP"),
    "du-lich": ("Du lịch & sân bay", "GIAO_TIEP", "CO_BAN"),
    "nha-hang": ("Nhà hàng & khách sạn", "TOEIC", "CO_BAN"),
    "mua-sam": ("Mua sắm & dịch vụ", "TOEIC", "CO_BAN"),
    "tuyen-dung": ("Tuyển dụng & phỏng vấn", "TOEIC", "CO_BAN"),
    "giao-tiep": ("Giao tiếp hằng ngày", "GIAO_TIEP", "MOI_BAT_DAU"),
    "hop-dong": ("Hợp đồng & pháp lý", "TOEIC", "TRUNG_CAP"),
    "marketing": ("Marketing & bán hàng", "TOEIC", "TRUNG_CAP"),
    "san-xuat": ("Sản xuất & kho vận", "TOEIC", "TRUNG_CAP"),
    "cong-nghe": ("Công nghệ & máy tính", "TOEIC", "CO_BAN"),
    "suc-khoe": ("Sức khỏe & y tế", "GIAO_TIEP", "CO_BAN"),
    "giao-duc": ("Giáo dục & học tập", "GIAO_TIEP", "CO_BAN"),
    "nha-o": ("Nhà ở & bất động sản", "TOEIC", "CO_BAN"),
    "giai-tri": ("Giải trí & sự kiện", "TOEIC", "CO_BAN"),
    "giao-thong": ("Giao thông & đi lại", "GIAO_TIEP", "CO_BAN"),
    "gia-dinh": ("Gia đình & đời sống", "GIAO_TIEP", "MOI_BAT_DAU"),
    "moi-truong": ("Môi trường & thời tiết", "GIAO_TIEP", "CO_BAN"),
    "the-thao": ("Thể thao & thể hình", "GIAO_TIEP", "CO_BAN"),
    "am-thuc": ("Ẩm thực & nấu ăn", "GIAO_TIEP", "CO_BAN"),
    "thoi-trang": ("Thời trang & làm đẹp", "GIAO_TIEP", "CO_BAN"),
    "am-nhac": ("Âm nhạc & nghệ thuật", "GIAO_TIEP", "CO_BAN"),
    "so-thich": ("Sở thích & thời gian rảnh", "GIAO_TIEP", "MOI_BAT_DAU"),
    "cam-xuc": ("Cảm xúc & tính cách", "GIAO_TIEP", "CO_BAN"),
    "tinh-ban": ("Tình bạn & tình yêu", "GIAO_TIEP", "CO_BAN"),
    "dong-vat": ("Động vật & thiên nhiên", "GIAO_TIEP", "MOI_BAT_DAU"),
    "khoa-hoc": ("Khoa học & vũ trụ", "GIAO_TIEP", "TRUNG_CAP"),
    "lich-su": ("Lịch sử & văn hóa", "GIAO_TIEP", "TRUNG_CAP"),
    "tin-tuc": ("Tin tức & xã hội", "GIAO_TIEP", "TRUNG_CAP"),
    "mang-xa-hoi": ("Mạng xã hội & Internet", "GIAO_TIEP", "CO_BAN"),
}


class Api:
    def __init__(self):
        self.cookies = {}
        self.csrf = None

    def call(self, method, path, body=None, params=None):
        url = BASE + path + ("?" + urllib.parse.urlencode(params) if params else "")
        data = None if body is None else json.dumps(body).encode("utf-8")
        req = urllib.request.Request(url, data=data, method=method)
        req.add_header("Accept", "application/json")
        if data is not None:
            req.add_header("Content-Type", "application/json")
        if self.cookies:
            req.add_header("Cookie", "; ".join(f"{k}={v}" for k, v in self.cookies.items()))
        if self.csrf and method != "GET":
            req.add_header("X-XSRF-TOKEN", self.csrf)
        try:
            with urllib.request.urlopen(req) as res:
                self.keep_cookies(res.headers)
                raw = res.read()
                return json.loads(raw) if raw else None
        except urllib.error.HTTPError as ex:
            detail = ex.read().decode("utf-8", "replace")
            raise RuntimeError(f"{method} {path} -> {ex.code}: {detail}") from None

    def keep_cookies(self, headers):
        for header in headers.get_all("Set-Cookie") or []:
            name, _, value = header.split(";", 1)[0].partition("=")
            if value:
                self.cookies[name.strip()] = value.strip()
            else:
                self.cookies.pop(name.strip(), None)

    def refresh_csrf(self):
        self.csrf = self.call("GET", "/auth/csrf")["token"]

    def pages(self, path, params=None, size=50):
        page = 0
        while True:
            res = self.call("GET", path, params={**(params or {}), "page": page, "size": size})
            yield from res["items"]
            page += 1
            if page >= res["totalPages"]:
                return


def read_cards(slug):
    with open(CSV_DIR / f"{slug}.csv", encoding="utf-8-sig", newline="") as fh:
        for row in csv.DictReader(fh):
            yield {
                "tu": row["tu"],
                "tuLoai": row["tuLoai"] or None,
                "nghiaVi": row["nghiaVi"],
                "phienAm": row["phienAm"] or None,
                "viDuEn": row["viDuEn"] or None,
                "dichVi": row["dichVi"] or None,
                "doKho": int(row["doKho"]) if row["doKho"] else 1,
                "nguon": row["nguon"] or None,
                "nhanIds": [x for x in row["nhanIds"].split(";") if x],
            }


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    if not PASSWORD:
        sys.exit("Set VOCAB_PASSWORD (and optionally VOCAB_EMAIL, VOCAB_API) before running")
    only = set(sys.argv[1:])
    api = Api()
    api.refresh_csrf()
    api.call("POST", "/auth/login", {"email": EMAIL, "password": PASSWORD})
    api.refresh_csrf()

    topics = {t["ten"]: t for t in api.pages("/public/topics")}
    total_added = 0

    for slug, (name, goal, level) in DECKS.items():
        if only and slug not in only:
            continue
        topic = topics.get(name)
        if topic is None:
            print(f"[skip] {slug}: topic '{name}' not found, run R__chu_de.sql first")
            continue

        deck = next((d for d in api.pages("/admin/decks", {"q": name}) if d["ten"] == name), None)
        if deck is None:
            deck = api.call("POST", "/admin/decks", {
                "ten": name,
                "moTa": topic.get("moTa"),
                "chuDeId": topic["id"],
                "trinhDo": level,
                "mucTieu": goal,
            })

        existing = {c["tu"].casefold() for c in api.pages(f"/admin/decks/{deck['id']}/cards")}
        added = 0
        for card in read_cards(slug):
            if card["tu"].casefold() in existing:
                continue
            api.call("POST", f"/admin/decks/{deck['id']}/cards", card)
            existing.add(card["tu"].casefold())
            added += 1

        deck = api.call("GET", f"/admin/decks/{deck['id']}")
        if deck["quyenTruyCap"] != "CONG_KHAI":
            deck = api.call("PATCH", f"/admin/decks/{deck['id']}", {
                "quyenTruyCap": "CONG_KHAI",
                "lyDo": "Xuất bản bộ mẫu theo chủ đề từ CSV",
                "version": deck["version"],
            })
        total_added += added
        print(f"[ok] {slug}: deck {deck['id']} '{name}' +{added} cards, total {deck['soThe']}, {deck['quyenTruyCap']}")

    print(f"done, {total_added} cards added")


if __name__ == "__main__":
    main()
