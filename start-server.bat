@echo off
chcp 65001 >nul
echo ==========================================
echo  苏州地铁11号线商业作战图 - 启动服务
echo ==========================================
echo.

REM 启动本地Web服务器（后台）
cd /d E:\suzhou-metro-11
start /min cmd /c "python -m http.server 8080"
echo [1/2] 本地服务器已启动: http://localhost:8080
echo        局域网访问: http://192.168.188.112:8080
echo.

REM 等待服务器启动
timeout /t 3 /nobreak >nul

REM 启动Cloudflare公网隧道（前台，显示链接）
cd /d E:\suzhou-metro-11\tools
echo [2/2] 正在启动公网隧道...
cloudflared.exe tunnel --url http://localhost:8080

pause
