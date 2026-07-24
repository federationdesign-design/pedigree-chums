// Response assembler (brief section 15). Combines an approved fact if needed, a
// character line, a pivot and a destination, filling placeholder tokens from the
// central campaign, rules, FAQ, knowledge and destination records. Rotation
// avoids repeating an exact line or destination within a session.

import { ChumData, Resolution, Dog, CollieResponse } from './types';
import { Normalised } from './normalise';
import { Session } from './session';
import { CAMPAIGN } from '../data/campaign';
import { RULES } from '../data/rules';
import { MODERATION, HEALTH_DIAGNOSIS_BOUNDARY, SAFETY_SIGNPOST } from '../data/moderation';

export interface Assembled {
  responseId: string;
  text: string;
  dog: Dog;
  destinationId?: string;
  url?: string | null;
  openPopup?: boolean;
  transferTo?: Dog;
  closed?: boolean;
}

const DOG_LABEL: Record<Dog, string> = {
  collie: 'Collie',
  labrador: 'Labrador',
  terrier: 'Border Terrier',
  boxer: 'Boxer',
};

// Fill {{token}} placeholders from a context map. Unknown tokens are dropped and
// stray double spaces collapsed, so a partial context never leaks braces.
function fill(template: string, ctx: Record<string, string>): string {
  return template
    .replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_, key) => ctx[key] ?? '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function baseContext(n: Normalised, destName = ''): Record<string, string> {
  return {
    price_answer: CAMPAIGN.answers.price_answer,
    launch_answer: CAMPAIGN.answers.launch_answer,
    delivery_answer: CAMPAIGN.answers.delivery_answer,
    discount_answer: CAMPAIGN.answers.discount_answer,
    approved_rule_summary: RULES.summary,
    rule_summary: RULES.summary,
    deal_answer: RULES.dealAnswer,
    win_condition: RULES.winCondition,
    player_count_answer: RULES.playerCount,
    age_answer: RULES.ageGuidance,
    input: n.original,
    destination_name: destName,
    food_word: n.original.replace(/[.!?]+$/, ''),
    topic: n.original.replace(/[.!?]+$/, ''),
  };
}

// Pick a bucket response, preferring one not used this session (rotation). Falls
// back to reuse only when every alternative has been used.
function pickResponse(data: ChumData, bucket: string, used: string[]): CollieResponse | null {
  const pool = data.collieResponses.filter((r) => r.bucketId === bucket);
  if (!pool.length) return null;
  return pool.find((r) => !used.includes(r.responseId)) ?? pool[0];
}

function copy(data: ChumData, type: string, subgroup?: string): string {
  const c = data.copyComponents.find((x) => x.type === type && (!subgroup || x.subgroup === subgroup));
  return c ? c.line : '';
}

// Deterministic destination rotation for conversational / fallback routes: first
// Play/Learn/Discover destination with a real target not offered yet this session.
function pickDestination(data: ChumData, offered: string[]): { id: string; name: string; url: string | null } | null {
  const families = ['Play', 'Learn', 'Discover'];
  const pool = data.destinations.filter(
    (d) => families.some((f) => d.family.includes(f)) && (d.resolvedUrl || d.embedded)
  );
  const choice = pool.find((d) => !offered.includes(d.destinationId)) ?? pool[0];
  return choice ? { id: choice.destinationId, name: choice.name, url: choice.resolvedUrl } : null;
}

