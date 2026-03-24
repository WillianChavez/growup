# Fase 2 - Migracion Monetaria Segura (Produccion)

Fecha: 2026-03-06

Objetivo: mejorar precision monetaria sin riesgo para datos existentes de produccion.

## Estado implementado en codigo (sin romper datos)

- Normalizacion de montos a 2 decimales en escrituras clave.
- Calculos de agregacion usando centavos en memoria (evita errores de coma flotante).
- Validaciones para aceptar maximo 2 decimales en import/transacciones.
- No se eliminaron columnas ni se hizo migracion destructiva.

## Estrategia recomendada para migracion de BD real (expand/contract)

## Paso 0 - Pre-check y respaldo

- Hacer backup completo de la base productiva.
- Verificar integridad (conteos por tabla y sumas de control).
- Ejecutar en staging con snapshot real antes de tocar produccion.

## Paso 1 - Expand (aditivo, sin romper)

- Agregar nuevas columnas monetarias en centavos (`*_cents`) como nullable.
- No eliminar ni renombrar columnas actuales `Float`.
- Deploy de aplicacion con lectura compatible (si existe cents, usar cents; si no, usar float).

## Paso 2 - Backfill controlado

- Poblar `*_cents = round(float * 100)` por lotes.
- Guardar logs por lote: tabla, rango de IDs, filas actualizadas, errores.
- Reintentar solo lotes fallidos.

## Paso 3 - Dual write

- En cada create/update escribir ambos campos: float (legacy) y cents (nuevo).
- Agregar monitoreo de drift: `abs(float - cents/100) > 0.005`.

## Paso 4 - Cutover de lectura

- Cambiar lecturas y reportes para usar solo cents.
- Mantener float solo para compatibilidad temporal.

## Paso 5 - Contract (opcional y posterior)

- Cuando no exista drift y todo reporte coincida: eliminar float legacy.
- Este paso debe ser una release separada.

## Campos a migrar primero (prioridad)

- `Transaction.amount`
- `IncomeSource.amount`
- `RecurringExpense.amount`
- `Asset.value`
- `Debt.totalAmount`
- `Debt.remainingAmount`
- `Debt.monthlyPayment`
- `FinancialSnapshot` (campos de montos agregados)

## Checklist operativo

- [ ] Backup confirmado y restauracion probada
- [ ] Prueba de backfill en staging
- [ ] Deploy de version expand
- [ ] Backfill completado en produccion
- [ ] Drift monitorizado por 7 dias
- [ ] Cutover de lectura habilitado
- [ ] Limpieza de columnas legacy planificada
