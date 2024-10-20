// extension.ts
import * as vscode from 'vscode';
import("node-fetch");

const configuration = vscode.workspace.getConfiguration('deepseek-ai-chat');
const bearerToken = configuration.get<string>('bearerToken');
const promt = configuration.get<string>('promt');

// Функция для генерации nonce (для Content Security Policy)
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

// Активируем расширение
export function activate(context: vscode.ExtensionContext) {
    const provider = new ChatViewProvider(context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('chatView', provider)
    );

    if (!bearerToken) {
        vscode.window.showErrorMessage('Добавьте BearerToken для расширения "deepseek-ai-chat".');
    }
}

class ChatViewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private messageHistory: Array<{ sender: string; text: string; timestamp: string }> = [];

    constructor(private readonly context: vscode.ExtensionContext) {
        this.messageHistory = context.globalState.get('messageHistory', []);
    }

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'media')],
        };

        webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async message => {
            switch (message.command) {
                case 'sendMessage':
                    this.messageHistory.push({ sender: 'Пользователь', text: message.text, timestamp: message.timestamp });
                    await this.context.globalState.update('messageHistory', this.messageHistory);

                    const responseText = await this.sendToApi(message.text);

                    this.messageHistory.push({ sender: 'DeepSeek', text: responseText, timestamp: message.timestamp });
                    await this.context.globalState.update('messageHistory', this.messageHistory);

                    webviewView.webview.postMessage({ command: 'newMessage', message: { sender: 'DeepSeek', text: responseText, timestamp: message.timestamp } });
                    break;

                case 'clearHistory':
                    this.messageHistory = [];
                    await this.context.globalState.update('messageHistory', this.messageHistory);

                    webviewView.webview.postMessage({ command: 'clearHistory' });
                    break;

                case 'ready':
                    // Отправляем историю сообщений в Webview после того, как оно готово
                    webviewView.webview.postMessage({ command: 'loadHistory', history: this.messageHistory });
                    break;
            }
        });
    }

    getHtmlForWebview(webview: vscode.Webview) {
        // Пути к локальным скриптам и стилям
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'main.js'));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'styles.css'));
        const highlightCssUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'default.min.css'));
        const highlightJsUri = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/highlight.min.js';
        const markedJsUri = 'https://cdnjs.cloudflare.com/ajax/libs/marked/14.1.3/marked.min.js';

        const nonce = getNonce();

        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <!-- Content Security Policy -->
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Chat Panel</title>
            <link href="${highlightCssUri}" rel="stylesheet">
            <link href="${styleUri}" rel="stylesheet">
        </head>
        <body>
            <button id="clearBtn">Clear History</button>
            <div id="chat-window"></div>
            <div id="input-area">
                <textarea class="input" id="message" placeholder="Введите сообщение"></textarea>
            </div>

            <script nonce="${nonce}" src="${markedJsUri}"></script>
            <script nonce="${nonce}" src="${highlightJsUri}"></script>
            <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
        </html>`;
    }

    // Метод для отправки запроса на API
    async sendToApi(text: string): Promise<string> {
        const message = promt + " " + text;

        const payload = {
            message: message,
            stream: true,
            model_preference: null,
            model_class: "deepseek_chat",
            temperature: 0,
        };

        const clearContextPayload = {
            model_class: "deepseek_chat",
            append_welcome_message: false,
        };

        const url = 'https://chat.deepseek.com/api/v0/chat/completions';
        const clearContextUrl = 'https://chat.deepseek.com/api/v0/chat/clear_context';

        // Сначала очистка контекста
        try {
            await fetch(clearContextUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${bearerToken}`,
                },
                body: JSON.stringify(clearContextPayload),
            });
        } catch (error) {
            throw new Error(`Ошибка очистки контекста: ${error}`);
        }

        // После успешной очистки контекста отправляем основное сообщение
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${bearerToken}`,
            },
            body: JSON.stringify(payload),
        });

        if (!response.body) {
            throw new Error('Нет тела ответа (body) в ответе API');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let fullMessage = '';

        return new Promise<string>(async (resolve, reject) => {
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    const events = chunk.trim().split("\n\n");

                    for (const event of events) {
                        if (event.startsWith('data:')) {
                            const jsonData = event.replace('data: ', '');
                            const parsedData = JSON.parse(jsonData);

                            if (parsedData.choices && parsedData.choices[0]?.delta?.content) {
                                const deltaContent = parsedData.choices[0].delta.content;
                                fullMessage += deltaContent;
                            }

                            if (parsedData.choices[0]?.finish_reason === 'stop') {
                                resolve(fullMessage);
                                return;
                            }
                        }
                    }
                }
            } catch (error) {
                reject(`Ошибка чтения потока: ${error}`);
            }
        });
    }

}

// Деактивация расширения
export function deactivate() { }
