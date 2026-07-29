import io
import re
import math
import numpy as np
import pandas as pd

SAMPLE_DATASETS = {
    "iris": """sepal_length,sepal_width,petal_length,petal_width,species
5.1,3.5,1.4,0.2,setosa
4.9,3.0,1.4,0.2,setosa
4.7,3.2,1.3,0.2,setosa
4.6,3.1,1.5,0.2,setosa
5.0,3.6,1.4,0.2,setosa
5.4,3.9,1.7,0.4,setosa
5.7,4.4,1.5,0.4,setosa
5.1,3.5,1.4,0.3,setosa
5.7,3.8,1.7,0.3,setosa
5.1,3.8,1.5,0.3,setosa
7.0,3.2,4.7,1.4,versicolor
6.4,3.2,4.5,1.5,versicolor
6.9,3.1,4.9,1.5,versicolor
5.5,2.3,4.0,1.3,versicolor
6.5,2.8,4.6,1.5,versicolor
5.7,2.8,4.5,1.3,versicolor
6.3,3.3,4.7,1.6,versicolor
4.9,2.4,3.3,1.0,versicolor
6.6,2.9,4.6,1.3,versicolor
5.2,2.7,3.9,1.4,versicolor
6.3,3.3,6.0,2.5,virginica
5.8,2.7,5.1,1.9,virginica
7.1,3.0,5.9,2.1,virginica
6.3,2.9,5.6,1.8,virginica
6.5,3.0,5.8,2.2,virginica
7.6,3.0,6.6,2.1,virginica
4.9,2.5,4.5,1.7,virginica
7.3,2.9,6.3,1.8,virginica
6.7,2.5,5.8,1.8,virginica
7.2,3.6,6.1,2.5,virginica""",

    "titanic": """survived,pclass,sex,age,fare,embarked
1,1,female,29,211.34,S
0,1,male,30,151.55,S
0,1,female,2,151.55,S
0,1,male,30,151.55,S
1,1,female,53,51.48,S
0,1,male,39,0,S
1,1,female,36,13,S
0,1,male,34,13,S
1,2,female,36,13,S
0,2,male,18,11.5,Q
0,2,male,40,13,S
1,2,female,36,13,C
0,2,male,28,10.5,S
0,3,male,42,7.55,S
1,3,female,16,20.25,S
0,3,male,13,20.25,S
0,3,female,16,7.65,S
1,3,male,25,7.65,S
0,3,male,20,7.925,S
1,3,female,18,7.225,C
0,3,male,30,7.25,Q
1,3,female,26,7.65,S
0,3,male,17,8.66,S
0,3,male,32,7.925,S
1,3,female,45,8.05,S
0,1,male,71,49.5,C
0,2,male,30,24,C
1,2,female,28,24,C
0,2,male,27,13,S
0,2,male,34,13,S""",

    "sales": """order_id,date,product,category,region,quantity,unit_price,revenue
1001,2024-01-05,Widget A,Electronics,North,10,29.99,299.90
1002,2024-01-08,Gadget B,Electronics,South,5,49.99,249.95
1003,2024-01-12,Widget A,Electronics,East,8,29.99,239.92
1004,2024-01-15,Gizmo C,Accessories,North,20,9.99,199.80
1005,2024-01-20,Gadget B,Electronics,West,3,49.99,149.97
1006,2024-02-02,Widget A,Electronics,South,12,29.99,359.88
1007,2024-02-10,Gizmo C,Accessories,East,15,9.99,149.85
1008,2024-02-14,Thingamajig D,Accessories,North,7,19.99,139.93
1009,2024-02-18,Gadget B,Electronics,South,6,49.99,299.94
1010,2024-02-25,Widget A,Electronics,West,9,29.99,269.91
1011,2024-03-01,Thingamajig D,Accessories,East,11,19.99,219.89
1012,2024-03-07,Gizmo C,Accessories,West,25,9.99,249.75
1013,2024-03-14,Widget A,Electronics,North,14,29.99,419.86
1014,2024-03-20,Gadget B,Electronics,East,4,49.99,199.96
1015,2024-03-28,Thingamajig D,Accessories,South,9,19.99,179.91
1016,2024-04-04,Widget A,Electronics,West,11,29.99,329.89
1017,2024-04-11,Gizmo C,Accessories,North,30,9.99,299.70
1018,2024-04-18,Gadget B,Electronics,South,7,49.99,349.93
1019,2024-04-25,Thingamajig D,Accessories,East,13,19.99,259.87
1020,2024-05-02,Widget A,Electronics,North,16,29.99,479.84"""
}

