# Sistema Aeropuerto Internacional

## Estructura del Proyecto

```
aeropuerto-internacional/
├── src/
│   ├── assets/              # Archivos estáticos (imágenes, PDFs, etc.)
│   ├── components/          # Componentes reutilizables
│   ├── pages/              # Páginas principales
│   ├── services/           # Servicios y APIs
│   ├── utils/             # Utilidades y helpers
│   ├── context/           # Context API
│   ├── hooks/             # Custom hooks
│   └── styles/            # Estilos globales
├── public/                # Archivos estáticos públicos
├── docs/                 # Documentación del proyecto
└── tests/               # Tests unitarios
```

## Tecnologías Utilizadas

- React.js
- Bootstrap 5
- React Router
- Axios
- React Bootstrap
- React Icons
- React Toastify

## Requisitos del Sistema

- Node.js 18.x o superior
- npm 8.x o superior
- Oracle Database 21c
- Oracle Data Guard
- Oracle Standby Database

## Instalación

1. Clonar el repositorio
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Configurar variables de entorno:
   ```bash
   cp .env.example .env
   ```
4. Iniciar el servidor de desarrollo:
   ```bash
   npm start
   ```

## Estructura de Bases de Datos

- Base de datos productiva: Oracle 21c
- Base de datos réplica: Oracle 21c Standby
- Data Guard configurado para replicación

## Documentación

La documentación completa del proyecto se encuentra en la carpeta `docs/`:
- Arquitectura del sistema
- API Documentation
- Guía de implementación
- Manual de usuario
- Guía de desarrollo

## Contribución

1. Crear una rama para nuevas características:
   ```bash
   git checkout -b feature/nueva-caracteristica
   ```
2. Commit los cambios:
   ```bash
   git commit -m 'feat: nueva característica'
   ```
3. Push a la rama:
   ```bash
   git push origin feature/nueva-caracteristica
   ```

## Licencia

MIT
