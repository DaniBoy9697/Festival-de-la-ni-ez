## Google Apps Script para importar actividades

Este script toma filas de Google Sheets y las envia al endpoint:
`/functions/v1/make-server-e1ac9291/activities/import`

### 1) Estructura recomendada de columnas

`id | email | title | description | startTime | endTime | location | audience`

- `id`: opcional, pero recomendado para hacer update sin duplicar.
- `email`: correo del asistente (si la actividad es personalizada).
- `audience`: `all`, `interclubes` o `custom`.
- `startTime` y `endTime`: formato ISO, por ejemplo `2026-04-30T09:00:00-06:00`.

### 2) Script

```javascript
function exportActivitiesToSupabase() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('activities');
  const values = sheet.getDataRange().getValues();
  const headers = values.shift();

  const activities = values
    .filter(row => row.some(cell => String(cell).trim() !== ''))
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      return {
        id: obj.id ? String(obj.id).trim() : undefined,
        email: obj.email ? String(obj.email).trim().toLowerCase() : undefined,
        title: String(obj.title || '').trim(),
        description: String(obj.description || '').trim(),
        startTime: String(obj.startTime || '').trim(),
        endTime: String(obj.endTime || '').trim() || null,
        location: String(obj.location || '').trim(),
        audience: String(obj.audience || '').trim() || undefined,
      };
    })
    .filter(a => a.title && a.startTime);

  const payload = { activities };
  const url = 'https://TU_PROJECT_REF.supabase.co/functions/v1/make-server-e1ac9291/activities/import';
  const importSecret = 'TU_IMPORT_SECRET';

  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-import-secret': importSecret
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  Logger.log(response.getResponseCode());
  Logger.log(response.getContentText());
}
```

### 3) Recomendaciones

- Guarda `IMPORT_SECRET` en `Script Properties` para no dejarlo hardcodeado.
- Crea una hoja separada para `attendees` y mantenla sincronizada en Supabase.
- Ejecuta primero con pocas filas para validar formato.
