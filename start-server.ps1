# start-server.ps1
# STABLE NATIVE POWERSHELL WEB SERVER (Synchronous with Robust Error Handling)

$port = 80
$localPath = $PSScriptRoot
$url = "http://*:$port/"

# Check for Admin rights
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "ERROR: Please run PowerShell as ADMINISTRATOR." -ForegroundColor Red
    pause
    exit
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url)

try {
    $listener.Start()
} catch {
    Write-Host "ERROR: Could not start server. Port $port might be in use." -ForegroundColor Red
    pause
    exit
}

Write-Host "----------------------------------------------------" -ForegroundColor Green
Write-Host "WVSGH HR Portal is LIVE" -ForegroundColor Cyan
Write-Host "Access Link: http://$($(ipconfig | findstr [0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*)[0].Split()[-1]):$port" -ForegroundColor Yellow
Write-Host "----------------------------------------------------" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server."

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $vPath = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrWhiteSpace($vPath)) { $vPath = "index.html" }
        $fPath = Join-Path $localPath $vPath

        if (Test-Path $fPath -PathType Leaf) {
            # Simple Mime Mapping
            $ext = [System.IO.Path]::GetExtension($fPath).ToLower()
            $mime = switch($ext) {
                ".html" { "text/html" }
                ".css"  { "text/css" }
                ".js"   { "application/javascript" }
                ".png"  { "image/png" }
                ".jpg"  { "image/jpeg" }
                ".jpeg" { "image/jpeg" }
                ".svg"  { "image/svg+xml" }
                ".pdf"  { "application/pdf" }
                ".mp4"  { "video/mp4" }
                default { "application/octet-stream" }
            }
            
            $response.ContentType = $mime
            
            # Efficiently stream the file
            $fileStream = [System.IO.File]::OpenRead($fPath)
            $response.ContentLength64 = $fileStream.Length
            
            $buffer = New-Object byte[] 64kb
            while (($read = $fileStream.Read($buffer, 0, $buffer.Length)) -gt 0) {
                try {
                    $response.OutputStream.Write($buffer, 0, $read)
                } catch {
                    # Client likely disconnected/navigated away
                    break
                }
            }
            $fileStream.Close()
        } else {
            $response.StatusCode = 404
        }
        $response.Close()
    } catch {
        # General catch to prevent the entire server from crashing
    }
}
