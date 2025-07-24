# LLM-TRPG 後端服務

這是 LLM 互動式桌上角色扮演遊戲 (TRPG) 專案的後端服務，基於 Node.js 和 Express.js 框架開發。它負責處理所有遊戲邏輯、使用者數據管理，並與大型語言模型(Gemini API) 進行互動。

## 第一階段已實現功能

此階段的目標是建立一個穩定、流暢的單人遊戲核心循環。目前已完成以下功能：

**使用者認證**：提供使用者註冊、登入及身份驗證功能。

**遊戲管理**：支援使用者創建新遊戲、讀取歷史遊戲列表，以及載入指定的遊戲進度。

**核心對話系統**：整合 Google Gemini API，接收玩家的對話輸入，生成遊戲劇情回覆。

**對話歷史紀錄**：所有玩家與 AI GM 的對話都會被儲存至資料庫，確保遊戲進度可以隨時接續。

**手動擲骰機制**：提供一個獨立的 API 端點，用於處理各種格式的擲骰需求 (例如
`d20`, `2d6`, `1d10+1`)。

**多語言支援**：可儲存並管理使用者的語言偏好設定。

## API 端點 (Endpoints)

以下是目前已建立的主要 API 端點：

`POST /api/register`：註冊新使用者。

`POST /api/login`：使用者登入。

`GET /api/game`：獲取該使用者的所有遊戲列表。

`GET /api/gemini`：創建一場新遊戲。

`GET /api/game/:id`：載入特定遊戲的詳細資訊與對話歷史。

`POST /api/gemini/:id`：在特定遊戲中發送一則新訊息。

`POST /api/roll`：根據公式進行擲骰。

`GET /api/user`：取得使用者設定（例如語言）。

`PUT /api/user`：更新使用者設定（例如語言）。

## 技術棧 (Tech Stack)

**框架**: Node.js, Express.js

**資料庫**: MongoDB with Mongoose

**身份驗證**: Passport.js with JWT

**LLM**: Google Gemini API

**環境變數管理**: dotenv

## 安裝與啟動

1. **安裝依賴**

```bash
npm install
```

2.  **設定環境變數**

在專案根目錄下建立一個 `.env`檔案，並填入必要的環境變數：

```bash

      MONGO_URI=你的MongoDB連線字串

      GEMINI_API_KEY=你的Gemini_API金鑰

      JWT_SECRET=你的JWT密鑰

```

3.  **啟動伺服器**

```bash
      npm start
```

伺服器預設會在`http://localhost:3000` 上運行。
