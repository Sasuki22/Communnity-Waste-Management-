# -*- coding: utf-8 -*-
import os
from flask import Flask, jsonify, request
try:
    from .config import PORT, HOST, DEBUG, SECRET_KEY
    from .database import init_db
    from .routes.schedule_routes import schedule_bp
except ImportError:
    import sys
    sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
    from config import PORT, HOST, DEBUG, SECRET_KEY
    from database import init_db
    from routes.schedule_routes import schedule_bp


def create_app():
    """Application factory for the Community Waste Management backend."""
    app = Flask(__name__)
    app.config["SECRET_KEY"] = SECRET_KEY

    # Initialize database on startup
    with app.app_context():
        init_db()

    # Register blueprints
    app.register_blueprint(schedule_bp)

    # CORS support for cross-origin requests from PHP/XAMPP frontend
    @app.after_request
    def add_cors_headers(response):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
        return response

    # Handle OPTIONS preflight requests globally
    @app.route("/", defaults={"path": ""}, methods=["OPTIONS"])
    @app.route("/<path:path>", methods=["OPTIONS"])
    def handle_options(path):
        return "", 204

    @app.route("/", methods=["GET"])
    def root():
        return jsonify({
            "service": "Community Waste Management System API",
            "version": "1.0.0",
            "status": "online",
            "endpoints": {
                "health": "/api/health",
                "all_schedules": "/api/schedules",
                "upcoming_schedules": "/api/schedules/upcoming",
                "zone_schedules": "/api/schedules/zones",
                "pickup_request": "POST /api/schedules/request"
            }
        })

    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({
            "status": "healthy",
            "database": "connected"
        })

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "success": False,
            "message": "Resource not found."
        }), 404

    @app.errorhandler(500)
    def server_error(error):
        return jsonify({
            "success": False,
            "message": "Internal server error."
        }), 500

    return app

app = create_app()

if __name__ == "__main__":
    print("Community Waste Management Flask API starting on http://127.0.0.1:{}".format(PORT))
    app.run(host=HOST, port=PORT, debug=DEBUG)
