# Load the UIAutomationClient assembly
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class User32 {
    [DllImport("user32.dll")]
    public static extern IntPtr SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool IsWindow(IntPtr hWnd);

    public const int SW_RESTORE = 9;

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern int GetWindowTextLength(IntPtr hWnd);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll", EntryPoint="SetCursorPos")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool SetCursorPos(int x, int y);

    [DllImport("user32.dll", EntryPoint="mouse_event")]
    public static extern void mouse_event(int dwFlags, int dx, int dy, int dwData, int dwExtraInfo);

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, string lParam);

    public const uint WM_SETTEXT = 0x000C;
}
"@ 

function Get-StartMenuApps {
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
    $desktopApps = Get-StartMenuApps

    # Retrieve UWP applications
    $uwpApps = Get-UWPApps

    # Concatenate both lists
    $allApps = $desktopApps + $uwpApps

    return $allApps | ConvertTo-Json -Depth 10
}

function Get-UWPAppWindowHandle {
    param (
        [string]$AppName,
        [int]$TimeoutSeconds = 30
    )

    $rootElement = [System.Windows.Automation.AutomationElement]::RootElement
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $window = $null

    # Split the app name into parts for more flexible matching
    $appNameParts = $AppName -split ' '

    do {
        $condition = [System.Windows.Automation.Condition]::TrueCondition
        $windows = $rootElement.FindAll([System.Windows.Automation.TreeScope]::Children, $condition)

        foreach ($win in $windows) {
            $winName = $win.Current.Name
            $matches = $appNameParts | Where-Object { $winName -match $_ -and $_ -ne '' } | Measure-Object

            # If any part matches (case-insensitive), select the window
            if ($matches.Count -gt 0 -and [User32]::IsWindow($win.Current.NativeWindowHandle)) {
                $window = $win
                break
            }
        }

        if ($null -ne $window) {
            break
        }

        Start-Sleep -Milliseconds 500
    }
    while ($stopwatch.Elapsed.TotalSeconds -lt $TimeoutSeconds)

    $stopwatch.Stop()

    if ($null -eq $window) {
        Write-Warning "Window for UWP app '$AppName' not found within timeout."
        return $null
    }

    # Ensure that a valid window handle was obtained
    if ($window.Current.NativeWindowHandle -eq 0) {
        Write-Warning "Failed to get a valid window handle for '$AppName'."
        return $null
    }

    return $window.Current.NativeWindowHandle
}

function Get-ActiveWindowHandles {
    $rootElement = [System.Windows.Automation.AutomationElement]::RootElement
    $condition = [System.Windows.Automation.Condition]::TrueCondition
    $windows = $rootElement.FindAll([System.Windows.Automation.TreeScope]::Children, $condition)

    $windowHandles = @()

    foreach ($window in $windows) {
        if ($window.Current.IsOffscreen -eq $false -and $window.Current.IsEnabled -eq $true) {
            $windowHandles += $window.Current.NativeWindowHandle
        }
    }

    return $windowHandles
}

function Start-ApplicationAndCaptureHandle {
    param (
        [string]$AppName,
        [string]$LaunchPath
    )

    $AppNameParts = $AppName -split ' '
    
    $beforeHandles = Get-ActiveWindowHandles

    # # Define a list to hold the window handles before launching the application
    # $beforeHandles = New-Object System.Collections.Generic.List[IntPtr]

    # # Callback method to process each window before launching the application
    # $beforeCallback = {
    #     param([IntPtr]$hWnd, [IntPtr]$lParam)

    #     $beforeHandles.Add($hWnd)
    #     # Continue enumeration
    #     return $true
    # }

    # # Cast the script block to the delegate type
    # $beforeEnumWindowsProc = $beforeCallback -as [User32+EnumWindowsProc]

    # # Enumerate all top-level windows before launching the application
    # [User32]::EnumWindows($beforeEnumWindowsProc, [IntPtr]::Zero) | Out-Null

    # Launch the application
    Start-Process -FilePath $LaunchPath
    Start-Sleep -Seconds 10  # Adjust as needed

    # # Define a list to hold the window handles after launching the application
    # $afterHandles = New-Object System.Collections.Generic.List[IntPtr]

    # # Callback method to process each window after launching the application
    # $afterCallback = {
    #     param([IntPtr]$hWnd, [IntPtr]$lParam)

    #     $afterHandles.Add($hWnd)
    #     # Continue enumeration
    #     return $true
    # }

    # # Cast the script block to the delegate type
    # $afterEnumWindowsProc = $afterCallback -as [User32+EnumWindowsProc]

    # # Enumerate all top-level windows after launching the application
    # [User32]::EnumWindows($afterEnumWindowsProc, [IntPtr]::Zero) | Out-Null

    $afterHandles = Get-ActiveWindowHandles

    # Find the difference in window handles
    $newHandles = $afterHandles | Where-Object { $beforeHandles -notcontains $_ }

    if ($newHandles.Count -gt 1) {
        Write-Warning "Multiple new windows found after launching the application."
    }

    $newHandles[0]
}

