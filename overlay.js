class TranslationOverlay {
    constructor() {
        this.apiUrl = '';
        this.apiKey = '';
        this.currentModel = '';
        this.init();
    }

    init() {
        this.loadConfig();
        this.bindEvents();
        this.setupSillyTavernIntegration();
    }

    bindEvents() {
        document.getElementById('fetch-models').addEventListener('click', () => this.fetchModels());
        document.getElementById('save-config').addEventListener('click', () => this.saveConfig());
    }

    // 从SillyTavern获取配置:cite[5]:cite[10]
    async loadConfig() {
        try {
            if (typeof callOverlayHandler === 'function') {
                const config = await callOverlayHandler({ call: 'getTranslationConfig' });
                if (config) {
                    this.apiUrl = config.apiUrl || '';
                    this.apiKey = config.apiKey || '';
                    this.currentModel = config.model || '';
                    this.updateUI();
                }
            }
        } catch (error) {
            console.log('使用本地配置');
        }
    }

    // 获取可用模型列表:cite[5]:cite[8]
    async fetchModels() {
        const apiUrl = document.getElementById('api-url').value;
        const apiKey = document.getElementById('api-key').value;
        
        if (!apiUrl || !apiKey) {
            this.showStatus('请先填写API URL和密钥', 'error');
            return;
        }

        try {
            this.showStatus('获取模型中...');
            
            const response = await fetch(`${apiUrl}/models`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            this.populateModelSelect(data.data || data.models);
            this.showStatus('获取成功!');
            
        } catch (error) {
            this.showStatus('获取模型失败: ' + error.message, 'error');
        }
    }

    populateModelSelect(models) {
        const select = document.getElementById('model-select');
        select.innerHTML = '<option value="">-- 选择模型 --</option>';
        
        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = model.id;
            select.appendChild(option);
        });
    }

    // 翻译文本的核心方法:cite[4]:cite[9]
    async translateText(text) {
        if (!this.apiUrl || !this.apiKey || !this.currentModel) {
            this.showStatus('请先配置API设置', 'error');
            return text;
        }

        try {
            const response = await fetch(`${this.apiUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.currentModel,
                    messages: [
                        {
                            role: "system",
                            content: "你是一个专业的翻译助手，专门将各种语言翻译成流畅的中文。只返回翻译结果，不要添加任何解释。"
                        },
                        {
                            role: "user",
                            content: `请将以下内容翻译成中文：${text}`
                        }
                    ],
                    max_tokens: 1000,
                    temperature: 0.3
                })
            });

            if (!response.ok) throw new Error(`翻译API错误: HTTP ${response.status}`);
            
            const data = await response.json();
            return data.choices[0].message.content;
            
        } catch (error) {
            this.showStatus('翻译失败: ' + error.message, 'error');
            return text; // 失败时返回原文
        }
    }

    // 监听SillyTavern的消息:cite[7]:cite[10]
    setupSillyTavernIntegration() {
        if (typeof addOverlayListener === 'function') {
            addOverlayListener('ChatMessage', (data) => {
                if (data.character && data.message) {
                    this.handleNewMessage(data.character, data.message);
                }
            });
        }

        // 监听页面变化来捕获角色对话
        this.setupMutationObserver();
    }

    setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        this.checkForCharacterMessages(node);
                    }
                });
            });
        });

        observer.observe(document.body, { 
            childList: true, 
            subtree: true 
        });
    }

    checkForCharacterMessages(element) {
        // 查找包含角色消息的元素
        const messageElements = element.querySelectorAll?.('[class*="message"], [class*="chat"]') || [];
        
        messageElements.forEach(async (msgElement) => {
            const text = msgElement.textContent;
            if (text && text.includes('<char>')) {
                const characterName = this.extractCharacterName(text);
                const messageContent = this.extractMessage(text);
                
                if (messageContent) {
                    this.displayOriginalMessage(characterName, messageContent);
                    const translated = await this.translateText(messageContent);
                    this.displayTranslatedMessage(characterName, translated);
                }
            }
        });
    }

    extractCharacterName(text) {
        const match = text.match(/<char>(.*?)<\/char>/);
        return match ? match[1] : '未知角色';
    }

    extractMessage(text) {
        // 提取角色消息内容的具体逻辑
        return text.replace(/<char>.*?<\/char>/, '').trim();
    }

    displayOriginalMessage(character, message) {
        const originalBox = document.getElementById('original-text');
        originalBox.innerHTML = `<strong>${character}:</strong> ${message}`;
    }

    displayTranslatedMessage(character, translation) {
        const translatedBox = document.getElementById('translated-text');
        translatedBox.innerHTML = `<strong>${character} (中文):</strong> ${translation}`;
    }

    showStatus(message, type = 'info') {
        const statusElement = document.getElementById('status');
        statusElement.textContent = message;
        statusElement.style.color = type === 'error' ? '#f44336' : '#4CAF50';
    }

    updateUI() {
        document.getElementById('api-url').value = this.apiUrl;
        document.getElementById('api-key').value = this.apiKey;
        if (this.currentModel) {
            document.getElementById('model-select').value = this.currentModel;
        }
    }

    saveConfig() {
        this.apiUrl = document.getElementById('api-url').value;
        this.apiKey = document.getElementById('api-key').value;
        this.currentModel = document.getElementById('model-select').value;
        
        // 保存到SillyTavern或本地存储
        if (typeof callOverlayHandler === 'function') {
            callOverlayHandler({ 
                call: 'saveTranslationConfig',
                data: {
                    apiUrl: this.apiUrl,
                    apiKey: this.apiKey,
                    model: this.currentModel
                }
            });
        } else {
            localStorage.setItem('translationConfig', JSON.stringify({
                apiUrl: this.apiUrl,
                apiKey: this.apiKey,
                model: this.currentModel
            }));
        }
        
        this.showStatus('配置已保存!');
    }
}

// 初始化悬浮窗
document.addEventListener('DOMContentLoaded', () => {
    new TranslationOverlay();
});
