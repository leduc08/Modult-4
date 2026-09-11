@echo off
title VietGo AI - Cloudflare Tunnel
echo ==============================================================
echo    VietGo AI - Chia se du an qua Cloudflare Quick Tunnel
echo ==============================================================
echo.
echo [1/2] Hay chac chan rang ban da bat server (npm run dev) o cua so khac!
echo [2/2] Dang mo duong ham Cloudflare Tunnel toi http://localhost:3000...
echo.
echo Sau vai giay, Cloudflare se xuat hien duong link co dang:
echo https://xxxx.trycloudflare.com
echo.
echo Copy link do va gui cho cac thanh vien trong team cua ban!
echo (Nhan Ctrl+C de dung chia se bat ky luc nao)
echo ==============================================================
echo.

tools\cloudflared.exe tunnel --protocol http2 --edge-ip-version 4 --url http://localhost:3000

pause
