// 监听扩展安装或更新
chrome.runtime.onInstalled.addListener(() => {
  // 初始化默认设置
  chrome.storage.sync.get(['minChineseWords', 'apiKey'], (result) => {
    if (!result.minChineseWords) {
      chrome.storage.sync.set({ minChineseWords: 100 });
    }
  });
});

// 处理来自content script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'analyze') {
    // 可以在这里添加额外的处理逻辑
    sendResponse({ success: true });
  }
}); 