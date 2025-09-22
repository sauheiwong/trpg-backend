const buildContextForLLM = (game, character, messages) => {
    const contents = [];

    // --- Part 1: 建立初始的背景資料 Prompt ---
    let initialContextParts = [];
    if (character) {
        initialContextParts.push(`## 角色當前狀態:\n${JSON.stringify(character, null, 2)}`);
    }
    if (game.KpMemo && game.KpMemo.trim() !== "") {
        initialContextParts.push(`# 故事至今的摘要:\n${game.KpMemo}`);
    }

    // 只有當有實際背景資料時，才加入這個初始對話
    if (initialContextParts.length > 0) {
        const initialContextPrompt = "# 遊戲核心背景\n" + initialContextParts.join('\n\n');
        contents.push({ role: "user", parts: [{ text: initialContextPrompt }] });
        // 在 user prompt 後面必須跟一個 model prompt 才能開始對話歷史
        contents.push({ role: "model", parts: [{ text: "好的，我已了解當前狀況並準備就緒。請繼續你的行動。" }] });
    }

    // --- Part 2: 處理儲存在資料庫中的對話歷史 ---
    const recentMessages = messages.slice(game.lastSummarizedMessageIndex);

    for (const message of recentMessages) {
        let historyItem = null;
        // console.log(`message is: 
        //     ${JSON.stringify(message, null, 2)}
        //     `)

        // 根據 message_type 來決定如何格式化
        switch (message.message_type) {
            case "user_prompt":
                if (message.content) {
                    historyItem = {
                        role: "user",
                        parts: [{ text: message.content }],
                    };
                }
                break;

            case "model_text_response":
                if (message.content) {
                    historyItem = {
                        role: "model",
                        parts: [{ text: message.content }],
                    };
                }
                break;

            case "model_function_call":
                if (message.function_call && message.function_call.name) {
                    historyItem = {
                        role: "model",
                        parts: [{
                            functionCall: {
                                name: message.function_call.name,
                                args: message.function_call.args,
                            }
                        }],
                    };
                }
                break;

            case "tool_function_result":
                if (message.function_result && message.function_result.name) {
                    historyItem = {
                        role: "user",
                        parts: [{
                            functionResponse: {
                                name: message.function_result.name,
                                response: message.function_result.result,
                            }
                        }],
                    };
                }
                break;
        }

        if (historyItem) {
            contents.push(historyItem);
        }
    }

    // console.log("buildingContextLLM contents is: ", contents)

    return contents;
};

export { buildContextForLLM };