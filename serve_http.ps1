$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$prefix = 'http://127.0.0.1:8081/'
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
$listener.Start()
Write-Host "Servidor local iniciado en $prefix"
Write-Host "Carpeta raíz: $baseDir"
Write-Host "Presiona Ctrl+C para detener."

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        try {
            $urlPath = $request.Url.AbsolutePath.TrimStart('/') -replace '/+', '\\'
            if ([string]::IsNullOrEmpty($urlPath)) {
                $urlPath = 'index.html'
            }

            $localPath = [System.IO.Path]::GetFullPath((Join-Path $baseDir $urlPath))
            if (-not $localPath.StartsWith($baseDir, [System.StringComparison]::OrdinalIgnoreCase)) {
                $response.StatusCode = 403
                $response.Close()
                continue
            }

            if (-not (Test-Path $localPath -PathType Leaf)) {
                if (Test-Path $localPath -PathType Container) {
                    $localPath = Join-Path $localPath 'index.html'
                }
            }

            if (-not (Test-Path $localPath -PathType Leaf)) {
                $response.StatusCode = 404
                $response.Close()
                continue
            }

            $bytes = [System.IO.File]::ReadAllBytes($localPath)
            $ext = [System.IO.Path]::GetExtension($localPath).ToLowerInvariant()
            $mime = switch ($ext) {
                '.html' { 'text/html; charset=utf-8' }
                '.htm' { 'text/html; charset=utf-8' }
                '.css' { 'text/css; charset=utf-8' }
                '.js' { 'application/javascript; charset=utf-8' }
                '.json' { 'application/json; charset=utf-8' }
                '.png' { 'image/png' }
                '.jpg' { 'image/jpeg' }
                '.jpeg' { 'image/jpeg' }
                '.gif' { 'image/gif' }
                '.svg' { 'image/svg+xml' }
                '.ico' { 'image/x-icon' }
                '.woff' { 'font/woff' }
                '.woff2' { 'font/woff2' }
                default { 'application/octet-stream' }
            }

            $response.ContentType = $mime
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } catch {
            $response.StatusCode = 500
        } finally {
            $response.OutputStream.Close()
            $response.Close()
        }
    }
} catch {
    # Ignored
} finally {
    $listener.Close()
}