def parse_sample(name: str) -> pd.DataFrame:
    csv_str = SAMPLE_DATASETS.get(name, SAMPLE_DATASETS["iris"])
    return pd.read_csv(io.StringIO(csv_str))

def parse_csv_text(text: str) -> pd.DataFrame:
    return pd.read_csv(io.StringIO(text.strip()))

def records_to_df(rows: list, columns: list = None) -> pd.DataFrame:
    if not rows:
        return pd.DataFrame(columns=columns or [])
    df = pd.DataFrame(rows)
    if columns:
        for c in columns:
            if c not in df.columns:
                df[c] = np.nan
        df = df[columns]
    return df

def df_to_response(df: pd.DataFrame, source: str = "python") -> dict:
    if df is None:
        return {"rows": [], "columns": [], "meta": {"rowCount": 0, "source": source}}
    # Replace NaN / Inf with None for clean JSON serialization
    df_clean = df.replace({np.nan: None, np.inf: None, -np.inf: None})
    records = df_clean.to_dict(orient="records")
    cols = list(df.columns)
    return {
        "rows": records,
        "columns": cols,
        "meta": {"rowCount": len(df), "source": source}
    }

# --- Clean Nodes ---

def drop_nulls(df: pd.DataFrame, mode: str = "any", cols: list = None) -> pd.DataFrame:
    target_cols = [c for c in cols if c in df.columns] if cols else list(df.columns)
    if not target_cols:
        return df.copy()
    how = "any" if mode == "any" else "all"
    return df.dropna(subset=target_cols, how=how).reset_index(drop=True)

def fill_nulls(df: pd.DataFrame, col: str, strategy: str = "mean", custom_val: str = None) -> pd.DataFrame:
    if col not in df.columns:
        return df.copy()
    res = df.copy()
    if strategy == "mean" and pd.api.types.is_numeric_dtype(res[col]):
        val = res[col].mean()
    elif strategy == "median" and pd.api.types.is_numeric_dtype(res[col]):
        val = res[col].median()
    elif strategy == "mode":
        m = res[col].mode()
        val = m.iloc[0] if not m.empty else ""
    else:
        val = custom_val if custom_val is not None else ""
    res[col] = res[col].fillna(val)
    return res

def dedupe(df: pd.DataFrame, cols: list = None) -> pd.DataFrame:
    target_cols = [c for c in cols if c in df.columns] if cols else None
    return df.drop_duplicates(subset=target_cols).reset_index(drop=True)

def type_cast(df: pd.DataFrame, col: str, target_type: str) -> pd.DataFrame:
    if col not in df.columns:
        return df.copy()
    res = df.copy()
    try:
        if target_type == "number":
            res[col] = pd.to_numeric(res[col], errors="coerce")
        elif target_type == "string":
            res[col] = res[col].astype(str)
        elif target_type == "boolean":
            res[col] = res[col].astype(bool)
        elif target_type == "date":
            res[col] = pd.to_datetime(res[col], errors="coerce").dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    except Exception:
        pass
    return res

def trim_strings(df: pd.DataFrame, cols: list = None) -> pd.DataFrame:
    res = df.copy()
    target_cols = [c for c in cols if c in res.columns] if cols else [c for c in res.columns if pd.api.types.is_string_dtype(res[c]) or res[c].dtype == 'object']
    for c in target_cols:
        res[c] = res[c].astype(str).str.strip()
    return res

# --- Transform Nodes ---

