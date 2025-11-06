# → GDN Pro | Página Oficial ←

<a href="https://gdnpro.com">
  <img src="https://gdnpro.com/images/embedded-img.webp" />
</a>

[Visit it →](https://gdnpro.com)

## 📃 Descripción →

Este repositorio contiene el código general de la página oficial de GDN Pro, una plataforma completa de gestión de proyectos freelance que conecta clientes con freelancers. Construida con [Next.js](https://nextjs.org) 16, [React](https://react.dev) 19, [TypeScript](https://www.typescriptlang.org), [Tailwind CSS](https://tailwindcss.com) 4, [Supabase](https://supabase.com), [Stripe](https://stripe.com), y desplegada en [Vercel](https://vercel.com).

## 🚀 Características Principales

### 🎯 Gestión de Proyectos
- Sistema completo de creación y gestión de proyectos
- Proyectos con milestones y entregables
- Seguimiento de progreso en tiempo real
- Estados de proyecto (pendiente, en progreso, completado)
- Gestión de presupuestos y pagos

### 💼 Marketplace de Freelancers
- Búsqueda avanzada de freelancers por categoría, ubicación, experiencia y presupuesto
- Perfiles públicos de freelancers con portafolio
- Sistema de propuestas para proyectos
- Estadísticas y calificaciones públicas

### 💰 Sistema de Pagos
- Integración completa con Stripe
- Checkout seguro para contrataciones
- Gestión de transacciones
- Historial de pagos para clientes y freelancers
- Pagos por milestones

### 💬 Mensajería y Comunicación
- Chat en tiempo real entre clientes y freelancers
- Centro de conversaciones integrado
- Notificaciones automáticas de nuevos mensajes
- Protección contra intercambio de información de contacto

### 🔔 Sistema de Notificaciones
- Centro de notificaciones completo
- Notificaciones en tiempo real para:
  - Nuevos mensajes
  - Propuestas recibidas/aceptadas/rechazadas
  - Actualizaciones de proyectos
  - Pagos procesados
  - Reseñas recibidas
  - Logros desbloqueados
- Campana de notificaciones con contador de no leídas

### ⭐ Sistema de Reseñas
- Reseñas detalladas con múltiples categorías
- Calificaciones por proyecto
- Estadísticas de reseñas públicas
- Sistema de reputación basado en reseñas

### 🏆 Sistema de Badges y Logros
- Sistema de badges para motivar a usuarios
- Logros desbloqueables automáticamente
- Badges para freelancers: proyectos completados, calificaciones, ingresos
- Badges para clientes: contrataciones, proyectos creados
- Persistencia en base de datos con Supabase
- Notificaciones al desbloquear badges

### 📊 Analytics y Dashboard
- Dashboard personalizado por tipo de usuario (Cliente, Freelancer, Admin)
- Métricas de rendimiento:
  - Ingresos totales y mensuales
  - Proyectos completados y activos
  - Calificaciones promedio
  - Gráficos de crecimiento
- Recomendaciones inteligentes basadas en datos
- Análisis de servicios más populares

### 🔐 Autenticación y Seguridad
- Autenticación con Supabase Auth
- Roles de usuario (Cliente, Freelancer, Admin)
- Protección de rutas con middleware
- Políticas de seguridad a nivel de base de datos (RLS)

### 🌐 Internacionalización
- Soporte multiidioma con i18next
- Detección automática de idioma del navegador
- Traducciones dinámicas

## 🤝 Puedes usar este repositorio siguiendo los pasos a continuación →

### 🚀 Empecemos

Sigue estos pasos para configurar y ejecutar el proyecto GDN Pro en tu entorno local:

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/gdnpro/gdnpro-nextjs.git
   ```

2. **Entra en la carpeta del proyecto**
   ```bash
   cd gdnpro-nextjs
   ```

3. **Instala las dependencias**
   ```bash
   npm install
   ```

4. **Configura las variables de entorno**
   
   Crea un archivo `.env.local` con las siguientes variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
   SUPABASE_SERVICE_ROLE_KEY=tu_clave_de_servicio_supabase
   ```

5. **Inicia el proyecto**
   ```bash
   npm run dev
   ```

6. **Abre tu navegador**
   
   Visita [http://localhost:3000](http://localhost:3000)

## ⚙️ Características Técnicas

### Toast System
Para mostrar un Toast en cualquier parte de la aplicación, simplemente usa:

```js
window.toast({
  title: "Mensaje para mostrar",
  type: "success", // 'success', 'error', 'warning', 'info'
  location: "bottom-center", // Opciones: 'top-right', 'top-center', 'top-left', 'bottom-right', 'bottom-center', 'bottom-left'
  dismissible: true, // (opcional) permite cerrar el toast manualmente
  icon: true // (opcional) muestra un ícono según el tipo
})
```

Ejemplo rápido:
```js
window.toast({
  title: "Inicio de sesión exitoso",
  type: "success",
  location: "bottom-center"
})
```

El Toast puede usarse en cualquier archivo JS/TS de frontend donde exista `window`.

### Badge System
El sistema de badges requiere una migración de base de datos. Consulta `README_BADGES.md` para más detalles sobre la configuración.

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 16.0.1
- **UI Library**: React 19.2.0
- **Lenguaje**: TypeScript 5
- **Estilos**: Tailwind CSS 4
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Pagos**: Stripe
- **Animaciones**: Framer Motion
- **i18n**: i18next
- **Analytics**: Vercel Analytics
- **Deployment**: Vercel

## 📁 Estructura del Proyecto

```
gdnpro/
├── app/                    # Rutas de Next.js App Router
│   ├── auth/              # Autenticación
│   ├── dashboard/         # Dashboards por rol
│   ├── freelancers/       # Marketplace de freelancers
│   ├── works/             # Marketplace de proyectos
│   └── payment/           # Procesamiento de pagos
├── components/            # Componentes React
│   ├── auth/             # Componentes de autenticación
│   ├── dashboard/        # Componentes del dashboard
│   ├── freelancers/     # Componentes del marketplace
│   ├── home/            # Componentes de la página principal
│   └── ui/              # Componentes UI reutilizables
├── hooks/               # Custom React hooks
├── interfaces/          # TypeScript interfaces
├── libs/               # Utilidades y helpers
├── services/           # Servicios y datos estáticos
├── utils/              # Utilidades generales
└── validations/        # Validaciones con Zod
```

## 📝 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter

## 🔗 Enlaces Útiles

- [Documentación de Badges](README_BADGES.md)
- [Sitio Web](https://gdnpro.com)
- [Supabase](https://supabase.com)
- [Next.js Docs](https://nextjs.org/docs)
