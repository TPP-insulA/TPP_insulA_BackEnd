# InsulA - Conector para Nightscout

## Descripción

Este conector permite que la aplicación InsulA se integre con [Nightscout](http://www.nightscout.info/), una plataforma de código abierto para monitoreo continuo de glucosa. El conector facilita la conexión a una instancia de Nightscout, la recuperación de datos de glucosa y la sincronización con Firebase.

## Requisitos previos

- Go 1.21 o superior
- Cuenta de Firebase con Firestore habilitado
- Credenciales de servicio de Firebase (archivo JSON)

## Configuración

### Variables de entorno

Se debe crear un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
JWT_SECRET="clave-para-tokens"
GOOGLE_APPLICATION_CREDENTIALS="/ruta/absoluta/al/service-account.json"
FIREBASE_PROJECT_ID="id-del-proyecto-firebase"
```

Para generar una clave JWT segura:

```bash
export JWT_SECRET=$(openssl rand -base64 32)
echo $JWT_SECRET
```

### Credenciales de Firebase

1. Ir a la [Consola de Firebase](https://console.firebase.google.com/)
2. Selección del proyecto
3. Ir a Configuración del proyecto > Cuentas de servicio
4. Hacer click en "Generar nueva clave privada"
5. Guardar el archivo JSON descargado en un lugar seguro
6. Configurar la ruta al archivo en la variable de entorno `GOOGLE_APPLICATION_CREDENTIALS`

## Instalación

Clonar este repositorio:

```bash
git clone https://github.com/franciscoduc4/TPP_insulA_BackEnd.git nightscout-connector
cd nightscout-connector
```

Instalar las dependencias:

```bash
go mod download
```

## Ejecución

### Desarrollo local

```bash
go run nightscout-connector/cmd/server/main.go
```

### Con Docker

Construir la imagen:

```bash
docker build -t insulA-nightscout-connector .
```

Ejecutar el contenedor:

```bash
docker run -p 8080:8080 \
  -e JWT_SECRET="tu-secreto-jwt" \
  -e GOOGLE_APPLICATION_CREDENTIALS="/app/config/service-account.json" \
  -e FIREBASE_PROJECT_ID="tu-proyecto-firebase" \
  -v /ruta/absoluta/al/service-account.json:/app/config/service-account.json \
  insulA-nightscout-connector
```

## Endpoints de la API

### Verificar estado del servicio

- **GET** `/api/health`
- **Respuesta**: Estado del servicio y timestamp

### Conectar a Nightscout

- **POST** `/api/nightscout/connect`
- **Auth**: Requerida
- **Body**:

  ```json
  {
    "userId": "id-del-usuario",
    "nightscoutUrl": "https://tu-sitio-nightscout.com",
    "apiKey": "token-de-api-opcional"
  }
  ```

- **Respuesta**: Confirmación de conexión exitosa

### Verificar conexión a Nightscout

- **GET** `/api/nightscout/verify?userId=id-del-usuario`
- **Auth**: Requerida
- **Respuesta**: Estado de la conexión

### Obtener datos de glucosa

- **GET** `/api/nightscout/entries?userId=id-del-usuario&count=24&from=2023-01-01T00:00:00Z&to=2023-01-02T00:00:00Z`
- **Auth**: Requerida
- **Parámetros**:
  - `userId`: ID del usuario (obligatorio)
  - `count`: Cantidad de registros (predeterminado: 24)
  - `from`: Fecha de inicio (formato ISO)
  - `to`: Fecha de fin (formato ISO)
- **Respuesta**: Lista de registros de glucosa

### Desconectar de Nightscout

- **DELETE** `/api/nightscout/disconnect?userId=id-del-usuario`
- **Auth**: Requerida
- **Respuesta**: Confirmación de desconexión exitosa

## Estructura del proyecto

```sh
.
├── Dockerfile
├── README.md
├── go.mod
├── go.sum
├── internal
│   ├── api         # Controladores y rutas de la API
│   ├── auth        # Lógica de autenticación
│   ├── config      # Configuración de la aplicación
│   ├── constants   # Constantes usadas en el proyecto
│   ├── firebase    # Cliente e integración con Firebase
│   ├── models      # Modelos de datos
│   └── nightscout  # Cliente para la API de Nightscout
└── nightscout-connector
    └── cmd
        └── server  # Punto de entrada de la aplicación
```

## Desarrollo

### Añadir nuevas funcionalidades

1. Crear nuevos controladores en `internal/api/handlers.go`
2. Agregar nuevas rutas en `internal/api/routes.go`
3. Actualizar las constantes en `internal/constants/constants.go`, de ser necesario

### Tests

Para ejecutar las pruebas:

```bash
go test ./...
```

## Licencia

Este proyecto está licenciado bajo [Licencia MIT](LICENSE).
