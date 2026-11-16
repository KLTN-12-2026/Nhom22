import json
import sys
import time
import urllib.error
import urllib.request
import http.cookiejar

sys.stdout.reconfigure(encoding="utf-8")
BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080"
PASSWORD = "Vocab@12345"
DEMO_TEXT = (
    "Last week our team moved to a new office. The commute is longer, but the meeting rooms are bigger "
    "and the cafeteria offers healthy meals. My manager asked me to schedule a training session about "
    "customer feedback and to prepare a short report before the deadline."
)


class Client:
    def __init__(self, email):
        self.email = email
        self.key = email.split("@")[0]
        self.jar = http.cookiejar.CookieJar()
        self.op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))
        self.csrf = None

    def call(self, method, path, body=None, headers=None, ok=(200, 201, 202, 204)):
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(BASE + path, data=data, method=method)
        if data is not None:
            req.add_header("Content-Type", "application/json")
        if method != "GET":
            req.add_header("X-XSRF-TOKEN", self.csrf)
        for k, v in (headers or {}).items():
            req.add_header(k, v)
        try:
            resp = self.op.open(req)
            code, text = resp.status, resp.read().decode()
        except urllib.error.HTTPError as e:
            code, text = e.code, e.read().decode()
        payload = json.loads(text) if text and text.lstrip()[:1] in "{[" else text
        if code not in ok:
            raise RuntimeError(f"{self.email} {method} {path} -> {code} {str(payload)[:300]}")
        return payload

    def login(self):
        self.csrf = json.loads(self.op.open(BASE + "/api/v1/auth/csrf").read().decode())["token"]
        self.call("POST", "/api/v1/auth/login", {"email": self.email, "password": PASSWORD})
        self.csrf = json.loads(self.op.open(BASE + "/api/v1/auth/csrf").read().decode())["token"]
        return self


def library_decks(c):
    return c.call("GET", "/api/v1/library/decks?nguon=MAU&size=20")["items"]


def copy_deck(c, deck_id):
    return c.call("POST", f"/api/v1/decks/{deck_id}/copy", headers={"Idempotency-Key": f"demo-{c.key}-{deck_id}"})


def has_progress(c, deck_id):
    p = c.call("GET", f"/api/v1/decks/{deck_id}/progress?size=50")
    return any(((it.get("chieu") or {}).get("EN_VI") or {}).get("trangThai") not in (None, "MOI") for it in p.get("items", []))


def study(c, deck_id, ratings, minutes=20):
    s = c.call("POST", "/api/v1/learning/sessions", {"boTheId": deck_id, "chieuHoc": "EN_VI", "quyThoiGian": minutes, "cheDo": "THUONG", "hocTuDo": True})
    done = 0
    for i, item in enumerate(s["hangDoi"]):
        if i >= len(ratings):
            break
        ver = (item.get("tienDo") or {}).get("version") or 0
        r = c.call("POST", f"/api/v1/learning/sessions/{s['id']}/reviews", {
            "clientEventId": f"demo-{s['id']}-{i}",
            "theId": item["theId"],
            "chieuHoc": "EN_VI",
            "danhGia": ratings[i],
            "expectedVersion": ver,
            "thoiGianTraLoiMs": 3000 + i * 150,
        }, ok=(200, 201, 422))
        if isinstance(r, dict) and r.get("code") == "BUSINESS_RULE":
            break
        done += 1
    c.call("POST", f"/api/v1/learning/sessions/{s['id']}/finish")
    return done


def practice(c, deck_id, loai, wrong_every=1, tag="p"):
    p = c.call("POST", "/api/v1/practice/sessions", {"loaiBai": loai, "soCau": 10, "boTheId": deck_id})
    answers = []
    for i, q in enumerate(p["cauHoi"]):
        opts = q.get("phuongAn") or []
        if isinstance(opts, dict):
            opts = opts.get("luaChon") or opts.get("items") or []
        if opts:
            pick = opts[0] if i % wrong_every == 0 else opts[-1]
            answers.append({"cauHoiId": q["id"], "luaChonId": str(pick.get("id"))})
        else:
            answers.append({"cauHoiId": q["id"], "noiDung": "demo"})
    r = c.call("POST", f"/api/v1/practice/sessions/{p['id']}/submissions", {"submitKey": f"demo-{tag}-{p['id']}", "thoiGian": 90000, "traLoi": answers})
    return r.get("soCauDung"), len(answers)


def main():
    admin = Client("admin@vocab.local").login()
    an = Client("an@vocab.local").login()
    binh = Client("binh@vocab.local").login()
    chi = Client("chi@vocab.local").login()

    lib = library_decks(an)
    first = lib[0]["id"]
    second = lib[1]["id"] if len(lib) > 1 else first

    plan = [
        (an, [first, second], ["NHO", "QUEN", "KHO", "NHO", "QUEN", "DE", "NHO", "QUEN", "NHO", "KHO", "NHO", "QUEN"]),
        (binh, [first], ["NHO", "DE", "NHO", "NHO", "KHO", "NHO", "DE", "NHO", "NHO", "NHO", "KHO", "NHO", "NHO", "DE", "NHO", "NHO", "NHO", "KHO", "NHO", "NHO"]),
        (chi, [second], ["NHO", "KHO", "QUEN", "NHO"]),
    ]
    summary = {}
    for c, decks, ratings in plan:
        own = [copy_deck(c, d)["id"] for d in decks]
        main_deck = own[0]
        info = {"bo": own}
        info["luotOn"] = "đã có" if has_progress(c, main_deck) else study(c, main_deck, ratings)
        first_practice = c.call("GET", "/api/v1/practice/history?size=1").get("totalElements", 0) == 0
        if c is an:
            if first_practice:
                info["luyen1"] = practice(c, main_deck, "CHON_NGHIA", 1, "an1")
                info["luyen2"] = practice(c, main_deck, "CHON_NGHIA", 1, "an2")
                info["luyen3"] = practice(c, main_deck, "CHON_TU", 2, "an3")
            req = c.call("POST", "/api/v1/ai/card-drafts", {"doanVan": DEMO_TEXT, "boTheId": main_deck}, headers={"Idempotency-Key": f"demo-draft-{c.key}"})
            info["aiNhap"] = req.get("requestId")
            rep = c.call("POST", "/api/v1/reports", {"loaiDoiTuong": "BO_THE", "doiTuongId": int(second), "lyDo": "SAI_NOI_DUNG", "moTa": "Một câu ví dụ trong bộ này dịch chưa sát nghĩa."}, ok=(200, 201, 409))
            info["baoCao"] = rep.get("id") if isinstance(rep, dict) else rep
        if c is chi:
            if first_practice:
                info["luyen1"] = practice(c, main_deck, "CHON_NGHIA", 2, "chi1")
            img = c.call("POST", "/api/v1/ai/card-images", {"tu": "deadline", "nghia": "hạn chót #mo-phong:LOI"}, headers={"Idempotency-Key": f"demo-img-{c.key}"})
            info["aiAnhLoi"] = img.get("requestId")
        summary[c.email] = info
    time.sleep(3)
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    usage = admin.call("GET", "/api/v1/admin/service-usage")
    print("service-usage:", json.dumps(usage, ensure_ascii=False)[:300])


if __name__ == "__main__":
    main()
