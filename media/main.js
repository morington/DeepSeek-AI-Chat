(function() {
    const vscode = acquireVsCodeApi();

    const clearBtn = document.getElementById('clearBtn');
    const chatWindow = document.getElementById('chat-window');
    const messageInput = document.getElementById('message');

    // Функция для создания временной метки
    function createTimestamp() {
        const now = new Date();
        const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const formattedDate = now.toLocaleDateString();
        return `${formattedTime} ${formattedDate}`;
    }

    // Функция для добавления сообщения в чат
    function appendMessage(sender, text, timestamp) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.classList.add(sender === 'Пользователь' ? 'user-message' : 'bot-message');
    
        const header = document.createElement('div');
        header.classList.add('message-header');
        header.textContent = sender;
    
        const timestampElement = document.createElement('div');
        timestampElement.classList.add('message-timestamp');
        timestampElement.textContent = timestamp;  // Используем переданную временную метку
    
        const body = document.createElement('div');
        body.classList.add('message-body');
        body.innerHTML = marked.parse(text);  // Парсим текст как Markdown
    
        messageElement.appendChild(header);
        messageElement.appendChild(timestampElement);  // Добавляем метку времени
        messageElement.appendChild(body);
    
        chatWindow.appendChild(messageElement);
    
        // Подсвечиваем блоки кода
        messageElement.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightBlock(block);
        });
    
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    // Отправка сообщения пользователем
    function sendMessage() {
        const message = messageInput.value.trim();
        if (message) {
            const timestamp = createTimestamp();  // Создаем временную метку для сообщения
            appendMessage('Пользователь', message, timestamp);
            vscode.postMessage({ command: 'sendMessage', text: message, timestamp: timestamp });  // Отправляем текст и временную метку
            messageInput.value = '';
        }
    }

    messageInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            sendMessage();
        }
    });

    clearBtn.addEventListener('click', () => {
        chatWindow.innerHTML = '';
        vscode.postMessage({ command: 'clearHistory' });
    });

    // Обрабатываем сообщения от расширения
    window.addEventListener('message', event => {
        const data = event.data;
        switch (data.command) {
            case 'loadHistory':
                console.log("История сообщений:", data.history);
                data.history.forEach(msg => {
                    // Восстанавливаем сообщение с сохранённой временной меткой
                    appendMessage(msg.sender, msg.text, msg.timestamp);
                });
                break;
            case 'newMessage':
                // Восстанавливаем новое сообщение с переданной временной меткой
                appendMessage(data.message.sender, data.message.text, data.message.timestamp);
                break;
            case 'clearHistory':
                chatWindow.innerHTML = '';
                break;
        }
    });

    // Уведомляем расширение, что Webview готово
    vscode.postMessage({ command: 'ready' });
})();
