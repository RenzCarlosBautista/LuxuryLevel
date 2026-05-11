param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$ScrapeArgs
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

$npmPath = (Get-Command npm -ErrorAction Stop).Source

& $npmPath run scrape -- @ScrapeArgs
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}
