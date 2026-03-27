import { useEffect, useState } from "react";

// 1. Define the shape of a single person object from the "data" array
type Member = {
  id: string;
  name: string;
  role: string;
};

// 2. Define the shape of the entire JSON response from your API
type ApiResponse = {
  product: string;
  url: string;
  data: Member[]; // This tells TypeScript "data" is a list of Member objects
  collected_at: string;
};

// 3. The URL where your Dockerized API is listening
const ApiUrl: string = "http://localhost:8001/data";

function App() {
  // 4. Create a state variable to hold the API data. It starts as 'null' because we haven't fetched yet.
  const [teamData, setTeamData] = useState<ApiResponse | null>(null);

  // 5. Create a boolean state to track if we are still waiting for the API
  const [loading, setLoading] = useState<boolean>(true);

  // 6. useEffect runs automatically once when the component first appears on screen
  useEffect(() => {
    // 7. Start the network request to your API
    fetch(ApiUrl)
      // 8. Convert the raw HTTP response into a JavaScript object (JSON)
      .then((res) => res.json())
      // 9. Take that JSON data and update our state
      .then((data: ApiResponse) => {
        setTeamData(data);    // Call the function to save the data into 'teamData'
        setLoading(false);    // Turn off the loading message
      })
      // 10. If the API is down or there is a CORS error, catch it here
      .catch((err) => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  }, []); // The empty brackets [] mean "only run this once on startup"

  // 11. If loading is true, show a simple text message and stop here
  if (loading) return <p>Loading...</p>;

  // 12. If we reach this point, the data is ready to be displayed
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
  </div>
);
}

export default App;
