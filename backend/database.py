import sqlite3
import json
import time

DB_NAME = "grocery.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    c.execute("""
    CREATE TABLE IF NOT EXISTS deals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store TEXT,
        data TEXT,
        created_at REAL
    )
    """)

    conn.commit()
    conn.close()


def save_deals(store, structured_data):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    c.execute("""
        INSERT INTO deals (store, data, created_at)
        VALUES (?, ?, ?)
    """, (store, json.dumps(structured_data), time.time()))

    conn.commit()
    conn.close()


def get_latest_deals(store):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    c.execute("""
        SELECT data FROM deals
        WHERE store = ?
        ORDER BY created_at DESC
        LIMIT 1
    """, (store,))

    row = c.fetchone()
    conn.close()

    if row:
        return json.loads(row[0])
    return None