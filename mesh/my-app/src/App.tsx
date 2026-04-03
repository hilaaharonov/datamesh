import { useEffect, useMemo, useState } from 'react'

type Product = {
  name: string
  collection: string
  source_url: string
  interval_seconds: number
}

type DataProductDocument = {
  product: string
  url: string
  data: unknown
  collected_at: string
}

const API_BASE = import.meta.env.VITE_MESH_API_URL ?? 'http://localhost:8002'

function App() {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [latestDocument, setLatestDocument] = useState<DataProductDocument | null>(null)
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [isLoadingDocument, setIsLoadingDocument] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedMetadata = useMemo(
    () => products.find((product) => product.name === selectedProduct),
    [products, selectedProduct],
  )

  useEffect(() => {
    async function loadProducts() {
      setError(null)
      setIsLoadingProducts(true)
      try {
        const response = await fetch(`${API_BASE}/products`)
        if (!response.ok) {
          throw new Error(`Failed to load products: ${response.status}`)
        }

        const payload = (await response.json()) as Product[]
        setProducts(payload)
        if (payload.length > 0) {
          setSelectedProduct(payload[0].name)
        }
      } catch (fetchError) {
        const message = fetchError instanceof Error ? fetchError.message : 'Unknown product fetch error'
        setError(message)
      } finally {
        setIsLoadingProducts(false)
      }
    }

    loadProducts()
  }, [])

  useEffect(() => {
    if (!selectedProduct) {
      return
    }

    async function loadLatestDocument() {
      setError(null)
      setIsLoadingDocument(true)
      try {
        const response = await fetch(`${API_BASE}/products/${selectedProduct}/latest`)
        if (!response.ok) {
          if (response.status === 404) {
            setLatestDocument(null)
            return
          }
          throw new Error(`Failed to load latest document: ${response.status}`)
        }

        const payload = (await response.json()) as DataProductDocument
        setLatestDocument(payload)
      } catch (fetchError) {
        const message = fetchError instanceof Error ? fetchError.message : 'Unknown latest document fetch error'
        setError(message)
      } finally {
        setIsLoadingDocument(false)
      }
    }

    loadLatestDocument()
  }, [selectedProduct])

  return (
    <main className="app-shell">
      <section className="card">
        <p className="eyebrow">Mesh Service</p>
        <h1>Collected Products Dashboard</h1>
        <p className="subtitle">View the latest documents written by the collector in ArangoDB.</p>

        <div className="meta-row">
          <span className="meta-pill">API: {API_BASE}</span>
          <span className="meta-pill">Products: {products.length}</span>
        </div>

        {isLoadingProducts ? <p className="status">Loading products...</p> : null}
        {error ? (
          <p className="status" role="alert">
            {error}
          </p>
        ) : null}

        <div className="layout-grid">
          <aside>
            <h2>Products</h2>
            <div className="list">
              {products.map((product) => {
                const isActive = product.name === selectedProduct
                return (
                  <button
                    key={product.name}
                    className={`list-item ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedProduct(product.name)}
                    type="button"
                  >
                    <strong>{product.name}</strong>
                    <span>{product.collection}</span>
                    <span>Every {product.interval_seconds}s</span>
                  </button>
                )
              })}
            </div>
          </aside>

          <section>
            <h2>Latest Document</h2>
            {isLoadingDocument ? <p className="status">Loading latest document...</p> : null}
            {!isLoadingDocument && !latestDocument ? (
              <p className="status">No collected document yet for this product.</p>
            ) : null}

            {latestDocument ? (
              <article className="document-card">
                <p>
                  <strong>Product:</strong> {latestDocument.product}
                </p>
                <p>
                  <strong>Source URL:</strong> {latestDocument.url}
                </p>
                <p>
                  <strong>Collected At:</strong> {latestDocument.collected_at}
                </p>
                <p>
                  <strong>Collector Config:</strong> {selectedMetadata?.source_url ?? '-'}
                </p>
                <pre>{JSON.stringify(latestDocument.data, null, 2)}</pre>
              </article>
            ) : null}
          </section>
        </div>
      </section>
    </main>
  )
}

export default App

