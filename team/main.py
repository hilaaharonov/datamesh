import logging
from fastapi import FastAPI, HTTPException
from arango.database import StandardDatabase
from db import get_db, COLLECTION_NAME
from models import TeamMember, CreateTeamMemberRequest, UpdateTeamMemberRequest

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

app = FastAPI(title="Team Service")
db: StandardDatabase = get_db()

@app.post("/members", response_model=TeamMember, status_code=201)
def create_member(request: CreateTeamMemberRequest) -> TeamMember:
    member = TeamMember(name=request.name, role=request.role)
    db.collection(COLLECTION_NAME).insert(member.to_arango())
    return member


@app.get("/members", response_model=list[TeamMember])
def get_all_members() -> list[TeamMember]:
    cursor = db.aql.execute(f"FOR m IN {COLLECTION_NAME} RETURN m")
    return [TeamMember(**doc) for doc in cursor]

@app.get("/members/{member_id}", response_model=TeamMember)
def get_member(member_id: str) -> TeamMember:
    doc = db.collection(COLLECTION_NAME).get(member_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Member not found")
    return TeamMember(**doc)


@app.patch("/members/{member_id}", response_model=TeamMember)
def update_member(member_id: str, request: UpdateTeamMemberRequest) -> TeamMember:
    doc = db.collection(COLLECTION_NAME).get(member_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Member not found")

    # Only update fields that were provided
    updates = request.model_dump(exclude_none=True)
    if updates:
        db.collection(COLLECTION_NAME).update({"_key": member_id, **updates})

    updated = db.collection(COLLECTION_NAME).get(member_id)
    return TeamMember(**updated)

@app.delete("/members/{member_id}", status_code=204)
def delete_member(member_id: str) -> None:
    doc = db.collection(COLLECTION_NAME).get(member_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Member not found")
    db.collection(COLLECTION_NAME).delete(member_id)
