$w = New-Object -ComObject WScript.Shell
$links = @(
  (Join-Path ([Environment]::GetFolderPath('Desktop')) 'PNHR DGTL.lnk'),
  (Join-Path ([Environment]::GetFolderPath('StartMenu')) 'PNHR DGTL.lnk')
)
foreach ($p in $links) {
  $s = $w.CreateShortcut($p)
  $exists = Test-Path $s.TargetPath
  Write-Output "$p -> $($s.TargetPath) [exists: $exists]"
}
