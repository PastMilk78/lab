# Sistema de Gestión de Laboratorios Alquimist

Un sistema completo de gestión de laboratorios médicos desarrollado con Next.js, TypeScript y Tailwind CSS.

## 🚀 Estado del Proyecto

### ✅ **Backend Completado (100%)**
- **8 APIs principales** implementadas y funcionando
- **Validación robusta** con Zod
- **Manejo de errores** centralizado
- **Datos en memoria** para desarrollo

### ✅ **Frontend Integrado (75%)**
- **Autenticación** ✅ Integrada con API
- **Laboratorios** ✅ Integrado con API
- **Clientes** ✅ Integrado con API
- **Chat** 🔄 Pendiente de integración
- **Inventario** 🔄 Pendiente de integración
- **Usuarios** 🔄 Pendiente de integración
- **Actividades** 🔄 Pendiente de integración

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Validación**: Zod
- **Iconos**: Lucide React
- **Formularios**: React Hook Form
- **Notificaciones**: Sonner

## 📡 API Endpoints Implementados

### Autenticación
- `POST /api/auth` - Login
- `DELETE /api/auth` - Logout

### Laboratorios
- `GET /api/laboratories` - Obtener todos los laboratorios
- `POST /api/laboratories` - Crear laboratorio
- `PUT /api/laboratories` - Actualizar laboratorio
- `DELETE /api/laboratories?id={id}` - Eliminar laboratorio

### Clientes
- `GET /api/clients` - Obtener todos los clientes
- `POST /api/clients` - Crear cliente
- `PUT /api/clients` - Actualizar cliente
- `DELETE /api/clients?id={id}` - Eliminar cliente

### Chat
- `GET /api/chat` - Obtener datos del chat
- `POST /api/chat` - Enviar mensaje
- `PUT /api/chat` - Crear canal
- `DELETE /api/chat?channelId={id}` - Eliminar canal

### Inventario
- `GET /api/inventory` - Obtener inventario
- `POST /api/inventory` - Agregar item
- `PUT /api/inventory` - Actualizar item
- `DELETE /api/inventory?labId={id}&itemId={id}` - Eliminar item

### Actividades
- `GET /api/activities` - Obtener actividades
- `POST /api/activities` - Crear actividad
- `DELETE /api/activities?days={n}` - Limpiar actividades antiguas

### Usuarios
- `GET /api/users` - Obtener usuarios
- `POST /api/users` - Crear usuario
- `PUT /api/users` - Actualizar usuario
- `DELETE /api/users?id={id}` - Eliminar usuario

### Asignaciones
- `GET /api/assignments` - Obtener asignaciones
- `POST /api/assignments` - Crear asignación
- `PUT /api/assignments` - Actualizar asignación
- `DELETE /api/assignments?id={id}` - Eliminar asignación

## 🔑 Credenciales de Prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@alquimist.com | admin123 |
| Jefe de Lab | jefe@alquimist.com | jefe123 |
| Técnico | tecnico@alquimist.com | tecnico123 |
| Patóloga | patologa@alquimist.com | patologa123 |

## 🚀 Deploy en Vercel

### Opción 1: Deploy Automático (Recomendado)
1. Conecta tu repositorio de GitHub a Vercel
2. Vercel detectará automáticamente que es un proyecto Next.js
3. El deploy se realizará automáticamente

### Opción 2: Deploy Manual
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Para producción
vercel --prod
```

## 🔧 Configuración de Desarrollo

### Variables de Entorno
Crear un archivo `.env.local` en la raíz del proyecto:

```env
# Configuración de la aplicación
NEXT_PUBLIC_APP_NAME="Laboratorios Alquimist"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Construcción para producción
npm run build

# Iniciar en producción
npm start

# Linting
npm run lint
```

## 📊 Próximos Pasos

### Integración Pendiente
- [ ] **Chat**: Integrar APIs de chat con frontend
- [ ] **Inventario**: Integrar APIs de inventario
- [ ] **Usuarios**: Integrar APIs de usuarios
- [ ] **Actividades**: Integrar APIs de actividades
- [ ] **Asignaciones**: Integrar APIs de asignaciones

### Mejoras Futuras
- [ ] **Base de datos real** (PostgreSQL, MongoDB)
- [ ] **JWT tokens** para autenticación
- [ ] **WebSockets** para chat en tiempo real
- [ ] **Notificaciones push**
- [ ] **Reportes y analytics**

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT.

---

Desarrollado con ❤️ para la gestión eficiente de laboratorios médicos.
