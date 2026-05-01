# Festival de la Niñez

Aplicación web en React + Vite con autenticación y backend en Supabase Edge Functions.

## Estado funcional actual

- Registro/login por correo.
- El campo `attendsInterclubes` ya no lo define el usuario en registro.
- `attendsInterclubes` se controla desde la tabla `attendees` (admin).
- Actividades filtradas por usuario:
  - globales (`audience = all`)
  - de interclubes (`audience = interclubes`)
  - personalizadas por correo (`assignedEmails`)
- Importación masiva de actividades desde Google Sheets con endpoint protegido.

## Paso a paso detallado (Supabase)

### 1) Crear proyecto Supabase

1. Ve a [Supabase](https://supabase.com) y crea un proyecto.
2. Guarda estos datos (Project Settings -> API):
   - `Project URL`
   - `anon public key`
   - `service_role key` (solo backend)

### 2) Crear tablas necesarias

1. Abre `SQL Editor` en Supabase.
2. Ejecuta todo el contenido de `supabase/schema.sql`.
3. Verifica que existan:
   - `public.kv_store_e1ac9291`
   - `public.attendees`

### 3) Cargar asistentes permitidos

La app solo permite registro con correos presentes en `attendees`.

Inserta tus asistentes (ejemplo):

```sql
insert into public.attendees (email, full_name, attends_interclubes, is_active)
values
  ('persona1@email.com', 'Persona Uno', true, true),
  ('persona2@email.com', 'Persona Dos', false, true);
```

### 4) Usar Supabase CLI

```bash
npx supabase@latest login
```

### 5) Vincular este repo con tu proyecto

```bash
npx supabase@latest link --project-ref <tu_project_ref>
```

`<tu_project_ref>` es el subdominio de tu URL (`https://<project_ref>.supabase.co`).

### 6) Configurar secretos de Edge Functions

```bash
npx supabase@latest secrets set SUPABASE_URL=https://<tu_project_ref>.supabase.co SUPABASE_SERVICE_ROLE_KEY=<tu_service_role_key> IMPORT_SECRET=<tu_clave_larga>
```

### 7) Desplegar backend (Edge Function)

Este es el paso clave que te faltaba.

```bash
npx supabase@latest functions deploy server
```

### 8) Probar backend

Abre en navegador:

`https://<tu_project_ref>.supabase.co/functions/v1/server/health`

Debe devolver algo como:

```json
{"status":"ok"}
```

## Configuración local del frontend

1. Copia `.env.example` a `.env.local`.
2. Completa:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Instala y ejecuta:

```bash
npm install
npm start
```

## Deploy en Netlify

Este repo ya incluye `netlify.toml`.

En Netlify agrega variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Y haz deploy normal.

## Importación desde Google Spreadsheet

1. Usa el endpoint:
   - `POST /functions/v1/server/activities/import`
2. Envía header:
   - `x-import-secret: <IMPORT_SECRET>`
3. Envía body:
   - `{ "activities": [...] }`

Guía y script listos en:

- `docs/google-apps-script.md`
  