def filter_rows(df: pd.DataFrame, col: str, op: str, value: str, mode: str = "keep") -> pd.DataFrame:
    if col not in df.columns:
        return df.copy()
    s = df[col]
    val_str = str(value)
    
    if op == '=':
        mask = s.astype(str) == val_str
    elif op == '≠':
        mask = s.astype(str) != val_str
    elif op in ('>', '<', '>=', '<='):
        try:
            num_s = pd.to_numeric(s, errors='coerce')
            num_val = float(value)
            if op == '>': mask = num_s > num_val
            elif op == '<': mask = num_s < num_val
            elif op == '>=': mask = num_s >= num_val
            elif op == '<=': mask = num_s <= num_val
        except Exception:
            mask = pd.Series([False]*len(df), index=df.index)
    elif op == 'contains':
        mask = s.astype(str).str.contains(val_str, case=False, na=False)
    elif op == 'starts with':
        mask = s.astype(str).str.startswith(val_str, na=False)
    elif op == 'ends with':
        mask = s.astype(str).str.endswith(val_str, na=False)
    elif op == 'is null':
        mask = s.isna()
    elif op == 'not null':
        mask = s.notna()
    elif op == 'regex':
        try:
            mask = s.astype(str).str.contains(val_str, regex=True, na=False)
        except Exception:
            mask = pd.Series([False]*len(df), index=df.index)
    else:
        mask = pd.Series([True]*len(df), index=df.index)

    if mode == "drop":
        mask = ~mask
        
    return df[mask].reset_index(drop=True)

def select_cols(df: pd.DataFrame, cols: list, mode: str = "keep") -> pd.DataFrame:
    valid_cols = [c for c in cols if c in df.columns]
    if mode == "keep":
        return df[valid_cols].copy() if valid_cols else df.copy()
    else:
        return df.drop(columns=valid_cols, errors="ignore").copy()

def rename_cols(df: pd.DataFrame, mapping: dict) -> pd.DataFrame:
    return df.rename(columns=mapping)

def add_column(df: pd.DataFrame, name: str, expr: str) -> pd.DataFrame:
    res = df.copy()
    try:
        res[name] = res.eval(expr)
    except Exception:
        # Fallback python row iteration if pd.eval fails on string operations
        try:
            res[name] = res.apply(lambda row: eval(expr, {}, row.to_dict()), axis=1)
        except Exception as e:
            res[name] = None
    return res

# --- Transform2 Nodes ---

def pivot_df(df: pd.DataFrame, index_col: str, columns_col: str, values_col: str, agg_fn: str = "sum") -> pd.DataFrame:
    if index_col not in df.columns or columns_col not in df.columns or values_col not in df.columns:
        return df.copy()
    agg_map = {"avg": "mean", "mean": "mean", "sum": "sum", "count": "count", "min": "min", "max": "max"}
    fn = agg_map.get(agg_fn, "sum")
    piv = df.pivot_table(index=index_col, columns=columns_col, values=values_col, aggfunc=fn).reset_index()
    piv.columns.name = None
    return piv

def melt_df(df: pd.DataFrame, id_cols: list, var_name: str = "variable", value_name: str = "value") -> pd.DataFrame:
    valid_ids = [c for c in id_cols if c in df.columns]
    return df.melt(id_vars=valid_ids if valid_ids else None, var_name=var_name, value_name=value_name)

def rolling_window(df: pd.DataFrame, col: str, window_size: int = 3, fn: str = "mean", output_col: str = None) -> pd.DataFrame:
    if col not in df.columns:
        return df.copy()
    res = df.copy()
    out_name = output_col if output_col else f"{col}_rolling_{fn}"
    roller = res[col].rolling(window=window_size, min_periods=1)
    if fn == "sum": res[out_name] = roller.sum()
    elif fn == "max": res[out_name] = roller.max()
    elif fn == "min": res[out_name] = roller.min()
    else: res[out_name] = roller.mean()
    return res

def string_ops(df: pd.DataFrame, col: str, op: str = "upper", param1: str = "", param2: str = "", output_col: str = None) -> pd.DataFrame:
    if col not in df.columns:
        return df.copy()
    res = df.copy()
    out_name = output_col if output_col else col
    s = res[col].astype(str)
    
    if op == "upper": res[out_name] = s.str.upper()
    elif op == "lower": res[out_name] = s.str.lower()
    elif op == "trim": res[out_name] = s.str.strip()
    elif op == "replace": res[out_name] = s.str.replace(param1, param2, regex=False)
    elif op == "extract": res[out_name] = s.str.extract(param1, expand=False)
    elif op == "length": res[out_name] = s.str.len()
    elif op == "prefix": res[out_name] = param1 + s
    elif op == "suffix": res[out_name] = s + param1
    else: res[out_name] = s
    return res

