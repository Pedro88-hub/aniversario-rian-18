# Configura o Supabase automaticamente (tabela + bucket + config.js)
# Uso:
#   .\scripts\setup-supabase.ps1 -ProjectUrl "https://xxxx.supabase.co" -AnonKey "eyJ..." -AccessToken "sbp_..."
param(
  [Parameter(Mandatory = $true)][string]$ProjectUrl,
  [Parameter(Mandatory = $true)][string]$AnonKey,
  [Parameter(Mandatory = $true)][string]$AccessToken
)

$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent

$ref = ($ProjectUrl -replace 'https?://', '' -replace '\.supabase\.co/?$', '').Trim()
if (-not $ref) { throw 'URL invalida. Exemplo: https://abcdefgh.supabase.co' }

$sql = Get-Content "$root\supabase-setup.sql" -Raw
$body = @{ query = $sql } | ConvertTo-Json -Depth 3

Write-Host "Rodando SQL no projeto $ref..."
Invoke-RestMethod `
  -Method Post `
  -Uri "https://api.supabase.com/v1/projects/$ref/database/query" `
  -Headers @{ Authorization = "Bearer $AccessToken"; 'Content-Type' = 'application/json' } `
  -Body $body | Out-Null

$configPath = Join-Path $root 'js\config.js'
$config = Get-Content $configPath -Raw
$config = $config -replace "url: ''", "url: '$ProjectUrl'"
$config = $config -replace "anonKey: ''", "anonKey: '$AnonKey'"
Set-Content -Path $configPath -Value $config -NoNewline

Write-Host 'Pronto! config.js atualizado e banco configurado.'
