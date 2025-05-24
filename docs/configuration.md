# Конфигурация

Все параметры настраиваются через переменные окружения (файл `.env`).

## Основные параметры
- `OPENAI_API_KEY` — API-ключ OpenAI (обязательно)
- `ASSISTANT_ID` — ID ассистента OpenAI (обязательно)
- `PORT` — порт сервера (по умолчанию 3000)
- `NODE_ENV` — окружение (`development`/`production`)
- `WIDGET_TITLE` — заголовок виджета
- `WIDGET_WELCOME_MESSAGE` — приветственное сообщение
- `WIDGET_PRIMARY_COLOR` — основной цвет
- `WIDGET_POSITION` — позиция на экране (`bottom-right`, `bottom-left` и т.д.)
- `WIDGET_LANGUAGE` — язык (например, `ru`)
- `ALLOWED_ORIGINS` — разрешённые источники CORS
- `RATE_LIMIT_REQUESTS` — лимит запросов
- `RATE_LIMIT_WINDOW` — окно лимита (минуты)
- `LOG_LEVEL` — уровень логирования

Пример файла `.env` смотрите в `.env.example`.
