import { useEffect, useState } from "react";

type Member = {
  id: string;
  name: string;
  role: string;
};

type ApiResponse = {
  product: string;
  url: string;
  data: Member[];
  collected_at: string;
};

const ApiUrl: string = "http://localhost:8001/data";

function View() {
  const [teamData, setTeamData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(ApiUrl)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load team data: ${res.status}`);
        }

        return res.json();
      })
      .then((data: ApiResponse) => {
        setTeamData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unknown fetch error");
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="status-text">Loading team data...</p>;

  return (
    <section className="page-wrap">
      <div className="page-header">
        <p className="eyebrow">Team Product</p>
        <h1>{teamData?.product ?? "Team Members"}</h1>
        <p className="page-subtitle">Live payload from the producer service endpoint.</p>
      </div>

      <div className="meta-row">
        <span className="meta-pill">Source: {teamData?.url ?? ApiUrl}</span>
        <span className="meta-pill">Collected: {teamData?.collected_at ?? "-"}</span>
      </div>

      {error && <p className="status-text" role="alert">{error}</p>}

      <div className="team-list">
        {teamData?.data.map((member) => (
          <div key={member.id} className="member-card">
            <div className="member-id">#{member.id}</div>
            <div className="member-name">{member.name}</div>
            <div className="member-role">{member.role}</div>
          </div>
        ))}
      </div>

      {!teamData?.data?.length && !error && (
        <p className="status-text">No members found.</p>
      )}
    </section>
  );
}
export default View;