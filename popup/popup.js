document.addEventListener('DOMContentLoaded', () => {
  // 加载保存的设置
  chrome.storage.sync.get(['minChineseWords', 'apiKey'], (result) => {
    document.getElementById('minChineseWords').value = result.minChineseWords || 100;
    document.getElementById('apiKey').value = result.apiKey || '';
  });

  // 保存设置
  document.getElementById('saveSettings').addEventListener('click', () => {
    const minChineseWords = document.getElementById('minChineseWords').value;
    const apiKey = document.getElementById('apiKey').value;

    chrome.storage.sync.set({
      minChineseWords,
      apiKey
    }, () => {
      alert('设置已保存！');
    });
  });
}); 