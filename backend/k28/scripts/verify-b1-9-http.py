import concurrent.futures
import hashlib
import io
import json
import os
import re
import secrets
import subprocess
import sys
import time
import uuid
import wave
from datetime import datetime, timezone
from pathlib import Path

import requests
from PIL import Image


BASE = os.environ.get("B19_BASE_URL", "http://localhost:8080")
MAIL = os.environ.get("B19_MAILPIT_URL", "http://localhost:8025")
RUN = uuid.uuid4().hex[:12]
OUTPUT = Path(__file__).resolve().parents[3] / "report" / "evidence" / f"B1.9-http-{RUN}.json"
RESULT = {"runId": RUN, "startedAt": datetime.now(timezone.utc).isoformat(), "baseUrl": BASE, "cases": [], "fixtures": {}}


def save():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    RESULT["passed"] = sum(item["passed"] for item in RESULT["cases"])
    RESULT["failed"] = sum(not item["passed"] for item in RESULT["cases"])
    OUTPUT.write_text(json.dumps(RESULT, ensure_ascii=False, indent=2), encoding="utf-8")


def check(name, condition, details=None):
    RESULT["cases"].append({"name": name, "passed": bool(condition), "details": details})
    save()
    print(f"{'PASS' if condition else 'FAIL'} {name}", flush=True)
    if not condition:
        raise AssertionError(f"{name}: {details}")


def call(session, method, path, body=None, expected=None, name=None, code=None):
    headers = {}
    if method not in ("GET", "HEAD"):
        token = session.get(BASE + "/api/v1/auth/csrf", timeout=15).json()
        headers[token["headerName"]] = token["token"]
    response = session.request(method, BASE + "/api/v1" + path, json=body, headers=headers, timeout=20)
    if expected is not None:
        actual_code = response.json().get("code") if code and response.content else None
        check(name or f"{method} {path}", response.status_code == expected and (not code or actual_code == code), {"method": method, "path": path, "expected": expected, "status": response.status_code, "code": actual_code, "body": response.json() if response.content else None})
    return response


def account(label, admin=False):
    session = requests.Session()
    email = f"b19-{RUN}-{label}@test.local"
    password = "B19" + secrets.token_hex(12)
    registered = call(session, "POST", "/auth/register", {"tenHienThi": "B1.9 " + label, "email": email, "password": password, "muiGio": "Asia/Ho_Chi_Minh", "acceptTerms": True})
    registered.raise_for_status()
    for _ in range(15):
        messages = requests.get(MAIL + "/api/v1/messages", timeout=10).json().get("messages", [])
        message = next((m for m in messages if any(t.get("Address", "").lower() == email for t in m.get("To", []))), None)
        if message:
            content = requests.get(MAIL + "/api/v1/message/" + message["ID"], timeout=10).json()
            match = re.search(r"token=([A-Za-z0-9_-]+)", content.get("Text", "") + content.get("HTML", ""))
            if match:
                call(session, "POST", "/auth/verify-email", {"token": match.group(1)}).raise_for_status()
                break
        time.sleep(1)
    else:
        raise RuntimeError("Verification email not available for test fixture")
    if admin:
        uid = registered.json()["id"]
        RESULT["fixtures"][label] = {"email": email, "userId": uid}
        save()
        sql(f"INSERT INTO nguoi_dung_vai_tro(nguoi_dung_id,vai_tro_id) SELECT {uid},id FROM vai_tro WHERE ma='ADMIN';")
    login = call(session, "POST", "/auth/login", {"email": email, "password": password})
    login.raise_for_status()
    RESULT["fixtures"][label] = {"email": email, "userId": login.json()["id"]}
    save()
    return session


def deck(session, label, public=False):
    response = call(session, "POST", "/decks", {"ten": f"B19 {RUN} {label}", "trinhDo": "CO_BAN", "quyenTruyCap": "CONG_KHAI" if public else "RIENG_TU"})
    response.raise_for_status()
    RESULT["fixtures"][label] = {"deckId": response.json()["id"]}
    save()
    return response.json()["id"]


