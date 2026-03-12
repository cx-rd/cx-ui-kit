# UI-Kit 現代化架構規範 (重構 v2)

本文件定義了 `@shared/ui-kit` 的核心架構、依賴規範與開發原則，旨在確保人工智慧 (AI) 與人類開發者能維持一致的開發體驗。

---

## 1. 分層架構 (Layered Architecture)

庫的原始碼嚴格分為以下四層，每一層有其特定的職責：

### 📁 `core/` (基礎層)
- **職責**：提供整個庫的基礎設施。不應依賴於其他任何層。
- **內容**：
  - `styles/`：設計系統 Token (Sass Variables) 與全域樣式。
  - `models/`：共享的 TypeScript 介面、枚舉與類型定義。
  - `pipes/`：純數據轉換工具。
  - `utils/`：純邏輯工具函數。

### 📁 `components/` (原子組件層)
- **職責**：可重複使用的獨立 UI 單元，專注於通用性。
- **原則**：僅依賴於 `core/` 層。
- **範例**：`UserMenuComponent`, `NotificationPopoverComponent`。

### 📁 `layouts/` (佈局層)
- **職責**：頁面的結構外殼與組合邏輯。
- **原則**：依賴於 `components/` 與 `core/`。
- **範例**：`MainLayoutComponent`, `SidebarComponent`, `ToolbarComponent`。

### 📁 `templates/` (頁面模板層)
- **職責**：完整的業務流程頁面。供 AI Skill 產生時的主要對象。
- **原則**：依賴於 `layouts/`、`components/` 與 `core/`。
- **範例**：`LoginPageComponent`, `AllNotificationsPageComponent`。

---

## 2. 單向相依原則 (Unidirectional Dependency)

為了防止循環引用並確保代碼可測試性，必須嚴格遵守以下流向：

**Templates** ➔ **Layouts** ➔ **Components** ➔ **Core**

> [!IMPORTANT]
> 禁止反向依賴（例如 `components` 引用 `layouts`）。

---

## 3. 命名慣例 (Naming Convention)

| 組件類型 | 後綴名稱 | 範例 |
| :--- | :--- | :--- |
| **頁面模板** | `PageComponent` | `UserStatsPageComponent` |
| **佈局殼層** | `LayoutComponent` | `AppShellLayoutComponent` |
| **通用組件** | (`Component`) | `PrimaryButtonComponent` |

---

## 4. 模組導出 (Export Policy)

- **Barrel Exports**：每個子目錄必須包含 `index.ts`，並導出該目錄下的主要物件。
- **依賴引用**：內部引用應使用相對路徑，外部對外統一由 `public-api.ts` 導出。
- **AI 識別**：每個 Template 必須導出一個 `XXX_ROUTE` 常數（如 `LOGIN_ROUTE`），以便自動化導控。

---

## 5. 樣式系統 (Style System)

- **唯一路徑**：所有樣式的入口為 `core/styles/index.scss`。
- **Token 引用**：組件樣式應優先使用 `@import '../../core/styles/tokens/index';`。
- **禁止 Hardcode**：不應直接使用顏色十六進位值，必須使用 `$tp-color-*` 變數。
