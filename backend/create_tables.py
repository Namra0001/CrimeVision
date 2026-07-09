import os
from dotenv import load_dotenv

# Load the environment variables from .env file
load_dotenv()

from sqlalchemy import create_engine
from app.db.base_class import Base

# Import all models so SQLAlchemy knows about them before creating tables
from app.models.user import User, OTPVerification
from app.models.permissions import RolePermission
from app.models.lookups import State, District, Court, UnitType, Rank, Designation, CasteMaster, ReligionMaster, OccupationMaster, CaseStatusMaster, GravityOffence, CaseCategory
from app.models.entities import Unit, Employee
from app.models.case import Act, Section, CrimeHead, CrimeSubHead, CaseMaster, ActSectionAssociation
from app.models.people import ComplainantDetails, Victim, Accused, ArrestSurrender
from app.models.chat import Conversation, Message, ConversationTag

def init_db():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ Error: DATABASE_URL is not set. Please check your .env file!")
        return

    print(f"Connecting to Database...")
    engine = create_engine(database_url, pool_pre_ping=True)
    
    print("Creating tables based on the Karnataka Police Schema...")
    # This creates all tables that don't exist yet
    Base.metadata.create_all(bind=engine)
    
    print("Success! All tables have been created in Supabase.")

if __name__ == "__main__":
    init_db()
