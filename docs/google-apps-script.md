# Exportar actividades desde Google Sheets

Guía **paso a paso**. No necesitas saber de backend: solo Google Sheets, propiedades del script, copiar/pegar código y el menú **Festival**.

---

## Lo que debes tener claro

**No existe un “paso 7” que ejecutar.** Lo que haces en la hoja es siempre el **menú Festival** (después de configurar una vez).

| Tu tabla… | Qué eliges en Festival |
|-----------|-------------------------|
| Una **fila por persona**, columnas **Nombre**, **Interclubes**, **Email** y horas **8:00**, **9:00**… | **Importar horario matriz** |
| Una **fila por actividad**, pestaña llamada **`activities`** | **Importar tabla larga** |

---

## Paso 1 — Datos que te tienen que dar (una vez)

Quien armó el proyecto Supabase te pasa:

1. **URL de importación** (termina en `.../server/activities/import`).
2. **Secreto** (misma clave que `IMPORT_SECRET` en Supabase).

Si al importar ves **Forbidden / 403**, el secreto de la hoja no coincide con el de Supabase.

---

## Paso 2 — Propiedades del script (Google)

**Extensiones → Apps Script** → engranaje del proyecto → **Propiedades del script** → **Agregar propiedad**.

**Siempre (los dos formatos):**

| Nombre | Valor |
|--------|--------|
| `IMPORT_SECRET` | El secreto que te pasaron |
| `ACTIVITIES_IMPORT_URL` | La URL completa de importación |

**Solo si usarás “Importar horario matriz”** (cronograma por persona):

| Nombre | Ejemplo | Para qué |
|--------|---------|----------|
| `EVENT_SERVICE_DATE` | `2026-05-02` | Día del evento (todas las horas usan esta fecha) |
| `EVENT_TZ_OFFSET` | `-06:00` | Zona horaria (México suele ser `-06:00`) |
| `SCHEDULE_SHEET_NAME` | *(vacío)* | Vacío = importa la **pestaña activa**; si pones nombre, usa esa pestaña |
| `LAST_SLOT_MINUTES` | `30` | Duración en minutos de la última franja si no hay “siguiente hora” |

No pegues el secreto dentro del código JavaScript.

---

## Paso 3 — Cómo ordenar la hoja

**Matriz (Interclubes):** fila 1 con **Nombre**, **Interclubes** (casilla), **Email** y columnas **8:00**, **9:30**, etc. Una columna **ID** a la izquierda está bien; el script no depende de ella.

**Tabla larga:** pestaña exacta **`activities`**, fila 1 con al menos **título** y **inicio** (`titulo` / `title`, `inicio` / `startTime`, etc.). Detalle de cabeceras al final del doc.

---

## Paso 4 — Pegar el código (una sola vez)

1. **Extensiones → Apps Script** → borra el contenido por defecto.
2. Copia **todo** el bloque JavaScript que viene **abajo en este mismo archivo** (es **un solo** copiar/pegar: menú + tabla larga + matriz).
3. Guarda (Ctrl+S).
4. Primera vez: función **`setupActivitiesMenu`** → **Ejecutar** → permisos.
5. Vuelve a la hoja; debe aparecer **Festival**. Si no, recarga la pestaña.

