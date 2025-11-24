# 🚀 GrowUp App

Una aplicación progresiva (PWA) de crecimiento personal construida con Next.js 16, que centraliza el seguimiento de hábitos, lectura, finanzas personales y metas.

## ✨ Características

### 🎯 Hábitos
- Tracker diario interactivo con checkboxes
- Calendario mensual con heatmap de completitud
- Categorías personalizables con emojis
- Gráficos de progreso
- Vista organizada por tabs (Hoy, Calendario, Todos)

### 💰 Finanzas Personales
- Dos botones dedicados: "Agregar Ingreso" y "Agregar Gasto"
- Vista agrupada por mes (collapsible)
- Categorías personalizables con emojis
- Gráficos de evolución (ingresos, gastos, balance)
- Filtros por fecha

### 📚 Lectura
- Seguimiento de libros (leyendo, completados, pendientes)
- Gestión de citas favoritas
- Estadísticas de lectura

### 🎯 Metas
- Seguimiento de objetivos personales
- Milestones y progreso
- Prioridades y categorías

### 📊 Dashboard
- Resumen de todas las áreas
- Gráficos interactivos
- Quick stats y acciones rápidas

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 16 (App Router)
- **Base de Datos**: Prisma + SQLite
- **Autenticación**: JWT con jose
- **UI**: shadcn/ui + Tailwind CSS
- **Animaciones**: Framer Motion
- **Gráficos**: Recharts
- **Validación**: Zod
- **Lenguaje**: TypeScript

## 🚀 Inicio Rápido

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Configurar base de datos

El archivo `.env.local` ya está configurado con SQLite:

```bash
DATABASE_URL="file:./dev.db"
```

### 3. Aplicar migraciones

```bash
pnpm prisma db push
```

### 4. Iniciar la aplicación

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### 5. ¡Listo para usar!

Las categorías por defecto se crean **automáticamente** al registrar un usuario nuevo.

**Categorías incluidas automáticamente:**
- **Hábitos**: 10 categorías (Salud, Productividad, Aprendizaje, Fitness, etc.)
- **Finanzas**: 23 categorías (15 gastos + 8 ingresos)

Si ya tienes usuarios sin categorías, ejecuta:
```bash
pnpm prisma:seed
```

## 📁 Estructura del Proyecto

```
growup/
├── prisma/
│   ├── schema.prisma    # Esquema de base de datos
│   └── seed.ts          # Seed de datos iniciales
├── src/
│   ├── app/
│   │   ├── (auth)/      # Páginas de autenticación
│   │   ├── (dashboard)/ # Páginas principales
│   │   └── api/         # API Routes
│   ├── components/      # Componentes React
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Utilidades
│   ├── services/        # Lógica de negocio
│   ├── types/           # Tipos TypeScript
│   └── validations/     # Esquemas Zod
└── package.json
```

## 🔧 Scripts Disponibles

```bash
pnpm dev          # Inicia el servidor de desarrollo
pnpm build        # Construye para producción
pnpm start        # Inicia el servidor de producción
pnpm type-check   # Verifica tipos TypeScript
pnpm prisma:seed  # Ejecuta el seed de datos
```

## 📊 Prisma Studio

Para explorar y modificar la base de datos visualmente:

```bash
pnpm prisma studio
```

## 🎨 Componentes UI

El proyecto utiliza shadcn/ui. Para agregar nuevos componentes:

```bash
pnpm dlx shadcn@latest add [component-name]
```

Componentes instalados:
- button, input, label, card, dialog
- select, textarea, calendar, dropdown-menu
- tabs, badge, avatar, progress
- separator, switch, sonner, popover

## 🔐 Autenticación

El sistema de autenticación incluye:
- Registro de usuarios con email y contraseña
- Login con JWT (almacenado en cookies HTTP-only)
- Middleware para proteger rutas
- Logout

## 📱 PWA

La aplicación está configurada como PWA con:
- Manifest.json
- Soporte offline (próximamente)
- Instalable en dispositivos móviles

## 🐛 Solución de Problemas

### Error: "Failed to fetch..."
- Asegúrate de haber creado un usuario
- Verifica que el seed se haya ejecutado con el userId correcto

### Reset de base de datos
```bash
pnpm prisma db push --force-reset
```

### Ver logs de Prisma
```bash
# En src/lib/prisma.ts, descomentar:
# log: ['query', 'error', 'warn'],
```

## 📚 Documentación Adicional

- [IMPLEMENTACION_COMPLETA.md](./IMPLEMENTACION_COMPLETA.md) - Detalles completos de la implementación
- [prisma/schema.prisma](./prisma/schema.prisma) - Esquema de base de datos
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [shadcn/ui](https://ui.shadcn.com)

## 🤝 Contribuir

Este es un proyecto personal de crecimiento. Si deseas contribuir:
1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

---

Hecho con ❤️ y Next.js
