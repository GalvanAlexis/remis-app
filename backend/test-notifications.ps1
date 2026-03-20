# test-notifications.ps1
# Script para probar el envío de notificaciones push desde el backend

$API_URL = "http://localhost:3000"
$USERNAME = "Ale"
$PASSWORD = "TestPass123!" # Nota: Asegurarse de que sea la contraseña correcta

Write-Host "1. Iniciando sesión como $USERNAME..." -ForegroundColor Cyan
$loginResponse = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method Post -Body (@{
    username = $USERNAME
    password = $PASSWORD
} | ConvertTo-Json) -ContentType "application/json"

$token = $loginResponse.access_token

if (-not $token) {
    Write-Host "Error: No se pudo obtener el access_token" -ForegroundColor Red
    exit
}

Write-Host "2. Disparando notificación de prueba..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$API_URL/notifications/send-test" -Method Post -Headers @{
        Authorization = "Bearer $token"
    } -ContentType "application/json"

    Write-Host "`n✅ Éxito!" -ForegroundColor Green
    Write-Host "Mensaje: $($response.message)"
    Write-Host "Token destino: $($response.token)"
    Write-Host "`nREVISA EL TERMINAL DEL BACKEND PARA VER EL RESULTADO DE EXPO." -ForegroundColor Yellow
} catch {
    $errorMsg = $_.Exception.Message
    Write-Host "`n❌ Error al enviar notificación: $errorMsg" -ForegroundColor Red
    Write-Host "Asegúrate de haber iniciado sesión al menos una vez desde un dispositivo físico/simulador con token válido." -ForegroundColor Gray
}
