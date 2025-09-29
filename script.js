// translation-overlay/script.js

let apiUrl = localStorage.getItem("overlayApiUrl") || "";
let apiKey = localStorage.getItem("overlayApiKey") || "";
let modelName = localStorage.getItem("overlayModel") || "";
let targetLang = localStorage.getItem("overlayLang") || "zh";

// ===== 悬浮窗 UI =====
const overlayBox = document.createElement("div");
overlayBox.className = "translation-overlay";
overlayBox.style.cssText = `
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 300px;
  background: rgba(30, 30, 30, 0.95);
  border: 1px solid #444;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  font-family: sans-serif;
  font-size: 14px;
  color: #eee;
  z-index: 9999;
`;

overlayBox.innerHTML = `
  <div style="display:flex;justify-content:space-between;align-items:center;
              padding:6px 10px;background:#222;border-bottom:1px solid #444;
              border-radius:10px 10px 0 0;font-weight:bold;">
    <span>翻译窗口</span>
    <div>
      <button id="overlay-settings" 
        style="background:none;border:none;color:#aaa;cursor:pointer;margin-right:8px;">⚙</button>
      <button id="overlay-close"
        style="background:none;border:none;color:#aaa;cursor:pointer;">✖</button>
    </div>
  </div>
  <div id="overlay-content" style="padding:8px;max-height:160px;overflow-y:auto;line-height:1.4;"></div>
  <div id="overlay-error" style="padding:4px 8px;min-height:16px;color:red;font-size:12px;"></div>
  <div id="overlay-settings-panel" style="display:none;padding:8px;border-top:1px solid #444;">
    <label>API 地址:<br><input id="input-api-url" type="text" style="width:100%;margin-bottom:6px;"></label>
    <label>API Key:<br><input id="input-api-key" type="password" style="width:100%;margin-bottom:6px;"></label>
    <label>模型名称:<br><input id="input-model" type="text" style="width:100%;margin-bottom:6px;"></label>
    <label>目标语言:<br><input id="input-lang" type="text" style="width:100%;margin-bottom:6px;"></label>
    <button id="overlay-save" style="margin-top:6px;width:100%;padding:4px;">保存配置</button>
  </div>
`;
document.body.appendChild(overlayBox);

document.getElementById("overlay-close").onclick = () => {
  overlayBox.style.display = "none";
};

const settingsPanel = document.getElementById("overlay-settings-panel");
document.getElementById("overlay-settings").onclick = () => {
  settingsPanel.style.display = settingsPanel.style.display === "none" ? "block" : "none";
};

// 填充当前配置到输入框
document.getElementById("input-api-url").value = apiUrl;
document.getElementById("input-api-key").value = apiKey;
document.getElementById("input-model").value = modelName;
document.getElementById("input-lang").value = targetLang;

document.getElementById("overlay-save").onclick = () => {
  apiUrl = document.getElementById("input-api-url").value.trim();
  apiKey = document.getElementById("input-api-key").value.trim();
  modelName = document.getElementById("input-model").value.trim();
  targetLang = document.getElementById("input-lang").value.trim() || "zh";
  localStorage.setItem("overlayApiUrl", apiUrl);
  localStorage.setItem("overlayApiKey", apiKey);
  localStorage.setItem("overlayModel", modelName);
  localStorage.setItem("overlayLang", targetLang);
  showError("配置已保存 ✔");
  settingsPanel.style.display = "none";
};

const overlayContent = document.getElementById("overlay-content");
const errorBox = document.getElementById("overlay-error");

function showError(msg) {
  errorBox.textContent = msg || "";
}

// ===== API 调用 =====
async function translateText(text) {
  if (!apiUrl || !apiKey || !modelName) {
    showError("请先在设置中填写 API 地址、密钥和模型");
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
      const err = await response.text();
      showError(`API 错误: ${response.status} ${err}`);
      return text;
    }

    const data = await response.json();
    const translated =
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.text ||
      text;

    showError("");
    return translated;
  } catch (e) {
    showError("请求失败: " + e.message);
    return text;
  }
}

// ===== 监听聊天区域 =====
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
          }
        }
      }
    }
  });

  observer.observe(chatRoot, { childList: true, subtree: true });
}

observeChat();
