# Script to push changes to GitHub

# Navigate to the repository directory
cd C:\Users\anwar\Documents\augment-projects\cre

# Make sure we're on the master branch
git checkout master

# Apply the patch file for the ToastContext.tsx changes
git apply app\0001-Add-direct-edit-functionality-with-localStorage-pers.patch

# Create the direct-edit directory (if it doesn't exist) and add the page.tsx file
if (-not (Test-Path -Path "app\deals\[id]\direct-edit")) {
    New-Item -Path "app\deals\[id]\direct-edit" -ItemType Directory -Force
}
Copy-Item -Path "app\direct-edit-page.tsx.txt" -Destination "app\deals\[id]\direct-edit\page.tsx" -Force

# Add the files to git
git add app\contexts\ToastContext.tsx app\deals\[id]\direct-edit\page.tsx

# Commit the changes
git commit -m "Add direct edit functionality with localStorage persistence"

# Push the changes to GitHub
git push origin master

Write-Host "Changes pushed to GitHub successfully!"
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
