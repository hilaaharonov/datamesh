import { useEffect, useState } from "react";

type MessageResponse = {
  message: string;
};

const ApiUrl: string = "http://localhost:8001/data"
function App() {
  const [message, setMessage] = useState<string>("Loading...");

  useEffect(() => {
    fetch(ApiUrl)
      .then(res => res.json())
      .then((data: MessageResponse) => setMessage(data.message));
  }, []);



  return (
    <div>
      <h1>My Team</h1>
      <p>{message}</p>
    </div>
  );
}

export default App;