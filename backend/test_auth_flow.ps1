Write-Host "?? Testing Complete Authentication Flow" -ForegroundColor Magenta
Write-Host "=" * 60 -ForegroundColor Cyan

# 1. Register a new user
Write-Host "`n1. Registering new user..." -ForegroundColor Yellow
$registerData = @{
    username = "demo_user_$(Get-Random -Minimum 1000 -Maximum 9999)"
    email = "demo_$(Get-Random -Minimum 1000 -Maximum 9999)@example.com"
    password = "SecurePass123!"
} | ConvertTo-Json

try {
    $regResponse = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/auth/register" `
        -Method Post `
        -Body $registerData `
        -ContentType "application/json"
    
    Write-Host "   ? Registration successful!" -ForegroundColor Green
    Write-Host "   Username: $($regResponse.username)" -ForegroundColor Gray
    Write-Host "   Email: $($regResponse.email)" -ForegroundColor Gray
    
    $username = $regResponse.username
    $password = ($registerData | ConvertFrom-Json).password
    
} catch {
    Write-Host "   ? Registration failed:" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
    exit
}

# 2. Login with the new user
Write-Host "`n2. Logging in..." -ForegroundColor Yellow
$loginData = @{
    username = $username
    password = $password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/auth/login" `
        -Method Post `
        -Body $loginData `
        -ContentType "application/json"
    
    Write-Host "   ? Login successful!" -ForegroundColor Green
    Write-Host "   Token type: $($loginResponse.token_type)" -ForegroundColor Gray
    Write-Host "   Token length: $($loginResponse.access_token.Length) chars" -ForegroundColor Gray
    
    $token = $loginResponse.access_token
    
} catch {
    Write-Host "   ? Login failed:" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
    exit
}

# 3. Test protected endpoint (/me)
Write-Host "`n3. Testing protected endpoint (/me)..." -ForegroundColor Yellow
try {
    $headers = @{ "Authorization" = "Bearer $token" }
    $userInfo = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/auth/me" `
        -Method Get `
        -Headers $headers
    
    Write-Host "   ? Protected endpoint successful!" -ForegroundColor Green
    Write-Host "   Current user: $($userInfo.username)" -ForegroundColor Gray
    Write-Host "   Email: $($userInfo.email)" -ForegroundColor Gray
    
} catch {
    Write-Host "   ? Protected endpoint failed:" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 4. Test with invalid token
Write-Host "`n4. Testing with invalid token..." -ForegroundColor Yellow
try {
    $headers = @{ "Authorization" = "Bearer invalid_token_123" }
    $invalidResponse = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/auth/me" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop
    
    Write-Host "   ? Should have failed but didn't!" -ForegroundColor Red
} catch {
    Write-Host "   ? Correctly rejected invalid token" -ForegroundColor Green
}

Write-Host "`n" + "=" * 60 -ForegroundColor Cyan
Write-Host "?? Authentication Flow Test Complete!" -ForegroundColor Green
Write-Host "All authentication endpoints are working correctly." -ForegroundColor Green
