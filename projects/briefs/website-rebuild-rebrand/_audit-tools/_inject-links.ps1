$path = 'C:\Claude\agent-os\clients\got-moles\projects\briefs\website-rebuild-rebrand\site\src\lib\blog-data.ts'
$c = [System.IO.File]::ReadAllText($path)
$em = [char]0x2014

# Edit 1: Red flags section - service-areas link
$old1 = 'King, Pierce, Snohomish, and Thurston Counties since 2017 from Enumclaw-based operations.'
$new1 = 'King, Pierce, Snohomish, and Thurston Counties since 2017 from Enumclaw-based operations, with [90+ Western Washington service areas](/service-areas/) listed openly on our site.'

# Edit 2: Question 6 (How long?) - communities we serve link
$old2 = "Got Moles has served nearly 5,000 clients since 2017. Spencer Hill has over 15 years of personal mole trapping experience."
$new2 = "Got Moles has served nearly 5,000 clients since 2017 across the [communities we serve](/service-areas/) throughout Western Washington. Spencer Hill has over 15 years of personal mole trapping experience."

# Edit 3: Question 1 (Specialize?) - partial-match keyword anchor for Seattle
$old3 = "They know Townsend's mole behavior, Western Washington soil patterns, and seasonal activity cycles inside out."
$new3 = "They know Townsend's mole behavior, Western Washington soil patterns, and seasonal activity cycles inside out " + $em + " and they actually cover the towns and neighborhoods you live in, whether that's [Seattle mole control](/mole-control-seattle/) or a smaller community further out."

if ($c.Contains($old1)) { $c = $c.Replace($old1, $new1); Write-Host "OK1" } else { Write-Host "MISS1" }
if ($c.Contains($old2)) { $c = $c.Replace($old2, $new2); Write-Host "OK2" } else { Write-Host "MISS2" }
if ($c.Contains($old3)) { $c = $c.Replace($old3, $new3); Write-Host "OK3" } else { Write-Host "MISS3" }

[System.IO.File]::WriteAllText($path, $c, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "WROTE"
