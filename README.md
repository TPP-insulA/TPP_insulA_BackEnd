# TPP_insulA_BackEnd

API backend para la aplicación de control de insulina.

## Requisitos previos

- Node.js (versión 16 o superior)
- PostgreSQL (versión 14 o superior)
- npm o yarn

## Configuración

1. Clona el repositorio:

```bash
git clone https://github.com/TPP-insulA/TPP_insulA_BackEnd.git
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

### Autenticación y Usuarios
- `POST /api/users/register` - Registrar un nuevo usuario
- `POST /api/users/login` - Iniciar sesión
- `GET /api/users/profile` - Obtener perfil de usuario
- `PUT /api/users/profile` - Actualizar perfil de usuario
- `PUT /api/users/profile/image` - Actualizar imagen de perfil
- `PUT /api/users/glucose-target` - Actualizar objetivos de glucosa
- `DELETE /api/users` - Eliminar cuenta de usuario

### Dashboard
- `GET /api/dashboard` - Obtener datos del dashboard (glucosa, actividades, predicciones)

### Lecturas de Glucosa
- `GET /api/glucose` - Obtener todas las lecturas
- `GET /api/glucose/stats` - Obtener estadísticas de glucosa
- `GET /api/glucose/predict` - Predecir próxima lectura de glucosa
- `GET /api/glucose/:id` - Obtener una lectura específica
- `POST /api/glucose` - Registrar nueva lectura
- `PUT /api/glucose/:id` - Actualizar una lectura
- `DELETE /api/glucose/:id` - Eliminar una lectura

### Actividades Físicas
- `GET /api/activities` - Obtener todas las actividades
- `GET /api/activities/stats` - Obtener estadísticas de actividades
- `GET /api/activities/:id` - Obtener una actividad específica
- `POST /api/activities` - Registrar nueva actividad
- `PUT /api/activities/:id` - Actualizar una actividad
- `DELETE /api/activities/:id` - Eliminar una actividad

### Comidas y Alimentos
- `GET /api/meals` - Obtener todas las comidas
- `GET /api/meals/:id` - Obtener una comida específica
- `POST /api/meals` - Registrar nueva comida
- `PUT /api/meals/:id` - Actualizar una comida
- `DELETE /api/meals/:id` - Eliminar una comida
- `POST /api/food/analyze` - Analizar alimento por imagen
- `GET /api/food/search` - Buscar alimentos en base de datos

### Insulina
- `GET /api/insulin` - Obtener todas las dosis
- `GET /api/insulin/stats` - Obtener estadísticas de insulina
- `GET /api/insulin/predict` - Predecir dosis de insulina
- `GET /api/insulin/:id` - Obtener una dosis específica
- `POST /api/insulin` - Registrar nueva dosis
- `PUT /api/insulin/:id` - Actualizar una dosis
- `DELETE /api/insulin/:id` - Eliminar una dosis

### Documentación
- `GET /api/docs` - Documentación Swagger de la API

Todos los endpoints (excepto registro, login y documentación) requieren autenticación mediante Bearer Token JWT.

## Documentación Detallada

Para una documentación más detallada de los endpoints, incluyendo esquemas de requests/responses y ejemplos, visita la documentación Swagger en `/api/docs` cuando el servidor esté corriendo.