import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMarkdownExport,
  buildTemplateBundle,
  buildTemplateBundleMetadata,
  buildTemplateCasePack,
  buildTemplateExportMetadata,
  filterTemplates,
  getTemplateCategories,
  normalizeFavouriteTemplates,
  sortTemplatesWithFavourites,
  renderTemplate,
  templateCatalogue
} from '../src/templates.js';

test('renders selected legal template with provided facts', () => {
  const text = renderTemplate('refund-request', { trader: 'Example Shop', item: 'faulty kettle', name: 'T. Buyer' });
  assert.match(text, /Example Shop/);
  assert.match(text, /faulty kettle/);
  assert.match(text, /Consumer Rights Act 2015/);
});

test('catalogue includes the required starter templates', () => {
  const expected = [
    'refund-request',
    'chargeback-bank-complaint',
    'landlord-repair-notice',
    'subject-access-request',
    'university-adjustment-request',
    'rail-delay-compensation',
    'airline-accessibility-complaint',
    'council-escalation'
  ];

  for (const id of expected) {
    assert.ok(templateCatalogue[id], `missing ${id}`);
    assert.ok(templateCatalogue[id].safety, `missing safety note for ${id}`);
  }
});

test('renders travel and data templates with relevant escalation language', () => {
  const rail = renderTemplate('rail-delay-compensation', {
    organisation: 'Example Rail',
    item: 'London to York',
    date: '1 June 2026',
    amount: 'GBP 80',
    name: 'T. Passenger'
  });
  const sar = renderTemplate('subject-access-request', { organisation: 'Example Council', name: 'T. Resident' });

  assert.match(rail, /Delay Repay/);
  assert.match(rail, /National Rail Conditions of Travel/);
  assert.match(sar, /within one month/);
  assert.match(sar, /UK data protection law/);
});

test('filters templates by category and search text', () => {
  const travelTemplates = filterTemplates({ category: 'Travel' });
  assert.deepEqual(travelTemplates.map((template) => template.id), [
    'rail-delay-compensation',
    'airline-accessibility-complaint'
  ]);

  const results = filterTemplates({ query: 'ombudsman council' });
  assert.deepEqual(results.map((template) => template.id), ['council-escalation']);
});

test('lists category metadata with counts', () => {
  const categories = getTemplateCategories();
  const travel = categories.find((category) => category.name === 'Travel');

  assert.deepEqual(categories.map((category) => category.name).sort(), [
    'Consumer',
    'Data protection',
    'Education',
    'Housing',
    'Money',
    'Public services',
    'Travel'
  ]);
  assert.equal(travel.count, 2);
});

test('builds template export metadata with a safe filename', () => {
  const metadata = buildTemplateExportMetadata('landlord-repair-notice', {
    organisation: 'Example Agent',
    item: 'Damp + broken heater'
  });

  assert.equal(metadata.mimeType, 'text/plain;charset=utf-8');
  assert.equal(metadata.filename, 'landlord-repair-notice-damp-broken-heater.txt');
  assert.match(metadata.title, /Landlord repair notice/);
});

test('normalizes favourite template ids and sorts favourites first', () => {
  const favourites = normalizeFavouriteTemplates([
    'rail-delay-compensation',
    'unknown-template',
    'refund-request',
    'refund-request'
  ]);
  assert.deepEqual(favourites, ['rail-delay-compensation', 'refund-request']);

  const sorted = sortTemplatesWithFavourites(filterTemplates({ category: 'Travel' }), favourites);
  assert.deepEqual(sorted.map((template) => template.id), [
    'rail-delay-compensation',
    'airline-accessibility-complaint'
  ]);
});

test('builds markdown export for a rendered template', () => {
  const markdown = buildMarkdownExport('subject-access-request', {
    organisation: 'Example Council',
    item: 'housing records',
    name: 'T. Resident'
  });

  assert.match(markdown, /^# Subject access request/);
  assert.match(markdown, /Dear Example Council/);
  assert.match(markdown, /Safety note/);
});

test('builds a combined markdown bundle for selected templates', () => {
  const bundle = buildTemplateBundle(['refund-request', 'subject-access-request', 'unknown-template'], {
    organisation: 'Example Council',
    trader: 'Example Shop',
    item: 'faulty kettle',
    name: 'T. Buyer'
  });

  assert.equal(bundle.count, 2);
  assert.match(bundle.content, /^# Open Access UK template pack/);
  assert.match(bundle.content, /## Refund request/);
  assert.match(bundle.content, /## Subject access request/);
  assert.match(bundle.content, /faulty kettle/);
  assert.match(bundle.content, /Safety notes/);
  assert.match(bundle.content, /not legal advice/i);
});

test('builds bundle export metadata with a safe filename', () => {
  const metadata = buildTemplateBundleMetadata(['refund-request', 'subject-access-request'], {
    organisation: 'Example Council / Housing Team'
  });

  assert.equal(metadata.mimeType, 'text/markdown;charset=utf-8');
  assert.equal(metadata.filename, 'open-access-uk-template-pack-example-council-housing-team.md');
  assert.equal(metadata.title, 'Template pack (2 templates)');
});

test('builds case packs with safety checklist and template bundle', () => {
  const pack = buildTemplateCasePack(['refund-request', 'subject-access-request'], {
    organisation: 'Example Council',
    trader: 'Example Shop',
    item: 'faulty kettle',
    name: 'T. Buyer'
  });

  assert.equal(pack.title, 'Template case pack');
  assert.match(pack.filename, /^open-access-uk-template-pack-/);
  assert.match(pack.markdown, /^# Template case pack/m);
  assert.match(pack.markdown, /## Before sending/);
  assert.match(pack.markdown, /Remove unnecessary account numbers/);
  assert.match(pack.markdown, /## Templates/);
  assert.match(pack.markdown, /Refund request/);
});
