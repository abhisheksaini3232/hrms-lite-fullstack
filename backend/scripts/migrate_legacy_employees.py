from __future__ import annotations

from collections import defaultdict
from typing import Any

from bson import ObjectId
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient


def is_valid_email(value: str) -> bool:
    value = (value or "").strip()
    return bool(value) and ("@" in value) and ("." in value.split("@")[-1]) and (" " not in value)


def make_legacy_email(oid: ObjectId) -> str:
    return f"legacy-{oid}@invalid.local"


def main() -> None:
    env_path = Path(__file__).resolve().parents[1] / ".env"
    load_dotenv(env_path)

    import os

    uri = os.environ.get("MONGODB_URI")
    dbn = os.environ.get("MONGODB_DB", "hrms_lite")

    if not uri:
        raise SystemExit("MONGODB_URI is missing (set it in backend/.env)")

    client = MongoClient(uri)
    db = client[dbn]

    # Count and normalize legacy docs
    legacy_query = {"$or": [{"employee_id": None}, {"employee_id": {"$exists": False}}]}
    legacy_docs = list(db.employees.find(legacy_query))

    # Build maps for uniqueness checks
    existing_emp_ids = set(
        d.get("employee_id") for d in db.employees.find({"employee_id": {"$exists": True}})
    )
    existing_emails = defaultdict(list)
    for d in db.employees.find({"email": {"$exists": True}}):
        if d.get("email"):
            existing_emails[str(d.get("email")).strip().lower()].append(d.get("_id"))

    updated = 0
    for doc in legacy_docs:
        oid = doc.get("_id")
        if not oid:
            continue

        employee_id = (doc.get("employee_id") or "").strip()
        if not employee_id:
            employee_id = f"LEGACY-{oid}"

        # Ensure unique employee_id
        if employee_id in existing_emp_ids:
            employee_id = f"{employee_id}-{str(oid)[-6:]}"
        existing_emp_ids.add(employee_id)

        full_name = (doc.get("full_name") or doc.get("name") or "Unknown").strip() or "Unknown"
        department = (doc.get("department") or doc.get("role") or "Unknown").strip() or "Unknown"

        email = (doc.get("email") or "").strip()
        if (not email) or (not is_valid_email(email)):
            email = make_legacy_email(oid)

        # Ensure unique email
        key = email.lower()
        if key in existing_emails and oid not in existing_emails[key]:
            email = make_legacy_email(oid)
            key = email.lower()
        existing_emails[key].append(oid)

        update_doc: dict[str, Any] = {
            "employee_id": employee_id,
            "full_name": full_name,
            "department": department,
            "email": email,
        }
        db.employees.update_one({"_id": oid}, {"$set": update_doc})
        updated += 1

    print(f"Legacy docs found: {len(legacy_docs)}")
    print(f"Legacy docs updated: {updated}")
    client.close()


if __name__ == "__main__":
    main()
