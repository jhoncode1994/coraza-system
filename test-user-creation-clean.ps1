$body = @"
{
  "nombre": "Juan Carlos",
  "apellido": "Perez Garcia",
  "cedula": "12345678",
  "zona": 1,
  "fechaIngreso": "2024-03-15",
  "cargo": "Vigilante"
}
"@

Write-Host "Probando creacion de usuario con campo cargo..."
Write-Host "Enviando datos: $body"

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/users" -Method POST -ContentType "application/json" -Body $body
    Write-Host "Usuario creado exitosamente:"
    Write-Host "Respuesta del servidor:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
    
    if ($response.cargo -eq "Vigilante") {
        Write-Host "EXITO! El campo cargo se guardo correctamente" -ForegroundColor Green
    } else {
        Write-Host "El campo cargo no se guardo como se esperaba" -ForegroundColor Yellow
        Write-Host "Esperado: Vigilante"
        Write-Host "Recibido: $($response.cargo)"
    }
} catch {
    Write-Host "Error al crear usuario:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
