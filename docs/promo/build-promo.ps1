# Build Royal Poker Match YouTube promo from captured gameplay.

$ErrorActionPreference = "Stop"
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

$Out = Join-Path $PSScriptRoot "out"
$Raw = Join-Path $Out "raw-gameplay.webm"
$Font = "C\:/Windows/Fonts/arialbd.ttf"
if (-not (Test-Path "C:\Windows\Fonts\arialbd.ttf")) { $Font = "C\:/Windows/Fonts/arial.ttf" }

if (-not (Test-Path $Raw)) {
  throw "Missing raw-gameplay.webm - run: cd frontend; node scripts/record-promo.mjs"
}

function Invoke-Ffmpeg {
  param([Parameter(Mandatory=$true)][string[]]$FfArgs)
  & ffmpeg @FfArgs
  if ($LASTEXITCODE -ne 0) { throw "ffmpeg failed" }
}

Write-Host "Building title / end cards..."
$title = Join-Path $Out "title-vertical.mp4"
$end = Join-Path $Out "end-vertical.mp4"

Invoke-Ffmpeg @(
  "-y","-f","lavfi","-i","color=c=0x061a17:s=1080x1920:d=3",
  "-vf","drawtext=fontfile='${Font}':text='ROYAL POKER MATCH':fontcolor=0xffe9a0:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2-80,drawtext=fontfile='${Font}':text='Swipe poker hands. Clear goals. Win.':fontcolor=white:fontsize=36:x=(w-text_w)/2:y=(h-text_h)/2+20",
  "-c:v","libx264","-pix_fmt","yuv420p","-t","3",$title
)

Invoke-Ffmpeg @(
  "-y","-f","lavfi","-i","color=c=0x061a17:s=1080x1920:d=3",
  "-vf","drawtext=fontfile='${Font}':text='Play free today':fontcolor=0xffe9a0:fontsize=64:x=(w-text_w)/2:y=(h-text_h)/2-40,drawtext=fontfile='${Font}':text='Link in description':fontcolor=white:fontsize=40:x=(w-text_w)/2:y=(h-text_h)/2+40",
  "-c:v","libx264","-pix_fmt","yuv420p","-t","3",$end
)

Write-Host "Scaling gameplay with captions..."
$Gameplay = Join-Path $Out "gameplay-captioned.mp4"
$vf = "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=0x061a17," +
  "drawtext=fontfile='${Font}':text='Not normal match-3 - real poker hands':fontcolor=0xffe9a0:fontsize=40:x=(w-text_w)/2:y=120:enable='between(t\,1\,8)'," +
  "drawtext=fontfile='${Font}':text='Swipe adjacent cards to score':fontcolor=white:fontsize=38:x=(w-text_w)/2:y=120:enable='between(t\,8\,18)'," +
  "drawtext=fontfile='${Font}':text='Chase goals - climb Solo - play online':fontcolor=0xffe9a0:fontsize=36:x=(w-text_w)/2:y=120:enable='between(t\,18\,35)'," +
  "drawtext=fontfile='${Font}':text='Quick Play - Friends - Cups':fontcolor=white:fontsize=38:x=(w-text_w)/2:y=120:enable='between(t\,35\,55)'"

Invoke-Ffmpeg @("-y","-i",$Raw,"-vf",$vf,"-an","-c:v","libx264","-pix_fmt","yuv420p","-t","45",$Gameplay)

Write-Host "Concatenating final Short..."
$List = Join-Path $Out "concat.txt"
@(
  "file 'title-vertical.mp4'"
  "file 'gameplay-captioned.mp4'"
  "file 'end-vertical.mp4'"
) | Set-Content -Path $List -Encoding ascii

$Short = Join-Path $Out "RoyalPokerMatch-YouTube-Short.mp4"
Push-Location $Out
Invoke-Ffmpeg @("-y","-f","concat","-safe","0","-i","concat.txt","-c:v","libx264","-pix_fmt","yuv420p","-movflags","+faststart",$Short)
Pop-Location

Write-Host "Building 16:9 landscape cut..."
$Landscape = Join-Path $Out "RoyalPokerMatch-YouTube-Landscape.mp4"
Invoke-Ffmpeg @(
  "-y","-i",$Short,
  "-vf","scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x061a17",
  "-c:v","libx264","-pix_fmt","yuv420p","-movflags","+faststart",$Landscape
)

Write-Host "DONE"
Get-Item $Short,$Landscape | Format-Table FullName,Length -AutoSize
