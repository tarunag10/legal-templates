import { initTheme } from './theme.js';
import {
  buildTemplateBundle,
  buildTemplateCasePack,
  buildTemplateBundleMetadata,
  buildTemplateLocalActionPack,
  buildMarkdownExport,
  buildTemplateExportMetadata,
  currentGuidance,
  filterTemplates,
  getTemplate,
  getTemplateCategories,
  normalizeFavouriteTemplates,
  renderTemplate,
  sortTemplatesWithFavourites
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
const downloadMarkdownButton = document.querySelector('#downloadMarkdown');
const copyBundleButton = document.querySelector('#copyBundle');
const copyCasePackButton = document.querySelector('#copyCasePack');
const copyLocalActionPackButton = document.querySelector('#copyLocalActionPack');
const downloadBundleMarkdownButton = document.querySelector('#downloadBundleMarkdown');
const downloadBundleTextButton = document.querySelector('#downloadBundleText');
const favouriteButton = document.querySelector('#favouriteTemplate');
const selectFavouritesButton = document.querySelector('#selectFavourites');
const showFavourites = document.querySelector('#showFavourites');
const bundleOptions = document.querySelector('#bundle-options');
const catalogueCards = document.querySelector('#catalogue-cards');
const currentGuidanceMount = document.querySelector('#current-guidance');
const favouritesKey = 'open-access-uk:legal-templates:favourites';

function getFavourites() {
  try {
    return normalizeFavouriteTemplates(JSON.parse(localStorage.getItem(favouritesKey) || '[]'));
  } catch {
    return [];
  }
}

function setFavourites(ids) {
  localStorage.setItem(favouritesKey, JSON.stringify(normalizeFavouriteTemplates(ids)));
}

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
  const favourites = getFavourites();
  const filtered = filterTemplates({ category: categorySelect.value, query: searchInput.value });
  const templates = showFavourites.checked
    ? sortTemplatesWithFavourites(filtered, favourites)
    : filtered;
  templateSelect.replaceChildren(
    ...templates.map((template) => option(template.id, favourites.includes(template.id) ? `★ ${template.title}` : template.title))
  );
  if (templates.some((template) => template.id === selectedId)) {
    templateSelect.value = selectedId;
  }
  if (!templateSelect.value && templates[0]) {
    templateSelect.value = templates[0].id;
  }
  renderCatalogue(templates, favourites);
  renderBundleOptions(templates, favourites);
}

function renderCatalogue(templates, favourites = []) {
  catalogueCards.replaceChildren(
    ...templates.map((template) => {
      const card = document.createElement('article');
      card.className = 'card';
      const heading = document.createElement('h3');
      heading.textContent = template.title;
      const category = document.createElement('p');
      category.className = 'tag';
      category.textContent = favourites.includes(template.id) ? `★ ${template.category}` : template.category;
      const summary = document.createElement('p');
      summary.textContent = template.summary;
      card.append(heading, category, summary);
      return card;
    })
  );
}

function renderBundleOptions(templates, favourites = []) {
  bundleOptions.replaceChildren(
    ...templates.map((template) => {
      const label = document.createElement('label');
      label.className = 'checkbox-row';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.name = 'bundleTemplate';
      input.value = template.id;
      input.checked = favourites.includes(template.id);
      label.append(input, document.createTextNode(` ${template.title}`));
      return label;
    })
  );
}

