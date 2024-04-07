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
    [DllImport("user32.dll", SetLastError = true)]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);

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
            
            # Check if the target path is not null or empty and points to an executable
            if (![string]::IsNullOrWhiteSpace($lnk.TargetPath) -and $lnk.TargetPath -like '*.exe') {
                # Attempt to retrieve the LastAccessTime of the executable file
                $exeFile = Get-Item $lnk.TargetPath -ErrorAction SilentlyContinue
                $lastAccessTime = $null
                if ($null -ne $exeFile) {
                    $lastAccessTime = $exeFile.LastAccessTime
                }

                $apps += [PSCustomObject]@{
                    Title = $shortcut.BaseName
                    Path  = $lnk.TargetPath
                    Type  = "Desktop"
                    LastAccessTime = $lastAccessTime
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

        if ($applications -is [array]) {
            $preferredApp = $applications | Where-Object { $_.Id.StartsWith("App") } | Select-Object -First 1
            if (-not $preferredApp) {
                $preferredApp = $applications[0]
            }
        } else {
            $preferredApp = $applications
        }

        if (-not $preferredApp) {
            return
        }

        $appId = $preferredApp.Id
        $launchPath = "shell:appsFolder\{0}!{1}" -f $package.PackageFamilyName, $appId

        # Attempt to get a readable title, default to PackageFamilyName if ms-resource is encountered
        $displayName = (Get-AppxPackageManifest -Package $package.PackageFullName).Package.Properties.DisplayName
        if ($displayName.StartsWith("ms-resource:")) {
            $displayName = $package.PackageFamilyName
        }

        # Loop through all .exe files in the package folder
        $exeFiles = Get-ChildItem -Path $package.InstallLocation -Filter "*.exe" -Recurse -ErrorAction SilentlyContinue
        $mostRecentExe = $exeFiles | Sort-Object LastAccessTime -Descending | Select-Object -First 1

        # Use the most recent LastAccessTime among the .exe files
        $lastAccessTime = $null
        if ($null -ne $mostRecentExe) {
            $lastAccessTime = $mostRecentExe.LastAccessTime
        }

        [PSCustomObject]@{
            Path  = $launchPath
            Title = $displayName
            Type  = "UWP"
            LastAccessTime = $lastAccessTime
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

    $allApps = $allApps | Sort-Object LastAccessTime -Descending

    return $allApps | ConvertTo-Json -Depth 10
}

function Get-ActiveWindowHandles {
    param(
        [switch]$Detailed
    )

    $rootElement = [System.Windows.Automation.AutomationElement]::RootElement
    $condition = [System.Windows.Automation.Condition]::TrueCondition
    $windows = $rootElement.FindAll([System.Windows.Automation.TreeScope]::Children, $condition)

    $windowDetails = @()

    foreach ($window in $windows) {
        if ($window.Current.IsOffscreen -eq $false -and $window.Current.IsEnabled -eq $true) {
            $handle = $window.Current.NativeWindowHandle
            $windowHandle = [IntPtr]$handle
            $processId = $null
            $null = [User32]::GetWindowThreadProcessId($windowHandle, [ref]$processId)
            
            $process = Get-Process -Id $processId -ErrorAction SilentlyContinue

            if ($Detailed) {
                $title = $window.Current.Name
                $windowDetails += [PSCustomObject]@{
                    Handle = $handle
                    Title = $title
                    # ExePath = $process.Path
                }
            } else {
                $windowDetails += $handle
            }
        }
    }

    return $windowDetails
}

function Start-Application {
    param (
        [string]$AppName,
        [string]$LaunchPath
    )

    # Launch the application
    Start-Process -FilePath $LaunchPath
    Start-Sleep -Seconds 5  # Adjust as needed
}

function Get-ActiveWindows {
    $afterWindows = Get-ActiveWindowHandles -Detailed
    $afterWindows | ConvertTo-Json -Depth 10
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

    $result = Invoke-UIElementTapByCoordinates -WindowHandle $WindowHandle -XPath $XPath
    return $result

    $element = Get-AutomationElementFromXPath -WindowHandle $WindowHandlePtr -XPath $XPath
    # $element = Get-ClosestTappableElement -Element $element

    if ($null -eq $element) {
        Write-Error "Unable to find an element matching the XPath."
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

    # Write-Host "Element does not support Tap."
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

    # $element.SetFocus() | Out-Null

    Invoke-UIElementTapByCoordinates -WindowHandle $WindowHandle -XPath $XPath | Out-Null

    if ($Mode -eq 'overwrite') {
        [System.Windows.Forms.SendKeys]::SendWait("^{HOME}") | Out-Null
        [System.Windows.Forms.SendKeys]::SendWait("^+{END}") | Out-Null
    } elseif ($Mode -eq 'append') {
        [System.Windows.Forms.SendKeys]::SendWait("{END}") | Out-Null
    }

    # Pre-process text to escape special characters that SendKeys interprets differently
    $processedText = $Text -replace '([+^%~(){}])', '{$1}'
    [System.Windows.Forms.SendKeys]::SendWait($processedText) | Out-Null

    # Confirm the text input by sending an Enter key
    [System.Windows.Forms.SendKeys]::SendWait("{ENTER}") | Out-Null

    return $true

    # $element = Get-AutomationElementFromXPath -WindowHandle $WindowHandle -XPath $XPath
    # if ($null -eq $element) {
    #     Write-Error "Unable to find element."
    #     return $false
    # }

    # $element = Get-ClosestEditableElement -Element $element
    # if ($null -eq $element) {
    #     Write-Error "Unable to find an editable element."
    #     return $false
    # }

    $valuePattern = $null

    try {
        $pattern = [System.Windows.Automation.ValuePatternIdentifiers]::Pattern
        $valuePattern = $element.GetCurrentPattern($pattern)

        if ($valuePattern -and !$valuePattern.Current.IsReadOnly) {
            $valuePatternInterface = [System.Windows.Automation.ValuePattern]$valuePattern
            if ($Mode -eq 'overwrite') {
                $valuePatternInterface.SetValue($Text)
            } elseif ($Mode -eq 'append') {
                $currentValue = $valuePatternInterface.Current.Value
                $newValue = $currentValue + $Text
                $valuePatternInterface.SetValue($newValue)
            }
            return $true
        } else {
            throw "Fallback to SendKeys."
        }
    } catch {
        # Fallback to SendKeys if ValuePattern is not supported or any error occurs
        $element.SetFocus() | Out-Null

        Invoke-UIElementTapByCoordinates -WindowHandle $WindowHandle -XPath $XPath | Out-Null

        if ($Mode -eq 'overwrite') {
            [System.Windows.Forms.SendKeys]::SendWait("^{HOME}") | Out-Null
            [System.Windows.Forms.SendKeys]::SendWait("^+{END}") | Out-Null
        } elseif ($Mode -eq 'append') {
            [System.Windows.Forms.SendKeys]::SendWait("{END}") | Out-Null
        }
        return $true
    }

    return $false
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
        $centerX = [int]($rect.X + $rect.Width / 2)
        $centerY = [int]($rect.Y + $rect.Height / 2)

        [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point($centerX, $centerY)

        # Mouse down and up to simulate a click
        $MOUSEEVENTF_LEFTDOWN = 0x02
        $MOUSEEVENTF_LEFTUP = 0x04
        [User32]::mouse_event($MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0) | Out-Null
        [User32]::mouse_event($MOUSEEVENTF_LEFTUP, 0, 0, 0, 0) | Out-Null
        Start-Sleep -Milliseconds 1000 # Short pause between down and up for better reliability

        # [User32]::mouse_event($MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0) | Out-Null
        # [User32]::mouse_event($MOUSEEVENTF_LEFTUP, 0, 0, 0, 0) | Out-Null
        
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