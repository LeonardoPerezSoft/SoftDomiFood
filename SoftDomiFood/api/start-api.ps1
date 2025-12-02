# Script para configurar e iniciar la API correctamente

Write-Host "Configurando API de SoftDomiFood..." -ForegroundColor Green
Write-Host ""

# Ir al directorio de la API
Set-Location "C:\Users\User\Documentos\SoftDomiFood\SoftDomiFood\api"

# Eliminar venv anterior si existe
if (Test-Path "venv") {
    Write-Host "Eliminando entorno virtual anterior..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force venv
}

# Crear nuevo venv
Write-Host "Creando nuevo entorno virtual..." -ForegroundColor Yellow
python -m venv venv

# Activar venv
Write-Host "Activando entorno virtual..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

# Actualizar pip
Write-Host "Actualizando pip..." -ForegroundColor Yellow
& ".\venv\Scripts\python.exe" -m pip install --upgrade pip setuptools wheel --quiet

# Instalar todas las dependencias desde requirements.txt
Write-Host "Instalando dependencias desde requirements.txt..." -ForegroundColor Yellow
& ".\venv\Scripts\python.exe" -m pip install -r requirements.txt

# Copiar .env
if (Test-Path ".env.local") {
    Write-Host "Copiando configuracion .env..." -ForegroundColor Yellow
    Copy-Item .env.local .env -Force
    Write-Host "  .env creado" -ForegroundColor Green
}

Write-Host ""
Write-Host "Configuracion completada!" -ForegroundColor Green
Write-Host ""
Write-Host "Iniciando servidor..." -ForegroundColor Cyan
Write-Host ""

# Iniciar uvicorn
& ".\venv\Scripts\python.exe" -m uvicorn main:app --reload --host 0.0.0.0 --port 5000
