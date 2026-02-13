# Test Driver Documents

Write-Host "===== Testing Driver Documents =====" -ForegroundColor Cyan
Write-Host ""

# 1. Login as Chofer
Write-Host "1. Login as Chofer..." -ForegroundColor Yellow
$loginResponse = Invoke-RestMethod -Uri "http://192.168.1.100:3000/auth/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body '{"email":"chofer@test.com","password":"123456"}'

$token = $loginResponse.access_token
Write-Host "Token obtained for chofer" -ForegroundColor Green
Write-Host ""

# 2. Upload Driver Documents
Write-Host "2. Upload Driver Documents..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $token"
}

$docsData = @{
    licenciaUrl     = "https://example.com/licencia.jpg"
    cedulaUrl       = "https://example.com/cedula.jpg"
    habilitacionUrl = "https://example.com/habilitacion.jpg"
    maxPassengers   = "4"
} | ConvertTo-Json

$uploadResult = Invoke-RestMethod -Uri "http://192.168.1.100:3000/users/driver/documents" `
    -Method Post `
    -Headers $headers `
    -ContentType "application/json" `
    -Body $docsData
    
Write-Host "Documents uploaded:" -ForegroundColor Green
$uploadResult | ConvertTo-Json -Depth 3
Write-Host ""

# 3. Get Driver Documents
Write-Host "3. Get Driver Documents..." -ForegroundColor Yellow
$docs = Invoke-RestMethod -Uri "http://192.168.1.100:3000/users/driver/documents" `
    -Method Get `
    -Headers $headers
    
Write-Host "Driver Documents:" -ForegroundColor Green
$docs | ConvertTo-Json
Write-Host ""

Write-Host "===== Tests Completed =====" -ForegroundColor Cyan
