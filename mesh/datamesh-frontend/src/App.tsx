import { FormEvent, useEffect, useMemo, useState } from "react";

const dataProductBaseUrl = "http://localhost:8002";
const themeStorageKey = "datamesh-theme";

type ThemeMode = "light" | "dark";

type DataProduct = {
  name: string;
  get_products_url: string;
  interval_seconds: number;
  collection: string;
};

type DataProductForm = {
  name: string;
  get_products_url: string;
  interval_seconds: string;
};

async function fetchAllDataProducts(): Promise<DataProduct[]> {
  const response = await fetch(`${dataProductBaseUrl}/products`);
  if (!response.ok) {
    throw new Error(`Failed to load data products: ${response.status}`);
  }
  const data = (await response.json()) as DataProduct[];
  return data;
}

async function fetchLastCollectionTime(productName: string): Promise<string> {
  const response = await fetch(`${dataProductBaseUrl}/products/${productName}/last_product_time`);
  if (!response.ok) {
    throw new Error(`Failed to load last collection time for ${productName}: ${response.status}`);
  }
  const data = await response.json();
  return data.last_product_time;
}


async function addDataProduct(product: DataProductForm): Promise<void> {
  const response = await fetch(`${dataProductBaseUrl}/add_data_product`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: product.name.trim(),
      get_products_url: product.get_products_url.trim(),
      interval_seconds: Number(product.interval_seconds),
      collection: `product_${product.name.trim()}`,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to add data product (${response.status}): ${detail}`);
  }
}

async function deleteDataProduct(name: string): Promise<void> {
  const response = await fetch(`${dataProductBaseUrl}/products/${name}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to delete data product (${response.status}): ${detail}`);
  }
}

function App() {
  const [dataProducts, setDataProducts] = useState<DataProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingName, setDeletingName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const savedTheme = window.localStorage.getItem(themeStorageKey);
    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const [newDataProduct, setNewDataProduct] = useState<DataProductForm>({
    name: "",
    get_products_url: "",
    interval_seconds: "120",
  });

  const newCollectionPreview = useMemo(() => {
    const normalizedName = newDataProduct.name.trim();
    return normalizedName ? `product_${normalizedName}` : "product_<name>";
  }, [newDataProduct.name]);

  async function refreshDataProducts() {
    setLoading(true);
    setError(null);
    try {
      const products = await fetchAllDataProducts();
      setDataProducts(products ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshDataProducts();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(themeStorageKey, theme);
  }, [theme]);

  async function handleAddDataProduct(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!newDataProduct.name.trim() || !newDataProduct.get_products_url.trim()) {
      setError("Please provide product name and source URL.");
      return;
    }

    const interval = Number(newDataProduct.interval_seconds);
    if (!Number.isInteger(interval) || interval <= 0) {
      setError("Interval must be a positive whole number.");
      return;
    }

    setSaving(true);
    try {
      await addDataProduct(newDataProduct);
      setNewDataProduct({
        name: "",
        get_products_url: "",
        interval_seconds: "120",
      });
      await refreshDataProducts();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteDataProduct(name: string) {
    setError(null);
    setDeletingName(name);
    try {
      await deleteDataProduct(name);
      await refreshDataProducts();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setDeletingName(null);
    }
  }

  function toggleTheme() {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  }

  return (
    <div className="app-shell">
      <header className="top-nav">
        <span className="brand">DataMesh</span>
        <nav className="nav-links">
          <span className="nav-link nav-link-active">Mesh Products</span>
          <button
            aria-pressed={theme === "dark"}
            className="nav-link theme-toggle"
            type="button"
            onClick={toggleTheme}
          >
            {theme === "dark" ? "☀ Light mode" : "🌙 Dark mode"}
          </button>
        </nav>
      </header>

      <main className="page-content">
        <section className="page-wrap">
          <div className="page-header">
            <p className="eyebrow">Mesh Service</p>
            <h1>Data Products Dashboard</h1>
            <p className="page-subtitle">
              View registered data products from the mesh API
            </p>
          </div>

          <div className="meta-row">
            <span className="meta-pill">API: {dataProductBaseUrl}</span>
            <span className="meta-pill">Products: {dataProducts.length}</span>
            <span className="meta-pill">Next Collection: {newCollectionPreview}</span>
          </div>

          <form onSubmit={handleAddDataProduct} className="member-form">
            <input
              required
              className="text-input"
              placeholder="Product Name"
              value={newDataProduct.name}
              onChange={(event) =>
                setNewDataProduct((prev) => ({ ...prev, name: event.target.value }))
              }
            />
            <input
              required
              className="text-input"
              placeholder="Source URL"
              value={newDataProduct.get_products_url}
              onChange={(event) =>
                setNewDataProduct((prev) => ({ ...prev, get_products_url: event.target.value }))
              }
            />
            <input
              required
              min={1}
              step={1}
              type="number"
              className="text-input"
              placeholder="Interval Seconds"
              value={newDataProduct.interval_seconds}
              onChange={(event) =>
                setNewDataProduct((prev) => ({ ...prev, interval_seconds: event.target.value }))
              }
            />
            <button className="button button-primary" disabled={saving} type="submit">
              {saving ? "Adding..." : "Add Data Product"}
            </button>
          </form>

          {loading && <p className="status-text">Loading data products...</p>}
          {error && (
            <p className="status-text" role="alert">
              {error}
            </p>
          )}

          {!loading && !error && dataProducts.length > 0 && (
            <div className="team-list">
              {dataProducts.map((product) => (
                <article key={product.name} className="member-card">
                  <div className="member-id">#{product.name}</div>
                  <div className="member-name">{product.collection}</div>
                  <div className="member-role">Every {product.interval_seconds}s</div>
                  <div className="member-role">last collection time: {product.last_collect_time} </div>
                  <p className="product-url">{product.get_products_url}</p>
                  <button
                    className="button button-danger"
                    disabled={deletingName === product.name || saving}
                    onClick={() => handleDeleteDataProduct(product.name)}
                    type="button"
                  >
                    {deletingName === product.name ? "Deleting..." : "Delete Product"}
                  </button>
                </article>
              ))}
            </div>
          )}

          {!loading && !error && dataProducts.length === 0 && (
            <p className="status-text">No data products found yet.</p>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
