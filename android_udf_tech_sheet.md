# Stack Android Moderno – Ficha Técnica (Orientada a UDF)

## 1. Lenguaje base
Kotlin (principal)
Java (interoperabilidad total)

## 2. Plataforma
Android SDK
Android Runtime (ART)
JVM / Kotlin Native / Kotlin Multiplatform

## 3. Capa de UI
View System (legacy)
XML Layouts
Jetpack Compose (declarativo)
Material Design / Material3

## 4. Arquitectura de UI
MVC (obsoleto)
MVP (legacy)
MVVM (estándar)
MVI (MVVM + UDF estricto)
Clean Architecture (macroarquitectura)

## 5. Gestión de estado
State / MutableState
LiveData
StateFlow
SharedFlow
Snapshot System (Compose)

## 6. Navegación
Intent System
Fragment Navigation
Jetpack Navigation v1/v2
Jetpack Navigation 3 (Compose-first)
Deep Links

## 7. Concurrencia y asincronía
Coroutines
Suspend functions
Flow
Channels
Structured Concurrency

## 8. Inyección de dependencias
Hilt (estándar)
Dagger
Koin
DI manual

## 9. Persistencia
Room (SQL)
DataStore
SharedPreferences (legacy)
SQLite

## 10. Red
Retrofit
Ktor Client
OkHttp
WebSockets

## 11. Serialización
Kotlinx Serialization
Moshi
Gson (legacy)

## 12. Testing
JUnit
MockK / Mockito
Espresso
Compose UI Test
Robolectric

## 13. Build system
Gradle
Kotlin DSL
Version Catalogs

## 14. Arquitectura de dominio
Repository Pattern
UseCases / Interactors
DTO / Domain Models
Mapper Pattern

## 15. Ciclo de vida
Activity Lifecycle
Fragment Lifecycle
ViewModel Lifecycle
Process Lifecycle

## 16. Seguridad
Keystore
Biometrics
EncryptedSharedPreferences
Network Security Config

## 17. Multiplataforma
Kotlin Multiplatform
Compose Multiplatform
Ktor
Shared Domain Layer

## 18. Herramientas
Android Studio
ADB
Profiler
Lint
Detekt

---

# Unidirectional Data Flow (UDF)

## Definición
UDF (Unidirectional Data Flow) es un principio de arquitectura donde **el estado fluye en una sola dirección**.

Usuario → Evento → Reducer/ViewModel → Nuevo estado → Vista

La vista nunca modifica el estado directamente.

## Componentes base

### State
Objeto inmutable que representa todo el estado de la UI.

```
data class UiState(
    val loading: Boolean,
    val user: User?
)
```

### Event / Intent
Acciones del usuario o del sistema.

```
sealed interface UiEvent {
    data object LoadUser : UiEvent
    data class Click(val id: Int) : UiEvent
}
```

### Reducer / ViewModel
Función pura que transforma estado.

```
fun reduce(state: UiState, event: UiEvent): UiState = when(event) {
    LoadUser -> state.copy(loading = true)
    is Click -> state
}
```

### View
Render puro del estado.

```
@Composable
fun Screen(state: UiState, onEvent: (UiEvent) -> Unit) {
    if (state.loading) Text("Cargando")
}
```

## Propiedades
Determinista
Trazable
Testeable
Sin efectos laterales ocultos

## Relaciones
MVVM → UDF dentro del ViewModel
MVI → UDF estricto
Redux / Elm / Flux → Implementaciones formales de UDF
Compose → Diseñado para UDF
Navigation3 → Navegación como estado

---

# Modelo mental

Kotlin = motor de lenguaje
Compose = render de UI
MVVM = arquitectura estructural
UDF = ley de flujo de datos
Navigation3 = máquina de estados de pantallas
ViewModel + StateFlow = contenedor de estado
Coroutines = motor async
Hilt = cableado de dependencias
Room / Retrofit = fuentes de datos

El sistema completo se comporta como una máquina de estados determinista.

