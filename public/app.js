// 全局数据对象
let resumeData = null;

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', async () => {
    // 加载默认数据
    await loadDefaultData();

    // 绑定事件
    document.getElementById('loadBtn').addEventListener('click', loadFromLocalStorage);
    document.getElementById('saveBtn').addEventListener('click', saveToLocalStorage);
    document.getElementById('previewBtn').addEventListener('click', showPreview);
    document.getElementById('generateBtn').addEventListener('click', generatePDF);
    document.getElementById('closePreview').addEventListener('click', closePreview);
});

// 加载默认数据
async function loadDefaultData() {
    try {
        const response = await fetch('/api/default-data');
        resumeData = await response.json();
        populateForm(resumeData);
    } catch (error) {
        console.error('加载默认数据失败:', error);
        alert('加载默认数据失败，请刷新页面重试');
    }
}

// 填充表单
function populateForm(data) {
    // 个人信息
    document.getElementById('name').value = data.personal.name || '';
    document.getElementById('title').value = data.personal.title || '';

    // 个人简介
    const profileFields = document.getElementById('profileFields');
    profileFields.innerHTML = '';
    for (const [key, value] of Object.entries(data.personal.profile)) {
        profileFields.innerHTML += `
            <div class="form-group">
                <label>${key}</label>
                <input type="text" data-profile-key="${key}" value="${value}">
            </div>
        `;
    }

    // 开发技能
    const skillsFields = document.getElementById('skillsFields');
    skillsFields.innerHTML = '';
    data.personal.skills.forEach((skill, index) => {
        skillsFields.innerHTML += createSkillField(skill, index);
    });

    // 技能证书
    const certificatesFields = document.getElementById('certificatesFields');
    certificatesFields.innerHTML = '';
    data.personal.certificates.forEach((cert, index) => {
        certificatesFields.innerHTML += createCertificateField(cert, index);
    });

    // 联系方式
    document.getElementById('contact_website').value = data.personal.contact.website || '';
    document.getElementById('contact_github').value = data.personal.contact.github || '';
    document.getElementById('contact_email').value = data.personal.contact.email || '';
    document.getElementById('contact_wechat').value = data.personal.contact.wechat || '';
    document.getElementById('contact_phone').value = data.personal.contact.phone || '';
    document.getElementById('contact_location').value = data.personal.contact.location || '';

    // 联系方式显示状态（默认全部显示）
    document.getElementById('show_website').checked = true;
    document.getElementById('show_github').checked = true;
    document.getElementById('show_email').checked = true;
    document.getElementById('show_wechat').checked = true;
    document.getElementById('show_phone').checked = true;
    document.getElementById('show_location').checked = true;

    // 教育背景
    const educationFields = document.getElementById('educationFields');
    educationFields.innerHTML = '';
    data.education.forEach((edu, index) => {
        educationFields.innerHTML += createEducationField(edu, index);
    });

    // 工作经验
    const experienceFields = document.getElementById('experienceFields');
    experienceFields.innerHTML = '';
    data.experience.forEach((exp, index) => {
        experienceFields.innerHTML += createExperienceField(exp, index);
    });

    // 校园经历
    const campusFields = document.getElementById('campusFields');
    campusFields.innerHTML = '';
    data.campus.forEach((campus, index) => {
        campusFields.innerHTML += createCampusField(campus, index);
    });

    // 技能清单
    document.getElementById('skills_languages').value = data.skillsList.languages || '';
    document.getElementById('skills_frameworks').value = data.skillsList.frameworks || '';
    document.getElementById('skills_devops').value = data.skillsList.devops || '';
    document.getElementById('skills_databases').value = data.skillsList.databases || '';
    document.getElementById('skills_cloud').value = data.skillsList.cloud || '';

    // 个人总结
    document.getElementById('summary').value = data.summary || '';

    // 结束语
    document.getElementById('disclaimer').value = data.disclaimer || '';
}

// 创建技能字段
function createSkillField(skill, index) {
    return `
        <div class="field-item">
            <button class="remove-btn" onclick="removeSkill(${index})">×</button>
            <div class="form-group">
                <input type="text" data-skill-index="${index}" value="${skill}" placeholder="技能名称">
            </div>
        </div>
    `;
}

// 创建证书字段
function createCertificateField(cert, index) {
    return `
        <div class="field-item">
            <button class="remove-btn" onclick="removeCertificate(${index})">×</button>
            <div class="form-group">
                <input type="text" data-cert-index="${index}" value="${cert}" placeholder="证书名称">
            </div>
        </div>
    `;
}

// 创建教育背景字段
function createEducationField(edu, index) {
    return `
        <div class="field-item">
            <button class="remove-btn" onclick="removeEducation(${index})">×</button>
            <div class="form-group">
                <label>学校及专业</label>
                <input type="text" data-edu-index="${index}" data-edu-field="school" value="${edu.school}" placeholder="学校 - 专业">
            </div>
            <div class="form-group">
                <label>开始时间</label>
                <input type="text" data-edu-index="${index}" data-edu-field="from" value="${edu.from}" placeholder="2020-09">
            </div>
            <div class="form-group">
                <label>结束时间</label>
                <input type="text" data-edu-index="${index}" data-edu-field="to" value="${edu.to}" placeholder="2024-06">
            </div>
            <div class="form-group">
                <label>描述（每行一条）</label>
                <textarea data-edu-index="${index}" data-edu-field="description" rows="3" placeholder="课程、成就等">${edu.description.join('\n')}</textarea>
            </div>
        </div>
    `;
}