```javascript
/**
 * Menú en la hoja (ejecutar setupActivitiesMenu una vez si no aparece).
 */
function setupActivitiesMenu() {
  SpreadsheetApp.getUi()
    .createMenu('Festival')
    .addItem('Importar tabla larga (una fila = una actividad)', 'exportActivitiesToSupabase')
    .addItem('Importar horario matriz (una fila = una persona)', 'exportWideScheduleToSupabase')
    .addToUi();
}

function onOpen() {
  setupActivitiesMenu();
}

function normKey_(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .replace(/_/g, '');
}

/** Variantes de encabezado → nombre interno */
var HEADER_ALIASES_ = {
  id: ['id'],
  email: ['email', 'correo', 'correoelectronico', 'mail'],
  title: ['title', 'titulo', 'nombre', 'actividad'],
  description: ['description', 'descripcion', 'detalle', 'notas'],
  startTime: ['starttime', 'start', 'inicio', 'fechainicio', 'horainicio', 'fecha_inicio'],
  endTime: ['endtime', 'end', 'fin', 'fechafin', 'horafin', 'fecha_fin'],
  location: ['location', 'ubicacion', 'lugar', 'sede'],
  audience: ['audience', 'audiencia', 'publico', 'para']
};

function buildHeaderIndex_(headerRow) {
  var idx = {};
  for (var i = 0; i < headerRow.length; i++) {
    var k = normKey_(headerRow[i]);
    if (k) idx[k] = i;
  }
  var canon = {};
  for (var field in HEADER_ALIASES_) {
    var aliases = HEADER_ALIASES_[field];
    for (var j = 0; j < aliases.length; j++) {
      var nk = normKey_(aliases[j]);
      if (idx[nk] !== undefined && idx[nk] !== void 0) {
        canon[field] = idx[nk];
        break;
      }
    }
  }
  return canon;
}

function cell_(row, canon, field) {
  var c = canon[field];
  if (c === undefined || c === void 0) return '';
  var v = row[c];
  return v === void 0 || v === null ? '' : v;
}

/** Fecha de Sheets o texto tal cual */
function timeValue_(val) {
  if (Object.prototype.toString.call(val) === '[object Date]' && !isNaN(val.getTime())) {
    var tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
    return Utilities.formatDate(val, tz, "yyyy-MM-dd'T'HH:mm:ss");
  }
  return String(val || '').trim();
}

function exportActivitiesToSupabase() {
  var props = PropertiesService.getScriptProperties();
  var secret = props.getProperty('IMPORT_SECRET');
  var url = props.getProperty('ACTIVITIES_IMPORT_URL');

  if (!secret || !url) {
    SpreadsheetApp.getUi().alert(
      'Falta configuración',
      'Agrega en Propiedades del script:\n• IMPORT_SECRET\n• ACTIVITIES_IMPORT_URL\n\nVer docs/google-apps-script.md del proyecto.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return;
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('activities');
  if (!sheet) {
    SpreadsheetApp.getUi().alert('No existe la hoja "activities". Créala con esa pestaña exacta.');
    return;
  }

  var values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    SpreadsheetApp.getUi().alert('No hay filas de datos (solo encabezados o vacío).');
    return;
  }

  var headers = values[0];
  var canon = buildHeaderIndex_(headers);
  if (canon.title === undefined || canon.startTime === undefined) {
    SpreadsheetApp.getUi().alert(
      'Encabezados requeridos',
      'Debe existir al menos una columna de título (title/titulo) y una de inicio (startTime/inicio).'
    );
    return;
  }

  var rows = values.slice(1);
  var activities = [];

  for (var r = 0; r < rows.length; r++) {
    var row = rows[r];
    if (!row.some(function (cell) { return String(cell).trim() !== ''; })) continue;

    var title = String(cell_(row, canon, 'title')).trim();
    var startRaw = cell_(row, canon, 'startTime');
    var startTime = timeValue_(startRaw);
    if (!title || !startTime) continue;

    var idCell = cell_(row, canon, 'id');
    var emailCell = cell_(row, canon, 'email');
    var endRaw = cell_(row, canon, 'endTime');
    var endStr = endRaw === '' || endRaw === void 0 ? '' : timeValue_(endRaw);

    var obj = {
      title: title,
      description: String(cell_(row, canon, 'description')).trim(),
      startTime: startTime,
      endTime: endStr || null,
      location: String(cell_(row, canon, 'location')).trim(),
      audience: String(cell_(row, canon, 'audience')).trim() || undefined
    };

    var idStr = String(idCell).trim();
    if (idStr) obj.id = idStr;

    var em = String(emailCell).trim().toLowerCase();
    if (em) obj.email = em;

    activities.push(obj);
  }

  if (activities.length === 0) {
    SpreadsheetApp.getUi().alert('No se armó ninguna actividad válida (revisa título e inicio por fila).');
    return;
  }

  var payload = { activities: activities };
  var response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-import-secret': secret },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  var code = response.getResponseCode();
  var body = response.getContentText();

  Logger.log(code);
  Logger.log(body);

  if (code >= 200 && code < 300) {
    try {
      var j = JSON.parse(body);
      SpreadsheetApp.getUi().alert(
        'Listo',
        'Importadas: ' + (j.imported != null ? j.imported : activities.length) + ' actividades.',
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    } catch (e) {
      SpreadsheetApp.getUi().alert('HTTP ' + code + '\n' + body);
    }
  } else {
    SpreadsheetApp.getUi().alert('Error HTTP ' + code + '\n\n' + body);
  }
}

/** Horario matriz: persona por fila + columnas de hora + Nombre / Interclubes / Email */
function exportWideScheduleToSupabase() {
  var props = PropertiesService.getScriptProperties();
  var secret = props.getProperty('IMPORT_SECRET');
  var url = props.getProperty('ACTIVITIES_IMPORT_URL');
  var dateYmd = props.getProperty('EVENT_SERVICE_DATE');
  var tzOff = props.getProperty('EVENT_TZ_OFFSET') || '-06:00';
  var sheetName = props.getProperty('SCHEDULE_SHEET_NAME');
  var lastFallback = parseInt(props.getProperty('LAST_SLOT_MINUTES') || '30', 10);

  if (!secret || !url || !dateYmd) {
    SpreadsheetApp.getUi().alert(
      'Falta configuración',
      'Necesitas en Propiedades del script:\n• IMPORT_SECRET\n• ACTIVITIES_IMPORT_URL\n• EVENT_SERVICE_DATE (ej. 2026-05-02)',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return;
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = sheetName ? ss.getSheetByName(sheetName) : ss.getActiveSheet();
  if (!sheet) {
    SpreadsheetApp.getUi().alert('No se encontró la hoja: ' + sheetName);
    return;
  }

  var values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    SpreadsheetApp.getUi().alert('La hoja no tiene datos.');
    return;
  }

  var headerRow = values[0];
  var dataRows = values.slice(1);

  var emailCol = findEmailColumnWide_(headerRow);
  var nombreCol = findNombreColumnWide_(headerRow);
  var interclubesCol = findInterclubesColumnWide_(headerRow);
  var timeCols = findTimeColumnsWide_(headerRow);

  if (emailCol < 0 || timeCols.length === 0) {
    SpreadsheetApp.getUi().alert(
      'Cabeceras',
      'Se necesita una columna Email/Correo y columnas de hora tipo 8:00 o 9:30 en la fila 1.'
    );
    return;
  }

  /* --- Asistentes: nombre + interclubes por email (última fila gana si hay duplicado) --- */
  var attendeesMap = {};
  for (var ai = 0; ai < dataRows.length; ai++) {
    var arow = dataRows[ai];
    var em = String(arow[emailCol] || '')
      .trim()
      .toLowerCase();
    if (!em || em.indexOf('@') < 0) continue;
    attendeesMap[em] = {
      email: em,
      full_name: nombreCol >= 0 ? String(arow[nombreCol] || '').trim() : '',
      attends_interclubes:
        interclubesCol >= 0 ? checkboxToBoolWide_(arow[interclubesCol]) : false,
      is_active: true
    };
  }
  var attendees = [];
  for (var ek in attendeesMap) {
    if (attendeesMap.hasOwnProperty(ek)) attendees.push(attendeesMap[ek]);
  }

  var isGlobal = [];
  for (var t = 0; t < timeCols.length; t++) {
    var colIdx = timeCols[t].sheetCol;
    var list = [];
    for (var r = 0; r < dataRows.length; r++) {
      list.push(String(dataRows[r][colIdx] || '').trim());
    }
    var filled = list.filter(function (x) {
      return x;
    });
    isGlobal[t] =
      filled.length === dataRows.length &&
      list.every(function (cell) {
        return cell === filled[0];
      });
  }

  var activities = [];
  var seen = {};

  /* --- Actividades globales (misma celda en todas las filas) --- */
  for (var g = 0; g < timeCols.length; g++) {
    if (!isGlobal[g]) continue;
    var colIdx = timeCols[g].sheetCol;
    var cellText = String(dataRows[0][colIdx] || '').trim();
    if (!cellText) continue;
    var titles = splitActivityTitlesWide_(cellText);
    if (titles.length === 0) continue;

    var startMm = minutesWide_(timeCols[g].label);
    var endMm = slotEndMinutesWide_(timeCols, g, lastFallback);
    var dur = endMm - startMm;

    if (titles.length === 1) {
      var titleA = titles[0];
      var id = stableIdWide_('g', dateYmd, timeCols[g].label, titleA);
      if (seen[id]) continue;
      seen[id] = true;
      activities.push({
        id: id,
        title: titleA,
        description: '',
        startTime: combineIsoWide_(dateYmd, timeCols[g].label, tzOff),
        endTime: endTimeForSlotWide_(dateYmd, timeCols, g, tzOff, lastFallback),
        location: '',
        audience: 'all'
      });
    } else {
      for (var qa = 0; qa < titles.length; qa++) {
        var sm = startMm + Math.round((qa * dur) / titles.length);
        var em =
          qa === titles.length - 1
            ? endMm
            : startMm + Math.round(((qa + 1) * dur) / titles.length);
        var titA = titles[qa];
        var idg = stableIdWide_('g', dateYmd, timeCols[g].label + '-' + qa, titA);
        if (seen[idg]) continue;
        seen[idg] = true;
        activities.push({
          id: idg,
          title: titA,
          description: '',
          startTime: isoFromMinutesWide_(dateYmd, sm, tzOff),
          endTime: isoFromMinutesWide_(dateYmd, em, tzOff),
          location: '',
          audience: 'all'
        });
      }
    }
  }

  /* --- Por persona: saltamos franjas globales; fusionamos columnas consecutivas iguales --- */
  for (var rr = 0; rr < dataRows.length; rr++) {
    var row = dataRows[rr];
    var email = String(row[emailCol] || '')
      .trim()
      .toLowerCase();
    if (!email || email.indexOf('@') < 0) continue;

    var ti = 0;
    while (ti < timeCols.length) {
      if (isGlobal[ti]) {
        ti++;
        continue;
      }
      var c0 = timeCols[ti].sheetCol;
      var raw = String(row[c0] || '').trim();
      if (!raw) {
        ti++;
        continue;
      }
      var startTi = ti;
      while (
        ti + 1 < timeCols.length &&
        !isGlobal[ti + 1] &&
        String(row[timeCols[ti + 1].sheetCol] || '').trim() === raw
      ) {
        ti++;
      }

      var titlesP = splitActivityTitlesWide_(raw);
      var startMmP = minutesWide_(timeCols[startTi].label);
      var endMmP = slotEndMinutesWide_(timeCols, ti, lastFallback);
      var durP = endMmP - startMmP;

      if (titlesP.length === 1) {
        var titleP = titlesP[0];
        var idp = stableIdWide_('p', email + '|' + dateYmd, timeCols[startTi].label, titleP);
        if (!seen[idp]) {
          seen[idp] = true;
          activities.push({
            id: idp,
            title: titleP,
            description: '',
            startTime: combineIsoWide_(dateYmd, timeCols[startTi].label, tzOff),
            endTime: endTimeForSlotWide_(dateYmd, timeCols, ti, tzOff, lastFallback),
            location: '',
            email: email,
            audience: 'custom'
          });
        }
      } else {
        for (var qp = 0; qp < titlesP.length; qp++) {
          var smp = startMmP + Math.round((qp * durP) / titlesP.length);
          var emp =
            qp === titlesP.length - 1
              ? endMmP
              : startMmP + Math.round(((qp + 1) * durP) / titlesP.length);
          var titP = titlesP[qp];
          var idp2 = stableIdWide_(
            'p',
            email + '|' + dateYmd,
            timeCols[startTi].label + '-' + qp,
            titP
          );
          if (seen[idp2]) continue;
          seen[idp2] = true;
          activities.push({
            id: idp2,
            title: titP,
            description: '',
            startTime: isoFromMinutesWide_(dateYmd, smp, tzOff),
            endTime: isoFromMinutesWide_(dateYmd, emp, tzOff),
            location: '',
            email: email,
            audience: 'custom'
          });
        }
      }
      ti++;
    }
  }

  if (activities.length === 0 && attendees.length === 0) {
    SpreadsheetApp.getUi().alert(
      'Sin datos',
      'No hay actividades ni filas con email válido para asistentes.'
    );
    return;
  }

  var payload = { activities: activities };
  if (attendees.length > 0) payload.attendees = attendees;

  var response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-import-secret': secret },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  var code = response.getResponseCode();
  var body = response.getContentText();
  Logger.log(code);
  Logger.log(body);

  if (code >= 200 && code < 300) {
    try {
      var j = JSON.parse(body);
      var parts = [];
      if (j.imported != null)
        parts.push('Actividades importadas: ' + j.imported);
      if (j.attendeesSynced != null)
        parts.push('Asistentes actualizados: ' + j.attendeesSynced);
      SpreadsheetApp.getUi().alert(
        'Listo',
        parts.length ? parts.join('\n') : body,
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    } catch (e) {
      SpreadsheetApp.getUi().alert('HTTP ' + code + '\n' + body);
    }
  } else {
    SpreadsheetApp.getUi().alert('Error HTTP ' + code + '\n\n' + body);
  }
}

/** Separado por comas, punto y coma o saltos de línea */
function splitActivityTitlesWide_(raw) {
  if (!raw) return [];
  return String(raw)
    .split(/[\n\r]+|,|;/)
    .map(function (s) {
      return s.trim();
    })
    .filter(Boolean);
}

/** Checkbox de Google Sheets o texto TRUE/FALSE/SI/1 */
function checkboxToBoolWide_(v) {
  if (v === true) return true;
  if (v === false) return false;
  var s = String(v || '').trim().toUpperCase();
  if (!s) return false;
  return (
    s === 'TRUE' ||
    s === 'SI' ||
    s === 'SÍ' ||
    s === '1' ||
    s === 'YES' ||
    s === 'VERDADERO' ||
    s === 'X'
  );
}

function slotEndMinutesWide_(timeCols, slotIndex, lastFallback) {
  if (slotIndex + 1 < timeCols.length) {
    return minutesWide_(timeCols[slotIndex + 1].label);
  }
  return minutesWide_(timeCols[slotIndex].label) + lastFallback;
}

function isoFromMinutesWide_(dateYmd, mm, tzOff) {
  return combineIsoWide_(dateYmd, mmToLabelWide_(mm), tzOff);
}

function findNombreColumnWide_(headers) {
  for (var i = 0; i < headers.length; i++) {
    var k = normKeyWide_(headers[i]);
    if (k === 'nombre' || k === 'name' || k === 'nombreyapellido') return i;
  }
  return -1;
}

function findInterclubesColumnWide_(headers) {
  for (var i = 0; i < headers.length; i++) {
    var k = normKeyWide_(headers[i]);
    if (k === 'interclubes' || k === 'interclub') return i;
  }
  return -1;
}

function findEmailColumnWide_(headers) {
  for (var i = 0; i < headers.length; i++) {
    var k = normKeyWide_(headers[i]);
    if (k === 'email' || k === 'correo' || k === 'correoelectronico') return i;
  }
  return -1;
}

function normKeyWide_(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '');
}

/** Columnas cuya cabecera es tipo 8:00 o 09:30 */
function findTimeColumnsWide_(headers) {
  var out = [];
  var re = /^(\d{1,2}):(\d{2})$/;
  for (var i = 0; i < headers.length; i++) {
    var h = String(headers[i]).trim();
    if (re.test(h)) {
      var m = h.match(re);
      out.push({
        sheetCol: i,
        label: parseInt(m[1], 10) + ':' + ('0' + m[2]).slice(-2)
      });
    }
  }
  out.sort(function (a, b) {
    return minutesWide_(a.label) - minutesWide_(b.label);
  });
  return out;
}

function minutesWide_(hhmm) {
  var m = String(hhmm).match(/^(\d{1,2}):(\d{2})$/);
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

function mmToLabelWide_(mm) {
  var h = Math.floor(mm / 60);
  var mi = mm % 60;
  return h + ':' + ('0' + mi).slice(-2);
}

function combineIsoWide_(dateYmd, hhmm, tzOff) {
  var dp = dateYmd.split('-');
  var m = String(hhmm).match(/^(\d{1,2}):(\d{2})$/);
  var hh = ('0' + m[1]).slice(-2);
  var mi = ('0' + m[2]).slice(-2);
  return dp[0] + '-' + dp[1] + '-' + dp[2] + 'T' + hh + ':' + mi + ':00' + tzOff;
}

function endTimeForSlotWide_(dateYmd, timeCols, slotIndex, tzOff, lastFallback) {
  if (slotIndex + 1 < timeCols.length) {
    return combineIsoWide_(dateYmd, timeCols[slotIndex + 1].label, tzOff);
  }
  var startMm = minutesWide_(timeCols[slotIndex].label);
  var endMm = startMm + lastFallback;
  return combineIsoWide_(dateYmd, mmToLabelWide_(endMm), tzOff);
}

function stableIdWide_(prefix, keySeed, timeLabel, title) {
  var slug = String(title)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  var t = String(timeLabel).replace(/:/g, '');
  var k = String(keySeed).replace(/[^a-z0-9|@-]+/gi, '-');
  return prefix + '-' + t + '-' + k.slice(0, 24) + '-' + slug.slice(0, 24);
}
```

