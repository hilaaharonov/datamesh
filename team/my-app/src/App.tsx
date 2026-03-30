import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import View from './ViewMembers.tsx'

function Home() {
  return <h1>Home Page</h1>;
}

function Management() {
  return <h1>About Page</h1>;
}


function App() {
  return (
    <BrowserRouter>
      {/* Navigation */}
      <nav>
        <Link className="nav-link" to="/">Home</Link> |{" "}
        <Link className="nav-link" to="/management">Manage team members</Link> |{" "}
        <Link  className="nav-link" to="/view">View team</Link>
      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/management" element={<Management />} />
        <Route path="/view" element={<View />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