function Get-ScreenshotOfAppWindowAsBase64 {
    param (
        [Parameter(Mandatory=$true)]
        [Int]$WindowHandle
    )

    $WindowHandlePtr = [IntPtr]$WindowHandle
    # Attempt to restore and bring the window to the foreground
    # [User32]::ShowWindow($WindowHandle, [User32]::SW_RESTORE) | Out-Null
    [User32]::SetForegroundWindow($WindowHandlePtr) | Out-Null

    Start-Sleep -Milliseconds 500

    # Check if our window is now the foreground window
    $foregroundWindow = [User32]::GetForegroundWindow()
    if ($foregroundWindow -ne $WindowHandlePtr) {
        Write-Warning "Failed to set the application window to the foreground."
        return
    }

    # Send Alt + PrtSc to capture the active window
    # [System.Windows.Forms.SendKeys]::SendWait("%{PRTSC}") | Out-Null
    # [System.Windows.Forms.SendKeys]::SendWait("{PRTSC}") | Out-Null
    [System.Windows.Forms.SendKeys]::SendWait("^{PRTSC}") | Out-Null

    Start-Sleep -Milliseconds 100

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

    $img = Get-ClipboardImage -retryCount 15 -delayMilliseconds 100
    if ($null -eq $img) {
        Write-Error "Failed to capture the screenshot from the clipboard."
        return
    }

    $memoryStream = New-Object System.IO.MemoryStream
    $img.Save($memoryStream, [System.Drawing.Imaging.ImageFormat]::Png)
    $base64String = [Convert]::ToBase64String($memoryStream.ToArray())

    $img.Dispose()
    $memoryStream.Dispose()

    return $base64String
}

function Get-RootAutomationElementFromHandle {
    param (
        [Parameter(Mandatory = $true)]
        [Int]$WindowHandle
    )

    $WindowHandlePtr = [IntPtr]$WindowHandle
    $automationElement = [System.Windows.Automation.AutomationElement]::FromHandle($WindowHandlePtr)
   
    return $automationElement
}

