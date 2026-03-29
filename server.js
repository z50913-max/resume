const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { generatePugFile } = require('./lib/pug-generator');

const app = express();
const PORT = 3000;
const DEFAULT_RESUME_NAME = '__default__';
const DEFAULT_DATA_PATH = path.join(__dirname, 'resume-data.json');
const RESUMES_DIR = path.join(__dirname, 'resumes');

app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static('public'));
app.use('/stylesheets', express.static('stylesheets'));
app.use('/assets', express.static('assets'));

function ensureResumesDir() {
  if (!fs.existsSync(RESUMES_DIR)) {
    fs.mkdirSync(RESUMES_DIR, { recursive: true });
  }
}

function loadDefaultData() {
  if (fs.existsSync(DEFAULT_DATA_PATH)) {
    return JSON.parse(fs.readFileSync(DEFAULT_DATA_PATH, 'utf8'));
  }
  return null;
}

function sanitizeResumeName(name) {
  const value = String(name || '').trim();
  const withoutExt = value.replace(/\.json$/i, '');
  const sanitized = withoutExt.replace(/[<>:"/\\|?*\x00-\x1F]/g, '-').replace(/\s+/g, '-');

  if (!sanitized || sanitized === '.' || sanitized === '..') {
    return null;
  }

  return sanitized;
}

function getResumeFilePath(name) {
  const safeName = sanitizeResumeName(name);
  if (!safeName) {
    return null;
  }

  return path.join(RESUMES_DIR, `${safeName}.json`);
}

function listResumeFiles() {
  ensureResumesDir();

  const files = fs.readdirSync(RESUMES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.json'))
    .map((entry) => {
      const filename = entry.name;
      const name = filename.replace(/\.json$/i, '');
      return {
        name,
        filename,
        label: name
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'));

  return [
    {
      name: DEFAULT_RESUME_NAME,
      filename: 'resume-data.json',
      label: '默认简历'
    },
    ...files
  ];
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/default-data', (req, res) => {
  const data = loadDefaultData();
  res.json(data);
});

app.get('/api/resumes', (req, res) => {
  try {
    res.json(listResumeFiles());
  } catch (error) {
    console.error('获取简历列表失败:', error);
    res.status(500).json({ error: '获取简历列表失败' });
  }
});

app.get('/api/resume/:name', (req, res) => {
  try {
    const requestedName = req.params.name;

    if (requestedName === DEFAULT_RESUME_NAME) {
      return res.json(loadDefaultData());
    }

    const resumePath = getResumeFilePath(requestedName);
    if (!resumePath) {
      return res.status(400).json({ error: '简历名称无效' });
    }

    if (!fs.existsSync(resumePath)) {
      return res.status(404).json({ error: '简历文件不存在' });
    }

    const data = JSON.parse(fs.readFileSync(resumePath, 'utf8'));
    res.json(data);
  } catch (error) {
    console.error('读取简历失败:', error);
    res.status(500).json({ error: '读取简历失败' });
  }
});

app.post('/api/resume/:name', (req, res) => {
  try {
    const resumePath = getResumeFilePath(req.params.name);
    if (!resumePath) {
      return res.status(400).json({ error: '简历名称无效' });
    }

    ensureResumesDir();
    fs.writeFileSync(resumePath, JSON.stringify(req.body, null, 2), 'utf8');

    res.json({
      success: true,
      name: path.basename(resumePath, '.json'),
      filename: path.basename(resumePath)
    });
  } catch (error) {
    console.error('保存简历失败:', error);
    res.status(500).json({ error: '保存简历失败' });
  }
});

app.post('/api/preview', async (req, res) => {
  try {
    const data = req.body;
    const html = generatePreviewHTML(data);
    res.send(html);
  } catch (error) {
    console.error('预览错误:', error);
    res.status(500).send(`<h1>预览失败</h1><p>${error.message}</p>`);
  }
});

function generatePreviewHTML(data) {
  const pug = require('pug');

  try {
    const pugContent = generatePugFile(data);
    const html = pug.render(pugContent, {
      filename: path.join(__dirname, 'resume.pug'),
      basedir: __dirname
    });

    return html;
  } catch (error) {
    console.error('预览生成错误:', error);
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>预览错误</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .error { color: red; background: #fee; padding: 20px; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="error">
    <h1>预览生成失败</h1>
    <p>${error.message}</p>
    <pre>${error.stack}</pre>
  </div>
</body>
</html>
    `;
  }
}

app.post('/api/generate-pdf', async (req, res) => {
  const resumePath = path.join(__dirname, 'resume.pug');
  const backupPath = path.join(__dirname, 'resume.pug.backup');
  const pdfPath = path.join(__dirname, 'resume.pdf');

  try {
    const data = req.body;

    console.log('正在生成 Pug 文件...');
    const pugContent = generatePugFile(data);

    if (fs.existsSync(resumePath)) {
      fs.copyFileSync(resumePath, backupPath);
      console.log('已备份原始 resume.pug');
    }

    fs.writeFileSync(resumePath, pugContent, 'utf8');
    console.log('已写入新的 resume.pug');

    console.log('正在调用 ReLaXed 生成 PDF...');

    await new Promise((resolve, reject) => {
      const relaxedCmd = 'E:\\soft\\abc\\node_npm\\node_global\\relaxed.cmd';
      const child = spawn(relaxedCmd, ['resume.pug', '--build-once'], {
        cwd: __dirname,
        shell: true
      });

      let pdfGenerated = false;

      child.stdout.on('data', (data) => {
        const text = data.toString();
        console.log('ReLaXed:', text.trim());

        if (text.includes('PDF written') || text.includes('Done in')) {
          pdfGenerated = true;
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

      setTimeout(() => {
        if (!pdfGenerated) {
          child.kill();
          reject(new Error('ReLaXed 超时'));
        }
      }, 30000);
    });

    console.log('ReLaXed 进程已完成');

    if (!fs.existsSync(pdfPath)) {
      throw new Error('PDF 文件未生成');
    }

    const pdfBuffer = fs.readFileSync(pdfPath);
    console.log(`PDF 生成成功，大小: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);

    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, resumePath);
      fs.unlinkSync(backupPath);
      console.log('已恢复原始 resume.pug');
    }

    res.contentType('application/pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('生成 PDF 错误:', error);

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

ensureResumesDir();

app.listen(PORT, () => {
  console.log(`简历编辑器已启动: http://localhost:${PORT}`);
  console.log('按 Ctrl+C 停止服务器');
});
