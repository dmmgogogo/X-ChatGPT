let settings = {
  minChineseWords: 100,
  apiKey: ''
};

// 加载设置
chrome.storage.sync.get(['minChineseWords', 'apiKey'], (result) => {
  settings = { ...settings, ...result };
});

// 检测推文语言
function detectLanguage(text) {
  const chineseRegex = /[\u4e00-\u9fa5]/g;
  const chineseCount = (text.match(chineseRegex) || []).length;
  return chineseCount > text.length / 3 ? 'zh' : 'en';
}

// 调用 ChatGPT API
async function callChatGPT(text, isChineseContent) {
  const prompt = isChineseContent 
    ? `请对以下内容进行摘要总结：\n${text}`
    : `请将以下英文内容用中文进行摘要总结：\n${text}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content: prompt
        }]
      })
    });

    const data = await response.json();
    console.log(data);
    return data.choices[0].message.content;
  } catch (error) {
    console.error('ChatGPT API 调用失败:', error);
    return '分析失败，请检查 API Key 设置';
  }
}

// 创建分析结果浮动框
function createFloatingBox(tweet, summary) {
  // 移除已存在的分析框（如果有）
  const existingBox = tweet.querySelector('.tweet-analysis-box');
  if (existingBox) {
    existingBox.remove();
  }

  const box = document.createElement('div');
  box.className = 'tweet-analysis-box';
  
  // 添加一个关闭按钮
  const closeButton = document.createElement('div');
  closeButton.innerHTML = '✕';
  closeButton.style.cssText = `
    position: absolute;
    right: 12px;
    top: 12px;
    cursor: pointer;
    font-size: 14px;
    color: #536471;
    padding: 4px;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    transition: background-color 0.2s;
  `;
  closeButton.onmouseover = () => {
    closeButton.style.backgroundColor = 'rgba(15, 20, 25, 0.1)';
  };
  closeButton.onmouseout = () => {
    closeButton.style.backgroundColor = 'transparent';
  };
  closeButton.onclick = () => box.remove();

  // 添加标题
  const title = document.createElement('div');
  title.className = 'analysis-title';
  title.textContent = 'AI 分析摘要';
  
  const content = document.createElement('div');
  content.className = 'analysis-content';
  const formattedSummary = summary.split('\n').map(para => 
    para.trim() ? `<p style="margin: 8px 0;">${para}</p>` : ''
  ).join('');
  content.innerHTML = formattedSummary;
  
  box.appendChild(closeButton);
  box.appendChild(title);
  box.appendChild(content);

  // 添加简单的拖动功能
  let isDragging = false;
  let currentX;
  let currentY;

  // 阻止点击事件传播
  box.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  box.addEventListener('mousedown', (e) => {
    // 阻止事件传播
    e.stopPropagation();
    e.preventDefault();
    
    if (e.target === closeButton) return;
    isDragging = true;
    currentX = e.clientX - box.offsetLeft;
    currentY = e.clientY - box.offsetTop;
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    box.style.left = `${e.clientX - currentX}px`;
    box.style.top = `${e.clientY - currentY}px`;
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // 阻止内容区域的点击事件传播
  content.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // 阻止标题区域的点击事件传播
  title.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // 将弹窗添加到推文容器中
  tweet.appendChild(box);
}

// 监听新推文
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1) {
        // 更新选择器以适应新的 X UI
        const tweets = node.querySelectorAll('article[data-testid="tweet"], article[data-testid="tweetDetail"]');
        tweets.forEach(async (tweet) => {
          if (tweet.querySelector('.tweet-analysis-box')) return;

          const tweetText = tweet.querySelector('[data-testid="tweetText"], [data-testid="post-text"]')?.innerText;
          if (!tweetText) return;

          const lang = detectLanguage(tweetText);
          const isChineseContent = lang === 'zh';

          if (isChineseContent && tweetText.length < settings.minChineseWords) return;

          const summary = await callChatGPT(tweetText, isChineseContent);
          createFloatingBox(tweet, summary);
        });
      }
    });
  });
});

// 开始监听页面变化
observer.observe(document.body, {
  childList: true,
  subtree: true
}); 