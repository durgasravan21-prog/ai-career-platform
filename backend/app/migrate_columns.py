import sqlite3
import os

def run_migration():
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../ai_career.db")
    print(f"Connecting to database at: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 1. Add mobile_number to user_profiles if not exists
    try:
        cursor.execute("ALTER TABLE user_profiles ADD COLUMN mobile_number VARCHAR(50)")
        print("Success: Added mobile_number column to user_profiles")
    except Exception as e:
        print("Notice: mobile_number column already exists or could not be added:", e)

    # 2. Add rejected_at to mentor_profiles if not exists
    try:
        cursor.execute("ALTER TABLE mentor_profiles ADD COLUMN rejected_at DATETIME")
        print("Success: Added rejected_at column to mentor_profiles")
    except Exception as e:
        print("Notice: rejected_at column already exists or could not be added:", e)

    # 3. Create mentor_reports table if not exists
    try:
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS mentor_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            mentor_id INTEGER NOT NULL,
            student_id INTEGER NOT NULL,
            reason TEXT NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'pending',
            created_at DATETIME NOT NULL,
            FOREIGN KEY (mentor_id) REFERENCES mentor_profiles (id) ON DELETE CASCADE,
            FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE
        )
        """)
        print("Success: Created or verified mentor_reports table")
    except Exception as e:
        print("Error: Failed to create mentor_reports table:", e)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    run_migration()
