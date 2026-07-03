$c = [System.IO.File]::ReadAllText('C:\Claude\agent-os\clients\got-moles\projects\briefs\website-rebuild-rebrand\site\src\lib\blog-data.ts')
$find = 'King, Pierce, Snohomish, and Thurston Counties since 2017 from Enumclaw-based operations.'
Write-Host ("Contains old1: " + $c.Contains($find))
$find2 = "Got Moles has served nearly 5,000 clients since 2017. Spencer Hill has over 15 years of personal mole trapping experience."
Write-Host ("Contains old2: " + $c.Contains($find2))
$find3 = "They know Townsend's mole behavior, Western Washington soil patterns, and seasonal activity cycles inside out."
Write-Host ("Contains old3: " + $c.Contains($find3))

$i = $c.IndexOf('Enumclaw-based')
$slice = $c.Substring($i, 50)
$bytes = [System.Text.Encoding]::UTF8.GetBytes($slice)
Write-Host ("Enumclaw context bytes: " + ($bytes -join ' '))

$i2 = $c.IndexOf('Townsend')
if ($i2 -gt 0) {
  $slice2 = $c.Substring($i2, 150)
  Write-Host ("Townsend slice: " + $slice2)
}

$i3 = $c.IndexOf('5,000 clients since 2017')
if ($i3 -gt 0) {
  Write-Host ("5000 clients found at: " + $i3)
  Write-Host $c.Substring($i3, 150)
}
