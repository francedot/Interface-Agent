# Load the UIAutomationClient assembly
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName System.Windows.Forms

function Get-AllInstalledApplications {
    # Get traditional desktop applications
    $registryPaths = @(
        "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*",
        "HKLM:\Software\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*",
        "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*"
    )

    $desktopApps = foreach ($path in $registryPaths) {
        Get-ItemProperty $path |
        Where-Object { $_.DisplayName } |
        Select-Object DisplayName, Publisher, InstallDate, DisplayVersion, UninstallString
    }

    # Get UWP (Universal Windows Platform) apps
    $uwpApps = Get-AppxPackage |
    Select-Object Name, PackageFullName, InstallLocation, @{Name = "Publisher"; Expression = { $_.PublisherId } }

    # Combine both lists
    $allApps = @($desktopApps) + @($uwpApps) |
    Sort-Object DisplayName

    # Convert to JSON
    $allApps | ConvertTo-Json -Depth 10
}

function Get-StartMenuApplications {
    $apps = @()
    $startMenuPaths = @(
        [Environment]::GetFolderPath("CommonStartMenu"),
        [Environment]::GetFolderPath("StartMenu")
    )

    foreach ($path in $startMenuPaths) {
        $shortcuts = Get-ChildItem "$path\Programs\*.lnk" -Recurse
        foreach ($shortcut in $shortcuts) {
            $shell = New-Object -ComObject WScript.Shell
            $lnk = $shell.CreateShortcut($shortcut.FullName)
            
            # Check if the target path is not null or empty
            if (![string]::IsNullOrWhiteSpace($lnk.TargetPath)) {
                $apps += [PSCustomObject]@{
                    Title = $shortcut.BaseName
                    Path  = $lnk.TargetPath
                    Type  = "Desktop"
                }
            }
        }
    }

    return $apps
}

function Get-UWPApps {
    $uwpApps = Get-AppxPackage | Where-Object { $_.SignatureKind -eq "Store" } | ForEach-Object {
        $package = $_
        $applications = (Get-AppxPackageManifest -Package $package.PackageFullName).Package.Applications.Application

        $preferredApp = $null

        # Check if multiple applications are present and filter for appId starting with 'App'
        if ($applications -is [array]) {
            $preferredApp = $applications | Where-Object { $_.Id.StartsWith("App") } | Select-Object -First 1
            if (-not $preferredApp) {
                $preferredApp = $applications[0] # Fallback to the first app if no 'App' prefix match
            }
        }
        else {
            $preferredApp = $applications
        }

        if (-not $preferredApp) {
            return
        }

        $appId = $preferredApp.Id
        $launchPath = "shell:appsFolder\{0}!{1}" -f $package.PackageFamilyName, $appId

        # Returning object with details for the selected application
        [PSCustomObject]@{
            Path  = $launchPath
            Title = (Get-AppxPackageManifest -Package $package.PackageFullName).Package.Properties.DisplayName
            Type  = "UWP"
        }
    } | Where-Object { $_ -ne $null }

    return $uwpApps
}

function Get-AllInstalledApps {
    # Retrieve desktop applications
    $desktopApps = Get-StartMenuApplications

    # Retrieve UWP applications
    $uwpApps = Get-UWPApps

    # Concatenate both lists
    $allApps = $desktopApps + $uwpApps

    return $allApps | ConvertTo-Json -Depth 10
}

function Start-Application {
    param (
        [string]$LaunchPath,
        [string]$AppName
    )

    # Start-Process "C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE"

    # Launch the application without waiting
    # [System.Diagnostics.Process]::Start($Path)

    # Replace %20 with actual spaces in the LaunchPath
    $LaunchPath = $LaunchPath -replace '%20', ' '

    try {
        Start-Process $LaunchPath
    }
    catch {
        Write-Error "Failed to start the application: $AppName with $LaunchPath"
        <#Do this if a terminating exception happens#>
    }


    # Give some time for the application to start
    Start-Sleep -Seconds 8

    # Retrieve all processes with the given AppName (you might need to adjust the matching condition)
    $processes = Get-Process | Where-Object { $_.MainWindowTitle -like "*$AppName*" -and $_.MainWindowHandle -ne 0 }

    if ($processes.Count -eq 0) {
        Write-Host "No matching processes found."
        return $null
    }

    # If multiple processes are found, you might need to determine which one is the correct one
    # For simplicity, let's assume the first one is the correct one
    $targetProcess = $processes[0]

    $windowHandle = $targetProcess.MainWindowHandle

    return $windowHandle
}

