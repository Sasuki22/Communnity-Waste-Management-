# -*- coding: utf-8 -*-
from flask import Blueprint, jsonify, request
try:
    from ..database import (
        get_all_schedules,
        get_upcoming_schedules,
        get_schedule_by_id,
        get_zone_summary,
        create_pickup_request
    )
except ImportError:
    from database import (
        get_all_schedules,
        get_upcoming_schedules,
        get_schedule_by_id,
        get_zone_summary,
        create_pickup_request
    )


schedule_bp = Blueprint("schedules", __name__, url_prefix="/api/schedules")

@schedule_bp.route("", methods=["GET"])
def list_schedules():
    """Get all waste collection schedules with optional zone and waste_type filters."""
    zone = request.args.get("zone")
    waste_type = request.args.get("waste_type")
    schedules = get_all_schedules(zone=zone, waste_type=waste_type)
    return jsonify({
        "success": True,
        "count": len(schedules),
        "data": schedules
    }), 200

@schedule_bp.route("/upcoming", methods=["GET"])
def upcoming_schedules():
    """Get weekly upcoming schedule list for the dashboard panel."""
    upcoming = get_upcoming_schedules()
    return jsonify({
        "success": True,
        "count": len(upcoming),
        "data": upcoming
    }), 200

@schedule_bp.route("/zones", methods=["GET"])
def zone_schedules():
    """Get collection days and details grouped by Zone."""
    summary = get_zone_summary()
    return jsonify({
        "success": True,
        "data": summary
    }), 200

@schedule_bp.route("/<int:schedule_id>", methods=["GET"])
def schedule_detail(schedule_id):
    """Get detailed information for a single schedule entry."""
    item = get_schedule_by_id(schedule_id)
    if not item:
        return jsonify({
            "success": False,
            "message": f"Schedule with ID {schedule_id} not found."
        }), 404
    return jsonify({
        "success": True,
        "data": item
    }), 200

@schedule_bp.route("/request", methods=["POST"])
def request_pickup():
    """Submit a special waste or bulky item pickup request."""
    data = request.get_json(silent=True) or {}
    user_name = data.get("user_name", "").strip()
    address = data.get("address", "").strip()
    waste_type = data.get("waste_type", "").strip()
    preferred_date = data.get("preferred_date", "").strip()

    if not user_name or not address or not preferred_date:
        return jsonify({
            "success": False,
            "message": "Please provide full name, address, and preferred date."
        }), 400

    new_id = create_pickup_request({
        "user_name": user_name,
        "address": address,
        "waste_type": waste_type or "General Waste",
        "preferred_date": preferred_date,
        "notes": data.get("notes", "")
    })

    return jsonify({
        "success": True,
        "message": "Pickup request submitted successfully.",
        "request_id": new_id
    }), 201
