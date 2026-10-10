"""
init_db.py

Initializes database tables and creates initial audit entries.
"""

from app.database.connection import engine, Base, SessionLocal
from app.database.models import SystemActivityRecord


def init_db():
    """
    Creates all database tables defined in SQLAlchemy models.
    """
    print("[*] Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    print("[✓] Database tables initialized successfully.")

    # Record initial system startup entry if database is freshly created
    db = SessionLocal()
    try:
        count = db.query(SystemActivityRecord).count()
        if count == 0:
            startup_record = SystemActivityRecord(
                category="SYSTEM",
                related_id="SYSTEM",
                description="Self-Organizing Multi-Agent System backend initialized. Database schema created.",
                outcome="ONLINE"
            )
            db.add(startup_record)
            db.commit()
    except Exception as e:
        print(f"[!] Warning during DB startup seeding: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
