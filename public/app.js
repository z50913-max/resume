let resumeData = null;
let currentResumeName = null;

const DEFAULT_RESUME_NAME = '__default__';
const LOCAL_DRAFT_KEY = 'resumeData';
const CONTACT_FIELDS = ['website', 'github', 'email', 'wechat', 'phone', 'location'];

document.addEventListener('DOMContentLoaded', async () => {
    await loadDefaultData();

    document.getElementById('loadBtn').addEventListener('click', loadResumeFromFile);
    document.getElementById('saveBtn').addEventListener('click', saveResumeToFile);
    document.getElementById('previewBtn').addEventListener('click', showPreview);
    document.getElementById('generateBtn').addEventListener('click', generatePDF);
    document.getElementById('closePreview').addEventListener('click', closePreview);
});

async function loadDefaultData() {
    try {
        const response = await fetch('/api/default-data');
        resumeData = await response.json();
        currentResumeName = null;
        populateForm(resumeData);
    } catch (error) {
        console.error('加载默认数据失败:', error);
        alert('加载默认数据失败，请刷新页面重试');
    }
}

function normalizeProfileItems(personal = {}) {
    if (Array.isArray(personal.profileItems)) {
        return personal.profileItems.map(item => ({
            label: String(item?.label ?? ''),
            value: String(item?.value ?? ''),
            visible: item?.visible !== false
        }));
    }

    return Object.entries(personal.profile || {}).map(([label, value]) => ({
        label: String(label ?? ''),
        value: String(value ?? ''),
        visible: true
    }));
}

