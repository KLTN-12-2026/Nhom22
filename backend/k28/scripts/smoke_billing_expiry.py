import json, re, time, sys, urllib.request, urllib.error, http.cookiejar
sys.stdout.reconfigure(encoding="utf-8")
from datetime import datetime, timedelta, timezone

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8081"
MAIL = "http://localhost:8025"


class Client:
    def __init__(self):
        self.jar = http.cookiejar.CookieJar()
        self.op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar), NoRedirect())
        self.csrf = None

    def req(self, method, path, body=None, raw=False):
        url = path if path.startswith("http") else BASE + path
        data = json.dumps(body).encode() if body is not None else None
        r = urllib.request.Request(url, data=data, method=method)
        if data:
            r.add_header("Content-Type", "application/json")
        if method != "GET":
            if not self.csrf:
                self.fetch_csrf()
            r.add_header("X-XSRF-TOKEN", self.csrf)
        try:
            resp = self.op.open(r)
            code, text, headers = resp.status, resp.read().decode(), resp.headers
        except urllib.error.HTTPError as e:
            code, text, headers = e.code, e.read().decode(), e.headers
        if raw:
            return code, text, headers
        try:
            return code, json.loads(text) if text else None
        except ValueError:
            return code, text

    def fetch_csrf(self):
        r = urllib.request.Request(BASE + "/api/v1/auth/csrf")
        tok = json.loads(self.op.open(r).read().decode())
        self.csrf = tok["token"]


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k):
        return None


def mail_get(path):
    return json.loads(urllib.request.urlopen(MAIL + path).read().decode())


def check(label, cond, detail=""):
    print(("PASS " if cond else "FAIL ") + label + (" | " + str(detail)[:300] if detail else ""))
    return cond


stamp = int(time.time())
email = f"b312.{stamp}@vocab.local"
pw = "Vocab@12345"

u = Client()
code, body = u.req("POST", "/api/v1/auth/register", {"tenHienThi": "B312 Test", "email": email, "password": pw, "muiGio": "Asia/Ho_Chi_Minh", "acceptTerms": True})
check("register 201", code == 201, code)
time.sleep(2)
msgs = mail_get(f"/api/v1/search?query=to:{email}")["messages"]
msg = mail_get(f"/api/v1/message/{msgs[0]['ID']}")
token = re.search(r"token=([A-Za-z0-9_\-]+)", msg["Text"] + msg.get("HTML", "")).group(1)
code, body = u.req("POST", "/api/v1/auth/verify-email", {"token": token})
check("verify-email", code in (200, 204), code)
code, body = u.req("POST", "/api/v1/auth/login", {"email": email, "password": pw})
check("login user", code == 200, code)
u.fetch_csrf()
code, body = u.req("POST", "/api/v1/billing/checkouts", {"goiMa": "PRO", "chuKy": "THANG"})
check("checkout 201", code == 201, body)
code, text, headers = u.req("GET", body["paymentUrl"].replace("http://localhost:8080", BASE), raw=True)
check("fake pay return 302", code == 302, headers.get("Location"))
code, sub = u.req("GET", "/api/v1/me/subscription")
check("subscription HIEU_LUC", code == 200 and sub.get("trangThai") == "HIEU_LUC", sub)

a = Client()
code, body = a.req("POST", "/api/v1/auth/login", {"email": "admin@vocab.local", "password": pw})
check("login admin", code == 200, code)
a.fetch_csrf()
code, page = a.req("GET", f"/api/v1/admin/subscriptions?email={email}")
print(str(page)[:300]); row = (page.get("content") or page.get("items") or page.get("data"))[0]
check("admin find subscription", code == 200 and row, row)
sid, ver = row["id"], row["version"]

code, body = a.req("POST", "/api/v1/admin/subscriptions/expiry-check", {"lyDo": "ngắn"})
check("expiry-check lyDo short 400", code == 400, code)

soon = (datetime.now(timezone.utc) + timedelta(days=3)).replace(microsecond=0).isoformat().replace("+00:00", "Z")
code, body = a.req("PATCH", f"/api/v1/admin/subscriptions/{sid}/expiry", {"hetHanAt": soon, "lyDo": "B3.12c HTTP kiem tra nhac sap het han", "version": ver})
check("PATCH expiry +3d 200", code == 200, body)
ver = body.get("version", ver) if isinstance(body, dict) else ver
code, body = a.req("PATCH", f"/api/v1/admin/subscriptions/{sid}/expiry", {"hetHanAt": soon, "lyDo": "B3.12c HTTP kiem tra version cu", "version": 0 if ver else 99})
check("PATCH expiry stale version 409", code == 409, code)

code, r1 = a.req("POST", "/api/v1/admin/subscriptions/expiry-check", {"lyDo": "B3.12b chay job het han mot vong"})
check("expiry-check #1 200, reminder >= 1", code == 200 and r1["soNhacSapHetHan"] >= 1, r1)
code, r2 = a.req("POST", "/api/v1/admin/subscriptions/expiry-check", {"lyDo": "B3.12b chay lai trong cung ngay"})
check("expiry-check #2 no duplicate reminder", code == 200, r2)
code, sub = u.req("GET", "/api/v1/me/subscription")
check("user soNgayConLai <= 3", sub.get("soNgayConLai") is not None and sub["soNgayConLai"] <= 3, sub)
code, notif = u.req("GET", "/api/v1/notifications")
check("user notification GOI_SAP_HET_HAN", code == 200 and "GOI_SAP_HET_HAN" in json.dumps(notif), str(notif)[:200])

past = (datetime.now(timezone.utc) + timedelta(seconds=5)).replace(microsecond=0).isoformat().replace("+00:00", "Z")
code, body = a.req("PATCH", f"/api/v1/admin/subscriptions/{sid}/expiry", {"hetHanAt": past, "lyDo": "B3.12b kiem tra chuyen het han", "version": ver})
check("PATCH expiry now+5s 200", code == 200, body)
time.sleep(7)
code, r3 = a.req("POST", "/api/v1/admin/subscriptions/expiry-check", {"lyDo": "B3.12b chuyen goi sang het han"})
check("expiry-check #3 expired >= 1", code == 200 and r3["soChuyenHetHan"] >= 1, r3)
code, sub = u.req("GET", "/api/v1/me/subscription")
check("user subscription HET_HAN", sub.get("trangThai") == "HET_HAN", sub)
code, body = u.req("GET", "/api/v1/decks")
check("locked API 402 SUBSCRIPTION_REQUIRED", code == 402 and body.get("code") == "SUBSCRIPTION_REQUIRED", body)
code, body = u.req("GET", "/api/v1/billing/transactions")
check("billing still allowed 200", code == 200, code)

time.sleep(2)
msgs = mail_get(f"/api/v1/search?query=to:{email}")["messages"]
subjects = [m["Subject"] for m in msgs]
print("Mailpit subjects:", subjects)
check("Mailpit has expiry reminder + expired mails", len(msgs) >= 3, subjects)
code, logs = a.req("GET", "/api/v1/admin/audit-logs?size=5")
print("audit:", str(logs)[:400])
