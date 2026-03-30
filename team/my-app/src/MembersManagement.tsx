import { FormEvent, useEffect, useState } from "react";

type Member = {
  id: string;
  name: string;
  role: string;
};

type TeamDataResponse = {
  product: string;
  url: string;
  data: Member[];
  collected_at: string;
};



const API_BASE = "http://localhost:8001";

function MembersManagement() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newMember, setNewMember] = useState<Member>({ id: "", name: "", role: "" });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ name: string; role: string }>({ name: "", role: "" });

  async function fetchMembers() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/data`);
      if (!response.ok) {
        throw new Error(`Failed to load members: ${response.status}`);
      }

      const body = (await response.json()) as TeamDataResponse;
      setMembers(Array.isArray(body.data) ? body.data : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMembers();
  }, []);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMember),
      });

      if (!response.ok) {
        throw new Error(`Failed to create member: ${response.status}`);
      }

      setNewMember({ id: "", name: "", role: "" });
      await fetchMembers();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  function beginEdit(member: Member) {
    setEditingId(member.id);
    setEditValues({ name: member.name, role: member.role });
  }

  async function saveEdit(memberId: string) {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editValues),
      });

      if (!response.ok) {
        throw new Error(`Failed to update member: ${response.status}`);
      }

      setEditingId(null);
      await fetchMembers();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function removeMember(memberId: string) {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/members/${memberId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete member: ${response.status}`);
      }

      await fetchMembers();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page-wrap">
      <div className="page-header">
        <p className="eyebrow">Team Service CRUD</p>
        <h1>Manage Team Members</h1>
        <p className="page-subtitle">Connected to `/members` endpoints on the producer service.</p>
      </div>

      <div className="meta-row">
        <span className="meta-pill">API: {API_BASE}</span>
        <span className="meta-pill">Members: {members.length}</span>
      </div>

      <form onSubmit={handleCreate} className="member-form">
        <input
          required
          className="text-input"
          placeholder="ID"
          value={newMember.id}
          onChange={(event) => setNewMember((prev) => ({ ...prev, id: event.target.value }))}
        />
        <input
          required
          className="text-input"
          placeholder="Name"
          value={newMember.name}
          onChange={(event) => setNewMember((prev) => ({ ...prev, name: event.target.value }))}
        />
        <input
          required
          className="text-input"
          placeholder="Role"
          value={newMember.role}
          onChange={(event) => setNewMember((prev) => ({ ...prev, role: event.target.value }))}
        />
        <button className="button button-primary" disabled={saving} type="submit">Add member</button>
      </form>

      {loading && <p className="status-text">Loading members...</p>}
      {error && <p className="status-text" role="alert">{error}</p>}

      {!loading && (
        <div className="team-list">
          {members.map((member) => (
            <div key={member.id} className="member-card">
              <div className="member-id">#{member.id}</div>

              {editingId === member.id ? (
                <>
                  <input
                    className="text-input"
                    value={editValues.name}
                    onChange={(event) =>
                      setEditValues((prev) => ({ ...prev, name: event.target.value }))
                    }
                  />
                  <input
                    className="text-input"
                    value={editValues.role}
                    onChange={(event) =>
                      setEditValues((prev) => ({ ...prev, role: event.target.value }))
                    }
                  />
                  <button className="button button-primary" disabled={saving} type="button" onClick={() => saveEdit(member.id)}>
                    Save
                  </button>
                  <button className="button button-secondary" type="button" onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <div className="member-name">{member.name}</div>
                  <div className="member-role">{member.role}</div>
                  <button className="button button-secondary" type="button" onClick={() => beginEdit(member)}>
                    Edit
                  </button>
                  <button
                    className="button button-danger"
                    disabled={saving}
                    type="button"
                    onClick={() => removeMember(member.id)}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && members.length === 0 && !error && (
        <p className="status-text">No members yet. Add your first member above.</p>
      )}
    </section>
  );
}

export default MembersManagement;