def upload(session, kind, complete=True):
    buffer = io.BytesIO()
    if kind == "ANH":
        Image.new("RGB", (2, 2), (20, 90, 150)).save(buffer, format="PNG")
        mime = "image/png"
    else:
        with wave.open(buffer, "wb") as audio:
            audio.setnchannels(1)
            audio.setsampwidth(2)
            audio.setframerate(8000)
            audio.writeframes(b"\x00\x00" * 8000)
        mime = "audio/vnd.wave"
    data = buffer.getvalue()
    response = call(session, "POST", "/files/upload-requests", {"loai": kind, "mimeType": mime, "kichThuoc": len(data), "checksum": hashlib.sha256(data).hexdigest()})
    response.raise_for_status()
    result = response.json()
    if complete:
        requests.put(result["uploadUrl"], data=data, headers={"Content-Type": mime}, timeout=20).raise_for_status()
        call(session, "POST", f"/files/{result['fileId']}/complete").raise_for_status()
    return result["fileId"]


def sql(query):
    command = ["docker", "exec", "-i", "vocab-mysql-1", "sh", "-c", 'MYSQL_PWD="$MYSQL_PASSWORD" mysql -u"$MYSQL_USER" "$MYSQL_DATABASE" --batch --skip-column-names --default-character-set=utf8mb4', "--"]
    result = subprocess.run(command, input=query, text=True, capture_output=True, check=True, encoding="utf-8")
    return result.stdout.strip()


