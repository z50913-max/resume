// Pug 文件生成器 - 根据 JSON 数据生成完整的 resume.pug 文件

// 转义 Pug 特殊字符
function escapePug(str) {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')  // 反斜杠
    .replace(/"/g, '\\"');    // 双引号
}

// 生成完整的 Pug 文件内容
function generatePugFile(data) {
  // 生成教育背景部分
  const educationSection = data.education.map(edu => {
    const descriptions = edu.description.map(line => `\t\t\t\t\t- ${line}`).join('\n');
    return `\t\t\t+item("${escapePug(edu.school)}", null, null, "${edu.from}", "${edu.to}")
\t\t\t\t:markdown-it
${descriptions}`;
  }).join('\n\n');

  // 生成工作经验部分（前3条）
  const experienceFirst = data.experience.slice(0, 3).map(exp => {
    const descriptions = exp.description.map(line => `\t\t\t\t\t- ${line}`).join('\n');
    return `\t\t\t+item("${escapePug(exp.company)}", null, "${escapePug(exp.location)}", "${exp.from}", "${exp.to}")
\t\t\t\t:markdown-it
${descriptions}`;
  }).join('\n\n');

  // 生成工作经验部分（后续）
  const experienceRest = data.experience.slice(3).map(exp => {
    const descriptions = exp.description.map(line => `\t\t\t\t\t- ${line}`).join('\n');
    return `\t\t\t+item("${escapePug(exp.company)}", null, "${escapePug(exp.location)}", "${exp.from}", "${exp.to}")
\t\t\t\t:markdown-it
${descriptions}`;
  }).join('\n\n');

  // 生成个人简介列表
  const profileList = Object.entries(data.personal.profile)
    .map(([key, value]) => `\t\t\t\tli ${key}: ${value}`)
    .join('\n');

  // 生成技能列表
  const skillsList = data.personal.skills
    .map(skill => `\t\t\t\tli ${skill}`)
    .join('\n');

  // 生成证书列表
  const certsList = data.personal.certificates
    .map(cert => `\t\t\t\tli ${cert}`)
    .join('\n');

  // 生成联系方式列表
  const contactList = [];
  if (data.personal.contact.website) contactList.push(`\t\t\t\tli #[i.fa.fa-globe] ${data.personal.contact.website}`);
  if (data.personal.contact.github) contactList.push(`\t\t\t\tli #[i.fa.fa-github] ${data.personal.contact.github}`);
  if (data.personal.contact.email) contactList.push(`\t\t\t\tli #[i.fa.fa-envelope] ${data.personal.contact.email}`);
  if (data.personal.contact.wechat) contactList.push(`\t\t\t\tli #[i.fa.fa-weixin] ${data.personal.contact.wechat}`);
  if (data.personal.contact.phone) contactList.push(`\t\t\t\tli #[i.fa.fa-phone] ${data.personal.contact.phone}`);
  if (data.personal.contact.location) contactList.push(`\t\t\t\tli #[i.fa.fa-location-arrow] ${data.personal.contact.location}`);

  // 生成校园经历
  const campusSection = data.campus.map(campus => {
    if (campus.place) {
      const descriptions = campus.description.map(line => `\t\t\t\t\t- ${line}`).join('\n');
      return `\t\t\t+item("${escapePug(campus.title)}", "${escapePug(campus.place)}", null, "${campus.from}", "${campus.to}")
\t\t\t\t:markdown-it
${descriptions}`;
    } else {
      const descriptions = campus.description.map(line => `\t\t\t\t\t\t${line}`).join('\n');
      return `\t\t\t+item("${escapePug(campus.title)}")
\t\t\t\t.concise
\t\t\t\t\t:markdown-it
${descriptions}`;
    }
  }).join('\n\n');

  // 生成完整的校园经历部分（包括标题），只有当有数据时才生成
  const campusFullSection = data.campus && data.campus.length > 0 ? `
\t\t.items.concise
\t\t\th2 #[i.fa.fa-eercast] 校园经历

${campusSection}
` : '';

  // 生成免责声明
  const disclaimerLines = data.disclaimer.split('\n')
    .map(line => `\t\t\tp ${line}`)
    .join('\n');

  // 组装完整的 Pug 文件
  return `include mixins

.pages
\t.container
\t\t.header
\t\t\th1 ${data.personal.name}
\t\t\t.subtitle ${data.personal.title}

\t\t.items
\t\t\th2 #[i.fa.fa-graduation-cap] 教育背景

${educationSection}

\t\t.items
\t\t\th2 #[i.fa.fa-hashtag] 工作经验

${experienceFirst}

\t.sidebar
\t\tdiv.header
\t\t\timg(src="${data.personal.avatar}")
\t\t.contact.side-block
\t\t\th1 个人简介
\t\t\tul
${profileList}

\t\t\th1 开发技能
\t\t\tul
${skillsList}

\t\t\th1 技能证书
\t\t\tul
${certsList}

\t\t.skills.side-block
\t\t\th1 联系方式
\t\t\tul
${contactList.join('\n')}

\t\t.disclaimer.side-block
${disclaimerLines}

.pages
\t.container
\t\t.items
${experienceRest}
${campusFullSection}
\t\t.abstract
\t\t\t:markdown-it(html=true)
\t\t\t\t### 技能清单
\t\t\t\t* 开发语言: \`${data.skillsList.languages}\`
\t\t\t\t* 开发框架: \`${data.skillsList.frameworks}\`
\t\t\t\t* 运维开发: \`${data.skillsList.devops}\`
\t\t\t\t* 数据库相关: \`${data.skillsList.databases}\`
\t\t\t\t* 云开放平台: ${data.skillsList.cloud}

\t\t\t\t${data.summary}

\t.sidebar
\t\t.disclaimer.side-block
${disclaimerLines}

style
\tinclude resume.scss
`;
}

module.exports = { generatePugFile };