// 创建工作经验字段
function createExperienceField(exp, index) {
    return `
        <div class="field-item">
            <button class="remove-btn" onclick="removeExperience(${index})">×</button>
            <div class="form-group">
                <label>公司及职位</label>
                <input type="text" data-exp-index="${index}" data-exp-field="company" value="${exp.company}" placeholder="公司名称 - 职位">
            </div>
            <div class="form-group">
                <label>地点</label>
                <input type="text" data-exp-index="${index}" data-exp-field="location" value="${exp.location}" placeholder="城市">
            </div>
            <div class="form-group">
                <label>开始时间</label>
                <input type="text" data-exp-index="${index}" data-exp-field="from" value="${exp.from}" placeholder="2020-01">
            </div>
            <div class="form-group">
                <label>结束时间</label>
                <input type="text" data-exp-index="${index}" data-exp-field="to" value="${exp.to}" placeholder="2022-12">
            </div>
            <div class="form-group">
                <label>工作描述（每行一条）</label>
                <textarea data-exp-index="${index}" data-exp-field="description" rows="5" placeholder="工作内容、项目经验等">${exp.description.join('\n')}</textarea>
            </div>
        </div>
    `;
}

// 创建校园经历字段
function createCampusField(campus, index) {
    return `
        <div class="field-item">
            <button class="remove-btn" onclick="removeCampus(${index})">×</button>
            <div class="form-group">
                <label>标题</label>
                <input type="text" data-campus-index="${index}" data-campus-field="title" value="${campus.title}" placeholder="项目或活动名称">
            </div>
            <div class="form-group">
                <label>地点/组织</label>
                <input type="text" data-campus-index="${index}" data-campus-field="place" value="${campus.place || ''}" placeholder="可选">
            </div>
            <div class="form-group">
                <label>开始时间</label>
                <input type="text" data-campus-index="${index}" data-campus-field="from" value="${campus.from || ''}" placeholder="可选">
            </div>
            <div class="form-group">
                <label>结束时间</label>
                <input type="text" data-campus-index="${index}" data-campus-field="to" value="${campus.to || ''}" placeholder="可选">
            </div>
            <div class="form-group">
                <label>描述（每行一条）</label>
                <textarea data-campus-index="${index}" data-campus-field="description" rows="3" placeholder="详细描述">${campus.description.join('\n')}</textarea>
            </div>
        </div>
    `;
}

// 添加技能
function addSkill() {
    const container = document.getElementById('skillsFields');
    const index = container.children.length;
    container.innerHTML += createSkillField('', index);
}

// 添加证书
function addCertificate() {
    const container = document.getElementById('certificatesFields');
    const index = container.children.length;
    container.innerHTML += createCertificateField('', index);
}

// 添加教育背景
function addEducation() {
    const container = document.getElementById('educationFields');
    const index = container.children.length;
    const edu = { school: '', from: '', to: '', description: [] };
    container.innerHTML += createEducationField(edu, index);
}

// 添加工作经验
function addExperience() {
    const container = document.getElementById('experienceFields');
    const index = container.children.length;
    const exp = { company: '', location: '', from: '', to: '', description: [] };
    container.innerHTML += createExperienceField(exp, index);
}

// 添加校园经历
function addCampus() {
    const container = document.getElementById('campusFields');
    const index = container.children.length;
    const campus = { title: '', place: '', from: '', to: '', description: [] };
    container.innerHTML += createCampusField(campus, index);
}

// 删除函数
function removeSkill(index) {
    document.querySelector(`[data-skill-index="${index}"]`).closest('.field-item').remove();
}

function removeCertificate(index) {
    document.querySelector(`[data-cert-index="${index}"]`).closest('.field-item').remove();
}

function removeEducation(index) {
    document.querySelector(`[data-edu-index="${index}"]`).closest('.field-item').remove();
}

function removeExperience(index) {
    document.querySelector(`[data-exp-index="${index}"]`).closest('.field-item').remove();
}

function removeCampus(index) {
    document.querySelector(`[data-campus-index="${index}"]`).closest('.field-item').remove();
}