function Get-ScreenshotOfAppWindowAsBase64 {
    param (
        [Parameter(Mandatory=$true)]
        [IntPtr]$WindowHandle
    )

    Add-Type @"
    using System;
    using System.Runtime.InteropServices;
    public class User32 {
        [DllImport("user32.dll", SetLastError=true)]
        public static extern bool SetForegroundWindow(IntPtr hWnd);
    }
"@ 

    # Activate the window by its handle to ensure it's focused
    $null = [User32]::SetForegroundWindow($WindowHandle)

    # Give the window some time to focus
    Start-Sleep -Milliseconds 100

    # Send Alt + PrtSc to capture the active window
    [System.Windows.Forms.SendKeys]::SendWait("%{PRTSC}")

    # Function to attempt to get the image from the clipboard
    function Get-ClipboardImage {
        [OutputType([System.Drawing.Image])]
        param (
            [int]$retryCount = 5,
            [int]$delayMilliseconds = 100
        )

        $img = $null
        for ($i = 0; $i -lt $retryCount; $i++) {
            try {
                Start-Sleep -Milliseconds $delayMilliseconds
                $img = [System.Windows.Forms.Clipboard]::GetImage()
                if ($null -ne $img) {
                    break
                }
            } catch {
                Write-Verbose "Attempt $i to access the clipboard failed. Retrying..."
            }
        }

        return $img
    }

    # Attempt to get the screenshot from the clipboard with retries
    $img = Get-ClipboardImage -retryCount 5 -delayMilliseconds 100

    if ($null -eq $img) {
        Write-Error "Failed to capture the screenshot from the clipboard."
        return
    }

    # Convert the image to base64
    $memoryStream = New-Object System.IO.MemoryStream
    $img.Save($memoryStream, [System.Drawing.Imaging.ImageFormat]::Png)
    $base64String = [Convert]::ToBase64String($memoryStream.ToArray())

    # Cleanup
    $img.Dispose()
    $memoryStream.Dispose()

    return $base64String
}

function Get-RootAutomationElementFromHandle {
    param (
        [Parameter(Mandatory = $true)]
        [IntPtr]$WindowHandle
    )

    # Convert the handle to an AutomationElement
    $automationElement = [System.Windows.Automation.AutomationElement]::FromHandle($WindowHandle)

    return $automationElement
}

function Get-UIElementSnapshotIterative {
    param (
        [Parameter(Mandatory = $true)]
        [System.Windows.Automation.AutomationElement]$RootElement
    )

    $queue = [System.Collections.Generic.Queue[System.Object]]::new()
    $queue.Enqueue(@($RootElement, $null))  # Enqueue root element with no parent

    $elementsIndex = @{}  # Initialize hashtable to index elements by Name

    while ($queue.Count -gt 0) {
        $current = $queue.Dequeue()
        $currentElement = $current[0]

        $elementInfo = New-Object PSObject -Property @{
            Name         = $currentElement.Current.Name
            ControlType  = $currentElement.Current.ControlType.ProgrammaticName
            AutomationId = $currentElement.Current.AutomationId
            ClassName    = $currentElement.Current.ClassName
            Children     = New-Object System.Collections.ArrayList
        }

        # This is the root element, add it directly by its name to the hashtable
        $elementsIndex[$currentElement.Current.Name] = $currentElement

        # Use ContentViewWalker to get child elements
        $child = [System.Windows.Automation.TreeWalker]::ContentViewWalker.GetFirstChild($currentElement)
        
        while ($null -ne $child) {
            # Instead of adding the child info directly, enqueue the child element with its parent info
            $queue.Enqueue(@($child, $elementInfo))
            $child = [System.Windows.Automation.TreeWalker]::ContentViewWalker.GetNextSibling($child)
        }
    }

    return $elementsIndex
}

function Get-ActiveWindowHandles {
    $rootElement = [System.Windows.Automation.AutomationElement]::RootElement
    $condition = [System.Windows.Automation.Condition]::TrueCondition
    $windows = $rootElement.FindAll([System.Windows.Automation.TreeScope]::Children, $condition)

    $windowHandles = @()

    foreach ($window in $windows) {
        if ($window.Current.IsOffscreen -eq $false -and $window.Current.IsEnabled -eq $true) {
            $handle = $window.Current.NativeWindowHandle
            $handleHex = "0x{0:X}" -f $handle
            $windowInfo = New-Object PSObject -Property @{
                Handle    = $handleHex
                Name      = $window.Current.Name
                ProcessId = $window.Current.ProcessId
            }
            $windowHandles += $windowInfo
        }
    }

    return $windowHandles
}

function Invoke-UIElement {
    param (
        [Parameter(Mandatory = $true)]
        [System.Windows.Automation.AutomationElement]$Element
    )

    $invokePattern = $null

    if ($Element.TryGetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern, [ref]$invokePattern)) {
        $invokePattern.Invoke()
    }
    else {
        Write-Host "Element does not support the InvokePattern."
    }
}

function Set-UIElementText {
    param (
        [Parameter(Mandatory = $true)]
        [System.Windows.Automation.AutomationElement]$Element,
        [Parameter(Mandatory = $true)]
        [string]$Text
    )

    $valuePattern = $null

    if ($Element.TryGetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern, [ref]$valuePattern)) {
        $valuePattern.SetValue($Text)
    }
    else {
        Write-Host "Element does not support the ValuePattern."
    }
}

function Invoke-UIElementByClassName {
    param (
        [Parameter(Mandatory = $true)]
        [System.Windows.Automation.AutomationElement]$Root,
        [Parameter(Mandatory = $true)]
        [string]$ClassName
    )

    # Find the element by class name
    $condition = [System.Windows.Automation.PropertyCondition]::new([System.Windows.Automation.AutomationElement]::ClassNameProperty, $ClassName)
    $element = $Root.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $condition)

    if ($null -eq $element) {
        Write-Host "Element with class name '$ClassName' not found."
        return
    }

    # Check if the element supports the InvokePattern and invoke it
    $invokePattern = $null

    if ($element.TryGetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern, [ref]$invokePattern)) {
        $invokePattern.Invoke()
        Write-Host "Element with class name '$ClassName' invoked."
    }
    else {
        Write-Host "Element with class name '$ClassName' does not support the InvokePattern."
    }
}
