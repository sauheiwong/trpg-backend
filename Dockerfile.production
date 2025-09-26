# --- 第一階段：建置 (Builder Stage) ---
# 使用一個包含完整建置工具的 Node.js 版本
FROM node:22-alpine AS builder

# 設定工作目錄
WORKDIR /usr/src/app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 使用 npm ci 來安裝依賴，確保一致性且只安裝生產環境所需的套件
# 這會移除 devDependencies，縮小 node_modules 的大小
RUN npm ci --only=production

# 複製所有其他的程式碼
COPY . .


# --- 第二階段：生產 (Production Stage) ---
# 使用一個極簡的 Node.js 映像
FROM node:22-alpine

# 設定工作目錄
WORKDIR /usr/src/app

# 從建置階段複製必要的檔案
# 1. 複製已安裝好的生產環境依賴
COPY --from=builder /usr/src/app/node_modules ./node_modules
# 2. 複製應用程式原始碼
COPY --from=builder /usr/src/app .

# 建立一個非 root 的使用者和群組來執行應用程式，增強安全性
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
# 切換到這個新使用者
USER appuser

# 設定環境變數為 production
ENV NODE_ENV=production

# 開放應用程式的連接埠
EXPOSE 4000

# 執行應用程式
CMD ["npm", "start"]