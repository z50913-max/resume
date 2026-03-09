# 简历可视化编辑器

一个基于 Web 的简历编辑器，通过表单界面轻松生成专业的 PDF 简历，无需编辑代码。
环境
D:\doc260303\Desktop\doc1\rust3>node --version
v22.22.0

D:\doc260303\Desktop\doc1\rust3>npm --version
10.9.4

## 功能特点

- ✅ 可视化表单编辑界面
- ✅ 实时预览功能（使用真实的 PDF 样式）
- ✅ 一键生成 PDF 简历
- ✅ 自动备份恢复机制
- ✅ 支持动态添加/删除工作经历、教育背景等
- <img width="950" height="1230" alt="image" src="https://github.com/user-attachments/assets/ba0369ef-585f-42cc-8dcf-499715315758" />
<img width="950" height="1235" alt="image" src="https://github.com/user-attachments/assets/adb88aad-69ef-4d6f-acd2-bd6a0ee2f03c" />



## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动服务器

```bash
node server.js
```

### 3. 打开编辑器

在浏览器中访问：http://localhost:3000

## 使用方法

1. **填写表单**：在 Web 界面填写个人信息、工作经历、教育背景等
2. **预览效果**：点击"预览"按钮查看实时效果
3. **生成 PDF**：点击"生成 PDF"按钮下载简历

## 项目结构

```
rust3/
├── server.js                 # Express 服务器（核心后端）
├── lib/
│   └── pug-generator.js     # Pug 文件生成器（根据 JSON 生成 Pug）
├── public/
│   ├── index.html           # Web 编辑器界面
│   ├── app.js               # 前端交互逻辑
│   └── editor.css           # 编辑器样式
├── stylesheets/
│   └── style.css            # 简历 PDF 样式（重要：影响最终 PDF 排版）
├── resume.pug               # 简历模板（原始模板，不要手动修改）
├── resume.scss              # 简历样式源文件（编译为 style.css）
├── resume-data.json         # 默认简历数据
├── mixins.pug               # Pug 混入（可复用组件）
└── package.json             # 项目依赖配置
```

## 核心文件说明

### 后端文件

| 文件 | 作用 | 修改影响 |
|------|------|----------|
| `server.js` | Express 服务器，处理 API 请求、生成 PDF | 修改会影响服务器功能、PDF 生成逻辑 |
| `lib/pug-generator.js` | 根据 JSON 数据动态生成 Pug 文件 | 修改会影响简历内容的生成逻辑 |

### 前端文件

| 文件 | 作用 | 修改影响 |
|------|------|----------|
| `public/index.html` | Web 编辑器界面（表单结构） | 修改会影响编辑器界面布局 |
| `public/app.js` | 前端交互逻辑（表单提交、预览、生成 PDF） | 修改会影响编辑器功能 |
| `public/editor.css` | 编辑器界面样式 | 修改只影响编辑器外观，不影响 PDF |

### 样式文件

| 文件 | 作用 | 修改影响 |
|------|------|----------|
| `stylesheets/style.css` | **简历 PDF 样式**（最终 PDF 的排版） | **修改会直接影响生成的 PDF 外观** |
| `resume.scss` | 样式源文件（需编译为 style.css） | 修改后需重新编译才能生效 |

### 模板文件

| 文件 | 作用 | 修改影响 |
|------|------|----------|
| `resume.pug` | 简历模板（原始模板，供参考） | **不要手动修改**，系统会自动生成临时文件 |
| `mixins.pug` | Pug 混入（定义可复用的组件如 `+item`） | 修改会影响简历结构 |

### 数据文件

| 文件 | 作用 | 修改影响 |
|------|------|----------|
| `resume-data.json` | 默认简历数据（首次加载时使用） | 修改会改变编辑器的默认内容 |

## 工作原理

1. **用户填写表单** → 前端收集 JSON 数据
2. **提交到后端** → `POST /api/generate-pdf`
3. **生成 Pug 文件** → `lib/pug-generator.js` 根据 JSON 生成临时 resume.pug
4. **备份原始文件** → 将原始 resume.pug 备份为 resume.pug.backup
5. **调用 ReLaXed** → 使用 spawn 执行 `relaxed resume.pug --build-once`
6. **监控进程** → 检测 "PDF written" 输出后自动终止进程
7. **读取 PDF** → 读取生成的 resume.pdf
8. **恢复原始文件** → 从备份恢复原始 resume.pug
9. **返回 PDF** → 将 PDF 发送给浏览器下载

## 常见修改场景

### 修改简历样式（字体、颜色、布局）

修改文件：`stylesheets/style.css`

例如修改侧边栏背景色：
```css
.sidebar {
  background-color: #f2f2f2; /* 改为其他颜色 */
}
```

### 修改默认数据

修改文件：`resume-data.json`

### 修改 ReLaXed 路径

修改文件：`server.js`（第 66 行左右）
```javascript
const relaxedCmd = 'E:\\soft\\abc\\node_npm\\node_global\\relaxed.cmd';
```

### 修改服务器端口

修改文件：`server.js`（第 9 行）
```javascript
const PORT = 3000; // 改为其他端口
```

## 注意事项

1. **不要手动修改 `resume.pug`**：系统会自动生成临时文件，手动修改会被覆盖
2. **修改样式后需重启服务器**：CSS 文件会被缓存，修改后需重启服务器
3. **备份重要数据**：生成的 PDF 会覆盖 `resume.pdf`，建议及时备份
4. **ReLaXed 依赖**：确保 ReLaXed 已正确安装并配置路径

## 故障排除

### 服务器无法启动

```bash
# 检查端口占用
netstat -ano | findstr :3000

# 杀掉占用进程
taskkill /F /PID <进程ID>
```

### PDF 生成失败

1. 检查 ReLaXed 是否正确安装：`relaxed --version`
2. 检查 ReLaXed 路径是否正确（server.js 第 66 行）
3. 查看服务器控制台的错误信息

### 预览和 PDF 效果不一致

预览功能已优化，现在使用和 PDF 完全相同的 Pug 模板和样式。如果仍有差异，请重启服务器。

## 技术栈

- **后端**：Node.js + Express
- **模板引擎**：Pug
- **PDF 生成**：ReLaXed (基于 Puppeteer)
- **前端**：原生 JavaScript + HTML + CSS

## 许可证

基于 [ReLaXed Examples](https://github.com/RelaxedJS/ReLaXed-examples) 项目修改。
