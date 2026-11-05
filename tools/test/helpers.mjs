/** Minimal well-formedness check: every tag closes, nothing leaks as "undefined"/"NaN". */
export function assertWellFormed(svg) {
  const problems = [];
  if (/undefined|NaN|\[object Object\]/.test(svg)) problems.push('contains undefined/NaN/[object Object]');
  const stack = [];
  const body = svg.replace(/<!--[\s\S]*?-->/g, '');
  for (const m of body.matchAll(/<(\/?)([a-zA-Z][\w:-]*)([^>]*?)(\/?)>/g)) {
    const [, closing, name, , selfClosing] = m;
    if (selfClosing) continue;
    if (!closing) stack.push(name);
    else if (stack.pop() !== name) problems.push(`unexpected </${name}>`);
  }
  if (stack.length) problems.push(`unclosed: ${stack.join(', ')}`);
  if (!/^<svg[^>]+viewBox=/.test(svg)) problems.push('missing root <svg viewBox>');
  if (!/<title id="title">[^<]+<\/title>/.test(svg)) problems.push('missing accessible <title>');
  if (problems.length) throw new Error(problems.join('; '));
}
