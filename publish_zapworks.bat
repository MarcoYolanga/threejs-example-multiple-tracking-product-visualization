@echo off
echo "Pubblicazione su Zapworks, aprire con windows powershell"

echo "Pulizia..."
rm -R .\dist\
mkdir dist
echo "Compilazione..."
npm run build -- --mode=production
echo "Pubblicazione..."
zapworks publish --project="928723868334891285" --version="1.0.2" --dir ./dist
