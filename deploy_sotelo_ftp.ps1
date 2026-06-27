$ErrorActionPreference = "Continue"

$base = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontDist = Join-Path $base "Sotelo-main\Sotelo-main\frontend\dist"
$apiDir = Join-Path $base "Sotelo-main\Sotelo-main\backend\public"
$backendApp = Join-Path $base "Sotelo-main\Sotelo-main\backend"
$credFile = Join-Path $base "sotelo_credentials_local.py"

if (-not (Test-Path $frontDist)) {
    throw "Missing frontend build output: $frontDist"
}
if (-not (Test-Path $credFile)) {
    throw "Missing credentials file: $credFile"
}

$credText = Get-Content -Path $credFile -Raw
$ftpUserMatch = [regex]::Match($credText, 'FTP_USER\s*=\s*"([^"]+)"')
$ftpPassMatch = [regex]::Match($credText, 'FTP_PASS\s*=\s*"([^"]+)"')
$ftpHostMatch = [regex]::Match($credText, 'FTP_HOST\s*=\s*"([^"]+)"')

if (-not $ftpUserMatch.Success -or -not $ftpPassMatch.Success) {
    throw "Could not parse FTP_USER/FTP_PASS from sotelo_credentials_local.py"
}

$ftpHost = if ($ftpHostMatch.Success) { $ftpHostMatch.Groups[1].Value } else { "ftp.dataholics.com.mx" }
$ftpUser = $ftpUserMatch.Groups[1].Value
$ftpPass = $ftpPassMatch.Groups[1].Value

$success = 0
$failed = 0

function Upload-File {
    param(
        [string]$LocalPath,
        [string]$RemotePath
    )
    $normalizedRemotePath = $RemotePath.TrimStart('/')
    $url = "ftp://${ftpHost}/$normalizedRemotePath"
    $result = & curl.exe --silent --show-error --ftp-method nocwd --ftp-create-dirs -T "$LocalPath" --user "${ftpUser}:${ftpPass}" "$url" 2>&1
    if ($LASTEXITCODE -eq 0) {
        $script:success++
        Write-Host "OK  $RemotePath"
    } else {
        $script:failed++
        Write-Warning "FAIL $RemotePath :: $result"
    }
}

function Upload-Directory {
    param(
        [string]$LocalDir,
        [string]$RemoteDir,
        [string[]]$ExcludePatterns = @()
    )
    $localPrefixLen = $LocalDir.Length
    Get-ChildItem -Path $LocalDir -Recurse -File | ForEach-Object {
        $fullName = $_.FullName
        $skip = $false
        foreach ($pattern in $ExcludePatterns) {
            if ($fullName -like $pattern) {
                $skip = $true
                break
            }
        }
        if ($skip) { return }
        
        $relative = $fullName.Substring($localPrefixLen).Replace('\', '/')
        if ($relative.StartsWith('/')) {
            $relative = $relative.Substring(1)
        }
        
        Upload-File -LocalPath $fullName -RemotePath "$RemoteDir/$relative"
    }
}
Write-Host "Building frontend..."
Set-Location -Path (Join-Path $base "Sotelo-main\Sotelo-main\frontend")
& npm run build

Write-Host "Uploading frontend dist to root..."
Upload-Directory -LocalDir $frontDist -RemoteDir "" -ExcludePatterns @()

Write-Host "Uploading backend app to backend/app..."
$backendAppDir = Join-Path $base "Sotelo-main\Sotelo-main\backend\app"
Upload-Directory -LocalDir $backendAppDir -RemoteDir "backend/app" -ExcludePatterns @("*\.git\*")

Write-Host ""
Write-Host "Upload summary: success=$success failed=$failed"
if ($failed -gt 0) {
    throw "Deployment finished with failed uploads."
}
Write-Host "Deployment upload completed successfully."
