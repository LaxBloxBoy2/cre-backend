@echo off
echo Running Git commands to fix and push changes...

cd C:\Users\anwar\Documents\augment-projects\cre

echo Installing Git LFS...
git lfs install

echo Creating .gitignore file...
echo node_modules/ > .gitignore
echo .next/ >> .gitignore

echo Creating a new clean branch...
git checkout -b clean-branch-with-direct-edit

echo Adding our changes...
git add .gitignore
git add app\deals\[id]\direct-edit\page.tsx app\contexts\ToastContext.tsx

echo Committing changes...
git commit -m "Add direct edit functionality with localStorage persistence"

echo Pushing to GitHub...
git push -u origin clean-branch-with-direct-edit

echo Done! Press any key to exit.
pause
