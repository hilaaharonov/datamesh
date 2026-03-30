import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import View from './ViewMembers.tsx'
import MembersManagement from './MembersManagement.tsx'

function Home() {
  return (
    <section className="page-wrap">
      <div className="page-header">
        <p className="eyebrow">Data Mesh Demo</p>
        <h1>Pink Control Center</h1>
        <p className="page-subtitle">
          Manage your producer data and explore the latest team snapshot in a single place.
        </p>
      </div>

      <div className="feature-grid">
        <article className="feature-card">
          <h2>Manage Members</h2>
          <p>Create, update, and remove members through Team Service CRUD APIs.</p>
          <Link className="button button-primary" to="/management">Open Management</Link>
        </article>

        <article className="feature-card">
          <h2>View Product Data</h2>
          <p>See the current `DataProductDocument` payload served from `/data`.</p>
          <Link className="button button-secondary" to="/view">Open Viewer</Link>
        </article>
      </div>
    </section>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="top-nav">
          <Link className="brand" to="/">DataMesh</Link>
          <nav className="nav-links">
            <Link className="nav-link" to="/">Home</Link>
            <Link className="nav-link" to="/management">Manage Team</Link>
            <Link className="nav-link" to="/view">View Team</Link>
          </nav>
        </header>

        <main className="page-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/management" element={<MembersManagement />} />
            <Route path="/view" element={<View />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
export default App;