function Get-UIWindowSnapshot {
    param (
        [Parameter(Mandatory = $true)]
        [System.Windows.Automation.AutomationElement]$RootElement
    )

    # Create an XML document and the root XML element
    $xmlDoc = New-Object System.Xml.XmlDocument
    $rootXml = $xmlDoc.CreateElement("UIDOM")
    $xmlDoc.AppendChild($rootXml) | Out-Null

    # Function to recursively add UI elements to the XML document
    $addUIElementToXml = {
        param($element, $parentXml)

        # Create XML element for current UI element
        $elementXml = $xmlDoc.CreateElement($element.Current.ControlType.ProgrammaticName -replace 'ControlType.', '')
        $elementXml.SetAttribute("Name", $element.Current.Name)
        $elementXml.SetAttribute("IsEnabled", $element.Current.IsEnabled)
        $elementXml.SetAttribute("IsOffscreen", $element.Current.IsOffscreen)
        $elementXml.SetAttribute("Location", $element.Current.BoundingRectangle.Location.ToString())
        $elementXml.SetAttribute("Size", $element.Current.BoundingRectangle.Size.ToString())
        $helpText = $element.GetCurrentPropertyValue([System.Windows.Automation.AutomationElement]::HelpTextProperty)
        if ($null -ne $helpText -and $helpText -ne '') {
            $elementXml.SetAttribute("Tooltip", $helpText)
        }

        # Determine if the element is editable
        $isEditable = $false
        $valuePattern = [ref] $null
        if ($element.TryGetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern, $valuePattern)) {
            $isEditable = $true
        }
        elseif ($element.Current.IsKeyboardFocusable) {
            $isEditable = $true
        }
        $elementXml.SetAttribute("IsEditable", $isEditable)

        # Determine if the element is tappable (supports InvokePattern)
        $isTappable = $false
        $invokePattern = [ref] $null
        if ($element.TryGetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern, $invokePattern)) {
            $isTappable = $true
        }
        $elementXml.SetAttribute("IsTappable", $isTappable)
 
        # Check for TextPattern and add text content if available
        $textPattern = [ref] $null
        if ($element.TryGetCurrentPattern([System.Windows.Automation.TextPattern]::Pattern, $textPattern)) {
            $text = $textPattern.Value.DocumentRange.GetText(-1)
            $elementXml.SetAttribute("Text", $text)
        }

        [void]$parentXml.AppendChild($elementXml)

        $child = [System.Windows.Automation.TreeWalker]::ContentViewWalker.GetFirstChild($element)
        while ($null -ne $child) {
            & $addUIElementToXml $child $elementXml
            $child = [System.Windows.Automation.TreeWalker]::ContentViewWalker.GetNextSibling($child)
        }
    }

    # Start recursive UI element addition from the root
    & $addUIElementToXml $RootElement $rootXml

    # Return the XML document as a string
    return $xmlDoc.OuterXml
}

function Get-WindowUITree {
    param (
        [Parameter(Mandatory = $true)]
        [Int]$WindowHandle
    )

    $WindowHandlePtr = [IntPtr]$WindowHandle
    $rootAutomationElement = Get-RootAutomationElementFromHandle -WindowHandle $WindowHandlePtr
    return Get-UIWindowSnapshot -RootElement $rootAutomationElement
}

function Get-AutomationElementFromXPath {
    param(
        [Parameter(Mandatory=$true)]
        [Int]$WindowHandle,

        [Parameter(Mandatory=$true)]
        [string]$XPath
    )

    $WindowHandlePtr = [IntPtr]$WindowHandle

    # Simplified function to parse the XPath using string split
    function Get-ParsedXPath($XPath) {
        # Splitting the XPath into parts by '[' to separate the ControlType and Name parts
        $parts = $XPath.Split('[', 2)
        if ($parts.Count -ne 2) {
            Write-Error "Invalid XPath format"
            return $null
        }

        # Keeping the ControlType part intact, removing just the leading '//'
        $controlTypePart = $parts[0] -replace '^//', ''

        # Adjusting the approach to extract the Name part cleanly
        # First, removing the trailing ']' from the second part
        $namePartWithExtra = $parts[1].TrimEnd(']')
        # Then, extracting the name value correctly by removing the prefix '@Name="' and the closing quote '"'
        $namePart = $namePartWithExtra -replace '@Name=', '' -replace "'", ""

        if (-not $controlTypePart -or -not $namePart) {
            Write-Error "Invalid XPath format"
            return $null
        }

        return @{ ControlTypeName = $controlTypePart; Name = $namePart }
    }

    function Get-ControlType($controlTypeName) {
        try {
            $field = [System.Windows.Automation.ControlType].GetField($controlTypeName, [System.Reflection.BindingFlags]::Static -bor [System.Reflection.BindingFlags]::Public)
            return $field.GetValue($null)
        } catch {
            Write-Error "Invalid ControlType name: $controlTypeName"
            return $null
        }
    }

    $parsedXPath = Get-ParsedXPath $XPath
    if ($null -eq $parsedXPath) { return $null }

    $controlType = Get-ControlType $parsedXPath.ControlTypeName
    if ($null -eq $controlType) { return $null }

    $rootElement = [System.Windows.Automation.AutomationElement]::FromHandle($WindowHandlePtr)
    $nameCondition = [System.Windows.Automation.PropertyCondition]::new([System.Windows.Automation.AutomationElement]::NameProperty, $parsedXPath.Name)
    $controlTypeCondition = [System.Windows.Automation.PropertyCondition]::new([System.Windows.Automation.AutomationElement]::ControlTypeProperty, $controlType)
    $andCondition = [System.Windows.Automation.AndCondition]::new($controlTypeCondition, $nameCondition)

    $foundElement = $rootElement.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $andCondition)
    if ($null -eq $foundElement) {
        Write-Error "Element not found for the given XPath. $XPath"
        return $null
    }

    return $foundElement
}

