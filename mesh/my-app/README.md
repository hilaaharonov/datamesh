# Mesh Dashboard (React + TypeScript)

Frontend for the `mesh` service. It reads collector metadata and latest collected documents from the mesh API.

## API used

- `GET /products`
- `GET /products/{product_name}/latest`

Default API base URL is `http://localhost:8002`.
Set `VITE_MESH_API_URL` to override.

## Run locally

```powershell
Set-Location C:\Users\hilaa\datamesh\mesh\my-app
npm install
npm run dev
```

## Build

```powershell
npm run build
npm run preview
```

