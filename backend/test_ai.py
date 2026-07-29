from ai_generator import generate_pipeline_ai

def test_ai():
    res = generate_pipeline_ai("Filter sales orders with revenue > 200, group by region, and build a bar chart")
    print(f"Engine: {res.get('engine')}")
    print(f"Explanation: {res.get('explanation')}")
    print(f"Nodes count: {len(res.get('nodes', []))}")
    print(f"Edges count: {len(res.get('edges', []))}")
    assert len(res.get("nodes", [])) > 0
    assert len(res.get("edges", [])) > 0
    print("[SUCCESS] AI Generator test PASSED!")

if __name__ == "__main__":
    test_ai()
