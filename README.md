# TPP_insulA_BackEnd

API backend para la aplicación de control de insulina.

## Requisitos previos

- Node.js (versión 16 o superior)
- PostgreSQL (versión 14 o superior)
- npm o yarn

## Configuración

1. Clona el repositorio:

```bash
git clone https://github.com/franciscoduc4/TPP_insulA_BackEnd.git
cd TPP_insulA_BackEnd
```

2. Instala las dependencias:

```bash
npm install
```

3. Configura las variables de entorno:

Crea un archivo `.env` en la raíz del proyecto basado en el archivo `.env.example` proporcionado. Asegúrate de configurar correctamente la conexión a la base de datos y el secreto JWT.

```bash
# Server configuration
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/insula_db?schema=public"

# JWT
JWT_SECRET="your_jwt_secret_key_here"
JWT_EXPIRES_IN=30d
```

4. Genera el cliente de Prisma y aplica las migraciones:

```bash
npx prisma migrate dev --name init
# o si ya tienes tablas creadas:
npx prisma db push
```

## Ejecución

### Entorno de desarrollo

```bash
npm run dev
```

### Producción

```bash
npm run build
npm start
```

## API Endpoints

### Usuarios
- `POST /api/users/register` - Registrar un nuevo usuario
- `POST /api/users/login` - Iniciar sesión
- `GET /api/users/profile` - Obtener perfil de usuario (requiere autenticación)
- `PUT /api/users/profile` - Actualizar perfil de usuario (requiere autenticación)
- `PUT /api/users/glucose-target` - Actualizar los objetivos de glucosa (requiere autenticación)
- `DELETE /api/users` - Eliminar cuenta de usuario (requiere autenticación)

### Lecturas de Glucosa
- `GET /api/glucose` - Obtener lecturas de glucosa (requiere autenticación)
- `GET /api/glucose/:id` - Obtener una lectura específica (requiere autenticación)
- `POST /api/glucose` - Crear una nueva lectura (requiere autenticación)
- `PUT /api/glucose/:id` - Actualizar una lectura (requiere autenticación)
- `DELETE /api/glucose/:id` - Eliminar una lectura (requiere autenticación)

### Actividades
- `GET /api/activities` - Obtener actividades (requiere autenticación)
- `GET /api/activities/:id` - Obtener una actividad específica (requiere autenticación)
- `POST /api/activities` - Crear una nueva actividad (requiere autenticación)
- `PUT /api/activities/:id` - Actualizar una actividad (requiere autenticación)
- `DELETE /api/activities/:id` - Eliminar una actividad (requiere autenticación)

### Dosis de Insulina
- `GET /api/insulin` - Obtener dosis de insulina (requiere autenticación)
- `GET /api/insulin/:id` - Obtener una dosis específica (requiere autenticación)
- `POST /api/insulin` - Crear una nueva dosis (requiere autenticación)
- `PUT /api/insulin/:id` - Actualizar una dosis (requiere autenticación)
- `DELETE /api/insulin/:id` - Eliminar una dosis (requiere autenticación)