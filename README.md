# page-sharon-api

## Levantar el proyecto con Docker

Esto evita el problema de "en mi máquina funciona" — todos corren la misma versión de Node y de Postgres, sin instalar nada distinto en cada equipo. Necesitas tener [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y abierto.

1. Copia `.env.example` a `.env` y completa al menos `JWT_SECRET` (los demás valores tienen defaults razonables para desarrollo local).

   ```bash
   cp .env.example .env
   ```

2. Levanta la API + Postgres:

   ```bash
   docker compose up --build
   ```

   La API queda disponible en `http://localhost:3000` (o el puerto que pongas en `PORT` dentro de `.env`), con hot-reload: los cambios en `src/` se reflejan sin reiniciar el contenedor a mano.

3. Corre las migraciones (en otra terminal, con el stack ya arriba):

   ```bash
   docker compose exec api npm run migration:run
   ```

4. Para apagar todo:

   ```bash
   docker compose down
   ```

   Los datos de Postgres quedan en un volumen (`postgres_data`) y persisten entre reinicios. Si alguna vez quieres borrar la base de datos y empezar de cero: `docker compose down -v`.

### Producción / staging

`docker-compose.prod.yml` levanta la imagen ya compilada (sin hot-reload):

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

### Versiones fijadas

* Node: `20.18.1` (definido como `ARG NODE_VERSION` en el [Dockerfile](Dockerfile) — para cambiarla, se edita ahí una sola vez).
* Postgres: `18.1` (definido en `docker-compose.yml` / `docker-compose.prod.yml`) — las migraciones usan `uuidv7()`, nativa desde Postgres 18; no bajar de esta versión mayor.