def main():
    guest = requests.Session()
    owner = account("owner")
    other = account("other")
    first = deck(owner, "primary")
    public = deck(owner, "public", True)
    secondary = deck(owner, "secondary")
    deleted_parent = deck(owner, "deleted-parent")
    route = f"/decks/{first}/cards"
    create = lambda body, name: call(owner, "POST", route, body, 201, name).json()
    sample = {"tu": "\u00a0Apple\u202f", "tuLoai": " Noun ", "nghiaVi": "\u2007quả táo\u00a0", "phienAm": "/ˈæpəl/", "viDuEn": "I eat an apple.", "dichVi": "Tôi ăn một quả táo.", "doKho": 2, "nguon": "B1.9 HTTP"}
    call(guest, "GET", route, expected=401, name="guest cannot list cards", code="UNAUTHENTICATED")
    call(guest, "POST", route, sample, 401, "guest cannot create cards", "UNAUTHENTICATED")
    raw = call(owner, "POST", route, sample, 201, "create full card")
    card = raw.json()
    cid = card["id"]
    RESULT["fixtures"]["primaryCard"] = cid
    check("response fields, normalization and Location", isinstance(cid, str) and raw.headers.get("Location") == f"/api/v1/cards/{cid}" and card["tu"] == "Apple" and card["nghiaVi"] == "quả táo" and card["version"] == 0 and all(card[k] == sample[k] for k in ("phienAm", "viDuEn", "dichVi", "doKho", "nguon")) and card["nhanIds"] == [] and not card["trung"])
    default = create({"tu": "book", "nghiaVi": "sách"}, "create minimal card")
    check("difficulty default and optional fields", default["doKho"] == 1 and default["tuLoai"] is None and default["anhId"] is None)
    duplicate = create({"tu": " APPLE ", "tuLoai": " NOUN ", "nghiaVi": "táo"}, "duplicate is allowed")
    check("duplicate warning excludes itself", duplicate["trung"] and duplicate["theTrungIds"] == [cid])
    create({"tu": "apple", "tuLoai": "verb", "nghiaVi": "khác từ loại"}, "different POS is allowed")
    independent = call(owner, "POST", f"/decks/{secondary}/cards", {"tu": "apple", "tuLoai": "noun", "nghiaVi": "bộ khác"}, 201, "duplicates limited to parent deck").json()
    check("other deck has no warning", not independent["trung"])
    nfc = create({"tu": "cafe\u0301", "tuLoai": "noun", "nghiaVi": "quán"}, "NFC first card")
    nfc_duplicate = create({"tu": "CAFÉ", "tuLoai": "NOUN", "nghiaVi": "quán"}, "NFC duplicate card")
    check("NFC canonical equivalents warn", nfc_duplicate["theTrungIds"] == [nfc["id"]])
    no_accent = create({"tu": "cafe", "tuLoai": "noun", "nghiaVi": "không dấu"}, "accent distinction card")
    check("accents are preserved in duplicate key", not no_accent["trung"])
    listed = call(owner, "GET", route + "?size=1", expected=200, name="list paginated cards").json()
    check("page envelope and ID descending", listed["page"] == 0 and listed["size"] == 1 and listed["totalElements"] == 7 and listed["items"][0]["id"] == no_accent["id"])
    for suffix in ("?page=-1", "?size=0", "?size=101"):
        call(owner, "GET", route + suffix, expected=400, name="invalid pagination " + suffix, code="VALIDATION_FAILED")
    for parent in (first, public):
        for method, body in (("GET", None), ("POST", sample)):
            call(other, method, f"/decks/{parent}/cards", body, 404, f"foreign {'public' if parent == public else 'private'} deck {method}", "NOT_FOUND")
    call(other, "PATCH", f"/cards/{cid}", {"version": 0, "nghiaVi": "khác"}, 404, "foreign card patch", "NOT_FOUND")
    call(other, "DELETE", f"/cards/{cid}?version=0", expected=404, name="foreign card delete", code="NOT_FOUND")
    call(guest, "PATCH", f"/cards/{cid}", {"version": 0}, 401, "guest patch", "UNAUTHENTICATED")
    call(guest, "DELETE", f"/cards/{cid}?version=0", expected=401, name="guest delete", code="UNAUTHENTICATED")
    for patch, label in (({"tu": ""}, "empty word"), ({"nghiaVi": "\u00a0\u202f"}, "Unicode blank meaning"), ({"doKho": 0}, "difficulty zero"), ({"doKho": 6}, "difficulty six"), ({"tu": "x" * 101}, "word too long"), ({"nhanIds": ["0"]}, "invalid tag ID"), ({"nhanIds": [None]}, "null tag ID")):
        call(owner, "POST", route, {**sample, **patch}, 400, "create rejects " + label, "VALIDATION_FAILED")
    for body, label in (({}, "missing version"), ({"version": -1}, "negative version"), ({"version": 0, "tu": "\u00a0"}, "blank word"), ({"version": 0, "nghiaVi": ""}, "blank meaning"), ({"version": 0, "anhId": "1", "boAnh": True}, "image replace and remove")):
        call(owner, "PATCH", f"/cards/{cid}", body, 400, "patch rejects " + label, "VALIDATION_FAILED")
    call(owner, "DELETE", f"/cards/{cid}", expected=400, name="delete requires version", code="VALIDATION_FAILED")
    call(owner, "DELETE", f"/cards/{cid}?version=-1", expected=400, name="delete rejects negative version", code="VALIDATION_FAILED")
    card = call(owner, "PATCH", f"/cards/{cid}", {"version": 0, "nghiaVi": "táo mới", "nguon": "", "tuLoai": None}, 200, "partial patch").json()
    check("partial patch keeps omitted and null, clears empty optional", card["version"] == 1 and card["tuLoai"] == "Noun" and card["nguon"] is None and card["nghiaVi"] == "táo mới")
    call(owner, "PATCH", f"/cards/{cid}", {"version": 0, "nghiaVi": "stale"}, 409, "stale patch version", "VERSION_CONFLICT")
    call(owner, "DELETE", f"/cards/{cid}?version=0", expected=409, name="stale delete version", code="VERSION_CONFLICT")
    card = call(owner, "PATCH", f"/cards/{cid}", {"version": 1}, 200, "no-op patch").json()
    check("no-op increments version exactly once", card["version"] == 2)
    tags = call(guest, "GET", "/public/tags", expected=200, name="guest public tags").json()
    call(owner, "GET", "/public/tags", expected=200, name="learner public tags")
    call(owner, "GET", "/admin/tags", expected=403, name="learner cannot administer tags", code="FORBIDDEN")
    call(owner, "POST", route, {**sample, "nhanIds": ["9223372036854775807"]}, 422, "missing tag", "BUSINESS_RULE")
    call(owner, "POST", route, {**sample, "nhanIds": ["1", "1"]}, 400, "repeated tag IDs", "VALIDATION_FAILED")
    if not tags["items"]:
        raise RuntimeError("No existing tag fixture; positive tag checks cannot run")
    tid = tags["items"][0]["id"]
    card = call(owner, "PATCH", f"/cards/{cid}", {"version": card["version"], "nhanIds": [tid]}, 200, "tag-only patch").json()
    check("tag-only patch version and links", card["version"] == 3 and card["nhanIds"] == [tid])
    card = call(owner, "PATCH", f"/cards/{cid}", {"version": card["version"], "nhanIds": None}, 200, "null tags retain links").json()
    check("null tag list retained", card["nhanIds"] == [tid] and card["version"] == 4)
    card = call(owner, "PATCH", f"/cards/{cid}", {"version": card["version"], "nhanIds": []}, 200, "clear all tags").json()
    check("empty tag list clears links", card["nhanIds"] == [] and card["version"] == 5)
    image = upload(owner, "ANH")
    replacement = upload(owner, "ANH")
    audio = upload(owner, "AM_THANH")
    foreign = upload(other, "ANH")
    incomplete = upload(owner, "ANH", False)
    RESULT["fixtures"]["files"] = [image, replacement, audio, foreign, incomplete]
    for field, value, status, label in (("anhId", foreign, 404, "foreign file"), ("anhId", incomplete, 422, "incomplete file"), ("anhId", audio, 422, "audio used as image"), ("amTuId", image, 422, "image used as audio"), ("anhId", "9223372036854775807", 404, "missing file")):
        call(owner, "POST", route, {**sample, field: value}, status, label, "NOT_FOUND" if status == 404 else "BUSINESS_RULE")
    card = call(owner, "PATCH", f"/cards/{cid}", {"version": card["version"], "anhId": image, "amTuId": audio, "amCauId": audio}, 200, "attach three file roles").json()
    check("file-only patch increments once", card["version"] == 6 and card["anhId"] == image and card["amTuId"] == audio and card["amCauId"] == audio)
    call(owner, "DELETE", f"/files/{image}", expected=409, name="linked image cannot be deleted", code="CONFLICT")
    card = call(owner, "PATCH", f"/cards/{cid}", {"version": card["version"], "anhId": replacement}, 200, "replace image only").json()
    check("other media roles preserved", card["version"] == 7 and card["anhId"] == replacement and card["amTuId"] == audio and card["amCauId"] == audio)
    call(owner, "GET", f"/files/{image}", expected=200, name="replaced file remains available")
    card = call(owner, "PATCH", f"/cards/{cid}", {"version": card["version"], "boAnh": True}, 200, "unlink image only").json()
    check("unlink leaves audio roles", card["version"] == 8 and card["anhId"] is None and card["amTuId"] == audio)
    call(owner, "GET", f"/files/{replacement}", expected=200, name="unlinked file remains available")
    call(owner, "DELETE", f"/files/{image}", expected=204, name="unreferenced test image can be deleted")
    call(owner, "POST", route, {**sample, "anhId": image}, 404, "deleted file cannot be attached", "NOT_FOUND")
    before = call(owner, "GET", route, expected=200, name="read before failed patch").json()
    call(owner, "PATCH", f"/cards/{cid}", {"version": card["version"], "nghiaVi": "must roll back", "nhanIds": [tid], "anhId": incomplete}, 422, "invalid file patch rolls back", "BUSINESS_RULE")
    after = call(owner, "GET", route, expected=200, name="read after failed patch").json()
    check("failed patch preserves entity version and links", next(x for x in before["items"] if x["id"] == cid) == next(x for x in after["items"] if x["id"] == cid))
    card = call(owner, "PATCH", f"/cards/{cid}", {"version": card["version"], "nhanIds": [tid], "anhId": replacement}, 200, "prepare reference retention").json()
    call(owner, "DELETE", f"/cards/{cid}?version={card['version']}", expected=204, name="soft delete card")
    call(owner, "DELETE", f"/cards/{cid}?version={card['version']}", expected=404, name="repeat delete is not found", code="NOT_FOUND")
    call(owner, "PATCH", f"/cards/{cid}", {"version": card["version"]}, 404, "deleted card cannot be patched", "NOT_FOUND")
    remaining = call(owner, "GET", route, expected=200, name="list after card deletion").json()
    check("deleted card excluded and duplicate warning updated", all(x["id"] != cid for x in remaining["items"]) and not next(x for x in remaining["items"] if x["id"] == duplicate["id"])["trung"])
    retained = sql(f"SELECT xoa_at IS NOT NULL,version,(SELECT COUNT(*) FROM the_nhan WHERE the_id={cid}),(SELECT COUNT(*) FROM the_tep WHERE the_id={cid}) FROM the_tu_vung WHERE id={cid};")
    check("database retains soft-deleted card, tags and three file links", retained == f"1\t{card['version'] + 1}\t1\t3", retained)
    call(owner, "DELETE", f"/files/{replacement}", expected=409, name="deleted card image reference still blocks file deletion", code="CONFLICT")
    call(owner, "DELETE", f"/files/{audio}", expected=409, name="deleted card audio reference still blocks file deletion", code="CONFLICT")
    call(owner, "GET", f"/files/{replacement}", expected=200, name="blocked deletion preserves file")
    parent_card = call(owner, "POST", f"/decks/{deleted_parent}/cards", {"tu": "parent", "nghiaVi": "bộ cha"}).json()
    sql(f"UPDATE bo_the SET xoa_at=UTC_TIMESTAMP(3) WHERE id={deleted_parent} AND chu_so_huu_id={RESULT['fixtures']['owner']['userId']};")
    for method, path, body in (("GET", f"/decks/{deleted_parent}/cards", None), ("POST", f"/decks/{deleted_parent}/cards", sample), ("PATCH", f"/cards/{parent_card['id']}", {"version": 0}), ("DELETE", f"/cards/{parent_card['id']}?version=0", None)):
        call(owner, method, path, body, 404, "soft-deleted parent " + method, "NOT_FOUND")
    concurrent_card = create({"tu": "race", "nghiaVi": "trước"}, "prepare concurrent update")
    token = owner.get(BASE + "/api/v1/auth/csrf", timeout=10).json()
    def race(value):
        session = requests.Session()
        session.cookies.update(owner.cookies)
        return session.patch(BASE + f"/api/v1/cards/{concurrent_card['id']}", json={"version": 0, "nghiaVi": value}, headers={token["headerName"]: token["token"]}, timeout=20)
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        responses = list(pool.map(race, ["writer one", "writer two"]))
    check("concurrent same-version patch has one winner", sorted(r.status_code for r in responses) == [200, 409] and next(r for r in responses if r.status_code == 409).json()["code"] == "VERSION_CONFLICT", [{"status": r.status_code, "body": r.json()} for r in responses])
    RESULT["finishedAt"] = datetime.now(timezone.utc).isoformat()
    RESULT["limitations"] = ["No ADMIN ownership HTTP fixture", "No B1.8 skipped test workflow was run; deleted parent was prepared by SQL on a new test deck", "No full card CRUD JUnit suite was run", "Concurrency checked for two same-version PATCH requests only"]
    save()
    print(f"RESULT {RESULT['passed']}/{len(RESULT['cases'])} passed; {OUTPUT}")


