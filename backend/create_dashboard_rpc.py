import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv(r'd:\CrimeVision\backend\.env')
engine = create_engine(os.getenv('DATABASE_URL'))

with engine.begin() as conn:
    conn.execute(text("""
    CREATE OR REPLACE FUNCTION get_dashboard_stats()
    RETURNS json AS $$
    DECLARE
        total_crimes INT;
        solved_cases INT;
        pending_cases INT;
        high_severity_alerts INT;
        trend_data JSON;
        category_data JSON;
    BEGIN
        -- Total Crimes
        SELECT COUNT(*) INTO total_crimes FROM casemaster;
        
        -- Solved Cases
        SELECT COUNT(*) INTO solved_cases
        FROM casemaster cm
        JOIN casestatusmaster cs ON cm."CaseStatusID" = cs."CaseStatusID"
        WHERE cs."CaseStatusName" ILIKE '%Charge Sheeted%'
           OR cs."CaseStatusName" ILIKE '%Convicted%'
           OR cs."CaseStatusName" ILIKE '%Closed%'
           OR cs."CaseStatusName" ILIKE '%True%'
           OR cs."CaseStatusName" ILIKE '%False%';
           
        -- Pending Cases
        pending_cases := total_crimes - solved_cases;
        
        -- High Severity Alerts
        SELECT COUNT(*) INTO high_severity_alerts
        FROM casemaster cm
        JOIN gravityoffence go ON cm."GravityOffenceID" = go."GravityOffenceID"
        WHERE go."LookupValue" ILIKE '%Heinious%'
           OR go."LookupValue" ILIKE '%Heinous%';
           
        -- Trend Data (Last 7 Months)
        SELECT json_agg(t) INTO trend_data
        FROM (
            WITH months AS (
                SELECT generate_series(
                    date_trunc('month', current_date - interval '6 months'),
                    date_trunc('month', current_date),
                    '1 month'::interval
                ) AS month_start
            )
            SELECT 
                to_char(m.month_start, 'Mon') as name,
                COUNT(cm."CaseMasterID") as crimes
            FROM months m
            LEFT JOIN casemaster cm 
                ON date_trunc('month', cm."CrimeRegisteredDate") = m.month_start
            GROUP BY m.month_start
            ORDER BY m.month_start ASC
        ) t;

        -- Category Data
        SELECT json_agg(c) INTO category_data
        FROM (
            SELECT ch."CrimeGroupName" as name, count(cm."CaseMasterID") as value
            FROM crimehead ch
            JOIN casemaster cm ON cm."CrimeMajorHeadID" = ch."CrimeHeadID"
            GROUP BY ch."CrimeGroupName"
            ORDER BY value DESC
            LIMIT 5
        ) c;
        
        IF category_data IS NULL THEN
            category_data := '[{"name": "No Data", "value": 1}]'::json;
        END IF;

        RETURN json_build_object(
            'kpis', json_build_object(
                'total_active', total_crimes,
                'solved', solved_cases,
                'pending', pending_cases,
                'high_severity', high_severity_alerts
            ),
            'trendData', trend_data,
            'categoryData', category_data
        );
    END;
    $$ LANGUAGE plpgsql;
    """))
print('RPC created successfully')
