// ===== src/app.js =====
// ===== src/app.js =====



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

const collectionNameInput = document.querySelector('#collectionName');
const addToCollectionBtn = document.querySelector('#addToCollection');
const collectionsMount = document.querySelector('#collections');

function loadCollections() {
  try {
    return parseCollections(localStorage.getItem(COLLECTIONS_KEY));
  } catch {
    return {};
  }
}

function saveCollections(state) {
  try {
    localStorage.setItem(COLLECTIONS_KEY, serializeCollections(state));
  } catch {
    /* private mode */
  }
}

function renderCollections() {
  if (!collectionsMount) return;
  const state = loadCollections();
  const names = Object.keys(state);
  if (!names.length) {
    collectionsMount.replaceChildren();
    return;
  }
  collectionsMount.replaceChildren(
    ...names.map((name) => {
      const card = document.createElement('article');
      card.className = 'card';
      const h3 = document.createElement('h3');
      h3.textContent = name;
      const p = document.createElement('p');
      p.textContent = `${state[name].length} template(s): ${state[name].join(', ')}`;
      card.append(h3, p);
      return card;
    })
  );
}

addToCollectionBtn?.addEventListener('click', () => {
  const name = collectionNameInput?.value?.trim();
  const id = values().template;
  if (!name || !id) {
    status.textContent = 'Enter a collection name and choose a template first.';
    return;
  }
  saveCollections(addToCollection(loadCollections(), name, id));
  renderCollections();
  status.textContent = `Added "${id}" to collection "${name}" locally.`;
});

renderCollections();

document.querySelector('#printTemplate')?.addEventListener('click', () => window.print());

const navToggle = document.querySelector('.nav-toggle');
const primaryNav = document.querySelector('#primary-nav');
navToggle?.addEventListener('click', () => {
  const open = navToggle.getAttribute('aria-expanded') !== 'true';
  navToggle.setAttribute('aria-expanded', String(open));
  primaryNav?.classList.toggle('is-open', open);
});


// ===== src/theme.js =====
const __m1__Users_tarunagarwal_Documents_1_App_Developement_Tarun_Open_Access_UK_legal_templates_src_theme_js = (() => {
// <app>/src/theme.js

function readStored() {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStored(value) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, value);
  } catch {
    /* private mode: theme still applies for this session */
  }
}

function apply(theme, toggle) {
  document.documentElement.setAttribute('data-theme', theme);
  if (toggle) {
    toggle.setAttribute('aria-pressed', String(theme === 'dark'));
    toggle.textContent = theme === 'dark' ? 'Light theme' : 'Dark theme';
  }
}

function initTheme(toggleSelector = '#theme-toggle') {
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  const toggle = document.querySelector(toggleSelector);
  let theme = resolveInitialTheme({ stored: readStored(), prefersDark });
  apply(theme, toggle);

  toggle?.addEventListener('click', () => {
    theme = nextTheme(theme);
    apply(theme, toggle);
    writeStored(theme);
  });
}

return { initTheme };
})();

// ===== ../shared/theme/index.mjs =====
const __m2__Users_tarunagarwal_Documents_1_App_Developement_Tarun_Open_Access_UK_shared_theme_index_mjs = (() => {
// shared/theme/index.mjs
const THEME_STORAGE_KEY = 'open-access-uk:theme';

const VALID = new Set(['light', 'dark']);

function resolveInitialTheme({ stored, prefersDark } = {}) {
  if (VALID.has(stored)) return stored;
  return prefersDark ? 'dark' : 'light';
}

function nextTheme(current) {
  return current === 'dark' ? 'light' : 'dark';
}

return { THEME_STORAGE_KEY, resolveInitialTheme, nextTheme };
})();