def main_admin():
    admin = None
    try:
        admin = account("admin", True)
        user = account("learner")
        owned = deck(admin, "admin-owned")
        foreign = deck(user, "learner-public", True)
        card = call(admin, "POST", f"/decks/{owned}/cards", {"tu": "admin", "nghiaVi": "thẻ của quản trị viên"}, 201, "admin creates in own deck").json()
        call(admin, "GET", f"/decks/{owned}/cards", expected=200, name="admin lists own cards")
        card = call(admin, "PATCH", f"/cards/{card['id']}", {"version": 0, "nghiaVi": "đã sửa"}, 200, "admin patches own card").json()
        call(admin, "DELETE", f"/cards/{card['id']}?version={card['version']}", expected=204, name="admin deletes own card")
        foreign_card = call(user, "POST", f"/decks/{foreign}/cards", {"tu": "learner", "nghiaVi": "thẻ của người học"}).json()
        for method, path, body in (("GET", f"/decks/{foreign}/cards", None), ("POST", f"/decks/{foreign}/cards", {"tu": "forbidden", "nghiaVi": "không được"}), ("PATCH", f"/cards/{foreign_card['id']}", {"version": 0}), ("DELETE", f"/cards/{foreign_card['id']}?version=0", None)):
            call(admin, method, path, body, 404, "admin cannot manage foreign public deck " + method, "NOT_FOUND")
        call(admin, "GET", "/admin/tags", expected=200, name="admin role fixture confirmed")
    finally:
        fixture = RESULT["fixtures"].get("admin")
        if fixture:
            uid = fixture["userId"]
            sql(f"DELETE FROM nguoi_dung_vai_tro WHERE nguoi_dung_id={uid} AND vai_tro_id IN(SELECT id FROM vai_tro WHERE ma='ADMIN');")
            RESULT["adminRoleRemoved"] = True
            save()
        if admin is not None:
            call(admin, "POST", "/auth/logout").raise_for_status()
            RESULT["adminSessionLoggedOut"] = True
            save()
    RESULT["finishedAt"] = datetime.now(timezone.utc).isoformat()
    RESULT["limitations"] = ["ADMIN role added only to a new test account and removed after verification; its session was logged out", "No skipped B1.8 workflow was run"]
    save()
    print(f"RESULT {RESULT['passed']}/{len(RESULT['cases'])} passed; {OUTPUT}")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    try:
        main_admin() if "--admin-only" in sys.argv else main()
    except Exception as error:
        RESULT["error"] = str(error)
        save()
        print(f"STOP {type(error).__name__}: {error}; evidence: {OUTPUT}")
        sys.exit(1)