function Get-ClosestEditableElement {
    param (
        [Parameter(Mandatory = $true)]
        [System.Windows.Automation.AutomationElement]$Element
    )

    # Check if the element itself is keyboard focusable
    if ($Element.Current.IsKeyboardFocusable) {
        return $Element
    }

    # Search among descendants for a keyboard focusable element
    $childWalker = [System.Windows.Automation.TreeWalker]::ContentViewWalker
    $descendant = $childWalker.GetFirstChild($Element)

    while ($null -ne $descendant) {
        if ($descendant.Current.IsKeyboardFocusable) {
            return $descendant
        }
        $descendant = $childWalker.GetNextSibling($descendant)
    }

    # If no focusable descendant is found, search among ancestors
    $treeWalker = [System.Windows.Automation.TreeWalker]::RawViewWalker
    $ancestor = $treeWalker.GetParent($Element)

    while ($null -ne $ancestor) {
        if ($ancestor.Current.IsKeyboardFocusable) {
            return $ancestor
        }
        $ancestor = $treeWalker.GetParent($ancestor)
    }

    # If no suitable element is found, return $null
    return $null
}

function Get-ClosestTappableElement {
    param (
        [Parameter(Mandatory = $true)]
        [System.Windows.Automation.AutomationElement]$Element
    )

    $invokePattern = [System.Windows.Automation.InvokePattern]::Pattern

    if ($Element.GetCurrentPattern($invokePattern)) {
        return $Element
    }

    $childWalker = [System.Windows.Automation.TreeWalker]::ContentViewWalker
    $descendant = $childWalker.GetFirstChild($Element)

    while ($null -ne $descendant) {
        if ($descendant.GetCurrentPattern($invokePattern)) {
            return $descendant
        }
        $descendant = $childWalker.GetNextSibling($descendant)
    }

    $treeWalker = [System.Windows.Automation.TreeWalker]::RawViewWalker
    $ancestor = $treeWalker.GetParent($Element)

    while ($null -ne $ancestor) {
        if ($ancestor.GetCurrentPattern($invokePattern)) {
            return $ancestor
        }
        $ancestor = $treeWalker.GetParent($ancestor)
    }

    return $null
}

function Invoke-ExpandComboBox {
    param (
        [Parameter(Mandatory = $true)]
        [System.Windows.Automation.AutomationElement]$ComboBoxElement
    )

    $expandCollapsePattern = $null
    if ($ComboBoxElement.TryGetCurrentPattern([System.Windows.Automation.ExpandCollapsePattern]::Pattern, [ref]$expandCollapsePattern)) {
        $expandCollapsePattern.Expand()
        Write-Output "Combo box expanded."
    } else {
        Write-Error "Combo box does not support ExpandCollapsePattern."
    }
}

function Invoke-UIElementTap {
    param (
        [Parameter(Mandatory=$true)]
        [Int]$WindowHandle,

        [Parameter(Mandatory=$true)]
        [string]$XPath
    )

    $WindowHandlePtr = [IntPtr]$WindowHandle
    $element = Get-AutomationElementFromXPath -WindowHandle $WindowHandlePtr -XPath $XPath
    # $element = Get-ClosestTappableElement -Element $element

    if ($null -eq $element) {
        Write-Error "Unable to find a tappable element."
        return $false
    }

    try {
        $expandCollapsePattern = $null
        if ($element.TryGetCurrentPattern([System.Windows.Automation.ExpandCollapsePattern]::Pattern, [ref]$expandCollapsePattern)) {
            $expandCollapsePattern.Expand()
            return $true
        }
    }
    catch {
    }

    try {
        $invokePattern = $null
        if ($element.TryGetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern, [ref]$invokePattern)) {
            $invokePattern.Invoke() | Out-Null
            return $true
        }
    }
    catch {
    }

    Invoke-UIElementTapByCoordinates -WindowHandle $WindowHandle -XPath $XPath
    
    # try {
    #     $togglePattern = $null
    #     if ($element.TryGetCurrentPattern([System.Windows.Automation.TogglePattern]::Pattern, [ref]$togglePattern)) {
    #         $togglePattern.Toggle() | Out-Null
    #         return $true
    #     }
    # }
    # catch {
    # }

    Write-Host "Element does not support Tap."
    return $false
}


