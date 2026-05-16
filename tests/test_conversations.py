"""Conversations + message CRUD with cursor pagination."""
from __future__ import annotations

import time


def test_create_list_delete(client):
    a = client.post("/api/conversations", json={"model_id": "m1", "title": "alpha"}).json()
    b = client.post("/api/conversations", json={"model_id": "m1", "title": "beta"}).json()
    listed = client.get("/api/conversations?limit=10").json()
    ids = {c["id"] for c in listed}
    assert a["id"] in ids and b["id"] in ids

    # Most recently created/updated comes first.
    assert listed[0]["id"] == b["id"]

    # Delete one, it disappears.
    assert client.delete(f"/api/conversations/{a['id']}").status_code == 200
    after = client.get("/api/conversations?limit=10").json()
    assert all(c["id"] != a["id"] for c in after)


def test_rename_conversation(client):
    c = client.post("/api/conversations", json={"model_id": "m1", "title": "old"}).json()
    r = client.patch(f"/api/conversations/{c['id']}", json={"title": "renamed"})
    assert r.status_code == 200
    again = client.get("/api/conversations?limit=10").json()
    row = next(x for x in again if x["id"] == c["id"])
    assert row["title"] == "renamed"


def test_cursor_pagination(client):
    created = []
    for i in range(6):
        created.append(client.post("/api/conversations", json={"model_id": "m1", "title": f"c{i}"}).json())
        time.sleep(0.005)  # ensure updated_at moves forward
    page1 = client.get("/api/conversations?limit=3").json()
    assert len(page1) == 3
    page2 = client.get(f"/api/conversations?limit=3&cursor={page1[-1]['id']}").json()
    # No overlap across pages.
    ids1 = {x["id"] for x in page1}
    ids2 = {x["id"] for x in page2}
    assert ids1.isdisjoint(ids2)
    assert len(ids1 | ids2) >= 6


def test_message_window(client):
    c = client.post("/api/conversations", json={"model_id": "m1", "title": "w"}).json()
    # Insert messages directly via the DB so we don't go through the LLM.
    from pocketlm.db import session_scope
    from pocketlm.models_schema import Message
    with session_scope() as s:
        for i in range(12):
            s.add(Message(conversation_id=c["id"], role="user", content=f"msg-{i}"))
        s.commit()
    latest = client.get(f"/api/conversations/{c['id']}/messages?limit=5").json()
    assert len(latest) == 5
    assert [m["content"] for m in latest] == [f"msg-{i}" for i in range(7, 12)]

    older = client.get(f"/api/conversations/{c['id']}/messages?limit=5&before={latest[0]['id']}").json()
    assert len(older) == 5
    assert [m["content"] for m in older] == [f"msg-{i}" for i in range(2, 7)]

