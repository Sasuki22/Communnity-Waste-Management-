# -*- coding: utf-8 -*-
import sqlite3
import os
try:
    from .config import DATABASE_PATH
except ImportError:
    from config import DATABASE_PATH


def get_db_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS schedules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            waste_type TEXT NOT NULL,
            icon TEXT NOT NULL,
            day_of_week TEXT NOT NULL,
            time_slot TEXT NOT NULL,
            zone TEXT NOT NULL DEFAULT 'All Zones',
            frequency TEXT NOT NULL DEFAULT 'Weekly',
            description TEXT,
            is_upcoming INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS pickup_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_name TEXT NOT NULL,
            address TEXT NOT NULL,
            waste_type TEXT NOT NULL,
            preferred_date TEXT NOT NULL,
            notes TEXT,
            status TEXT DEFAULT 'Pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("SELECT COUNT(*) FROM schedules")
    if cursor.fetchone()[0] == 0:
        default_schedules = [
            ("General Waste", "trash", "Monday", "07:00 AM - 10:00 AM", "All Zones", "Weekly", "Non-recyclable household waste.", 1),
            ("Recyclable Waste", "recycle", "Wednesday", "08:00 AM - 12:00 PM", "All Zones", "Weekly", "Clean paper, plastics, glass, metal cans.", 1),
            ("Organic Waste", "leaf", "Friday", "07:00 AM - 10:00 AM", "All Zones", "Weekly", "Food scraps, leaves, and garden trimmings.", 1),
            ("Hazardous Waste", "warning", "Saturday", "09:00 AM - 01:00 PM", "All Zones", "Bi-Weekly", "Batteries, bulbs, electronics, and chemicals.", 1),
            ("General Waste (Zone 1)", "trash", "Monday & Thursday", "06:30 AM - 09:30 AM", "Zone 1", "Bi-Weekly", "Zone 1 regular waste collection.", 0),
            ("Recyclable Waste (Zone 1)", "recycle", "Wednesday", "08:00 AM - 11:00 AM", "Zone 1", "Weekly", "Zone 1 recyclables collection.", 0),
            ("General Waste (Zone 2)", "trash", "Tuesday & Friday", "06:30 AM - 09:30 AM", "Zone 2", "Bi-Weekly", "Zone 2 regular waste collection.", 0),
            ("Recyclable Waste (Zone 2)", "recycle", "Thursday", "08:00 AM - 11:00 AM", "Zone 2", "Weekly", "Zone 2 recyclables collection.", 0),
            ("General Waste (Zone 3)", "trash", "Wednesday & Saturday", "06:30 AM - 09:30 AM", "Zone 3", "Bi-Weekly", "Zone 3 regular waste collection.", 0),
            ("Recyclable Waste (Zone 3)", "recycle", "Friday", "08:00 AM - 11:00 AM", "Zone 3", "Weekly", "Zone 3 recyclables collection.", 0)
        ]
        cursor.executemany("""
            INSERT INTO schedules (waste_type, icon, day_of_week, time_slot, zone, frequency, description, is_upcoming)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, default_schedules)

    conn.commit()
    conn.close()

def get_all_schedules(zone=None, waste_type=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM schedules WHERE 1=1"
    params = []
    if zone and zone != "All Zones":
        query += " AND (zone = ? OR zone = 'All Zones')"
        params.append(zone)
    if waste_type:
        query += " AND waste_type LIKE ?"
        params.append("%{}%".format(waste_type))
    query += " ORDER BY id ASC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_upcoming_schedules():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM schedules WHERE is_upcoming = 1 ORDER BY id ASC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_schedule_by_id(schedule_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM schedules WHERE id = ?", (schedule_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_zone_summary():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT zone, waste_type, day_of_week, time_slot FROM schedules ORDER BY zone, id")
    rows = cursor.fetchall()
    conn.close()
    summary = {
        "Zone 1": {"schedule": "Mon & Thu", "recyclables": "Wednesday", "items": []},
        "Zone 2": {"schedule": "Tue & Fri", "recyclables": "Thursday", "items": []},
        "Zone 3": {"schedule": "Wed & Sat", "recyclables": "Friday", "items": []},
        "All Zones": {"schedule": "Mon, Wed, Fri, Sat", "items": []}
    }
    for row in rows:
        z = row["zone"]
        if z in summary:
            summary[z]["items"].append(dict(row))
    return summary

def create_pickup_request(data):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO pickup_requests (user_name, address, waste_type, preferred_date, notes)
        VALUES (?, ?, ?, ?, ?)
    """, (
        data.get("user_name", "Anonymous"),
        data.get("address", ""),
        data.get("waste_type", "General Waste"),
        data.get("preferred_date", ""),
        data.get("notes", "")
    ))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return new_id
