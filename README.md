# Расширение **DeepSeek AI Chat** для VSCode

Добро пожаловать в расширение **DeepSeek AI Chat** для Visual Studio Code!

С помощью этого расширения вы можете общаться с моделью DeepSeek AI прямо в вашем редакторе VSCode. Задавайте вопросы, получайте помощь с программированием или просто общайтесь с ИИ, не покидая среды разработки. Кроме того, расширение сохраняет историю сообщений и позволяет её очистить при необходимости.

## Возможности
- **Удобный интерфейс чата:** Интегрированный в VSCode чат с поддержкой Markdown и подсветкой синтаксиса для кода.
- **Сохранение истории сообщений:** Сохраняет все сообщения даже после перезапуска VSCode, чтобы вы могли к ним вернуться.
- **Контекстные промты:** Возможность задать контекстный промт для персонализации взаимодействия с ИИ.
- **Очистка истории:** Очистка всех предыдущих сообщений одним кликом.
- **Защищённый контент:** Встроена политика безопасности контента (CSP) для безопасного взаимодействия и просмотра.
- **Постоянная очистка истории в DeepSeek:** только вы храните историю на стороне VSCode. Модель не будет запоминать ваш диалог с ней, каждое сообщение с чистого нуля, идеальный вариант для простых задач

## Начало работы
- **Установка расширения:**
    ```bash
    code --install-extension deepseek-ai-chat-<VERSION>.vsix
    ```

- **Настройка Bearer Token:**

    После установки перейдите в настройки VSCode и добавьте свой Bearer Token для API DeepSeek. Вы можете найти эти настройки в разделе `Настройки > Расширения > DeepSeek AI Chat`.

- **Настройка контекстного промта (опционально):**

    В тех же настройках можно указать параметр promt, который будет использоваться для контекстного управления каждым диалогом с ИИ. Это полезно для предоставления фоновой информации или указаний в конкретной предметной области.

## Использование

- **После активации расширения:**

    **Открытие окна чата:**
    Перейдите на боковую панель VSCode, найдите иконку DeepSeek AI и откройте панель чата.

    **Начало общения:**
    Введите ваше сообщение в текстовое поле и нажмите `Enter`. ИИ ответит в реальном времени, а все сообщения появятся в окне чата. Чтобы перейти на новую строку, используйте `Shift+Enter`.

    **Очистка истории сообщений:**
    Чтобы начать новый разговор, нажмите кнопку Очистить историю, которая находится над окном чата.

    **Персонализация взаимодействия:**
    Вы можете изменить свой контекстный `promt` в настройках для того, чтобы ИИ давал более релевантные ответы в зависимости от ваших нужд. Я к примеру заставляю его не объяснять, чтобы не ждать долго ответа.
