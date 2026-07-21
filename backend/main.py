from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict
from typing import List, Optional

app = FastAPI(title="DataFlow API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class PipelineNode(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: str


class PipelineEdge(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: Optional[str] = None
    source: str
    target: str


class PipelineRequest(BaseModel):
    nodes: List[PipelineNode]
    edges: List[PipelineEdge]


class PipelineResponse(BaseModel):
    num_nodes: int
    num_edges: int
    is_dag: bool


@app.get('/')
def read_root():
    return {'app': 'DataFlow', 'status': 'ok'}


def _is_dag(node_ids: List[str], edges: List[PipelineEdge]) -> bool:
    WHITE, GRAY, BLACK = 0, 1, 2
    adjacency = {node_id: [] for node_id in node_ids}
    valid_ids = set(node_ids)
    for edge in edges:
        if edge.source in valid_ids and edge.target in valid_ids:
            adjacency[edge.source].append(edge.target)

    color = {node_id: WHITE for node_id in node_ids}

    def visit(u: str) -> bool:
        color[u] = GRAY
        for v in adjacency[u]:
            if color[v] == GRAY:
                return False
            if color[v] == WHITE and not visit(v):
                return False
        color[u] = BLACK
        return True

    return all(color[n] != WHITE or visit(n) for n in node_ids)


@app.post('/pipelines/parse', response_model=PipelineResponse)
def parse_pipeline(pipeline: PipelineRequest):
    node_ids = [node.id for node in pipeline.nodes]
    return PipelineResponse(
        num_nodes=len(pipeline.nodes),
        num_edges=len(pipeline.edges),
        is_dag=_is_dag(node_ids, pipeline.edges),
    )
