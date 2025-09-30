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
    }
  } catch (e) {
    console.error("加载配置失败:", e);
  }
  return state;
}

export function saveState(newState) {
  state = { ...state, ...newState };
  localStorage.setItem("translationOverlayState", JSON.stringify(state));
}

export function getState() {
  return state;
}
