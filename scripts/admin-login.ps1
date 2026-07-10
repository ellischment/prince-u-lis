$ErrorActionPreference = 'SilentlyContinue'
$sv = $null

$csrf = Invoke-WebRequest -Uri 'http://localhost:3000/api/auth/csrf' -UseBasicParsing -SessionVariable sv
$token = ($csrf.Content | ConvertFrom-Json).csrfToken
Write-Host "CSRF: $token"

$body = "csrfToken=$token&email=liza%40princ-lis.ru&password=dev-owner-123&callbackUrl=http%3A%2F%2Flocalhost%3A3000%2Fadmin%2Fbookings&json=true"
$login = Invoke-WebRequest -Uri 'http://localhost:3000/api/auth/callback/credentials' -Method POST -Body $body -ContentType 'application/x-www-form-urlencoded' -UseBasicParsing -WebSession $sv -MaximumRedirection 5
Write-Host "Login status: $($login.StatusCode)"

$me = Invoke-WebRequest -Uri 'http://localhost:3000/api/auth/session' -UseBasicParsing -WebSession $sv
Write-Host "Session: $($me.Content)"

$bk = Invoke-WebRequest -Uri 'http://localhost:3000/api/admin/bookings' -UseBasicParsing -WebSession $sv
Write-Host "Bookings status: $($bk.StatusCode)"
$data = $bk.Content | ConvertFrom-Json
Write-Host "Bookings total=$($data.total) returned=$($data.data.Count)"
