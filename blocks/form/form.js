/**
 * form — the source FormSection / Form (formbuilder): labelled fields with required
 * validation, a reCAPTCHA slot and a submit button, plus the error notification.
 * Submission is NOT wired: the endpoint and the bot check are an owner decision in the
 * dynamics plan (stardust/dynamic-features-plan.md); as in the gated prototype the submit
 * ships disabled (live renders it disabled until the reCAPTCHA is solved) and a valid
 * submit is swallowed.
 * Schema: stardust/eds-schema/mt-en-bring-fairtrade-to-your-market-html.json § FormSection.
 * Decode tier: template-slotted per field (label / field / message slots), rows reconstructive.
 *
 * Authoring — one row per field, then one row for the submit label, then the notifications:
 *   field row:  cell 1 <p>Label*</p> | cell 2 <p>placeholder</p><p>error message</p> | cell 3 type
 * word
 *   submit row: cell 1 <p>Submit</p> | cell 2 <p>submit</p> (type word)
 *   clear row:  cell 1 <p>screen-reader label of the inputs' clear button</p> | cell 2 <p>clear</p>
 *   notice row: cell 1 <h3>Title</h3><p>Text</p> | cell 2 <p>success</p> or <p>error</p>
 * A trailing "*" in the label marks the field required.
 *
 * @variants cell 3: textarea | text | email | submit | clear | success | error (default text)
 * @ew-exempt <p> type word (last cell) — metadata, never displayed
 * @ew-exempt <p> placeholder (field row, cell 2, first <p>) — config, rendered as the field's
 *    placeholder attribute
 * @ew-exempt <p> submit label — the <button> cannot host the editor (EW7); rendered as the button
 *    text
 * @ew-exempt <p> clear label — the <button> cannot host the editor (EW7); rendered as the clear
 *    button's visually hidden text
 */

function wrapNode(node, className) {
  const w = document.createElement('div');
  w.className = className;
  w.append(node);
  return w;
}

const TYPES = ['textarea', 'text', 'email', 'submit', 'clear', 'success', 'error'];
let formCount = 0;

function rowType(cells) {
  const last = cells[cells.length - 1];
  const word = last ? last.textContent.trim().toLowerCase() : '';
  if (cells.length > 1 && TYPES.includes(word)) return word;
  if (cells[0] && cells[0].querySelector('h1, h2, h3, h4, h5, h6')) return 'error';
  return 'text';
}

// the trash glyph from the shared sprite (#trash, loaded with the header); helper inlined, as
// in every block (the round-trip harness inlines block JS and cannot resolve imports)
const SVG_NS = 'http://www.w3.org/2000/svg';
function icon(name) {
  const span = document.createElement('span');
  span.className = 'svg-icon';
  span.setAttribute('aria-hidden', 'true');
  const svg = document.createElementNS(SVG_NS, 'svg');
  const use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', `#${name}`);
  svg.append(use);
  span.append(svg);
  return span;
}

function buildClear(text) {
  const button = document.createElement('button');
  button.className = 'input-clear';
  button.type = 'button';
  button.dataset.inputClear = '';
  const hidden = document.createElement('span');
  hidden.className = 'visuallyhidden';
  hidden.textContent = text;
  button.append(icon('trash'), hidden);
  return button;
}

