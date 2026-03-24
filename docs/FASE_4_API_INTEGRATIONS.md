# Fase 4 – Integraciones API gratuitas

Fecha: 2026-03-06

## Objetivo

Integrar tres datos externos gratuitos para enriquecer la experiencia diaria sin depender de claves secretas:

- **Frankfurter**: tipos de cambio para mostrar conversiones rápidas y mantener el dashboard armónico con la moneda del usuario.
- **Nager.Date**: feriados nacionales para brindar alertas útiles (e.g., “toca feriado el próximo jueves”).
- **Open-Meteo**: clima actual para ajustar hábitos (recomendar indoor si llueve) y enriquecer la tarjeta de check-in.

## Implementación

1. **Servicios y rutas**
   - `CurrencyService` + `/api/currency/convert`: consulta `https://api.frankfurter.dev/latest?base=...&symbols=...` y cachea durante 1h; no requiere API Key.
   - `HolidayService`: consulta `https://date.nager.at/api/v3/PublicHolidays/{year}/{countryCode}` para el país derivado de la zona horaria; se usa en `FocusService` para emitir alertas con el nombre local.
   - `WeatherService` + `/api/weather`: obtiene `current_weather` + `precipitation_probability` de Open-Meteo usando coordenadas derivadas de la zona horaria; nuevamente nada se almacena y no se pide API Key.

2. **Frontend**
   - `Check-in` ahora incluye tarjetas para clima y conversiones, y recibe las alertas mejoradas con feriados; se usa el JWT existente (sin nuevos secretos) y se adapta si `user.currency` no está definido.
   - Las nuevas rutas se consumen en el `Load Check-in`: `/api/alerts`, `/api/weekly-review`, `/api/weather`, `/api/currency/convert` (1 unidad de `user.currency` a USD/EUR).

3. **Notas operativas**
   - No se cambió la base de datos.
   - Todas las APIs trabajan sin keys. Si en algún momento se toma un plan comercial con Open-Meteo o Nager.Date, documentar el secreto y actualizar los servicios.
   - Para personalizar la región, los usuarios deberían actualizar `timezone` (ya existe). Si se necesita más precisión, se puede extender `settings` (JSON) con lat/lon.
