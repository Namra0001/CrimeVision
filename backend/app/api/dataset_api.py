from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd
import io
import json

from app.services.rag_service import rag_service

router = APIRouter()

@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    filename = file.filename
    content = await file.read()
    
    try:
        if filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(content))
        elif filename.endswith('.xlsx') or filename.endswith('.xls'):
            df = pd.read_excel(io.BytesIO(content))
        elif filename.endswith('.json'):
            data = json.loads(content)
            df = pd.DataFrame(data)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload CSV, Excel, or JSON.")
            
        # Basic cleaning
        df = df.dropna(how='all') # Remove empty rows
        df = df.drop_duplicates()
        
        # Pass to RAG service for ingestion
        rag_service.ingest_dataframe(df, source_name=filename)
        
        return {
            "status": "success", 
            "message": f"Successfully ingested {len(df)} records from {filename}",
            "records_processed": len(df)
        }
    except Exception as e:
        print(f"Error processing upload: {e}")
        raise HTTPException(status_code=500, detail=str(e))
