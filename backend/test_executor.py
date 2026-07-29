import time
from executor import execute_pipeline

def test_execution():
    nodes = [
        {"id": "node-1", "type": "load", "data": {"sourceType": "sample", "sampleName": "sales"}},
        {"id": "node-2", "type": "filterRows", "data": {"col": "category", "op": "=", "value": "Electronics", "mode": "keep"}},
        {"id": "node-3", "type": "sort", "data": {"col": "revenue", "dir": "desc"}},
        {"id": "node-4", "type": "preview", "data": {}},
        {"id": "node-5", "type": "profiler", "data": {}}
    ]
    edges = [
        {"id": "e1", "source": "node-1", "target": "node-2"},
        {"id": "e2", "source": "node-2", "target": "node-3"},
        {"id": "e3", "source": "node-3", "target": "node-4"},
        {"id": "e4", "source": "node-3", "target": "node-5"},
    ]

    t0 = time.perf_counter()
    res = execute_pipeline(nodes, edges)
    elapsed = (time.perf_counter() - t0) * 1000

    print(f"Success: {res['success']}")
    print(f"Total Execution Time: {res['totalExecutionTimeMs']} ms (Wall clock: {elapsed:.2f} ms)")
    for nid, r in res['nodeResults'].items():
        print(f"  [{nid}] status={r['status']} rowCount={r['rowCount']} time={r['executionTimeMs']}ms")
    
    assert res['success'] == True
    print("[SUCCESS] Python pipeline execution test PASSED!")

if __name__ == "__main__":
    test_execution()
