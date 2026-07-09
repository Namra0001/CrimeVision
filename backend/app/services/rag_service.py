import os
import json
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from dotenv import load_dotenv

from langchain_community.utilities import SQLDatabase
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

# Load environment variables (API Key)
load_dotenv()

DB_PATH = "sqlite:///crimevision.db"

class RAGService:
    def __init__(self):
        self.llm = None
        self.db = None
        self._initialized = False

    def _ensure_initialized(self):
        if self._initialized:
            return
            
        # Initialize Gemini 2.5 Flash
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("WARNING: GEMINI_API_KEY not found in .env")
            
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0,
            max_retries=0,
            google_api_key=api_key
        )
        self.db = SQLDatabase.from_uri(DB_PATH, sample_rows_in_table_info=0)
        self._initialized = True

    def _get_schema(self):
        return self.db.get_table_info(['casemaster', 'district', 'unit', 'crimehead', 'casestatusmaster', 'accused', 'victim'])

    def _format_history(self, history: Optional[List[Any]]) -> str:
        if not history:
            return "No previous conversation context."
        
        formatted = ""
        for msg in history:
            role = getattr(msg, "role", "user")
            content = getattr(msg, "content", str(msg))
            formatted += f"{role.capitalize()}: {content}\n"
        return formatted

    def _generate_sql(self, question: str, history: Optional[List[Any]] = None, error_msg: str = "") -> str:
        prompt = PromptTemplate.from_template(
            """You are a SQLite database expert acting as a Crime Intelligence Assistant.
            Your task is to generate a syntactically correct SQLite query to answer the user's question.
            
            Database Schema:
            {schema}
            
            Conversation History (Use this for context if the user asks follow-up questions):
            {history}
            
            Current Question: {question}
            
            {error_context}
            
            CRITICAL RULES:
            1. ONLY use the tables and columns provided in the schema.
            2. Join `casemaster c` to `unit u` (c.PoliceStationID = u.UnitID).
            3. Join `unit u` to `district d` (u.DistrictID = d.DistrictID).
            4. Join `casemaster c` to `crimehead h` (c.CrimeMajorHeadID = h.CrimeHeadID).
            5. ONLY return the raw SQL code. NO markdown, NO explanation.
            6. Pay attention to synonyms (highest = DESC LIMIT 1, lowest = ASC LIMIT 1, etc.).
            7. For 'pending' cases, use CaseStatusID IN (1, 4). For 'closed'/'solved', use CaseStatusID = 3.
            8. IMPORTANT: SQLite string comparison is case-sensitive! ALWAYS use `LIKE '%keyword%'` or `UPPER(col) = 'KEYWORD'` for text columns like CrimeGroupName, DistrictName, etc. (e.g. `UPPER(h.CrimeGroupName) LIKE '%MURDER%'`).
            9. The current year is 2024. If the user asks about future years (like 2025), generate SQL for the latest available year in the DB.
            
            SQLQuery:"""
        )
        
        error_context = ""
        if error_msg:
            error_context = f"WARNING: Your previous SQL query failed with this error: {error_msg}\nFix the query so it runs successfully."
            
        chain = prompt | self.llm | StrOutputParser()
        raw = chain.invoke({
            "schema": self._get_schema(), 
            "history": self._format_history(history),
            "question": question, 
            "error_context": error_context
        })
        
        # Clean markdown if present
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            lines = cleaned.split('\n')
            if lines[0].startswith("```"): lines = lines[1:]
            if lines and lines[-1].startswith("```"): lines = lines[:-1]
            cleaned = '\n'.join(lines).strip()
            
        return cleaned

    def _explain_result(self, question: str, sql: str, result: str, language: str = 'en') -> str:
        if not result or result == "[]" or result == "None":
            return "No matching records were found in the current dataset. Please try adjusting your filters or asking about available regions like Bengaluru or Mysuru."
            
        prompt = PromptTemplate.from_template(
            """You are an experienced Crime Intelligence Officer.
            
            CRITICAL INSTRUCTION FOR RESPONSE FORMAT:
            1. Always format your answer using bullet points for readability.
            2. Leave an empty line (gap) between every bullet point.
            3. The MAIN ANSWER or key data points MUST be in **BOLD TEXT**.
            4. If the user asks a short question, give a short 1-3 point answer.
            5. If the user asks for predictions or recommendations (e.g. "how to reduce cases"), use your AI capabilities to generate actionable, predictive insights based on the data context.
            
            User Question: {question}
            Raw Database Result: {result}
            
            Write the response in {lang_name}. Never mention SQL or raw database IDs.
            
            Response:"""
        )
        chain = prompt | self.llm | StrOutputParser()
        lang_name = "Kannada" if language == 'kn' else "simple English"
        return chain.invoke({"question": question, "result": str(result)[:2000], "lang_name": lang_name})

    def ask(self, question: str, history: Optional[List[Any]] = None, language: str = 'en') -> str:
        self._ensure_initialized()
        
        max_retries = 3
        current_error = ""
        
        for attempt in range(max_retries):
            try:
                sql = self._generate_sql(question, history, current_error)
                
                # Check for destructive commands
                if any(word in sql.upper() for word in ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER']):
                    return "Safety check failed: Generated SQL attempts to modify data."
                
                result = self.db.run(sql)
                
                # If error in result string
                if "Error:" in str(result):
                    raise Exception(str(result))
                    
                return self._explain_result(question, sql, result, language)
                
            except Exception as e:
                current_error = str(e)
                
        return "The requested information is not available in the current database, or the query could not be processed."

    def ingest_dataframe(self, import_pd, source_name):
        pass

    def generate_risk_recommendations(self, layer: str, context_data: str, language: str = 'en') -> List[Dict]:
        self._ensure_initialized()
        
        prompt = PromptTemplate.from_template(
            """You are a senior Crime Intelligence AI Analyst for the Karnataka State Police.
            
            Based on the following database context for the '{layer}' layer, generate exactly 2 highly specific, actionable recommendations.
            
            Data Context:
            {context_data}
            
            CRITICAL RULES:
            1. Return ONLY a raw JSON array containing exactly 2 objects.
            2. Each object must have these exact keys: "id" (e.g. "R1"), "type" (e.g. "Deployment", "Surveillance", "Infrastructure"), "title" (short action), "description" (detailed reason), "lat" (float, approx around 12.9 to 15.0), "lng" (float, approx around 75.0 to 77.5), "priority" ("Critical", "High", or "Medium"), and "impact" (short expected outcome).
            3. Do not include markdown code blocks like ```json. Just return the raw array.
            4. If the language is Kannada, write the 'title', 'description', and 'impact' in Kannada. Otherwise, write in English.
            
            Language: {language}
            """
        )
        chain = prompt | self.llm | StrOutputParser()
        lang_name = "Kannada" if language == 'kn' else "English"
        
        raw = chain.invoke({
            "layer": layer,
            "context_data": context_data,
            "language": lang_name
        })
        
        try:
            # Clean markdown if present
            cleaned = raw.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            return json.loads(cleaned.strip())
        except Exception as e:
            print("Failed to parse LLM recommendations:", e)
            return []

rag_service = RAGService()