export function assemble(res: Resolution, data: ChumData, n: Normalised, session: Session): Assembled {
  const dog = session.activeDog;

  switch (res.action) {
    case 'safety_signpost':
    case 'safety_boundary': {
      const cat = MODERATION.find((m) => m.id === res.moderationId) ?? MODERATION[0];
      const idx = session.usedResponseIds.filter((id) => id.startsWith(cat.id)).length % cat.responses.length;
      const text = cat.responses[idx].replace('{{safety_signpost_copy}}', SAFETY_SIGNPOST).replace(/\s{2,}/g, ' ').trim();
      return { responseId: `${cat.id}-${idx}`, text, dog };
    }

    case 'health_answer':
      return { responseId: HEALTH_DIAGNOSIS_BOUNDARY.id, text: HEALTH_DIAGNOSIS_BOUNDARY.response, dog };

    case 'open_discount_popup': {
      const r = pickResponse(data, 'B01', session.usedResponseIds);
      const text = r ? fill(r.template, baseContext(n)) : CAMPAIGN.answers.discount_answer;
      return { responseId: r?.responseId ?? 'B01', text, dog, destinationId: 'DST001', openPopup: true };
    }

    case 'rules_answer': {
      const r = pickResponse(data, 'B02', session.usedResponseIds);
      const text = r ? fill(r.template, baseContext(n)) : RULES.summary;
      return { responseId: r?.responseId ?? 'B02', text, dog, destinationId: 'DST011' };
    }

    case 'link': {
      const dest = data.destinations.find((d) => d.destinationId === res.destinationId);
      const art = data.articles.find((a) => a.articleId === res.destinationId);
      const name = dest?.name ?? art?.title ?? 'the right place';
      const bucket = res.bucket ?? 'B03';
      const r = pickResponse(data, bucket, session.usedResponseIds);
      const text = r ? fill(r.template, baseContext(n, name)) : `${name} is here.`;
      return { responseId: r?.responseId ?? bucket, text, dog, destinationId: res.destinationId, url: res.url ?? dest?.resolvedUrl ?? art?.resolvedUrl ?? null };
    }

    case 'faq_answer': {
      const f = data.faq.find((x) => x.faqId === res.faqId);
      const answer = f?.resolvedAnswer ?? '';
      const r = pickResponse(data, 'B04', session.usedResponseIds);
      const wrapper = r ? fill(r.template, baseContext(n)) : '';
      const text = [answer, wrapper].filter(Boolean).join(' ').trim() || 'That is a fair question.';
      return { responseId: f ? `B04-${f.faqId}` : 'B04', text, dog, url: f?.cta ?? null };
    }

    case 'gk_answer': {
      const g = data.generalKnowledge.find((x) => x.questionId === res.gkId);
      const pivot = copy(data, 'Collie pivot', 'Geordie');
      const text = g ? `${g.correctAnswer}. ${g.collieObservation} ${pivot}`.replace(/\.\./g, '.').trim() : 'Answered.';
      return { responseId: g ? g.questionId : 'GK', text, dog };
    }

    case 'gk_unknown': {
      const tilt = copy(data, 'Head tilt', 'Double');
      const text = `I do not have an approved answer for that, and I will not invent one. ${tilt}`.trim();
      return { responseId: 'GK-UNKNOWN', text, dog };
    }

    case 'breed_answer': {
      const collie = data.dogs.find((d) => d.slug === 'border-collie');
      const bits = collie
        ? `${collie.character} Typical working life is around ${collie.lifespanYears} years, and on training we are, professionally speaking, ${collie.training?.label.toLowerCase()}.`
        : 'We maintain a strong professional record.';
      return { responseId: 'B07-COLLIE', text: bits.replace(/\s{2,}/g, ' ').trim(), dog };
    }

    case 'transfer': {
      const to = res.transferTo ?? 'labrador';
      const toLabel = DOG_LABEL[to];
      const rule = data.transfers.find((t) => t.from === 'Collie' && t.to === toLabel);
      const out = rule?.exampleLine ?? `This needs the ${toLabel}.`;
      const inType = to === 'labrador' ? 'Labrador transfer-in' : to === 'boxer' ? 'Boxer transfer-in' : 'Terrier transfer-in';
      const incoming = fill(copy(data, inType), baseContext(n));
      const returning = session.previousDogs.includes(to) ? 'And yes, you again. ' : '';
      const text = `${out} ${returning}${incoming}`.replace(/\s{2,}/g, ' ').trim();
      return { responseId: `TR-${to}`, text, dog, transferTo: to };
    }

    case 'converse': {
      const bucket = res.bucket ?? 'B09';
      const r = pickResponse(data, bucket, session.usedResponseIds);
      const dest = pickDestination(data, session.offeredDestinationIds);
      const text = r ? fill(r.template, baseContext(n, dest?.name ?? '')) : 'Noted.';
      return { responseId: r?.responseId ?? bucket, text, dog, destinationId: dest?.id, url: dest?.url ?? null };
    }

    case 'gibberish': {
      const r = pickResponse(data, 'B14', session.usedResponseIds);
      const dest = pickDestination(data, session.offeredDestinationIds);
      const text = r ? fill(r.template, baseContext(n, dest?.name ?? '')) : 'Did you lean on your keyboard?';
      return { responseId: r?.responseId ?? 'B14', text, dog, destinationId: dest?.id, url: dest?.url ?? null };
    }

    case 'boxer_cutoff': {
      const l1 = copy(data, 'Boxer ending', 'Cut-off 1');
      const l2 = copy(data, 'Boxer ending', 'Cut-off 2');
      return { responseId: 'BOXER-CUTOFF', text: `${l1} ${l2}`.trim(), dog: 'boxer', transferTo: 'boxer', closed: true };
    }
  }
}
