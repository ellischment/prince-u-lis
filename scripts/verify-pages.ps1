$base = 'http://localhost:3000'

Write-Host '=== PUNKT 2: Client path ==='

# Main page
$r = Invoke-WebRequest -Uri "$base/" -UseBasicParsing
Write-Host "GET / -> $($r.StatusCode)"
Write-Host "  title: $(if($r.Content -match '<title>([^<]+)</title>'){$Matches[1]} else {'not found'})"
Write-Host "  Princ-i-Lis text: $(if($r.Content -match 'Принц'){' YES'} else {' NO'})"
Write-Host "  Fox/stars section: $(if($r.Content -match 'f3-|fx-star|FoxScene'){' YES'} else {' NO'})"
Write-Host "  Catalog section: $(if($r.Content -match 'catalog\-section|CatalogSection'){' YES'} else {' NO'})"
Write-Host "  Booking section: $(if($r.Content -match 'booking\-section|BookingSection'){' YES'} else {' NO'})"
Write-Host "  JSON-LD LocalBusiness: $(if($r.Content -match 'LocalBusiness'){' YES'} else {' NO'})"
Write-Host ""

# Service page
$r2 = Invoke-WebRequest -Uri "$base/zanyatiya/goncharny-krug" -UseBasicParsing
Write-Host "GET /zanyatiya/goncharny-krug -> $($r2.StatusCode)"
Write-Host "  Price present: $(if($r2.Content -match '3500'){' YES'} else {' NO'})"
Write-Host "  Program items: $(if($r2.Content -match 'program|ServiceProgramItem'){' YES'} else {' NO'})"
Write-Host "  Slot chips: $(if($r2.Content -match 'chip'){' YES'} else {' NO'})"
Write-Host "  Booking form: $(if($r2.Content -match 'booking|Записаться'){' YES'} else {' NO'})"
Write-Host ""

# API: slots for service
$r3 = Invoke-WebRequest -Uri "$base/api/slots?serviceId=all" -UseBasicParsing
Write-Host "GET /api/slots -> $($r3.StatusCode)"
Write-Host ""

# Categories
$r4 = Invoke-WebRequest -Uri "$base/api/services" -UseBasicParsing
Write-Host "GET /api/services -> $($r4.StatusCode)"
$svcJson = $r4.Content | ConvertFrom-Json
Write-Host "  Services count: $($svcJson.Count)"
Write-Host ""

# Admin login page
$r5 = Invoke-WebRequest -Uri "$base/admin/login" -UseBasicParsing
Write-Host "GET /admin/login -> $($r5.StatusCode)"
Write-Host "  Login form present: $(if($r5.Content -match 'form|email|password'){' YES'} else {' NO'})"
Write-Host ""

# Admin redirect (no auth)
try {
  $r6 = Invoke-WebRequest -Uri "$base/admin/bookings" -UseBasicParsing -MaximumRedirection 0 -ErrorAction Stop
  Write-Host "GET /admin/bookings -> $($r6.StatusCode) (expected 307)"
} catch {
  $status = $_.Exception.Response.StatusCode.value__
  $loc = $_.Exception.Response.Headers['Location']
  Write-Host "GET /admin/bookings -> $status -> $loc (middleware redirect OK)"
}
