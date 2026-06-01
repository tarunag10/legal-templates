import {
  buildTemplateExportMetadata,
  filterTemplates,
  getTemplate,
  getTemplateCategories,
  renderTemplate
} from './templates.js';

const form = document.querySelector('form');
const output = document.querySelector('#output');
const templateSelect = document.querySelector('#template');
const categorySelect = document.querySelector('#category');
const searchInput = document.querySelector('#search');
const templateSummary = document.querySelector('#template-summary');
const status = document.querySelector('#status');
const copyButton = document.querySelector('#copyTemplate');
const downloadButton = document.querySelector('#downloadTemplate');
const catalogueCards = document.querySelector('#catalogue-cards');

function option(value, label) {
  const element = document.createElement('option');
  element.value = value;
  element.textContent = label;
  return element;
}

function populateCategories() {
  categorySelect.replaceChildren(
    option('All', 'All categories'),
    ...getTemplateCategories().map((category) => option(category.name, `${category.name} (${category.count})`))
  );
}

function populateTemplates(selectedId = templateSelect.value) {
  const templates = filterTemplates({ category: categorySelect.value, query: searchInput.value });
  templateSelect.replaceChildren(
    ...templates.map((template) => option(template.id, template.title))
  );
  if (templates.some((template) => template.id === selectedId)) {
    templateSelect.value = selectedId;
  }
  if (!templateSelect.value && templates[0]) {
    templateSelect.value = templates[0].id;
  }
  renderCatalogue(templates);
}

function renderCatalogue(templates) {
  catalogueCards.replaceChildren(
    ...templates.map((template) => {
      const card = document.createElement('article');
      card.className = 'card';
      const heading = document.createElement('h3');
      heading.textContent = template.title;
      const category = document.createElement('p');
      category.className = 'tag';
      category.textContent = template.category;
      const summary = document.createElement('p');
      summary.textContent = template.summary;
      card.append(heading, category, summary);
      return card;
    })
  );
}

function values() {
  return Object.fromEntries(new FormData(form).entries());
}

function update() {
  const data = values();
  if (!data.template) {
    templateSummary.textContent = 'No templates match the current filter.';
    output.textContent = '';
    return;
  }
  const template = getTemplate(data.template);
  templateSummary.textContent = `${template.category}: ${template.summary} ${template.safety}`;
  output.textContent = renderTemplate(data.template, data);
}

async function copyTemplate() {
  try {
    await navigator.clipboard?.writeText(output.textContent);
    status.textContent = 'Template copied locally. Nothing was sent to a server.';
  } catch {
    status.textContent = 'Copy failed. You can still select and copy the preview manually.';
  }
}

function downloadTemplate() {
  const data = values();
  const metadata = buildTemplateExportMetadata(data.template, data);
  const blob = new Blob([output.textContent], { type: metadata.mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = metadata.filename;
  link.click();
  URL.revokeObjectURL(url);
  status.textContent = `Downloaded ${metadata.filename}. Nothing was sent to a server.`;
}

populateCategories();
populateTemplates('refund-request');
templateSelect.value = 'refund-request';
form.addEventListener('input', (event) => {
  if (event.target === categorySelect || event.target === searchInput) {
    populateTemplates();
  }
  update();
});
form.addEventListener('submit', (event) => {
  event.preventDefault();
  copyTemplate();
});
copyButton.addEventListener('click', copyTemplate);
downloadButton.addEventListener('click', downloadTemplate);
update();