// 收集表单数据
function collectFormData() {
    const data = {
        personal: {
            name: document.getElementById('name').value,
            title: document.getElementById('title').value,
            avatar: './assets/coam.png',
            profile: {},
            skills: [],
            certificates: [],
            contact: {
                website: document.getElementById('show_website').checked ? document.getElementById('contact_website').value : '',
                github: document.getElementById('show_github').checked ? document.getElementById('contact_github').value : '',
                email: document.getElementById('show_email').checked ? document.getElementById('contact_email').value : '',
                wechat: document.getElementById('show_wechat').checked ? document.getElementById('contact_wechat').value : '',
                phone: document.getElementById('show_phone').checked ? document.getElementById('contact_phone').value : '',
                location: document.getElementById('show_location').checked ? document.getElementById('contact_location').value : ''
            }
        },
        education: [],
        experience: [],
        campus: [],
        skillsList: {
            languages: document.getElementById('skills_languages').value,
            frameworks: document.getElementById('skills_frameworks').value,
            devops: document.getElementById('skills_devops').value,
            databases: document.getElementById('skills_databases').value,
            cloud: document.getElementById('skills_cloud').value
        },
        summary: document.getElementById('summary').value,
        disclaimer: document.getElementById('disclaimer').value
    };

    // 收集个人简介
    document.querySelectorAll('[data-profile-key]').forEach(input => {
        const key = input.getAttribute('data-profile-key');
        data.personal.profile[key] = input.value;
    });

    // 收集技能
    document.querySelectorAll('[data-skill-index]').forEach(input => {
        if (input.value.trim()) {
            data.personal.skills.push(input.value);
        }
    });

    // 收集证书
    document.querySelectorAll('[data-cert-index]').forEach(input => {
        if (input.value.trim()) {
            data.personal.certificates.push(input.value);
        }
    });

    // 收集教育背景
    const eduIndices = new Set();
    document.querySelectorAll('[data-edu-index]').forEach(el => {
        eduIndices.add(el.getAttribute('data-edu-index'));
    });

    eduIndices.forEach(index => {
        const edu = {
            school: document.querySelector(`[data-edu-index="${index}"][data-edu-field="school"]`).value,
            from: document.querySelector(`[data-edu-index="${index}"][data-edu-field="from"]`).value,
            to: document.querySelector(`[data-edu-index="${index}"][data-edu-field="to"]`).value,
            description: document.querySelector(`[data-edu-index="${index}"][data-edu-field="description"]`).value.split('\n').filter(line => line.trim())
        };
        data.education.push(edu);
    });

    // 收集工作经验
    const expIndices = new Set();
    document.querySelectorAll('[data-exp-index]').forEach(el => {
        expIndices.add(el.getAttribute('data-exp-index'));
    });

    expIndices.forEach(index => {
        const exp = {
            company: document.querySelector(`[data-exp-index="${index}"][data-exp-field="company"]`).value,
            location: document.querySelector(`[data-exp-index="${index}"][data-exp-field="location"]`).value,
            from: document.querySelector(`[data-exp-index="${index}"][data-exp-field="from"]`).value,
            to: document.querySelector(`[data-exp-index="${index}"][data-exp-field="to"]`).value,
            description: document.querySelector(`[data-exp-index="${index}"][data-exp-field="description"]`).value.split('\n').filter(line => line.trim())
        };
        data.experience.push(exp);
    });

    // 收集校园经历
    const campusIndices = new Set();
    document.querySelectorAll('[data-campus-index]').forEach(el => {
        campusIndices.add(el.getAttribute('data-campus-index'));
    });

    campusIndices.forEach(index => {
        const campus = {
            title: document.querySelector(`[data-campus-index="${index}"][data-campus-field="title"]`).value,
            place: document.querySelector(`[data-campus-index="${index}"][data-campus-field="place"]`).value,
            from: document.querySelector(`[data-campus-index="${index}"][data-campus-field="from"]`).value,
            to: document.querySelector(`[data-campus-index="${index}"][data-campus-field="to"]`).value,
            description: document.querySelector(`[data-campus-index="${index}"][data-campus-field="description"]`).value.split('\n').filter(line => line.trim())
        };
        data.campus.push(campus);
    });

    return data;
}

// 显示预览
async function showPreview() {
    const data = collectFormData();
    showLoading();

    try {
        const response = await fetch('/api/preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const html = await response.text();
        const previewFrame = document.getElementById('previewFrame');
        previewFrame.srcdoc = html;

        document.querySelector('.preview-panel').classList.add('active');
    } catch (error) {
        console.error('预览失败:', error);
        alert('预览失败: ' + error.message);
    } finally {
        hideLoading();
    }
}

// 关闭预览
function closePreview() {
    document.querySelector('.preview-panel').classList.remove('active');
}

// 生成 PDF
async function generatePDF() {
    const data = collectFormData();
    showLoading();

    try {
        const response = await fetch('/api/generate-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('生成 PDF 失败');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'resume.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        alert('PDF 生成成功！');
    } catch (error) {
        console.error('生成 PDF 失败:', error);
        alert('生成 PDF 失败: ' + error.message);
    } finally {
        hideLoading();
    }
}

// 保存到本地存储
function saveToLocalStorage() {
    const data = collectFormData();
    localStorage.setItem('resumeData', JSON.stringify(data));
    alert('数据已保存到浏览器本地存储');
}

// 从本地存储加载
function loadFromLocalStorage() {
    const saved = localStorage.getItem('resumeData');
    if (saved) {
        const data = JSON.parse(saved);
        populateForm(data);
        alert('数据已从本地存储加载');
    } else {
        alert('没有找到保存的数据');
    }
}

// 显示/隐藏加载动画
function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}
