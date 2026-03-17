#!/bin/bash

cd api && php -S 0.0.0.0:8000 router.php &
PHP_PID=$!

cd /home/runner/workspace && npx vite --host 0.0.0.0 --port 5000

kill $PHP_PID 2>/dev/null