function normalizeContactVisibility(personal = {}) {
    const visibility = personal.contactVisibility || {};
    const contact = personal.contact || {};

    return CONTACT_FIELDS.reduce((result, key) => {
        if (typeof visibility[key] === 'boolean') {
            result[key] = visibility[key];
        } else {
            result[key] = Boolean(String(contact[key] ?? '').trim());
        }
        return result;
    }, {});
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function createProfileField(field, index) {
    const visibleChecked = field.visible !== false ? 'checked' : '';
    const labelValue = escapeHtml(field.label);
    const fieldValue = escapeHtml(field.value);

    return `
        <div class="field-item" data-profile-item>
            <button class="remove-btn" onclick="removeProfile(${index})">×</button>
            <div class="form-group">
                <label>字段名称</label>
                <input type="text" data-profile-index="${index}" data-profile-field="label" value="${labelValue}" placeholder="如：驻外意向">
            </div>
            <div class="form-group">
                <label>字段内容</label>
                <input type="text" data-profile-index="${index}" data-profile-field="value" value="${fieldValue}" placeholder="如：可驻马来西亚">
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" data-profile-index="${index}" data-profile-field="visible" ${visibleChecked} style="width:auto; margin-right:8px;">
                    显示到 PDF
                </label>
            </div>
        </div>
    `;
}

function renderProfileFields(items) {
    const profileFields = document.getElementById('profileFields');
    profileFields.innerHTML = '';
    items.forEach((field, index) => {
        profileFields.innerHTML += createProfileField(field, index);
    });
}

function getProfileItemsFromForm() {
    return Array.from(document.querySelectorAll('[data-profile-item]')).map((item) => {
        const labelInput = item.querySelector('[data-profile-field="label"]');
        const valueInput = item.querySelector('[data-profile-field="value"]');
        const visibleInput = item.querySelector('[data-profile-field="visible"]');

        return {
            label: labelInput ? labelInput.value.trim() : '',
            value: valueInput ? valueInput.value.trim() : '',
            visible: visibleInput ? visibleInput.checked : true
        };
    });
}

function populateForm(data) {
    document.getElementById('name').value = data.personal.name || '';
    document.getElementById('title').value = data.personal.title || '';

    renderProfileFields(normalizeProfileItems(data.personal || {}));

    const skillsFields = document.getElementById('skillsFields');
    skillsFields.innerHTML = '';
    data.personal.skills.forEach((skill, index) => {
        skillsFields.innerHTML += createSkillField(skill, index);
    });

    const certificatesFields = document.getElementById('certificatesFields');
    certificatesFields.innerHTML = '';
    data.personal.certificates.forEach((cert, index) => {
        certificatesFields.innerHTML += createCertificateField(cert, index);
    });

    document.getElementById('contact_website').value = data.personal.contact.website || '';
    document.getElementById('contact_github').value = data.personal.contact.github || '';
    document.getElementById('contact_email').value = data.personal.contact.email || '';
    document.getElementById('contact_wechat').value = data.personal.contact.wechat || '';
    document.getElementById('contact_phone').value = data.personal.contact.phone || '';
    document.getElementById('contact_location').value = data.personal.contact.location || '';

    const contactVisibility = normalizeContactVisibility(data.personal || {});
    document.getElementById('show_website').checked = contactVisibility.website;
    document.getElementById('show_github').checked = contactVisibility.github;
    document.getElementById('show_email').checked = contactVisibility.email;
    document.getElementById('show_wechat').checked = contactVisibility.wechat;
    document.getElementById('show_phone').checked = contactVisibility.phone;
    document.getElementById('show_location').checked = contactVisibility.location;

    const educationFields = document.getElementById('educationFields');
    educationFields.innerHTML = '';
    data.education.forEach((edu, index) => {
        educationFields.innerHTML += createEducationField(edu, index);
    });

    const experienceFields = document.getElementById('experienceFields');
    experienceFields.innerHTML = '';
    data.experience.forEach((exp, index) => {
        experienceFields.innerHTML += createExperienceField(exp, index);
    });

    const campusFields = document.getElementById('campusFields');
    campusFields.innerHTML = '';
    data.campus.forEach((campus, index) => {
        campusFields.innerHTML += createCampusField(campus, index);
    });

    document.getElementById('skills_languages').value = data.skillsList.languages || '';
    document.getElementById('skills_frameworks').value = data.skillsList.frameworks || '';
    document.getElementById('skills_devops').value = data.skillsList.devops || '';
    document.getElementById('skills_databases').value = data.skillsList.databases || '';
    document.getElementById('skills_cloud').value = data.skillsList.cloud || '';

    document.getElementById('summary').value = data.summary || '';
    document.getElementById('disclaimer').value = data.disclaimer || '';
}

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
                <label>工作描述（每行一条，支持次级项）</label>
                <textarea data-exp-index="${index}" data-exp-field="description" rows="5" placeholder="一级项直接写文字&#10;其他事项&#10;&gt; 门禁系统联调&#10;&gt; 监控与考勤设备排查">${exp.description.join('\n')}</textarea>
                <div class="field-help">
                    一级项目直接写文字；二级项在行首输入 <code>&gt;</code>。<br>
                    示例：<code>其他事项</code><br>
                    <code>&gt; 门禁系统联调</code><br>
                    <code>&gt; 监控与考勤设备排查</code>
                </div>
            </div>
        </div>
    `;
}

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

function addSkill() {
    const container = document.getElementById('skillsFields');
    const index = container.children.length;
    container.innerHTML += createSkillField('', index);
}

function addProfileField() {
    const items = getProfileItemsFromForm();
    items.push({ label: '', value: '', visible: true });
    renderProfileFields(items);
}

function addCertificate() {
    const container = document.getElementById('certificatesFields');
    const index = container.children.length;
    container.innerHTML += createCertificateField('', index);
}

function addEducation() {
    const container = document.getElementById('educationFields');
    const index = container.children.length;
    const edu = { school: '', from: '', to: '', description: [] };
    container.innerHTML += createEducationField(edu, index);
}

function addExperience() {
    const container = document.getElementById('experienceFields');
    const index = container.children.length;
    const exp = { company: '', location: '', from: '', to: '', description: [] };
    container.innerHTML += createExperienceField(exp, index);
}

function addCampus() {
    const container = document.getElementById('campusFields');
    const index = container.children.length;
    const campus = { title: '', place: '', from: '', to: '', description: [] };
    container.innerHTML += createCampusField(campus, index);
}

function removeSkill(index) {
    document.querySelector(`[data-skill-index="${index}"]`).closest('.field-item').remove();
}

function removeCertificate(index) {
    document.querySelector(`[data-cert-index="${index}"]`).closest('.field-item').remove();
}

function removeProfile(index) {
    const items = getProfileItemsFromForm();
    items.splice(index, 1);
    renderProfileFields(items);
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

function collectFormData() {
    const profileItems = getProfileItemsFromForm();
    const contactVisibility = {
        website: document.getElementById('show_website').checked,
        github: document.getElementById('show_github').checked,
        email: document.getElementById('show_email').checked,
        wechat: document.getElementById('show_wechat').checked,
        phone: document.getElementById('show_phone').checked,
        location: document.getElementById('show_location').checked
    };
    const data = {
        personal: {
            name: document.getElementById('name').value,
            title: document.getElementById('title').value,
            avatar: './assets/coam.png',
            profile: {},
            profileItems,
            skills: [],
            certificates: [],
            contact: {
                website: document.getElementById('contact_website').value,
                github: document.getElementById('contact_github').value,
                email: document.getElementById('contact_email').value,
                wechat: document.getElementById('contact_wechat').value,
                phone: document.getElementById('contact_phone').value,
                location: document.getElementById('contact_location').value
            },
            contactVisibility
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

    profileItems.forEach((item) => {
        if (item.visible && item.label && item.value) {
            data.personal.profile[item.label] = item.value;
        }
    });

    document.querySelectorAll('[data-skill-index]').forEach(input => {
        if (input.value.trim()) {
            data.personal.skills.push(input.value);
        }
    });

    document.querySelectorAll('[data-cert-index]').forEach(input => {
        if (input.value.trim()) {
            data.personal.certificates.push(input.value);
        }
    });

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

function closePreview() {
    document.querySelector('.preview-panel').classList.remove('active');
}

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

async function loadResumeFromFile() {
    showLoading();

    try {
        const response = await fetch('/api/resumes');
        if (!response.ok) {
            throw new Error('获取简历列表失败');
        }

        const resumes = await response.json();
        const selectionText = resumes
            .map((item, index) => `${index + 1}. ${item.label}`)
            .join('\n');

        const input = window.prompt(`请输入要加载的简历编号：\n${selectionText}`, '1');
        if (input === null) {
            return;
        }

        const selectedIndex = Number.parseInt(input, 10) - 1;
        const selectedResume = resumes[selectedIndex];

        if (!selectedResume) {
            alert('未找到对应的简历编号');
            return;
        }

        const detailResponse = await fetch(`/api/resume/${encodeURIComponent(selectedResume.name)}`);
        if (!detailResponse.ok) {
            throw new Error('加载简历失败');
        }

        const data = await detailResponse.json();
        resumeData = data;
        currentResumeName = selectedResume.name === DEFAULT_RESUME_NAME ? null : selectedResume.name;
        populateForm(data);
        saveDraftToLocalStorage(data);
        alert(`已加载：${selectedResume.label}`);
    } catch (error) {
        console.error('加载简历失败:', error);
        alert('加载简历失败: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function saveResumeToFile() {
    const data = collectFormData();
    let resumeName = currentResumeName;

    if (!resumeName) {
        const input = window.prompt('请输入简历文件名（无需输入 .json 后缀）', data.personal.name || 'new-resume');
        if (input === null) {
            return;
        }

        resumeName = normalizeResumeName(input);
        if (!resumeName) {
            alert('简历文件名不能为空');
            return;
        }
    }

    showLoading();

    try {
        const response = await fetch(`/api/resume/${encodeURIComponent(resumeName)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || '保存简历失败');
        }

        currentResumeName = result.name;
        resumeData = data;
        saveDraftToLocalStorage(data);
        alert(`简历已保存到 resumes/${result.filename}`);
    } catch (error) {
        console.error('保存简历失败:', error);
        alert('保存简历失败: ' + error.message);
    } finally {
        hideLoading();
    }
}

function normalizeResumeName(name) {
    return String(name || '')
        .trim()
        .replace(/\.json$/i, '')
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
        .replace(/\s+/g, '-');
}

function saveDraftToLocalStorage(data) {
    localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(data));
}

function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}
