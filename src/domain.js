// 读取并验证项目共享的领域资料。
export function parseDomain(raw) {
  const value = JSON.parse(raw);
  const complete = value.domain && value.version > 0 && Array.isArray(value.facts) && value.facts.length > 0 && Array.isArray(value.entities) && value.entities.length > 0 && Array.isArray(value.rules) && value.rules.length > 0 && isPlainObject(value.sample);
  if (!complete) throw new Error('领域资料缺少必要字段');
  assertUnique(value.entities, '对象清单存在重复条目');
  assertUnique(value.rules, '规则清单存在重复条目');
  return value;
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertUnique(list, message) {
  if (new Set(list).size !== list.length) throw new Error(message);
}