function buildField(cells, type, idBase, i, clearText) {
  const [labelCell, cfgCell] = cells;
  const id = `${idBase}-field-${i}`;
  const isArea = type === 'textarea';
  const prefix = isArea ? 'textarea' : 'input';
  const wrap = document.createElement('div');
  wrap.className = prefix;
  const label = document.createElement('label');
  label.className = `${prefix}-label`;
  label.htmlFor = id;
  const labelNodes = [...labelCell.children];
  label.append(...(labelNodes.length ? labelNodes : labelCell.childNodes));
  const required = /\*\s*$/.test(label.textContent);
  const fieldWrapper = document.createElement('div');
  fieldWrapper.className = `${prefix}-field-wrapper`;
  const field = document.createElement(isArea ? 'textarea' : 'input');
  field.className = `${prefix}-field`;
  field.id = id;
  field.name = label.textContent.replace(/\*\s*$/, '').trim();
  if (isArea) {
    field.rows = 5;
    field.maxLength = 2500;
  } else {
    field.type = type === 'email' ? 'email' : 'text';
  }
  if (required) field.required = true;
  const cfg = cfgCell && cells.length > 2 ? [...cfgCell.children] : [];
  const [placeholder, ...messages] = cfg;
  if (placeholder) field.placeholder = placeholder.textContent.trim();
  fieldWrapper.append(field);
  if (!isArea && clearText) fieldWrapper.append(buildClear(clearText));
  const msgBox = document.createElement('div');
  msgBox.className = `${prefix}-messages`;
  messages.forEach((m) => msgBox.append(wrapNode(m, `${prefix}-error-message`)));
  wrap.append(label, fieldWrapper, msgBox);
  return wrap;
}

export default function decorate(block) {
  formCount += 1;
  const idBase = `form-${formCount}`;
  const rows = [...block.children].map((r) => [...r.children]);
  if (!rows.length) return;
  const inner = document.createElement('div');
  inner.className = 'form-inner';
  const form = document.createElement('form');
  form.className = 'form-form';
  form.method = 'post';
  form.noValidate = true;
  const notices = [];
  let submitLabel = '';
  const clearRow = rows.find((cells) => rowType(cells) === 'clear');
  const clearText = clearRow ? clearRow[0].textContent.trim() : '';
  rows.forEach((cells, i) => {
    const type = rowType(cells);
    if (type === 'submit') submitLabel = cells[0].textContent.trim();
    else if (type === 'clear') {
      // consumed above: the clear buttons' label
    } else if (type === 'error' || type === 'success') {
      const notice = document.createElement('div');
      notice.className = `form-notification form-notification-${type}`;
      const box = document.createElement('div');
      box.className = 'form-notification-inner';
      [...cells[0].children].forEach((n) => box.append(wrapNode(n, /^H[1-6]$/.test(n.tagName) ? 'form-notification-title' : 'form-notification-text')));
      notice.append(box);
      notices.push(notice);
    } else form.append(buildField(cells, type, idBase, i, clearText));
  });
  const footer = document.createElement('div');
  footer.className = 'form-footer';
  const captcha = document.createElement('div');
  captcha.className = 'form-field form-field-recaptcha';
  captcha.dataset.recaptchaSlot = '';
  const submitWrap = document.createElement('div');
  submitWrap.className = 'form-field form-field-submit';
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'button variant-primary color-leafgreen form-action';
  submit.disabled = true; // live: disabled until the reCAPTCHA is solved (owner decision pending)
  submit.dataset.recaptchaGated = '';
  const label = document.createElement('span');
  label.className = 'button-inner';
  label.textContent = submitLabel;
  submit.append(label);
  submitWrap.append(submit);
  footer.append(captcha, submitWrap);
  form.append(footer);
  inner.append(form, ...notices);
  block.replaceChildren(inner);

  // required validation (source .has-error state); a valid submit is swallowed (no backend)
  const fields = [...form.querySelectorAll('.input, .textarea')];
  const check = (f) => {
    const el = f.querySelector('input, textarea');
    const bad = el && el.required && !el.value.trim();
    f.classList.toggle('has-error', !!bad);
    return !bad;
  };
  fields.forEach((f) => f.querySelector('input, textarea').addEventListener('input', () => {
    if (f.classList.contains('has-error')) check(f);
  }));
  form.querySelectorAll('[data-input-clear]').forEach((b) => b.addEventListener('click', () => {
    const input = b.parentElement.querySelector('input');
    input.value = '';
    input.focus();
  }));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const ok = fields.map(check).every(Boolean);
    if (!ok) fields.find((f) => f.classList.contains('has-error')).querySelector('input, textarea').focus();
  });
}
