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

  const [addMember, setAddMember] = useState<Member | null>(null);

  useEffect(() => {
    fetch(ApiUrl)
      .then((res) => res.json())
      .then((data: ApiResponse) => {
        setTeamData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
  <div className="app-container">
    <h1>{teamData?.product}</h1>
    <span className="timestamp">Last updated: {teamData?.collected_at}</span>

    <div className="team-list">
      {teamData?.data.map((member) => (
        <div key={member.id} className="member-card">
          <div className="member-name">{member.name}</div>
          <div className="member-role">{member.role}</div>
        </div>
      ))}
    </div>

    <button type="button"
    onClick={() => setAddMember("hila")}>
    add member
    </button>
  </div>
);
}
export default View;