---

## Paso 5 — Subir datos (cada vez que cambie la hoja)

1. Abre la pestaña correcta (cronograma tipo matriz **o** pestaña **`activities`**).
2. Menú **Festival** → **Importar horario matriz** *o* **Importar tabla larga**.
3. Espera el mensaje “Listo”. Si falta `EVENT_SERVICE_DATE` en propiedades del script, lo dirá el propio Google.

---

## Paso 6 — Probar en la app

Entra con un usuario cuyo **Email** sea el de la hoja y revisa **Actividades**. La casilla **Interclubes** define si ve esa sección.

---

## Consejos

- Volver a importar **actualiza** datos. En tabla larga, si repites el mismo **`id`** en una fila, esa actividad se sustituye.
- Filas sin título o sin hora de inicio (tabla larga) se omiten.
- Si en una columna de hora **todas** las filas tienen el mismo texto (ej. “Inauguración”), cuenta como actividad para **todos**. Si una fila queda vacía en esa columna, ya no es para todos y solo aplica donde hay texto.

---

## Tabla larga — cabeceras que entiende el script

| Concepto | Ejemplos de nombre de columna |
|----------|------------------------------|
| Título | `title`, `titulo`, `nombre`, `actividad` |
| Inicio | `startTime`, `inicio`, `fecha_inicio` |
| Fin | `endTime`, `fin`, `fecha_fin` |
| Correo | `email`, `correo` |
| Lugar, descripción, audiencia | `location`, `description`, `audience`, … |

Las fechas pueden ser celdas de fecha/hora de Google o texto ISO.

---

## Para quien mantenga el proyecto (técnico)

Los datos van por HTTPS a Supabase (`POST …/server/activities/import`) con el header `x-import-secret`. La matriz también envía nombre + interclubes + email para la tabla `attendees`. Si algo falla raro con interclubes, desplegar de nuevo la función Edge **`server`** con el código actual del repo.

### Mantenedor: secreto en Supabase

```bash
npx supabase@latest secrets set IMPORT_SECRET=tu_clave_larga ...
```
