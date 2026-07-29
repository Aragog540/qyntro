import os
import json
import httpx
from typing import Dict, Any, List

SYSTEM_PROMPT = """You are DataFlow AI, an expert Data Engineering & Pipeline Architect.
Your task is to convert a user's natural language request into a valid DataFlow Node Graph pipeline.

DataFlow Node Catalog & Config Parameters:
1. `load`: data source. data: { "sourceType": "sample", "sampleName": "sales" | "iris" | "titanic" }
2. `dropNulls`: remove null rows. data: { "mode": "any" | "all", "cols": "comma-separated cols or blank" }
3. `fillNulls`: fill missing values. data: { "col": "column_name", "strategy": "mean" | "median" | "mode" | "value", "value": "" }
4. `dedupe`: remove duplicate rows. data: { "cols": "comma-separated cols or blank" }
5. `typeCast`: change column type. data: { "col": "column_name", "targetType": "number" | "string" | "boolean" | "date" }
6. `trimStrings`: trim whitespace. data: { "cols": "comma-separated cols or blank" }
7. `filterRows`: filter dataset rows. data: { "col": "column_name", "op": "=" | "≠" | ">" | "<" | ">=" | "<=" | "contains" | "starts with" | "ends with" | "is null" | "not null" | "regex", "value": "val", "mode": "keep" | "drop" }
8. `selectCols`: select or drop columns. data: { "cols": "col1, col2", "mode": "keep" | "drop" }
9. `rename`: rename columns. data: { "mappingStr": "old_name -> new_name" }
10. `addColumn`: calculated field. data: { "name": "new_col", "expr": "price * quantity" }
11. `sort`: sort rows. data: { "col": "column_name", "dir": "asc" | "desc" }
12. `slice`: limit rows. data: { "n": "100", "mode": "first" | "last" }
13. `aggregate`: group by & aggregate. data: { "groupBy": "col1, col2", "aggCol": "agg_column", "aggFn": "sum" | "avg" | "count" | "min" | "max" }
14. `pivot`: pivot table. data: { "indexCol": "col1", "columnsCol": "col2", "valuesCol": "col3", "aggFn": "sum" }
15. `join`: join two dataframes. data: { "key": "join_key_col", "mode": "inner" | "left" | "right" }
16. `profiler`: statistical data profiling. data: {}
17. `chart`: data visualization. data: { "chartType": "bar" | "line" | "scatter" | "pie" | "area" | "histogram", "xCol": "category_col", "yCol": "numeric_col", "title": "Chart Title" }
18. `preview`: table preview node. data: {}
19. `export`: file download node. data: { "format": "csv" | "json" | "tsv", "filename": "output", "bundleZip": "auto" | "always" }

OUTPUT REQUIREMENTS:
You MUST output raw valid JSON (no markdown formatting, no extra text) with this exact schema:
{
  "explanation": "Short friendly explanation of the pipeline built",
  "nodes": [
    {
      "id": "node-1",
      "type": "load",
      "data": { "sourceType": "sample", "sampleName": "sales" },
      "position": { "x": 100, "y": 200 }
    }
  ],
  "edges": [
    {
      "id": "e1-2",
      "source": "node-1",
      "target": "node-2"
    }
  ]
}

PLACEMENT RULES:
- Space out nodes horizontally: position x should increment by +260 for each step in the pipeline (e.g. x: 100, 360, 620, 880, 1140). Y position should stay around 200.
- Connect consecutive nodes sequentially in the `edges` list.
- Always start with a `load` node if no data source is specified.
- End with a `preview`, `profiler`, `chart`, or `export` node if appropriate.
"""

