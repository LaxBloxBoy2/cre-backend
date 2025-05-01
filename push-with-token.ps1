# This script will help you push to GitHub using a Personal Access Token
Write-Host "This script will help you push to GitHub using a Personal Access Token (PAT)"
Write-Host "Please make sure you have created a PAT for the LaxBloxBoy2 account"
Write-Host "Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)"
Write-Host "Click 'Generate new token' → 'Generate new token (classic)'"
Write-Host "Give it a name like 'CRE Backend Access'"
Write-Host "Select the 'repo' scope to allow full access to repositories"
Write-Host "Click 'Generate token'"
Write-Host "Copy the token (you'll only see it once)"
Write-Host ""
Write-Host "When prompted for a password, paste the token instead of your GitHub password"
Write-Host ""

# First, let's make sure we're using the correct remote URL
git remote set-url origin https://LaxBloxBoy2@github.com/LaxBloxBoy2/cre-backend.git

# Clear any stored credentials for GitHub
Write-Host "Clearing any stored credentials for GitHub..."
cmdkey /delete:LegacyGeneric:target=git:https://github.com
cmdkey /delete:LegacyGeneric:target=git:https://LaxBloxBoy@github.com
cmdkey /delete:LegacyGeneric:target=git:https://LaxBloxBoy2@github.com

# Push to GitHub
Write-Host "Pushing to GitHub..."
Write-Host "Username: LaxBloxBoy2"
Write-Host "Password: [Use your Personal Access Token]"
git push origin master
