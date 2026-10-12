const token = /^[A-Za-z][A-Za-z0-9_]*$/;
export function validateTypeExpression(expression) {
  if (!Array.isArray(expression)) throw new Error('Type expression must be an array');
  let depth = 0;
  for (const part of expression) {
    if (typeof part !== 'string' || !token.test(part)) throw new Error('Invalid type expression token');
    if (part === 'AND' || part === 'OR') {
      if (depth < 2) throw new Error('Malformed binary type expression');
      depth--;
    } else if (part === 'NOT') {
      if (depth < 1) throw new Error('Malformed NOT type expression');
    } else depth++;
  }
  return expression;
}
export function matchesTypeExpression(expression, types) {
  validateTypeExpression(expression);
  const available = new Set(types), values = [];
  for (const part of expression) {
    if (part === 'NOT') values.push(!values.pop());
    else if (part === 'AND' || part === 'OR') {
      const right = values.pop(), left = values.pop();
      values.push(part === 'AND' ? left && right : left || right);
    } else values.push(available.has(part));
  }
  // Uncombined entries in the PoB list are alternatives, not requirements.
  return values.some(Boolean);
}
export function describeTypeExpression(expression) {
  validateTypeExpression(expression);
  const values = [];
  for (const part of expression) {
    if (part === 'NOT') values.push(`NOT ${values.pop()}`);
    else if (part === 'AND' || part === 'OR') {
      const right=values.pop(), left=values.pop(); values.push(`(${left} ${part} ${right})`);
    } else values.push(part);
  }
  return values.join(' OR ') || '(empty)';
}
