# Estado integral Prisma — fase 1

Estado: implementado, local-first y retrocompatible. Fecha: 2026-08-23.

## Contrato y límites

`src/investorState.js` define el dominio puro `prisma_investor_state`, esquema `1`. El estado separa identidad local, situación financiera, riesgo, objetivos, conocimiento, comportamiento, afinidades con aperturas, progreso educativo, preferencias, evidencia y versiones. Las secciones futuras comienzan vacías y no contienen lógica de aperturas, progreso ni ranking.

`profile_v2.0` sigue siendo exclusivamente la versión del modelo de riesgo. `schemaVersion: 1` identifica la forma del estado integral y `versions.openingBooks` queda vacío para una evolución independiente.

El módulo expone creación inicial, validación de versión, normalización, reconocimiento legacy, migración y proyección legacy. Todas son funciones puras: no conocen React, red, autenticación ni almacenamiento; aceptan estructuras congeladas, clonan las entradas y la normalización es idempotente. Para un esquema conocido, los campos JSON adicionales superiores y anidados se preservan; los campos conocidos normalizados tienen precedencia. Se descartan claves capaces de alterar prototipos y valores no serializables.

## Persistencia local

`src/investorStateRepository.js` encapsula `localStorage` y acepta un storage inyectable para pruebas. Usa:

- `prisma-investor-state`: estado integral nuevo.
- `prisma-profile-result`: agregado anterior, conservado sin eliminación destructiva.

La lectura prioriza el estado nuevo. Si sólo existe el formato anterior, lo migra en memoria sin escribir durante la carga. No hay efectos React que persistan por observar el estado inicial: recargar, incluso bajo Strict Mode, realiza cero escrituras. Una creación o cambio explícito guarda el formato nuevo y mantiene la clave legacy para consumidores actuales. La revisión comienza en 1 al persistir, aumenta únicamente si cambia el contenido semántico —con comparación recursiva independiente del orden de claves— y conserva identificador y fecha de creación.

El estado canónico es la fuente de verdad. En la escritura dual se escribe primero la proyección legacy y el estado canónico al final como punto de confirmación. `localStorage` no ofrece transacciones: si falla la segunda escritura, el repositorio informa `partial_failure` e intenta restaurar el valor legacy anterior; también informa si el rollback falla. Nunca reporta una escritura parcial como exitosa.

Todas las operaciones `getItem`, `setItem` y `removeItem` están protegidas y devuelven estados explícitos para ausencia, corrupción, versión no soportada, almacenamiento inaccesible y fallos parciales. Una versión desconocida o un JSON canónico corrupto nunca se normalizan ni sobrescriben. Si existe un respaldo legacy válido, puede usarse sólo en memoria; ambos valores permanecen intactos hasta una recuperación explícita fuera de esta fase.

## Integración retrocompatible

`App.jsx` lee mediante el repositorio y continúa entregando la proyección anterior a todos los componentes, por lo que no cambian pantallas ni recomendaciones. La persistencia se invoca únicamente desde acciones explícitas: completar Onboarding, iniciar demo, registrar comportamiento o cambiar el nivel de explicación. `demoMode.js` registra la nueva clave para que el reseteo explícito mantenga su alcance anterior y maneja fallos de borrado sin propagarlos.

Al guardar un cambio legacy sobre un estado canónico existente se actualizan únicamente las ramas representadas por la vista anterior; afinidades, progreso y extensiones canónicas se conservan. Al proyectar, el snapshot legacy funciona como base para datos todavía no modelados y riesgo, conocimiento y comportamiento canónicos siempre prevalecen. Sin snapshot se genera la forma mínima usada por los consumidores actuales: `profile`, `answers`, `knowledge`, `knowledgeResponses` e `investorMap`.

No se modificaron preguntas, pesos, umbrales, cálculo de riesgo, compatibilidad, recomendaciones, textos ni diseño.

## Endurecimiento posterior a revisión

El estado canónico es la única fuente de verdad y legacy es sólo su representación de compatibilidad. Toda actualización legacy debe declarar uno o más dominios de la lista cerrada `financialSituation`, `risk`, `objectives`, `knowledge`, `behavior`, `preferences` y `evidence`; afinidades, progreso, versiones y extensiones no declaradas permanecen intactas. Un identificador entrante distinto se rechaza como `identity_conflict`, sin escritura, revisión ni fecha nueva.

