# BD de prueba con Docker — Guía rápida

Levanta una MySQL 8 local idéntica en esquema a producción, para desarrollo y tests. Cuando la lógica esté validada, se usan las credenciales de producción (Fase 5) sin tocar el código.

## Requisitos
- Docker Desktop / Docker Engine + Docker Compose v2.

## Pasos

```bash
# 1. Desde esta carpeta (03-datos/docker)
cp .env.example .env          # ajusta credenciales si quieres

# 2. Levantar MySQL + Adminer
docker compose up -d

# 3. Verificar estado (espera healthcheck "healthy")
docker compose ps

# 4. Adminer (inspección visual):  http://localhost:8080
#    Sistema: MySQL · Servidor: mysql · Usuario/Password: los del .env · BD: sotelo_payroll
```

## Conectar CodeIgniter 4

En `backend/.env`:

```
database.default.hostname = 127.0.0.1
database.default.database = sotelo_payroll
database.default.username = sotelo
database.default.password = sotelopass
database.default.DBDriver = MySQLi
database.default.port = 3306
```

Luego, dentro de `backend/`:

```bash
php spark migrate
php spark db:seed RolesPermisosSeeder
php spark db:seed AdminUserSeeder
composer test
```

## Comandos útiles

```bash
docker compose down       # detener (conserva datos)
docker compose down -v    # detener y BORRAR datos (volumen) — reset limpio
docker compose logs -f mysql
```

## Notas de seguridad
- El archivo `.env` con credenciales **no** se versiona (añádelo a `.gitignore`).
- Las credenciales de producción se inyectan por entorno/secret manager en el servidor, nunca en el repo.
- `./initdb/*.sql` (si lo creas) se ejecuta solo en el **primer** arranque del volumen; para el esquema usa las migraciones de CI4 (fuente de verdad).
