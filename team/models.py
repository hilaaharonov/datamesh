from pydantic import BaseModel, Field
from uuid import uuid4

class TeamMember(BaseModel):
    """Represents a team member stored in ArangoDB."""

    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    role: str

    def to_arango(self) -> dict:
        """Serialize to a dict suitable for ArangoDB insertion.
        Uses id as the _key so we can look up members by id directly."""
        return {
            "_key": self.id,
            "id": self.id,
            "name": self.name,
            "role": self.role,
        }


class CreateTeamMemberRequest(BaseModel):
    """Request body for creating a new team member."""
    name: str
    role: str


class UpdateTeamMemberRequest(BaseModel):
    """Request body for updating a team member.
    All fields are optional — only provided fields are updated."""
    name: str | None = None
    role: str | None = None
