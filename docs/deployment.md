# Деплой

## Быстрый деплой на Render.com
1. Создайте новый Web Service на Render
2. Укажите репозиторий и путь к папке `app`
3. Установите переменные окружения (см. `.env.example`)
4. Build Command: `npm install`
5. Start Command: `npm start`

## Деплой на свой сервер
1. Установите Node.js >=16
2. Установите зависимости: `npm install`
3. Настройте `.env`
4. Запустите сервер: `npm start`

## Docker (опционально)
- Можно добавить Dockerfile для контейнеризации (см. чек-лист)

## Интеграция на сайт
Добавьте в `<head>` вашего сайта:
```html
<script src="https://your-domain/widget.js"></script>
<link rel="stylesheet" href="https://your-domain/widget.css">
```
