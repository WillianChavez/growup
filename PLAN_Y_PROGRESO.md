# Plan y Progreso - GrowUp

Última actualización: 2026-03-06

## Estado Actual (Implementado)

### Base Técnica

- [x] Proyecto en Next.js App Router + TypeScript
- [x] Prisma configurado con SQLite
- [x] Soporte opcional para Turso/libSQL
- [x] ESLint + Prettier + Husky configurados
- [x] Build de producción funcional (`pnpm build`)
- [x] Type-check limpio (`pnpm type-check`)
- [x] Lint check limpio (`pnpm lint:check`)

### Autenticación y Sesión

- [x] Registro de usuario
- [x] Login de usuario
- [x] Logout de usuario
- [x] Cookie `httpOnly` para token
- [x] Middleware de protección de rutas web
- [x] Endpoint de perfil (`/api/auth/me`)
- [x] Actualización básica de perfil (`name`)

### Módulo Hábitos

- [x] CRUD de hábitos
- [x] CRUD de categorías de hábitos
- [x] Registro diario de entradas
- [x] Vista diaria
- [x] Vista mensual
- [x] Estadísticas semanales
- [x] Calendario y componentes visuales

### Módulo Finanzas

- [x] CRUD de transacciones
- [x] CRUD de categorías de transacciones
- [x] Agrupación mensual de transacciones
- [x] Dashboard financiero básico
- [x] CRUD de ingresos recurrentes
- [x] CRUD de gastos recurrentes
- [x] Resumen de presupuesto base
- [x] CRUD de activos
- [x] CRUD de deudas

### Reportes Financieros

- [x] Estado de resultados
- [x] Balance general
- [x] Flujo de caja
- [x] Visualizaciones de reportes en frontend

### Módulo Lectura

- [x] CRUD de libros
- [x] Búsqueda de libros (Open Library)
- [x] Estadísticas de lectura
- [x] Componentes de progreso de lectura

### Módulo Metas

- [x] CRUD de metas
- [x] Seguimiento de progreso
- [x] Componentes de timeline/calendario/progreso

### Datos

- [x] Exportación de datos de usuario
- [x] Importación de datos de usuario

---

## Riesgos / Deuda Técnica Detectada

- [x] Forzar `JWT_SECRET` obligatorio en producción (sin fallback inseguro)
- [ ] Migrar `middleware.ts` -> `proxy.ts` (deprecación Next 16)
- [x] Endurecer importación (`/api/data/import`) con validaciones Zod completas
- [x] Agregar límites de tamaño/rate limit en endpoints sensibles
- [ ] Revisar precisión monetaria (usar `Decimal` o centavos enteros)
- [ ] Alinear README con estado real del repo
- [ ] Agregar suite de tests (actualmente no hay tests automatizados)

---

## Plan de Trabajo (Checklist de Avance)

## Fase 1 - Seguridad y Estabilidad (Semana 1)

- [x] Exigir `JWT_SECRET` en runtime de producción
- [x] Implementar helper único de autenticación para API routes
- [x] Agregar rate limiting básico en login/register/import
- [x] Agregar validación estricta en import con Zod
- [x] Agregar logs estructurados de errores en API

## Fase 2 - Calidad de Datos Financieros (Semana 2)

- [x] Definir estrategia de dinero (`Decimal` o `amountInCents`)
- [ ] Migrar campos monetarios principales
- [x] Ajustar servicios/reportes a la nueva estrategia monetaria
- [ ] Agregar pruebas de regresión para cálculos financieros

## Fase 3 - UX de Uso Diario (Semana 3)

- [x] Crear pantalla de `Check-in diario` (hábitos + gasto rápido + metas)
- [x] Implementar `Quick Add` (entrada rápida unificada)
- [x] Agregar centro de alertas (vencimientos, sobrepresupuesto, metas estancadas)
- [x] Añadir cierre semanal automático con insights

## Fase 4 - Integraciones API Gratuitas (Semana 4)

- [x] Integrar Frankfurter (tipo de cambio)
- [x] Integrar Nager.Date (feriados para planificación)
- [x] Integrar Open-Meteo (hábitos dependientes del clima)
- [ ] Mejorar integración Open Library (ranking/sugerencias/cache)

## Fase 5 - Testing y Operación Continua

- [ ] Configurar tests unitarios (servicios críticos)
- [ ] Configurar tests de integración de API routes
- [ ] Configurar smoke tests de build/deploy
- [ ] Definir checklist de release

---

## Control de Hitos

- [x] Hito A: Seguridad mínima en producción completada
- [x] Hito B: Cálculos monetarios robustos completados
- [x] Hito C: Experiencia diaria optimizada completada
- [x] Hito D: Integraciones externas en producción completadas
- [ ] Hito E: Base de tests automatizados operativa

---

## Notas de Seguimiento

- [ ] Registrar fecha de inicio del siguiente sprint
- [ ] Registrar fecha de cierre del sprint actual
- [ ] Documentar bloqueos encontrados
- [ ] Documentar decisiones técnicas clave