function renderCurrentGuidance() {
  currentGuidanceMount.replaceChildren(
    ...currentGuidance.map((item) => {
      const card = document.createElement('article');
      card.className = 'card';
      const heading = document.createElement('h3');
      heading.textContent = item.title;
      const detail = document.createElement('p');
      detail.textContent = item.detail;
      const link = document.createElement('a');
      link.href = item.url;
      link.rel = 'noreferrer';
      link.textContent = item.source;
      card.append(heading, detail, link);
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

function downloadMarkdown() {
  const data = values();
  const metadata = buildTemplateExportMetadata(data.template, data);
  const filename = metadata.filename.replace(/\.txt$/, '.md');
  const blob = new Blob([buildMarkdownExport(data.template, data)], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  status.textContent = `Downloaded ${filename}. Nothing was sent to a server.`;
}

function selectedBundleIds() {
  return [...bundleOptions.querySelectorAll('input[name="bundleTemplate"]:checked')]
    .map((input) => input.value);
}

function buildBundle(format = 'markdown') {
  const ids = selectedBundleIds();
  if (ids.length === 0) {
    status.textContent = 'Choose at least one template for the pack.';
    return null;
  }
  return {
    bundle: buildTemplateBundle(ids, values(), { format }),
    metadata: buildTemplateBundleMetadata(ids, values(), { format })
  };
}

async function copyBundle() {
  const result = buildBundle('text');
  if (!result) return;
  try {
    await navigator.clipboard?.writeText(result.bundle.content);
    status.textContent = `Copied ${result.metadata.title.toLowerCase()} locally. Nothing was sent to a server.`;
  } catch {
    status.textContent = 'Copy failed. You can still download the pack or copy each preview manually.';
  }
}

async function copyCasePack() {
  const ids = selectedBundleIds();
  if (ids.length === 0) {
    status.textContent = 'Choose at least one template for the case pack.';
    return;
  }
  try {
    await navigator.clipboard?.writeText(buildTemplateCasePack(ids, values()).markdown);
    status.textContent = 'Case pack copied locally. Nothing was sent to a server.';
  } catch {
    status.textContent = 'Copy failed. You can still download the pack or copy each preview manually.';
  }
}

async function copyLocalActionPack() {
  const ids = selectedBundleIds();
  const actionIds = ids.length > 0 ? ids : [values().template];
  try {
    await navigator.clipboard?.writeText(buildTemplateLocalActionPack(actionIds, values()).markdown);
    status.textContent = 'Local action pack copied locally. Nothing was sent to a server.';
  } catch {
    status.textContent = 'Copy failed. You can still download the pack or copy each preview manually.';
  }
}

function downloadBundle(format = 'markdown') {
  const result = buildBundle(format);
  if (!result) return;
  const blob = new Blob([result.bundle.content], { type: result.metadata.mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = result.metadata.filename;
  link.click();
  URL.revokeObjectURL(url);
  status.textContent = `Downloaded ${result.metadata.filename}. Nothing was sent to a server.`;
}

function selectFavouriteTemplates() {
  const favourites = getFavourites();
  const boxes = bundleOptions.querySelectorAll('input[name="bundleTemplate"]');
  for (const box of boxes) {
    box.checked = favourites.includes(box.value);
  }
  status.textContent = favourites.length > 0 ? 'Selected local favourites for the pack.' : 'No local favourites saved yet.';
}

function toggleFavourite() {
  const data = values();
  const favourites = getFavourites();
  const next = favourites.includes(data.template)
    ? favourites.filter((id) => id !== data.template)
    : [...favourites, data.template];
  setFavourites(next);
  populateTemplates(data.template);
  update();
  status.textContent = next.includes(data.template) ? 'Template saved as a local favourite.' : 'Template removed from local favourites.';
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
downloadMarkdownButton.addEventListener('click', downloadMarkdown);
copyBundleButton.addEventListener('click', copyBundle);
copyCasePackButton.addEventListener('click', copyCasePack);
copyLocalActionPackButton.addEventListener('click', copyLocalActionPack);
downloadBundleMarkdownButton.addEventListener('click', () => downloadBundle('markdown'));
downloadBundleTextButton.addEventListener('click', () => downloadBundle('text'));
favouriteButton.addEventListener('click', toggleFavourite);
selectFavouritesButton.addEventListener('click', selectFavouriteTemplates);
showFavourites.addEventListener('change', () => {
populateTemplates();
update();
renderCurrentGuidance();
});
update();

initTheme('#theme-toggle');

const navToggle = document.querySelector('.nav-toggle');
const primaryNav = document.querySelector('#primary-nav');
navToggle?.addEventListener('click', () => {
  const open = navToggle.getAttribute('aria-expanded') !== 'true';
  navToggle.setAttribute('aria-expanded', String(open));
  primaryNav?.classList.toggle('is-open', open);
});