// ===== ../shared/collections/index.mjs =====
const __m3__Users_tarunagarwal_Documents_1_App_Developement_Tarun_Open_Access_UK_shared_collections_index_mjs = (() => {
const COLLECTIONS_KEY = 'open-access-uk:legal-templates:collections';

function addToCollection(state, name, id) {
  const key = String(name).trim();
  const value = String(id).trim();
  if (!key || !value) return state;
  const existing = Array.isArray(state[key]) ? state[key] : [];
  if (existing.includes(value)) return state;
  return { ...state, [key]: [...existing, value] };
}

function removeFromCollection(state, name, id) {
  if (!Array.isArray(state[name])) return state;
  const next = state[name].filter((x) => x !== id);
  const copy = { ...state };
  if (next.length) copy[name] = next;
  else delete copy[name];
  return copy;
}

function serializeCollections(state) {
  return JSON.stringify(state || {});
}

function parseCollections(value) {
  try {
    const parsed = JSON.parse(value || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const clean = {};
    for (const [name, ids] of Object.entries(parsed)) {
      if (Array.isArray(ids)) clean[name] = ids.filter((x) => typeof x === 'string');
    }
    return clean;
  } catch {
    return {};
  }
}

return { COLLECTIONS_KEY, addToCollection, removeFromCollection, serializeCollections, parseCollections };
})();

// ===== src/templates.js =====
const __m4__Users_tarunagarwal_Documents_1_App_Developement_Tarun_Open_Access_UK_legal_templates_src_templates_js = (() => {
const sharedSafety = 'This is a template, not legal advice. Check deadlines, contract terms, local procedures, and whether specialist advice is needed before sending.';

const localActionRules = {
  'refund-request': {
    evidence: ['Receipt, order confirmation, photos, product page, trader messages, and repair or replacement history.'],
    safety: ['Check whether the trader has already had a chance to repair or replace and whether any return window is relevant.'],
    nextSteps: ['Put the 14-day response date in your calendar and keep a copy of the sent refund request.'],
    escalation: ['If the trader refuses, ask for written reasons and check the card-provider, ombudsman, ADR, or small-claim route before acting.']
  },
  'chargeback-bank-complaint': {
    evidence: ['Receipts, order confirmations, cancellation emails, delivery evidence, trader correspondence, transaction dates, and bank complaint references.'],
    safety: ['Remove full card numbers, PINs, passwords, security answers, and unnecessary private details.'],
    nextSteps: ['Put the bank complaint and chargeback follow-up dates in your calendar.'],
    escalation: ['Ask for the final-response route and when the Financial Ombudsman Service may be available.']
  },
  'landlord-repair-notice': {
    evidence: ['Photos, videos, repair reports, dated messages, inspection notes, rent account references, and access availability.'],
    safety: ['Keep paying rent unless you have taken advice, and report urgent health and safety risks promptly.'],
    nextSteps: ['Calendar the inspection or repair deadline and keep a dated log of access attempts.'],
    escalation: ['If repairs are delayed, ask for the complaints route and check council private-rented-sector or specialist housing advice.']
  },
  'subject-access-request': {
    evidence: ['Proof of identity checks, request date, delivery receipt, account references, clarification messages, and the response deadline.'],
    safety: ['Do not send more identity documents than necessary and keep copies of any clarification requested.'],
    nextSteps: ['Calendar one month from receipt unless a lawful extension is explained.'],
    escalation: ['If there is no response, ask for an internal review or complaint route and consider the ICO complaint route.']
  },
  'university-adjustment-request': {
    evidence: ['Support plan, medical or disability evidence, assessment timetable, placement details, emails, and staff contact names.'],
    safety: ['Check exam, placement, accommodation, and appeal deadlines before waiting for a routine reply.'],
    nextSteps: ['Calendar the decision date and ask for interim support where a deadline is close.'],
    escalation: ['Ask for disability support, student complaints, appeal, or OIA-route information if the issue remains unresolved.']
  },
  'rail-delay-compensation': {
    evidence: ['Ticket, booking reference, planned itinerary, actual arrival time, disruption screenshots, and operator messages.'],
    safety: ['Check the operator claim window and keep the original ticket evidence until the claim is resolved.'],
    nextSteps: ['Submit through the operator route and calendar the expected response date.'],
    escalation: ['If rejected, ask for written reasons and the passenger complaints or ombudsman route.']
  },
  'airline-accessibility-complaint': {
    evidence: ['Booking reference, assistance confirmation, boarding pass, photos, mobility-aid evidence, staff names, and witness details.'],
    safety: ['For future travel, separately confirm assistance, handover points, and mobility-aid arrangements before the journey.'],
    nextSteps: ['Calendar the complaint follow-up date and keep travel documents together.'],
    escalation: ['Ask for the airline or airport escalation route and check CAA or approved ADR options where applicable.']
  },
  'council-escalation': {
    evidence: ['Complaint reference, decision letters, photos, officer names, dates of contact, and evidence of practical impact.'],
    safety: ['Check the council complaint stage and any urgent statutory review or appeal route before relying on complaint escalation alone.'],
    nextSteps: ['Calendar the target response date and note the responsible team or officer.'],
    escalation: ['Ask when the Local Government and Social Care Ombudsman route may become available.']
  }
};

const currentGuidance = [
  {
    title: 'Consumer refunds and remedies',
    detail: 'GOV.UK says traders must offer a full refund when an item is faulty, not as described, or does not do what it is supposed to do; repair or replacement rights can also apply.',
    source: 'GOV.UK returns and refunds',
    url: 'https://www.gov.uk/accepting-returns-and-giving-refunds'
  },
  {
    title: 'Subject access requests',
    detail: 'ICO guidance says subject access requests can be verbal or written and should be answered without undue delay and within one month unless an extension lawfully applies.',
    source: 'ICO subject access guidance',
    url: 'https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/subject-access-requests/a-guide-to-subject-access/'
  },
  {
    title: 'FOI timing and accessible help',
    detail: 'GOV.UK says FOI requests are normally written requests, public authorities should help if disability prevents writing, and responses should usually arrive within 20 working days.',
    source: 'GOV.UK FOI requests',
    url: 'https://www.gov.uk/make-a-freedom-of-information-request/how-to-make-an-foi-request'
  },
  {
    title: 'Before court',
    detail: 'Civil pre-action guidance expects parties to exchange enough information to understand each other’s position, consider settlement or ADR, and reduce avoidable costs.',
    source: 'Civil Procedure Rules pre-action conduct',
    url: 'https://www.justice.gov.uk/courts/procedure-rules/civil/rules/pd_pre-action_conduct'
  }
];

const templateCatalogue = {
  'refund-request': {
    title: 'Refund request',
    category: 'Consumer',
    summary: 'Ask a trader for a refund, repair, replacement, repeat performance, or price reduction.',
    fields: ['trader', 'item', 'date', 'outcome', 'evidence', 'name'],
    safety: 'Useful for goods, services, or digital content. Rights and remedies depend on what was bought, when the problem appeared, and whether the trader has already had a chance to repair or replace.',
    render: ({ trader = 'the trader', item = 'the item or service', date = 'the purchase date', outcome = 'a refund', evidence = 'I can provide receipts, photos, correspondence, or other evidence', name = 'Your name' } = {}) => `Dear ${trader},

Refund or remedy request: ${item}

I am writing about ${item}, purchased or ordered on ${date}. I believe the trader is responsible for providing an appropriate remedy under the Consumer Rights Act 2015 because goods should be of satisfactory quality, fit for purpose, and as described, and services should be carried out with reasonable care and skill.

The problem is:
[Briefly explain what went wrong, when you noticed it, and what you have already tried.]

I am asking for: ${outcome}.

${evidence}.

Please respond within 14 days. If you reject this request, please explain the reason in writing and identify any alternative remedy you will offer.

Yours faithfully,
${name}`
  },
  'chargeback-bank-complaint': {
    title: 'Chargeback or bank complaint',
    category: 'Money',
    summary: 'Ask a bank or card provider to consider chargeback, Section 75, or a complaint about a disputed card purchase.',
    fields: ['organisation', 'item', 'date', 'amount', 'outcome', 'evidence', 'name'],
    safety: 'Chargeback scheme rules and Section 75 are different. Section 75 usually depends on credit, cash price, and the debtor-creditor-supplier link. Avoid sending full card numbers.',
    render: ({ organisation = 'the bank or card provider', item = 'the disputed purchase', date = 'the transaction date', amount = 'the amount paid', outcome = 'a chargeback or Section 75 assessment', evidence = 'I can provide receipts, order confirmations, cancellation emails, delivery evidence, or trader correspondence', name = 'Your name' } = {}) => `Dear ${organisation},

Card dispute and complaint: ${item}

I am asking you to review ${item}, paid for on ${date} for ${amount}. Please consider whether you can raise a chargeback and whether Section 75 of the Consumer Credit Act 1974 or another card-protection route may apply.

The trader issue is:
[Explain non-delivery, misdescription, cancellation, faulty goods, poor service, or refusal to refund.]

The outcome I am seeking is: ${outcome}.

${evidence}.

If you decide not to raise or continue a chargeback, or you reject a Section 75 or complaint route, please provide written reasons and tell me how to escalate to your final-response process and the Financial Ombudsman Service.

Yours faithfully,
${name}`
  },
  'landlord-repair-notice': {
    title: 'Landlord repair notice',
    category: 'Housing',
    summary: 'Notify a landlord or agent about disrepair, safety issues, access arrangements, and a response deadline.',
    fields: ['organisation', 'property', 'item', 'date', 'outcome', 'evidence', 'name'],
    safety: 'Housing law differs across the UK. Keep paying rent unless you have taken advice. Report urgent health and safety risks promptly.',
    render: ({ organisation = 'the landlord or letting agent', property = 'the property', item = 'the repair issue', date = 'the date first reported', outcome = 'inspection and repair dates', evidence = 'I have photos, messages, and dates of previous reports', name = 'Your name' } = {}) => `Dear ${organisation},

Repair notice: ${property}

I am writing about ${item} at ${property}. I first reported or noticed this on ${date}.

The problem is:
[Describe the disrepair, affected rooms, safety concerns, impact on heating, water, electrics, damp, security, or access.]

Please confirm ${outcome}. Please also give at least 24 hours' written notice before any inspection or visit unless this is a genuine emergency.

${evidence}.

If you do not accept responsibility for the repair, please explain your position in writing and provide your complaints process.

Yours faithfully,
${name}`
  },
  'subject-access-request': {
    title: 'Subject access request',
    category: 'Data protection',
    summary: 'Ask an organisation for your personal data under UK GDPR.',
    fields: ['organisation', 'item', 'date', 'outcome', 'name'],
    safety: 'Organisations normally must respond without undue delay and within one month. They may need identity checks or clarification for broad requests.',
    render: ({ organisation = 'the organisation', item = 'my personal data', date = 'the relevant date range', outcome = 'copies of my personal data and the required supplementary information', name = 'Your name' } = {}) => `Dear ${organisation},

Subject access request

Please treat this as a subject access request under UK data protection law.

I am asking for ${outcome} relating to ${item}. The relevant period is ${date}.

Please include personal data held in emails, case notes, account records, call notes, complaints, application records, automated decision-making records, and correspondence where applicable. If you need identification or clarification, please tell me promptly.

Please respond without undue delay and within one month unless a lawful extension applies.

Yours faithfully,
${name}`
  },
  'university-adjustment-request': {
    title: 'University adjustment request',
    category: 'Education',
    summary: 'Ask a university, college, or placement provider for disability adjustments.',
    fields: ['organisation', 'item', 'date', 'outcome', 'evidence', 'name'],
    safety: 'Use urgent wording for exams, placements, deadlines, disciplinary processes, or accommodation issues with fixed dates.',
    render: ({ organisation = 'the university or college', item = 'the course, exam, placement, or service', date = 'the relevant date', outcome = 'reasonable adjustments', evidence = 'I can provide disability evidence if required and proportionate', name = 'Your name' } = {}) => `Dear ${organisation},

Reasonable adjustment request: ${item}

I am asking for ${outcome} for ${item}, relevant to ${date}. Education providers should consider reasonable adjustments so disabled students are not placed at a substantial disadvantage.

The barrier is:
[Explain the rule, environment, assessment format, communication issue, or timetable problem.]

The adjustment I am requesting is:
[Set out the adjustment clearly, including dates and any interim support.]

${evidence}.

Please confirm the decision, who is responsible for implementation, whether staff need to be notified, and the review or appeal route if any adjustment is refused.

Yours faithfully,
${name}`
  },
  'rail-delay-compensation': {
    title: 'Rail delay compensation',
    category: 'Travel',
    summary: 'Request Delay Repay or rail compensation after a delayed or cancelled train journey.',
    fields: ['organisation', 'item', 'date', 'amount', 'outcome', 'evidence', 'name'],
    safety: 'Compensation depends on the operator, ticket, arrival delay, and Passenger Charter or Delay Repay rules. Keep tickets and journey evidence.',
    render: ({ organisation = 'the train company', item = 'the delayed journey', date = 'the journey date', amount = 'the fare paid', outcome = 'Delay Repay compensation', evidence = 'I attach or can provide my ticket, booking reference, planned itinerary, actual arrival time, and disruption evidence', name = 'Your name' } = {}) => `Dear ${organisation},

Rail compensation request: ${item}

I am requesting ${outcome} for ${item} on ${date}. I paid ${amount}.

Planned journey:
[Add origin, destination, booked train, and scheduled arrival time.]

What happened:
[Add cancelled or delayed service details and actual arrival time.]

${evidence}.

Please assess this under Delay Repay, your Passenger Charter, and the National Rail Conditions of Travel. If you reject the claim, please provide written reasons and the escalation route.

Yours faithfully,
${name}`
  },
  'airline-accessibility-complaint': {
    title: 'Airline assistance complaint',
    category: 'Travel',
    summary: 'Complain about airline or airport accessibility assistance failures.',
    fields: ['organisation', 'item', 'date', 'outcome', 'evidence', 'name'],
    safety: 'For urgent future travel, ask separately for immediate assistance confirmation. Keep boarding passes, assistance bookings, photos, and names where available.',
    render: ({ organisation = 'the airline or airport', item = 'the assistance failure', date = 'the travel date', outcome = 'an explanation, apology, remedy, and assurance it will not happen again', evidence = 'I can provide booking references, boarding passes, assistance confirmations, photos, or witness details', name = 'Your name' } = {}) => `Dear ${organisation},

Accessibility complaint: ${item}

I am complaining about ${item} on ${date}. Disabled passengers and passengers with reduced mobility are entitled to assistance, and accessibility arrangements should be handled with dignity and care.

What happened:
[Explain the assistance booked, what failed, where it happened, who was involved, and the impact.]

The outcome I am seeking is: ${outcome}.

${evidence}.

Please explain what went wrong, what records you hold about the assistance request, what corrective action you will take, and how I can escalate the complaint if your response is not satisfactory.

Yours faithfully,
${name}`
  },
  'council-escalation': {
    title: 'Council escalation',
    category: 'Public services',
    summary: 'Escalate a council service problem after the first response has not resolved it.',
    fields: ['organisation', 'item', 'date', 'outcome', 'evidence', 'name'],
    safety: 'Use the council complaints process before going to the Local Government and Social Care Ombudsman unless there is a special urgent route.',
    render: ({ organisation = 'the council', item = 'the service problem', date = 'the date of the original complaint', outcome = 'a stage-two review or formal escalation', evidence = 'I can provide the complaint reference, emails, photos, decision letters, and dates of contact', name = 'Your name' } = {}) => `Dear ${organisation},

Complaint escalation: ${item}

I am asking for ${outcome} because my complaint about ${item}, first raised on ${date}, has not been resolved.

What remains unresolved:
[List the decision, delay, communication failure, access issue, or service failure.]

Impact:
[Explain practical impact, urgency, cost, health, housing, education, care, or accessibility consequences.]

${evidence}.

Please confirm the current complaint stage, the target response date, the officer responsible, and the next escalation route, including when I may approach the Local Government and Social Care Ombudsman if the matter remains unresolved.

Yours faithfully,
${name}`
  }
};

function getTemplate(id) {
  const template = templateCatalogue[id];
  if (!template) throw new Error('Unknown template');
  return template;
}

function renderTemplate(id, facts = {}) {
  const template = getTemplate(id);
  return `${template.render(facts)}

---
Safety note: ${template.safety} ${sharedSafety}`;
}

function filterTemplates({ category = 'All', query = '' } = {}) {
  const queryTerms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return Object.entries(templateCatalogue)
    .map(([id, template]) => ({ id, ...template }))
    .filter((template) => category === 'All' || !category || template.category === category)
    .filter((template) => {
      if (queryTerms.length === 0) return true;
      const haystack = [
        template.id,
        template.title,
        template.category,
        template.summary,
        template.safety,
        ...(template.fields || [])
      ].join(' ').toLowerCase();
      return queryTerms.every((term) => haystack.includes(term));
    });
}

function getTemplateCategories() {
  const counts = new Map();
  for (const template of Object.values(templateCatalogue)) {
    counts.set(template.category, (counts.get(template.category) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function buildTemplateExportMetadata(id, facts = {}) {
  const template = getTemplate(id);
  const subject = slugify(facts.item || facts.property || facts.organisation || template.title);
  const filename = [id, subject].filter(Boolean).join('-') + '.txt';
  return {
    title: template.title,
    filename,
    mimeType: 'text/plain;charset=utf-8'
  };
}

function normalizeFavouriteTemplates(value = []) {
  const seen = new Set();
  const ids = Array.isArray(value) ? value : [];
  return ids.filter((id) => {
    if (!templateCatalogue[id] || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function sortTemplatesWithFavourites(templates, favouriteIds = []) {
  const favourites = new Set(normalizeFavouriteTemplates(favouriteIds));
  return [...templates].sort((a, b) => {
    const aFav = favourites.has(a.id);
    const bFav = favourites.has(b.id);
    if (aFav !== bFav) return aFav ? -1 : 1;
    return a.title.localeCompare(b.title);
  });
}

function buildMarkdownExport(id, facts = {}) {
  const template = getTemplate(id);
  const rendered = renderTemplate(id, facts);
  return `# ${template.title}

${template.summary}

Category: ${template.category}

\`\`\`text
${rendered}
\`\`\`
`;
}

function normalizeBundleIds(ids = []) {
  return normalizeFavouriteTemplates(ids);
}

function templateBundleSubject(facts = {}, templates = []) {
  return facts.organisation || facts.trader || facts.property || facts.item || templates[0]?.title || 'templates';
}

function buildTemplateBundle(ids = [], facts = {}, options = {}) {
  const format = options.format === 'text' ? 'text' : 'markdown';
  const templates = normalizeBundleIds(ids).map((id) => ({ id, ...getTemplate(id) }));
  const safetyNotes = [
    ...new Set([
      sharedSafety,
      ...templates.map((template) => template.safety)
    ])
  ];

  if (format === 'text') {
    const sections = templates.map((template, index) => [
      `${index + 1}. ${template.title}`,
      `Category: ${template.category}`,
      template.summary,
      '',
      renderTemplate(template.id, facts)
    ].join('\n'));
    return {
      count: templates.length,
      format,
      content: [
        'Open Access UK template pack',
        '',
        `Templates: ${templates.length}`,
        'This pack was generated locally in your browser. Nothing was sent to a server.',
        '',
        ...sections,
        '',
        'Safety notes',
        ...safetyNotes.map((note) => `- ${note}`)
      ].join('\n')
    };
  }

  const sections = templates.map((template) => `## ${template.title}

Category: ${template.category}

${template.summary}

\`\`\`text
${renderTemplate(template.id, facts)}
\`\`\`
`);

  return {
    count: templates.length,
    format,
    content: `# Open Access UK template pack

Templates: ${templates.length}

This pack was generated locally in your browser. Nothing was sent to a server.

${sections.join('\n')}
## Safety notes

${safetyNotes.map((note) => `- ${note}`).join('\n')}
`
  };
}

function buildTemplateBundleMetadata(ids = [], facts = {}, options = {}) {
  const format = options.format === 'text' ? 'text' : 'markdown';
  const templates = normalizeBundleIds(ids).map((id) => ({ id, ...getTemplate(id) }));
  const subject = slugify(templateBundleSubject(facts, templates)) || 'templates';
  const extension = format === 'text' ? 'txt' : 'md';
  return {
    title: `Template pack (${templates.length} ${templates.length === 1 ? 'template' : 'templates'})`,
    filename: `open-access-uk-template-pack-${subject}.${extension}`,
    mimeType: format === 'text' ? 'text/plain;charset=utf-8' : 'text/markdown;charset=utf-8'
  };
}

function buildTemplateCasePack(ids = [], facts = {}) {
  const bundle = buildTemplateBundle(ids, facts, { format: 'markdown' });
  const metadata = buildTemplateBundleMetadata(ids, facts, { format: 'markdown' });

  return {
    title: 'Template case pack',
    filename: metadata.filename,
    markdown: [
      '# Template case pack',
      '',
      'Generated locally in the browser. Nothing was sent to a server.',
      '',
      '## Before sending',
      '- [ ] Check deadlines, appeal windows, complaint stages, and local rules.',
      '- [ ] Remove unnecessary account numbers, medical records, and private identifiers.',
      '- [ ] Save copies of evidence and sent messages.',
      '- [ ] Keep a note of the outcome requested in each letter.',
      '',
      '## Current source notes',
      ...currentGuidance.map((item) => `- ${item.title}: ${item.detail} Source: ${item.url}`),
      '',
      '## Templates',
      bundle.content.trim()
    ].join('\n')
  };
}

function buildTemplateLocalActionPack(ids = [], facts = {}) {
  const templates = normalizeBundleIds(ids).map((id) => ({ id, ...getTemplate(id) }));
  const selected = templates.length > 0 ? templates : [{ id: 'refund-request', ...getTemplate('refund-request') }];
  const evidence = unique(selected.flatMap((template) => localActionRules[template.id]?.evidence || []));
  const safety = unique([
    'Check deadlines, appeal windows, complaint stages, and local rules before waiting.',
    'Keep private details proportionate and remove unnecessary account, health, or identity information.',
    ...selected.flatMap((template) => localActionRules[template.id]?.safety || [])
  ]);
  const nextSteps = unique([
    'Save a dated copy of each letter, the delivery method, and the address or email used.',
    ...selected.flatMap((template) => localActionRules[template.id]?.nextSteps || [])
  ]);
  const escalation = unique([
    'Ask for written reasons if the request is refused and keep the complaint or appeal route with the pack.',
    ...selected.flatMap((template) => localActionRules[template.id]?.escalation || [])
  ]);
  const contextLabel = selected.map((template) => template.title).join(' + ');
  const subject = facts.organisation || facts.trader || facts.property || facts.item || contextLabel;

  return {
    title: 'Local action pack',
    templateCount: selected.length,
    contextLabel,
    evidence,
    safety,
    nextSteps,
    escalation,
    markdown: [
      '# Local action pack',
      '',
      'Generated locally in the browser. Nothing was sent to a server.',
      '',
      `Templates: ${contextLabel}`,
      `Context: ${subject}`,
      facts.date ? `Date or period: ${facts.date}` : '',
      '',
      '## Evidence to keep',
      ...evidence.map((item) => `- [ ] ${item}`),
      '',
      '## Safety checks',
      ...safety.map((item) => `- [ ] ${item}`),
      '',
      '## Next steps',
      ...nextSteps.map((item) => `- [ ] ${item}`),
      '',
      '## Escalation notes',
      ...escalation.map((item) => `- [ ] ${item}`)
    ].filter((line) => line !== '').join('\n')
  };
}

return { currentGuidance, templateCatalogue, getTemplate, renderTemplate, filterTemplates, getTemplateCategories, buildTemplateExportMetadata, normalizeFavouriteTemplates, sortTemplatesWithFavourites, buildMarkdownExport, buildTemplateBundle, buildTemplateBundleMetadata, buildTemplateCasePack, buildTemplateLocalActionPack };
})();

