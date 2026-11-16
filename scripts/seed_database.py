"""
Database seed execution script.
Wraps app.db.seed.seed_database.
"""

import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(BASE_DIR, "backend"))
sys.path.insert(0, os.path.join(BASE_DIR, "analytics"))

from app.db.seed import seed_database

if __name__ == "__main__":
    seed_database()
