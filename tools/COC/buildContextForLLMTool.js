

const buildContextForLLM = (game, character, messages, latestMessage) => {
    const contents = [];

    // Part 1 & 2: 將所有「背景資料」合併到一個初始的 "user" prompt 中
    let initialContextPrompt = "# 遊戲核心狀態\n";

    if (character) {
      initialContextPrompt += `## 角色最初狀態:\n${JSON.stringify(character)}\n`;
    }
    // if (game.gameState) {
    //   initialContextPrompt += `## 世界狀態:\n${JSON.stringify(game.gameState)}\n`;
    // }
    // 修正大小寫：KPmemo
    if (game.KpMemo && game.KpMemo.trim() !== "") {
        initialContextPrompt += `# 故事至此的摘要:\n${game.KpMemo}\n`;
    }
    
    // 只有當有實際內容時才加入
    if (initialContextPrompt.length > 20) { // 隨意設定一個比 "# 遊戲核心狀態\n" 長的數字
        contents.push({ role: "user", parts: [{ text: initialContextPrompt }] });
        // 重要：在 user prompt 後面必須跟一個 model prompt 才能開始對話歷史
        contents.push({ role: "model", parts: [{ text: "好的，我已準備就緒，請開始你的行動。" }] });
    }

    if (game.lastSummarizedMessageIndex === 0) {
        contents.push({ role: "user", parts: [{ text: "game start" }] });
    }

    // Part 3. 從資料庫來的對話歷史
    const recentMessages = messages.slice(game.lastSummarizedMessageIndex);
    const formattedRecentMessages = recentMessages.map((message) => ({
        role: message.role === "model" ? "model" : "user",
        parts: [{ text: message.content }],
    }));
    contents.push(...formattedRecentMessages);

    // Part 4. 玩家最新輸入
    // 在加入前，檢查最後一則訊息是否也是 user，如果是，則合併內容避免角色重複
    const lastMessage = contents[contents.length - 1];
    if (lastMessage && lastMessage.role === 'user') {
        lastMessage.parts[0].text += '\n\n' + latestMessage;
    } else {
        contents.push({ role: "user", parts: [{ text: latestMessage }] });
    }
    
    // console.log("first content is: ", contents[0].parts[0].text);

    return contents;
}

export { buildContextForLLM }