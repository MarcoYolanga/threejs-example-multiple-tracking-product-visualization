@echo off
echo Pubblicazione su Zapworks da windows
echo
echo Pulizia...
@del /s /f /q .\dist\
echo Compilazione...
call npm run build -- --mode=production
echo Pubblicazione...
zapworks publish --project="928723868334891285" --dir ./dist
