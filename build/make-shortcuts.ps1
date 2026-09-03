$w = New-Object -ComObject WScript.Shell
$exe = 'C:\emergent-matrix\dist\win-unpacked\PNHR DGTL.exe'
$icon = 'C:\emergent-matrix\build\icon.ico'
$paths = @(
  (Join-Path ([Environment]::GetFolderPath('Desktop')) 'PNHR DGTL.lnk'),
  (Join-Path ([Environment]::GetFolderPath('StartMenu')) 'PNHR DGTL.lnk')
)
foreach ($p in $paths) {
  $s = $w.CreateShortcut($p)
  $s.TargetPath = $exe
  $s.WorkingDirectory = 'C:\emergent-matrix\dist\win-unpacked'
  $s.IconLocation = $icon
  $s.Description = 'PNHR DGTL - Panther Digital desktop'
  $s.Save()
  Write-Output "saved: $p"
}
