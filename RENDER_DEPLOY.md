# Инструкции по деплою на Render

## 🚀 Быстрый деплой на Render

### 1. Подготовка репозитория
Убедитесь, что ваш код запушен в GitHub репозиторий.

### 2. Создание сервиса на Render

1. Зайдите на [render.com](https://render.com) и создайте аккаунт
2. Нажмите "New +" и выберите "Web Service"
3. Подключите ваш GitHub репозиторий
4. Настройте сервис:
   - **Name**: `voice-widget-app`
   - **Environment**: `Node`
   - **Region**: `Oregon (US West)` или ближайший к вам
   - **Branch**: `main` (или ваша основная ветка)
   - **Root Directory**: `app`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 3. Настройка переменных окружения

В разделе "Environment Variables" добавьте:

```
NODE_ENV=production
PORT=10000
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_ASSISTANT_ID=your_assistant_id_here
```

**⚠️ ВАЖНО**: Замените значения на ваши реальные ключи!

### 4. Дополнительные настройки

- **Health Check Path**: `/health`
- **Auto-Deploy**: `Yes`

### 5. Деплой

1. Нажмите "Create Web Service"
2. Render автоматически:
   - Склонирует репозиторий
   - Выполнит `npm install`
   - Запустит приложение
   - Предоставит URL для доступа

### 6. Проверка работы

После успешного деплоя:

1. Откройте предоставленный URL
2. Добавьте `/fixed-demo.html` для тестирования анимаций
3. Проверьте автоматическую озвучку
4. Протестируйте все функции виджета

## 🔧 Возможные проблемы и решения

### Проблема: "Build failed"
**Решение**: Проверьте логи сборки и убедитесь, что все зависимости в package.json корректны.

### Проблема: "App crashed"
**Решение**: 
1. Проверьте переменные окружения
2. Убедитесь, что OPENAI_API_KEY правильный
3. Проверьте логи приложения в Render dashboard

### Проблема: "503 Service Unavailable"
**Решение**: Приложение еще запускается. Подождите 1-2 минуты.

### Проблема: Озвучка не работает
**Решение**: 
1. Проверьте, что OPENAI_API_KEY имеет доступ к TTS API
2. Убедитесь, что в браузере разрешен автозапуск аудио
3. Попробуйте протестировать в разных браузерах

## 🌐 После деплоя

Ваш виджет будет доступен по адресу:
```
https://your-app-name.onrender.com
```

### Тестовые страницы:
- `/` - Основная страница
- `/fixed-demo.html` - Демо с исправленной озвучкой
- `/simple-test.html` - Простой тест автоозвучки
- `/animated-demo.html` - Демо всех анимаций

## 📱 Интеграция в ваш сайт

После деплоя вы можете интегрировать виджет в любой сайт:

```html
<link rel="stylesheet" href="https://your-app-name.onrender.com/widget-animated.css">
<script src="https://your-app-name.onrender.com/utils.js"></script>
<script src="https://your-app-name.onrender.com/api-client.js"></script>
<script src="https://your-app-name.onrender.com/voice-recognition.js"></script>
<script src="https://your-app-name.onrender.com/voice-synthesis.js"></script>
<script src="https://your-app-name.onrender.com/voice-widget.js"></script>

<script>
  // Настройте базовый URL для API
  window.VoiceWidgetConfig = {
    apiBaseUrl: 'https://your-app-name.onrender.com'
  };
  
  // Инициализируйте виджет
  const widget = new VoiceWidget({
    autoSpeak: true,
    debug: false
  });
</script>
```

## 🎯 Преимущества деплоя на Render

1. **HTTPS по умолчанию** - необходимо для Web Audio API
2. **Автоматические деплои** - при пуше в Git
3. **Бесплатный план** - для тестирования
4. **Глобальная доступность** - CDN
5. **Логирование и мониторинг** - встроенные инструменты

## 📊 Мониторинг

В Render dashboard вы можете:
- Просматривать логи в реальном времени
- Мониторить использование ресурсов
- Настраивать alerts
- Просматривать метрики производительности
