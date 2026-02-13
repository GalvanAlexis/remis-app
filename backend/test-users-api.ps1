# Test Users Module Endpoints

Write-Host "===== REMIS API Testing =====" -ForegroundColor Cyan
Write-Host ""

# 1. Login to get fresh token
Write-Host "1. Login as Cliente..." -ForegroundColor Yellow
$loginResponse = Invoke-RestMethod -Uri "http://192.168.1.100:3000/auth/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body '{"email":"cliente@test.com","password":"123456"}'

$token = $loginResponse.access_token
Write-Host "Token obtained: $($token.Substring(0,20))..." -ForegroundColor Green
Write-Host ""

# 2. Get Profile
Write-Host "2. Get Profile..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $token"
}
$profile = Invoke-RestMethod -Uri "http://192.168.1.100:3000/users/profile" `
    -Method Get `
    -Headers $headers
    
Write-Host "Profile:" -ForegroundColor Green
$profile | ConvertTo-Json -Depth 5
Write-Host ""

# 3. Update Profile
Write-Host "3. Update Profile..." -ForegroundColor Yellow
$updateData = @{
    nombre = "Juan Pablo"
    phone = "+54911222333"
} | ConvertTo-Json

$updatedProfile = Invoke-RestMethod -Uri "http://192.168.1.100:3000/users/profile" `
    -Method Put `
    -Headers $headers `
    -ContentType "application/json" `
    -Body $updateData
    
Write-Host "Updated Profile:" -ForegroundColor Green
$updatedProfile | ConvertTo-Json
Write-Host ""

Write-Host "===== Tests Completed =====" -ForegroundColor Cyan