function Set-UIElementText {
    param (
        [Parameter(Mandatory = $true)]
        [Int]$WindowHandle,

        [Parameter(Mandatory = $true)]
        [string]$XPath,

        [Parameter(Mandatory = $true)]
        [string]$Text,

        [Parameter(Mandatory = $true)]
        [ValidateSet('overwrite', 'append')]
        [string]$Mode
    )

    $element = Get-AutomationElementFromXPath -WindowHandle $WindowHandle -XPath $XPath
    if ($null -eq $element) {
        Write-Error "Unable to find element."
        return $false
    }

    $element = Get-ClosestEditableElement -Element $element
    if ($null -eq $element) {
        Write-Error "Unable to find an editable element."
        return $false
    }

    $element.SetFocus() | Out-Null
    if ($Mode -eq 'overwrite') {
        [System.Windows.Forms.SendKeys]::SendWait("^{HOME}") | Out-Null
        [System.Windows.Forms.SendKeys]::SendWait("^+{END}") | Out-Null
        [System.Windows.Forms.SendKeys]::SendWait("{DEL}") | Out-Null
    } elseif ($Mode -eq 'append') {
        [System.Windows.Forms.SendKeys]::SendWait("{END}") | Out-Null
    }
    [System.Windows.Forms.SendKeys]::SendWait($Text) | Out-Null

    return $true
}

function Invoke-UIElementTapByCoordinates {
    param (
        [Parameter(Mandatory=$true)]
        [Int]$WindowHandle,

        [Parameter(Mandatory=$true)]
        [string]$XPath
    )

    try {
        $element = Get-AutomationElementFromXPath -WindowHandle $WindowHandle -XPath $XPath
        if ($null -eq $element) {
            Write-Error "Unable to find element."
            return $false
        }

        $rect = $element.Current.BoundingRectangle
        $centerX = [int]($rect.X)
        $centerY = [int]($rect.Y)

        [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point($centerX, $centerY)

        # Mouse down and up to simulate a click
        $MOUSEEVENTF_LEFTDOWN = 0x02
        $MOUSEEVENTF_LEFTUP = 0x04
        [User32]::mouse_event($MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0) | Out-Null
        [User32]::mouse_event($MOUSEEVENTF_LEFTUP, 0, 0, 0, 0) | Out-Null
        Start-Sleep -Milliseconds 500 # Short pause between down and up for better reliability

        [User32]::mouse_event($MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0) | Out-Null
        [User32]::mouse_event($MOUSEEVENTF_LEFTUP, 0, 0, 0, 0) | Out-Null
        
        # Write-Host "Tap invoked at $centerX, $centerY."
        return $true
    }
    catch {
        return $false;
    }
}

function Set-UIElementTextByCoordinates {
    param (
        [Parameter(Mandatory=$true)]
        [Int]$WindowHandle,
        [Parameter(Mandatory=$true)]
        [string]$XPath,
        [Parameter(Mandatory=$true)]
        [string]$Text
    )

    # First, use Invoke-UIElementTapByCoordinates to focus the element
    $tapResult = Invoke-UIElementTapByCoordinates -WindowHandle $WindowHandle -XPath $XPath
    if (-not $tapResult) {
        Write-Error "Failed to tap the element."
        return $false
    }

    # Wait a bit after tapping to ensure the element is focused
    Start-Sleep -Milliseconds 100

    # Then, send the text to the now-focused element
    # Pre-process text to escape special characters that SendKeys interprets differently
    $processedText = $Text -replace '([+^%~(){}])', '{$1}'
    
    [System.Windows.Forms.SendKeys]::SendWait($processedText) | Out-Null

    Write-Host "Text '$Text' has been set to the element identified by XPath: $XPath."
    return $true
}