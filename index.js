import "./script.js";
import "./state.js";
import "./style.css";

/**
 * SillyTavern 扩展入口
 */
export function init(extension) {
  console.log("[TranslationOverlay] Extension loaded");

  // 如果 script.js 定义了初始化函数，就尝试调用它
  if (typeof window.initializeTranslationOverlay === "function") {
    window.initializeTranslationOverlay(extension);
  }

  // 如果 state.js 定义了初始化函数，也尝试调用
  if (typeof window.initTranslationState === "function") {
    window.initTranslationState(extension);
  }
}