Los callers sólo consideran exitosos `saved` y `unchanged`. Onboarding no completa ni escribe historial si falla la persistencia. El modo demo aborta si no puede limpiar el estado canónico. Los escritores y borradores genéricos rechazan las claves canónica y legacy; sólo el repositorio y el reset Prisma explícito pueden operarlas.

La proyección sin snapshot incluye la forma mínima usada por `InvestorMapPanel`: `vectorSummary`, `vector`, `tree` y `guardrails`. Cuando conocimiento está evaluado, `knowledge.responses` canónico prevalece incluso si está vacío. La normalización conserva extensiones JSON seguras de manera aislada y descarta valores no serializables o claves peligrosas sin perder propiedades hermanas.

La verificación de carga ya no usa SSR ni inspección de fuentes: monta `App` con `react-dom/client` dentro de `React.StrictMode` sobre un DOM de `jsdom`, ejecuta los efectos, desmonta y comprueba cero llamadas a `setItem` y `removeItem` junto con la integridad exacta del estado. `jsdom` es dependencia de desarrollo porque sólo proporciona el DOM al runner Node.

## Tercer endurecimiento

El reset Prisma es una operación específica del repositorio y no una elevación de permisos de un helper genérico. Antes de modificar storage conserva el texto raw de ambas claves y aborta sin eliminar si alguna lectura falla. Elimina y verifica primero legacy, elimina y verifica después el canónico, y finalmente vuelve a comprobar ambas claves; sólo informa éxito si las dos lecturas inmediatas devuelven `null`. Ante una excepción de eliminación o lectura, o una postcondición incumplida, intenta restaurar y verificar el snapshot raw completo. `rolledBack` sólo es verdadero cuando ambas claves coinciden exactamente con sus valores originales; los resultados distinguen `storage_unavailable`, `remove_failed`, `verification_failed`, `postcondition_failed` y `rollback_failed`.

La garantía del reset es una verificación síncrona inmediata con rollback compensatorio de mejor esfuerzo. `localStorage` no ofrece transacciones ni atomicidad entre pestañas o contextos concurrentes: otro contexto puede modificar una clave después de la verificación final y del retorno. Demo y reset de UI sólo avanzan cuando el resultado completo expone `ok: true`.

Los helpers genéricos nunca pueden escribir ni eliminar las claves canónica o legacy, independientemente de opciones adicionales. `vectorSummary` usa legacy como base sólo para campos no modelados y superpone al final `capacity`, `tolerance` y `knowledge` canónicos.

La sanitización es recursiva y no mutante. Omite por propiedad `undefined`, funciones, símbolos, números no finitos, `BigInt`, claves peligrosas y ramas cíclicas, preservando sus hermanas seguras. En arrays conserva longitud y orden y representa cada elemento inseguro como `null`.

Después de `saved` o `unchanged`, React adopta siempre la proyección de `outcome.state`, nunca el candidato legacy. Los errores conservan el estado React previo; Onboarding no completa ni escribe historial y demo/reset no cambian pantalla, perfil, modo ni mensaje de éxito.

La prueba cliente construye `App` mediante un build Vite cliente temporal, instala primero `JSDOM` y sus globals, importa dinámicamente React DOM y el módulo generado, monta con `createRoot` bajo `React.StrictMode`, comprueba mediante las dos inicializaciones canónicas que ocurrió el doble ciclo y elimina la salida temporal en `finally`. Compara explícitamente las claves canónica y legacy completas, metadatos y secciones futuras, además del caso canónico corrupto.

Deuda de dependencias separada y no corregida en esta fase: `brace-expansion` llega por ESLint y `nanoid` por Vite/PostCSS. Ninguna vulnerabilidad pertenece al árbol de `jsdom`; no se ejecutó `npm audit fix`.

## Cobertura

`src/investorState.test.js` prueba creación, migración, conservación del riesgo, estados parciales, idempotencia, entradas congeladas, proyección legacy, Strict Mode sin escrituras, persistencia/recuperación, corrupción, versión desconocida, errores y rollback de storage, extensiones, igualdad semántica, conservación de secciones canónicas e incremento controlado de revisión.
