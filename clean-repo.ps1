# Clean repository script
Write-Host "Starting repository cleaning process..."

# Set Git user configuration
Write-Host "Setting up Git user configuration..."
git config --global user.email "temp-user@example.com"
git config --global user.name "Temporary User"

# Step 1: Create a fresh clone of the repository (this will be our clean version)
Write-Host "Creating a fresh clone of the repository..."
$tempDir = "clean-repo-temp"
if (Test-Path $tempDir) {
    Remove-Item -Recurse -Force $tempDir
}
git clone --no-hardlinks . $tempDir
cd $tempDir

# Step 2: Create a new branch without any history
Write-Host "Creating a new branch without history..."
git checkout --orphan clean-branch

# Remove all files from the staging area
git rm -rf --cached .

# Add only the files we want to keep (excluding large files and node_modules)
Write-Host "Adding files to the new branch (excluding large files and node_modules)..."
Get-ChildItem -Recurse -Exclude "node_modules", ".next", "*.exe", "*.node", "*.dll", "*.so", "*.dylib", "*.zip", "*.tar.gz", "*.rar", "*.7z", "*.iso", "*.bin", "*.dmg", "*.pkg", "*.deb", "*.rpm" |
    Where-Object { -not $_.PSIsContainer } |
    ForEach-Object { git add $_.FullName }

# Add .gitignore
git add .gitignore

# Commit the changes
git commit -m "Initial commit - clean repository"

# Step 3: Push the new branch to GitHub with force
Write-Host "Pushing clean branch to GitHub..."
git remote -v
git push -f origin clean-branch:master

# Step 4: Return to original directory
Write-Host "Cleaning up..."
cd ..

Write-Host "Repository cleaning completed. The clean branch has been pushed to GitHub."
Write-Host "You can now clone a fresh copy of the repository from GitHub."
