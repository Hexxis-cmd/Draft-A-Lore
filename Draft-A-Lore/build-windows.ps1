[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$releaseDir = Join-Path $repoRoot 'releases'
$htmlPath = Join-Path $releaseDir 'DraftALore.html'
$outputPath = Join-Path $releaseDir 'DraftALore.exe'
$zipPath = Join-Path $releaseDir 'DraftALore-Windows.zip'
$iconPath = Join-Path $releaseDir 'favicon.ico'

if (-not (Test-Path -LiteralPath $htmlPath -PathType Leaf)) {
    throw 'releases\DraftALore.html is missing. Run python build.py first.'
}

$compilerCandidates = @(
    (Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'),
    (Join-Path $env:WINDIR 'Microsoft.NET\Framework\v4.0.30319\csc.exe')
)
$compiler = $compilerCandidates | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } | Select-Object -First 1
if (-not $compiler) {
    throw 'The Windows .NET Framework C# compiler was not found.'
}

$temporaryDir = Join-Path ([IO.Path]::GetTempPath()) ('DraftALoreBuild-' + [guid]::NewGuid().ToString('N'))
$packageDir = Join-Path $temporaryDir 'package'
New-Item -ItemType Directory -Path $packageDir -Force | Out-Null

try {
    $sourcePath = Join-Path $temporaryDir 'DraftALoreLauncher.cs'
    $source = @'
using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Windows.Forms;

[assembly: AssemblyTitle("Draft A Lore")]
[assembly: AssemblyDescription("Offline writing and RPG adventure design studio")]
[assembly: AssemblyCompany("Hexxis-cmd (Daymien Vanhorn)")]
[assembly: AssemblyProduct("Draft A Lore")]
[assembly: AssemblyVersion("1.0.0.0")]
[assembly: AssemblyFileVersion("1.0.0.0")]

internal static class DraftALoreLauncher
{
    [STAThread]
    private static int Main()
    {
        string appDirectory = AppDomain.CurrentDomain.BaseDirectory;
        string htmlPath = Path.Combine(appDirectory, "DraftALore.html");
        if (!File.Exists(htmlPath))
        {
            MessageBox.Show(
                "DraftALore.html must be kept in the same folder as DraftALore.exe.",
                "Draft A Lore",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
            return 1;
        }

        try
        {
            string browser = FindBrowser();
            if (browser != null)
            {
                string fileUrl = new Uri(htmlPath).AbsoluteUri;
                Process.Start(new ProcessStartInfo
                {
                    FileName = browser,
                    Arguments = "--app=\"" + fileUrl + "\" --window-size=1400,900",
                    WorkingDirectory = appDirectory,
                    UseShellExecute = false
                });
            }
            else
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = htmlPath,
                    WorkingDirectory = appDirectory,
                    UseShellExecute = true
                });
            }
            return 0;
        }
        catch (Exception error)
        {
            MessageBox.Show(
                "Draft A Lore could not open.\n\n" + error.Message +
                "\n\nYou can still open DraftALore.html directly in a browser.",
                "Draft A Lore",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
            return 1;
        }
    }

    private static string FindBrowser()
    {
        string programFiles = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
        string programFilesX86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);
        string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        string[] candidates =
        {
            Path.Combine(programFilesX86, "Microsoft", "Edge", "Application", "msedge.exe"),
            Path.Combine(programFiles, "Microsoft", "Edge", "Application", "msedge.exe"),
            Path.Combine(programFiles, "Google", "Chrome", "Application", "chrome.exe"),
            Path.Combine(programFilesX86, "Google", "Chrome", "Application", "chrome.exe"),
            Path.Combine(localAppData, "Google", "Chrome", "Application", "chrome.exe"),
            Path.Combine(programFiles, "BraveSoftware", "Brave-Browser", "Application", "brave.exe"),
            Path.Combine(programFilesX86, "BraveSoftware", "Brave-Browser", "Application", "brave.exe"),
            Path.Combine(programFiles, "Vivaldi", "Application", "vivaldi.exe"),
            Path.Combine(localAppData, "Vivaldi", "Application", "vivaldi.exe")
        };

        foreach (string candidate in candidates)
        {
            if (!String.IsNullOrEmpty(candidate) && File.Exists(candidate))
                return candidate;
        }
        return null;
    }
}
'@
    Set-Content -LiteralPath $sourcePath -Value $source -Encoding UTF8

    $compilerArguments = @(
        '/nologo',
        '/target:winexe',
        '/optimize+',
        '/platform:anycpu',
        '/reference:System.Windows.Forms.dll',
        ('/out:' + $outputPath)
    )
    if (Test-Path -LiteralPath $iconPath -PathType Leaf) {
        $compilerArguments += '/win32icon:' + $iconPath
    }
    $compilerArguments += $sourcePath

    & $compiler $compilerArguments
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $outputPath -PathType Leaf)) {
        throw 'The Windows launcher did not compile successfully.'
    }

    $packageFiles = @(
        'DraftALore.exe',
        'DraftALore.html',
        'favicon.ico',
        'Install-DraftALore.bat',
        'README-WINDOWS.txt'
    )
    foreach ($name in $packageFiles) {
        $sourceFile = Join-Path $releaseDir $name
        if (Test-Path -LiteralPath $sourceFile -PathType Leaf) {
            Copy-Item -LiteralPath $sourceFile -Destination $packageDir
        }
    }

    if (Test-Path -LiteralPath $zipPath) {
        Remove-Item -LiteralPath $zipPath -Force
    }
    Compress-Archive -Path (Join-Path $packageDir '*') -DestinationPath $zipPath -CompressionLevel Optimal

    Write-Host ('Built releases\DraftALore.exe ({0:N0} bytes)' -f (Get-Item -LiteralPath $outputPath).Length)
    Write-Host ('Built releases\DraftALore-Windows.zip ({0:N0} bytes)' -f (Get-Item -LiteralPath $zipPath).Length)
}
finally {
    if (Test-Path -LiteralPath $temporaryDir) {
        Remove-Item -LiteralPath $temporaryDir -Recurse -Force
    }
}