def fallback_generate_pipeline(prompt: str) -> Dict[str, Any]:
    prompt_lower = prompt.lower()
    nodes = []
    edges = []

    # 1. Determine dataset
    sample_name = "sales"
    if "iris" in prompt_lower:
        sample_name = "iris"
    elif "titanic" in prompt_lower:
        sample_name = "titanic"

    nodes.append({
        "id": "node-1",
        "type": "load",
        "data": {"sourceType": "sample", "sampleName": sample_name},
        "position": {"x": 100, "y": 200}
    })

    curr_idx = 2
    prev_id = "node-1"

    # 2. Cleaning
    if "null" in prompt_lower or "missing" in prompt_lower or "clean" in prompt_lower:
        nid = f"node-{curr_idx}"
        nodes.append({
            "id": nid,
            "type": "dropNulls",
            "data": {"mode": "any", "cols": ""},
            "position": {"x": 100 + (curr_idx - 1) * 260, "y": 200}
        })
        edges.append({"id": f"e-{prev_id}-{nid}", "source": prev_id, "target": nid})
        prev_id = nid
        curr_idx += 1

    if "dedupe" in prompt_lower or "duplicate" in prompt_lower:
        nid = f"node-{curr_idx}"
        nodes.append({
            "id": nid,
            "type": "dedupe",
            "data": {"cols": ""},
            "position": {"x": 100 + (curr_idx - 1) * 260, "y": 200}
        })
        edges.append({"id": f"e-{prev_id}-{nid}", "source": prev_id, "target": nid})
        prev_id = nid
        curr_idx += 1

    # 3. Filtering
    if "filter" in prompt_lower or "where" in prompt_lower or "greater" in prompt_lower or "revenue" in prompt_lower or "salary" in prompt_lower:
        col = "revenue" if sample_name == "sales" else ("fare" if sample_name == "titanic" else "sepal_length")
        op = ">"
        val = "200" if sample_name == "sales" else "5.0"
        
        nid = f"node-{curr_idx}"
        nodes.append({
            "id": nid,
            "type": "filterRows",
            "data": {"col": col, "op": op, "value": val, "mode": "keep"},
            "position": {"x": 100 + (curr_idx - 1) * 260, "y": 200}
        })
        edges.append({"id": f"e-{prev_id}-{nid}", "source": prev_id, "target": nid})
        prev_id = nid
        curr_idx += 1

    # 4. Aggregation / Group by
    if "group" in prompt_lower or "aggregate" in prompt_lower or "sum" in prompt_lower or "avg" in prompt_lower:
        group_col = "region" if sample_name == "sales" else ("pclass" if sample_name == "titanic" else "species")
        agg_col = "revenue" if sample_name == "sales" else ("fare" if sample_name == "titanic" else "petal_length")
        
        nid = f"node-{curr_idx}"
        nodes.append({
            "id": nid,
            "type": "aggregate",
            "data": {"groupBy": group_col, "aggCol": agg_col, "aggFn": "sum"},
            "position": {"x": 100 + (curr_idx - 1) * 260, "y": 200}
        })
        edges.append({"id": f"e-{prev_id}-{nid}", "source": prev_id, "target": nid})
        prev_id = nid
        curr_idx += 1

    # 5. Sorting
    if "sort" in prompt_lower or "order" in prompt_lower or "top" in prompt_lower:
        sort_col = "revenue" if sample_name == "sales" else "sepal_length"
        nid = f"node-{curr_idx}"
        nodes.append({
            "id": nid,
            "type": "sort",
            "data": {"col": sort_col, "dir": "desc"},
            "position": {"x": 100 + (curr_idx - 1) * 260, "y": 200}
        })
        edges.append({"id": f"e-{prev_id}-{nid}", "source": prev_id, "target": nid})
        prev_id = nid
        curr_idx += 1

    # 6. Output (Chart, Profiler, Preview)
    if "chart" in prompt_lower or "bar" in prompt_lower or "plot" in prompt_lower or "pie" in prompt_lower:
        chart_type = "pie" if "pie" in prompt_lower else ("scatter" if "scatter" in prompt_lower else "bar")
        x_col = "region" if sample_name == "sales" else ("species" if sample_name == "iris" else "sex")
        y_col = "revenue" if sample_name == "sales" else ("petal_length" if sample_name == "iris" else "fare")
        
        nid = f"node-{curr_idx}"
        nodes.append({
            "id": nid,
            "type": "chart",
            "data": {"chartType": chart_type, "xCol": x_col, "yCol": y_col, "title": f"AI Generated {chart_type.title()} Chart"},
            "position": {"x": 100 + (curr_idx - 1) * 260, "y": 200}
        })
        edges.append({"id": f"e-{prev_id}-{nid}", "source": prev_id, "target": nid})
        prev_id = nid
        curr_idx += 1

    elif "profile" in prompt_lower or "stats" in prompt_lower:
        nid = f"node-{curr_idx}"
        nodes.append({
            "id": nid,
            "type": "profiler",
            "data": {},
            "position": {"x": 100 + (curr_idx - 1) * 260, "y": 200}
        })
        edges.append({"id": f"e-{prev_id}-{nid}", "source": prev_id, "target": nid})
        prev_id = nid
        curr_idx += 1

    # Always ensure preview node at the end if not chart/profile
    if nodes[-1]["type"] not in ["preview", "chart", "profiler", "export"]:
        nid = f"node-{curr_idx}"
        nodes.append({
            "id": nid,
            "type": "preview",
            "data": {},
            "position": {"x": 100 + (curr_idx - 1) * 260, "y": 200}
        })
        edges.append({"id": f"e-{prev_id}-{nid}", "source": prev_id, "target": nid})

    return {
        "explanation": f"Generated custom DataFlow pipeline based on: '{prompt}'. Attached dataset '{sample_name}', transformation nodes, and visualization output.",
        "nodes": nodes,
        "edges": edges,
        "engine": "DataFlow AI (Rules Engine Fallback)"
    }


def generate_pipeline_ai(prompt: str, user_api_key: str = None) -> Dict[str, Any]:
    api_key = user_api_key or os.environ.get("GROQ_API_KEY")

    if not api_key:
        return fallback_generate_pipeline(prompt)

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    # Using llama-3.3-70b-versatile for Groq API
    model = "llama-3.3-70b-versatile"
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Create a pipeline for: {prompt}"}
        ],
        "temperature": 0.2,
        "response_format": {"type": "json_object"}
    }

    try:
        with httpx.Client(timeout=15.0) as client:
            resp = client.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                parsed = json.loads(content)
                parsed["engine"] = f"Groq AI ({model})"
                return parsed
    except Exception as e:
        print(f"[AI Generator Warning] Groq API call failed: {e}. Using fallback generator.")

    return fallback_generate_pipeline(prompt)
