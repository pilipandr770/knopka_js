# Voice Widget

Универсальный голосовой виджет для сайтов с интеграцией OpenAI Assistant.

## Возможности
- Голосовой ввод и вывод (speech-to-text, text-to-speech)
- Интеграция с OpenAI (Whisper, Assistant, TTS)
- Встраиваемый виджет для любого сайта
- Кастомизация через параметры и переменные окружения

## Быстрый старт
1. Клонируйте репозиторий
2. Установите зависимости: `npm install`
3. Настройте переменные окружения (см. `.env.example`)
4. Запустите сервер: `npm start`
5. Внедрите виджет на сайт через `<script src="/widget.js"></script>`

## Документация
- [Установка](docs/installation.md)
- [Конфигурация](docs/configuration.md)
- [Деплой](docs/deployment.md)

## Структура проекта
- `backend/` — серверная часть (Express, OpenAI)
- `frontend/` — клиентская часть (виджет, стили)
- `build/` — сборка виджета
- `docs/` — документация

## Лицензия
MIT
#   k n o p k a _ j s  
 