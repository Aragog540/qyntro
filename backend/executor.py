import time
import pandas as pd
from typing import List, Dict, Any
from data_ops import (
    parse_sample, parse_csv_text, records_to_df, df_to_response,
    drop_nulls, fill_nulls, dedupe, type_cast, trim_strings,
    filter_rows, select_cols, rename_cols, add_column,
    pivot_df, melt_df, rolling_window, string_ops,
    sort_rows, slice_rows, aggregate_df, sample_df,
    join_dfs, concat_dfs, profile_df
)

def topo_sort(nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> List[str]:
    node_ids = [n["id"] for n in nodes]
    in_degree = {nid: 0 for nid in node_ids}
    adjacency = {nid: [] for nid in node_ids}

    for e in edges:
        src = e.get("source")
        tgt = e.get("target")
        if src in adjacency and tgt in in_degree:
            adjacency[src].append(e)
            in_degree[tgt] += 1

    queue = [nid for nid in node_ids if in_degree[nid] == 0]
    order = []

    while queue:
        curr = queue.pop(0)
        order.append(curr)
        for e in adjacency[curr]:
            tgt = e.get("target")
            in_degree[tgt] -= 1
            if in_degree[tgt] == 0:
                queue.append(tgt)

    if len(order) != len(nodes):
        raise ValueError("Pipeline contains a cycle — graph topology is not a DAG.")

    return order


def execute_pipeline(nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> Dict[str, Any]:
    start_time = time.perf_counter()
    order = topo_sort(nodes, edges)

    node_by_id = {n["id"]: n for n in nodes}
    output_df_by_id: Dict[str, pd.DataFrame] = {}
    results = {}

    for node_id in order:
        node = node_by_id[node_id]
        node_type = node.get("type", "")
        data = node.get("data", {}) or {}
        
        incoming_edges = [e for e in edges if e.get("target") == node_id]
        
        # Gather inputs
        node_start = time.perf_counter()
        input_df = None
        
        if node_type == "join":
            # Multi-input handle node
            by_handle = {}
            for e in incoming_edges:
                handle = e.get("targetHandle", "")
                handle_name = "left" if "left" in handle else ("right" if "right" in handle else "left")
                src_df = output_df_by_id.get(e.get("source"))
                if src_df is not None:
                    by_handle[handle_name] = src_df
            left_df = by_handle.get("left")
            right_df = by_handle.get("right")
            
        else:
            incoming_dfs = [output_df_by_id.get(e.get("source")) for e in incoming_edges]
            incoming_dfs = [d for d in incoming_dfs if d is not None]
            if len(incoming_dfs) == 0:
                input_df = None
            elif len(incoming_dfs) == 1:
                input_df = incoming_dfs[0]
            else:
                input_df = concat_dfs(incoming_dfs)

        res_df = None
        status = "done"
        error_msg = None
        preview_payload = None
        chart_payload = None
        profile_payload = None

        try:
            # IO Nodes
            if node_type == "load":
                source_type = data.get("sourceType", "sample")
                if source_type == "sample":
                    sample_name = data.get("sampleName", "iris")
                    res_df = parse_sample(sample_name)
                elif source_type == "paste":
                    paste_text = data.get("pasteText", "")
                    if not paste_text.strip():
                        raise ValueError("No CSV text provided for paste node.")
                    res_df = parse_csv_text(paste_text)
                elif source_type == "file":
                    # If client passed raw rows via inline data
                    inline_rows = data.get("inlineRows")
                    inline_cols = data.get("inlineCols")
                    if inline_rows is not None:
                        res_df = records_to_df(inline_rows, inline_cols)
                    else:
                        res_df = parse_sample("sales")
                else:
                    res_df = parse_sample("sales")

            elif node_type == "dbQuery":
                sql_query = data.get("sqlQuery", "SELECT * FROM sales_orders LIMIT 100").strip()
                db_type = data.get("dbType", "postgres")
                conn_str = data.get("connectionString", "").strip()
                if not conn_str or db_type == "sandbox":
                    res_df = parse_sample("sales")
                else:
                    try:
                        import sqlalchemy
                        engine = sqlalchemy.create_engine(conn_str)
                        res_df = pd.read_sql(sql_query, engine)
                    except Exception:
                        res_df = parse_sample("sales")

            elif node_type == "apiFetch":
                url = data.get("url", "").strip()
                if not url:
                    raise ValueError("REST API Endpoint URL is required.")
                import httpx
                resp = httpx.get(url, timeout=10.0)
                resp.raise_for_status()
                json_data = resp.json()
                if isinstance(json_data, dict):
                    json_data = json_data.get("data") or json_data.get("items") or [json_data]
                res_df = pd.DataFrame(json_data)

            elif node_type == "preview":
                res_df = input_df
                if res_df is not None:
                    preview_payload = df_to_response(res_df, source="python")

            elif node_type == "export":
                res_df = input_df

            # Clean Nodes
            elif node_type == "dropNulls":
                if input_df is None: raise ValueError("No input data.")
                cols = [c.strip() for c in data.get("cols", "").split(",") if c.strip()]
                res_df = drop_nulls(input_df, mode=data.get("mode", "any"), cols=cols)

            elif node_type == "fillNulls":
                if input_df is None: raise ValueError("No input data.")
                col = data.get("col", "")
                if not col: raise ValueError("Column name required for fillNulls.")
                res_df = fill_nulls(input_df, col=col, strategy=data.get("strategy", "mean"), custom_val=data.get("value"))

            elif node_type == "dedupe":
                if input_df is None: raise ValueError("No input data.")
                cols = [c.strip() for c in data.get("cols", "").split(",") if c.strip()]
                res_df = dedupe(input_df, cols=cols)

            elif node_type == "typeCast":
                if input_df is None: raise ValueError("No input data.")
                col = data.get("col", "")
                if not col: raise ValueError("Column name required for typeCast.")
                res_df = type_cast(input_df, col=col, target_type=data.get("targetType", "number"))

            elif node_type == "trimStrings":
                if input_df is None: raise ValueError("No input data.")
                cols = [c.strip() for c in data.get("cols", "").split(",") if c.strip()]
                res_df = trim_strings(input_df, cols=cols)

            elif node_type == "normalize":
                if input_df is None: raise ValueError("No input data.")
                res_df = input_df.copy()
                col = data.get("col", "").strip()
                if col and col in res_df.columns:
                    target_col = (data.get("newCol") or "").strip() or f"{col}_scaled"
                    method = data.get("method", "minmax")
                    import numpy as np
                    series = pd.to_numeric(res_df[col], errors="coerce")
                    if method == "zscore":
                        std = series.std()
                        res_df[target_col] = ((series - series.mean()) / (std if std != 0 else 1)).round(4)
                    elif method == "log":
                        res_df[target_col] = np.log1p(series.clip(lower=0)).round(4)
                    else:
                        rng = series.max() - series.min()
                        res_df[target_col] = ((series - series.min()) / (rng if rng != 0 else 1)).round(4)

            # Transform Nodes
            elif node_type == "filterRows":
                if input_df is None: raise ValueError("No input data.")
                col = data.get("col", "").strip()
                if not col: raise ValueError("Column name required for filterRows.")
                res_df = filter_rows(input_df, col=col, op=data.get("op", "="), value=data.get("value", ""), mode=data.get("mode", "keep"))

            elif node_type == "selectCols":
                if input_df is None: raise ValueError("No input data.")
                cols = [c.strip() for c in data.get("cols", "").split(",") if c.strip()]
                res_df = select_cols(input_df, cols=cols, mode=data.get("mode", "keep"))

            elif node_type == "rename":
                if input_df is None: raise ValueError("No input data.")
                mapping_str = data.get("mappingStr", "")
                mapping = {}
                for line in mapping_str.split("\n"):
                    if "→" in line or "->" in line:
                        parts = line.replace("→", "->").split("->")
                        if len(parts) == 2 and parts[0].strip() and parts[1].strip():
                            mapping[parts[0].strip()] = parts[1].strip()
                res_df = rename_cols(input_df, mapping)

            elif node_type == "addColumn":
                if input_df is None: raise ValueError("No input data.")
                col_name = data.get("name", "").strip()
                expr = data.get("expr", "").strip()
                if not col_name or not expr: raise ValueError("Column name and expression required.")
                res_df = add_column(input_df, name=col_name, expr=expr)

            elif node_type == "pivot":
                if input_df is None: raise ValueError("No input data.")
                res_df = pivot_df(input_df, index_col=data.get("indexCol"), columns_col=data.get("columnsCol"), values_col=data.get("valuesCol"), agg_fn=data.get("aggFn", "sum"))

            elif node_type == "melt":
                if input_df is None: raise ValueError("No input data.")
                id_cols = [c.strip() for c in data.get("idCols", "").split(",") if c.strip()]
                res_df = melt_df(input_df, id_cols=id_cols, var_name=data.get("varName", "variable"), value_name=data.get("valueName", "value"))

            elif node_type == "rolling":
                if input_df is None: raise ValueError("No input data.")
                res_df = rolling_window(input_df, col=data.get("col"), window_size=int(data.get("windowSize", 3)), fn=data.get("fn", "mean"), output_col=data.get("outputCol"))

            elif node_type == "stringOps":
                if input_df is None: raise ValueError("No input data.")
                res_df = string_ops(input_df, col=data.get("col"), op=data.get("op", "upper"), param1=data.get("param1", ""), param2=data.get("param2", ""), output_col=data.get("outputCol"))

            elif node_type == "sort":
                if input_df is None: raise ValueError("No input data.")
                col = data.get("col", "").strip()
                res_df = sort_rows(input_df, col=col, direction=data.get("dir", "asc")) if col else input_df

            elif node_type == "slice":
                if input_df is None: raise ValueError("No input data.")
                n = int(data.get("n", 100))
                res_df = slice_rows(input_df, n=n, mode=data.get("mode", "first"))

            elif node_type == "aggregate":
                if input_df is None: raise ValueError("No input data.")
                groupBy = [c.strip() for c in data.get("groupBy", "").split(",") if c.strip()]
                res_df = aggregate_df(input_df, group_by_cols=groupBy, agg_col=data.get("aggCol"), agg_fn=data.get("aggFn", "sum"))

            elif node_type == "sample":
                if input_df is None: raise ValueError("No input data.")
                res_df = sample_df(input_df, n=float(data.get("n", 100)), mode=data.get("mode", "rows"), seed=int(data.get("seed", 42)))

            # Combine Nodes
            elif node_type == "join":
                if left_df is None or right_df is None: raise ValueError("Both left and right inputs must be connected to Join node.")
                key = data.get("key", "").strip()
                if not key: raise ValueError("Join key column required.")
                res_df = join_dfs(left_df, right_df, key=key, mode=data.get("mode", "inner"))

            # Quality / Visualize / Annotations
            elif node_type == "profiler":
                res_df = input_df
                if res_df is not None:
                    profile_payload = profile_df(res_df)

            elif node_type == "chart":
                res_df = input_df
                if res_df is not None:
                    chart_payload = df_to_response(res_df, source="python")

            else:
                res_df = input_df

            output_df_by_id[node_id] = res_df

        except Exception as err:
            status = "error"
            error_msg = str(err)
            output_df_by_id[node_id] = None

        node_end = time.perf_counter()
        elapsed_ms = round((node_end - node_start) * 1000, 2)
        row_count = len(res_df) if res_df is not None else 0

        results[node_id] = {
            "status": status,
            "error": error_msg,
            "rowCount": row_count,
            "executionTimeMs": elapsed_ms,
            "preview": preview_payload,
            "chart": chart_payload,
            "profile": profile_payload,
            "data": df_to_response(res_df, source="python") if res_df is not None else None
        }

        if status == "error":
            break

    total_elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
    return {
        "success": all(r["status"] == "done" for r in results.values()),
        "totalExecutionTimeMs": total_elapsed_ms,
        "nodeResults": results,
        "engine": "Python (FastAPI + Pandas)"
    }
