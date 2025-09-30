import { getState, loadState } from "./state.js";

let overlayBox;

async function translateText(text) {
  const { apiUrl, apiKey, modelName, targetLang } = getState();

  if (!apiUrl || !apiKey || !modelName) {
    console.warn("翻译插件: 未配置 API 信息");
    return text;
  }

  try {
    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: "system", content: `Translate the following into ${targetLang}.` },
          { role: "user", content: text },
        ],
      }),
    });

    if (!response.ok) {
      console.error("API 错误:", response.status);
      return text;
    }

    const data = await response.json();
    return (
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.text ||
      text
    );
  } catch (e) {
    console.error("翻译请求失败:", e);
    return text;
  }
}

function createOverlay() {
  overlayBox = document.createElement("div");
  overlayBox.className = "translation-overlay";
  overlayBox.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 300px;
    background: rgba(30, 30, 30, 0.95);
    border: 1px solid #444;
    border-radius: 10px;
    font-size: 14px;
    color: #eee;
    padding: 8px;
    z-index: 9999;
    max-height: 200px;
    overflow-y: auto;
  `;
  document.body.appendChild(overlayBox);
}

function observeChat() {
  const chatRoot = document.querySelector("#chat") || document.body;
  const observer = new MutationObserver(async (mutations) => {
    for (let mutation of mutations) {
      for (let node of mutation.addedNodes) {
        if (node.nodeType === 1) {
          const msg = node.innerText?.trim();
          if (msg && msg.length > 2) {
            const translated = await translateText(msg);
            const div = document.createElement("div");
            div.style.cssText = "margin-top:4px;font-size:13px;color:#66ccff;";
            div.textContent = `[译] ${translated}`;
            node.appendChild(div);

            // 同时更新悬浮窗内容
            if (overlayBox) {
              const p = document.createElement("div");
              p.textContent = `[${msg}] → ${translated}`;
              overlayBox.appendChild(p);
              overlayBox.scrollTop = overlayBox.scrollHeight;
            }
          }
        }
      }
    }
  });
  observer.observe(chatRoot, { childList: true, subtree: true });
}

export function loadExtension() {
  loadState();
  createOverlay();
  observeChat();
  console.log("Translation Overlay 已加载");
}
