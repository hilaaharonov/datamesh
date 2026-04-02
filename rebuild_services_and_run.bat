 cd C:\Users\hilaa\datamesh
 echo building team team_service
 docker build -f .\team\Dockerfile -t datamesh-team_service:latest . --no-cache

 echo building mesh service
 docker build -f .\mesh\Dockerfile -t datamesh-mesh:latest . --no-cache

 docker compose up

 cd C:\Users\hilaa\datamesh\team\my-app
 npm run dev