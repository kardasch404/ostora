@echo off
echo Installing uuid_generate_v7 function...

docker exec -i ostora_postgres psql -U postgres -d ostora < prisma\migrations\20260425_add_uuid_v7_function.sql

if %ERRORLEVEL% EQU 0 (
    echo UUID v7 function installed successfully!
) else (
    echo Failed to install UUID v7 function. Trying alternative container name...
    docker exec -i postgres psql -U postgres -d ostora < prisma\migrations\20260425_add_uuid_v7_function.sql
)

pause