# --- Organize Nodes ---

def sort_rows(df: pd.DataFrame, col: str, direction: str = "asc") -> pd.DataFrame:
    if col not in df.columns:
        return df.copy()
    ascending = direction == "asc"
    return df.sort_values(by=col, ascending=ascending).reset_index(drop=True)

def slice_rows(df: pd.DataFrame, n: int = 100, mode: str = "first") -> pd.DataFrame:
    if mode == "last":
        return df.tail(n).reset_index(drop=True)
    return df.head(n).reset_index(drop=True)

def aggregate_df(df: pd.DataFrame, group_by_cols: list, agg_col: str, agg_fn: str = "sum") -> pd.DataFrame:
    valid_groups = [c for c in group_by_cols if c in df.columns]
    if not valid_groups or agg_col not in df.columns:
        return df.copy()
    agg_map = {"avg": "mean", "mean": "mean", "sum": "sum", "count": "count", "min": "min", "max": "max"}
    fn = agg_map.get(agg_fn, "sum")
    return df.groupby(valid_groups, as_index=False).agg({agg_col: fn})

def sample_df(df: pd.DataFrame, n: int = 100, mode: str = "rows", seed: int = 42) -> pd.DataFrame:
    if len(df) == 0:
        return df.copy()
    if mode == "percent":
        frac = min(max(n / 100.0, 0.0), 1.0)
        return df.sample(frac=frac, random_state=seed).reset_index(drop=True)
    else:
        sample_n = min(n, len(df))
        return df.sample(n=sample_n, random_state=seed).reset_index(drop=True)

# --- Combine Nodes ---

def join_dfs(left_df: pd.DataFrame, right_df: pd.DataFrame, key: str, mode: str = "inner") -> pd.DataFrame:
    if key not in left_df.columns or key not in right_df.columns:
        return left_df.copy()
    how_map = {"inner": "inner", "left": "left", "right": "right", "outer": "outer"}
    how = how_map.get(mode, "inner")
    return pd.merge(left_df, right_df, on=key, how=how, suffixes=("", "_right")).reset_index(drop=True)

def concat_dfs(dfs: list) -> pd.DataFrame:
    valid_dfs = [d for d in dfs if d is not None and not d.empty]
    if not valid_dfs:
        return pd.DataFrame()
    return pd.concat(valid_dfs, ignore_index=True)

# --- Quality / Profile Nodes ---

def profile_df(df: pd.DataFrame) -> dict:
    if df is None or df.empty:
        return {"totalRows": 0, "totalCols": 0, "columns": []}
    
    col_profiles = []
    total_rows = len(df)
    
    for c in df.columns:
        series = df[c]
        null_count = int(series.isna().sum())
        null_ratio = float(null_count / total_rows) if total_rows > 0 else 0.0
        unique_count = int(series.nunique(dropna=True))
        
        col_type = "string"
        if pd.api.types.is_numeric_dtype(series):
            col_type = "number"
        elif pd.api.types.is_bool_dtype(series):
            col_type = "boolean"
        elif pd.api.types.is_datetime64_any_dtype(series):
            col_type = "date"

        stats = {}
        if col_type == "number":
            stats = {
                "min": float(series.min()) if not series.dropna().empty else None,
                "max": float(series.max()) if not series.dropna().empty else None,
                "mean": float(series.mean()) if not series.dropna().empty else None,
                "median": float(series.median()) if not series.dropna().empty else None,
            }
        
        top_vals = series.value_counts(dropna=True).head(5).to_dict()

        col_profiles.append({
            "name": c,
            "type": col_type,
            "nullCount": null_count,
            "nullRatio": round(null_ratio, 4),
            "uniqueCount": unique_count,
            "stats": stats,
            "topValues": top_vals
        })
        
    return {
        "totalRows": total_rows,
        "totalCols": len(df.columns),
        "columns": col_profiles
    }
