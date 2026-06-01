const sharedSafety = 'This is a template, not legal advice. Check deadlines, contract terms, local procedures, and whether specialist advice is needed before sending.';

export const templateCatalogue = {
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

export function getTemplate(id) {
  const template = templateCatalogue[id];
  if (!template) throw new Error('Unknown template');
  return template;
}

export function renderTemplate(id, facts = {}) {
  const template = getTemplate(id);
  return `${template.render(facts)}

---
Safety note: ${template.safety} ${sharedSafety}`;
}

export function filterTemplates({ category = 'All', query = '' } = {}) {
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

export function getTemplateCategories() {
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

export function buildTemplateExportMetadata(id, facts = {}) {
  const template = getTemplate(id);
  const subject = slugify(facts.item || facts.property || facts.organisation || template.title);
  const filename = [id, subject].filter(Boolean).join('-') + '.txt';
  return {
    title: template.title,
    filename,
    mimeType: 'text/plain;charset=utf-8'
  };
}

export function normalizeFavouriteTemplates(value = []) {
  const seen = new Set();
  const ids = Array.isArray(value) ? value : [];
  return ids.filter((id) => {
    if (!templateCatalogue[id] || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export function sortTemplatesWithFavourites(templates, favouriteIds = []) {
  const favourites = new Set(normalizeFavouriteTemplates(favouriteIds));
  return [...templates].sort((a, b) => {
    const aFav = favourites.has(a.id);
    const bFav = favourites.has(b.id);
    if (aFav !== bFav) return aFav ? -1 : 1;
    return a.title.localeCompare(b.title);
  });
}

export function buildMarkdownExport(id, facts = {}) {
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
