const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { generatePugFile } = require('./lib/pug-generator');

const app = express();
const PORT = 3000;

// 中间件
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static('public'));
app.use('/stylesheets', express.static('stylesheets'));
app.use('/assets', express.static('assets'));

// 加载默认简历数据
function loadDefaultData() {
  const dataPath = path.join(__dirname, 'resume-data.json');
  if (fs.existsSync(dataPath)) {
    return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  }
  return null;
}

// 首页 - 编辑器界面
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API: 获取默认数据
app.get('/api/default-data', (req, res) => {
  const data = loadDefaultData();
  res.json(data);
});

// API: 生成 PDF（使用 ReLaXed）
app.post('/api/generate-pdf', async (req, res) => {
  const resumePath = path.join(__dirname, 'resume.pug');
  const backupPath = path.join(__dirname, 'resume.pug.backup');
  const pdfPath = path.join(__dirname, 'resume.pdf');

  try {
    const data = req.body;

    // 1. 生成 Pug 文件内容
    console.log('正在生成 Pug 文件...');
    const pugContent = generatePugFile(data);

    // 2. 备份原始 resume.pug
    if (fs.existsSync(resumePath)) {
      fs.copyFileSync(resumePath, backupPath);
      console.log('已备份原始 resume.pug');
    }

    // 3. 写入新的 resume.pug
    fs.writeFileSync(resumePath, pugContent, 'utf8');
    console.log('已写入新的 resume.pug');

    // 4. 调用 ReLaXed 生成 PDF
    console.log('正在调用 ReLaXed 生成 PDF...');

    await new Promise((resolve, reject) => {
      const relaxedCmd = 'E:\\soft\\abc\\node_npm\\node_global\\relaxed.cmd';
      const child = spawn(relaxedCmd, ['resume.pug', '--build-once'], {
        cwd: __dirname,
        shell: true
      });

      let output = '';
      let pdfGenerated = false;

      child.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        console.log('ReLaXed:', text.trim());

        // 检查 PDF 是否已生成
        if (text.includes('PDF written') || text.includes('Done in')) {
          pdfGenerated = true;
          // 等待一小段时间确保文件写入完成
          setTimeout(() => {
            child.kill();
            resolve();
          }, 500);
        }
      });

      child.stderr.on('data', (data) => {
        console.error('ReLaXed 错误:', data.toString());
      });

      child.on('error', (error) => {
        reject(new Error(`启动 ReLaXed 失败: ${error.message}`));
      });

      // 设置超时
      setTimeout(() => {
        if (!pdfGenerated) {
          child.kill();
          reject(new Error('ReLaXed 超时'));
        }
      }, 30000);
    });

    console.log('ReLaXed 进程已完成');

    // 5. 读取生成的 PDF
    if (!fs.existsSync(pdfPath)) {
      throw new Error('PDF 文件未生成');
    }

    const pdfBuffer = fs.readFileSync(pdfPath);
    console.log(`PDF 生成成功，大小: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);

    // 6. 恢复原始 resume.pug
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, resumePath);
      fs.unlinkSync(backupPath);
      console.log('已恢复原始 resume.pug');
    }

    // 7. 返回 PDF
    res.contentType('application/pdf');
    res.send(pdfBuffer);

  } catch (error) {
    console.error('生成 PDF 错误:', error);

    // 恢复原始文件
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, resumePath);
      fs.unlinkSync(backupPath);
      console.log('已恢复原始 resume.pug');
    }

    res.status(500).json({
      error: error.message,
      details: error.stderr || error.stdout || ''
    });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`简历编辑器已启动: http://localhost:${PORT}`);
  console.log('按 Ctrl+C 停止服务器');
});
