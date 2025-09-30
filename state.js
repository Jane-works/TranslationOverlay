// 保存与加载插件配置

export const defaultState = {
  apiUrl: "",
  apiKey: "",
  modelName: "",
  targetLang: "zh"
};

let state = { ...defaultState };

export function loadState() {
  try {
    const raw = localStorage.getItem("translationOverlayState");
    if (raw) {
      state = { ...defaultState, ...JSON.parse(raw) };
    } else {
      state = { ...defaultState };
    }
  } catch (e) {
    console.error("加载配置失败:", e);
    state = { ...defaultState };
  }
  return state;
}

export function saveState(newState = {}) {
  try {
    state = { ...state, ...newState };
    localStorage.setItem("translationOverlayState", JSON.stringify(state));
  } catch (e) {
    console.error("保存配置失败:", e);
  }
}

export function getState() {
  return state;
}
