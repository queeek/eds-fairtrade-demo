/* Fairtrade replica — `form` archetype behaviour (FormSection; reusable for every
   formbuilder page). The form UI is rebuilt faithfully (fields, labels, required
   validation, submit), but submission is NOT wired to any backend: the dynamics
   plan leaves the endpoint + reCAPTCHA to an owner decision. A valid submit is
   swallowed with no visible change ("show nothing extra"); an invalid one gets the
   source's .has-error state on each empty required field.
   The submit button ships DISABLED, as live renders it until the reCAPTCHA is
   solved (button[data-recaptcha-gated]); whoever wires the backend + bot check
   removes the attribute from the captcha callback. */
(() => {
  document.querySelectorAll('[data-form] form[data-form-pending]').forEach(form => {
    form.setAttribute('novalidate', '');
    const fields = [...form.querySelectorAll('.Input, .Textarea')];
    const check = f => {
      const el = f.querySelector('input, textarea');
      const bad = el && el.required && !el.value.trim();
      f.classList.toggle('has-error', !!bad);
      f.querySelector('.Textarea--fieldWrapper')?.classList.toggle('has-error', !!bad);
      return !bad;
    };
    fields.forEach(f => f.querySelector('input, textarea')?.addEventListener('input', () => f.classList.contains('has-error') && check(f)));
    form.addEventListener('submit', e => {
      e.preventDefault();
      const ok = fields.map(check).every(Boolean);
      if (!ok) fields.find(f => f.classList.contains('has-error'))?.querySelector('input, textarea')?.focus();
      // ok: pending backend (dynamics plan) — intentionally no request, no notification.
    });
  });
})();
