// 读取并验证项目共享的领域资料。
export function parseDomain(raw) {
  const value = JSON.parse(raw);
  const complete = value.domain && value.version > 0 && Array.isArray(value.facts) && value.facts.length > 0 && Array.isArray(value.entities) && value.entities.length > 0 && Array.isArray(value.rules) && value.rules.length > 0 && value.sample;
  if (!complete) throw new Error('领域资料缺少必要字段');
  validateSample(value.sample);
  return value;
}

// 样例虽为演示数据，也必须体现领域的硬约定：
// 权益带额度、生效期和适用对象；核销冻结规则版本；撤销留下原因。
function validateSample(sample) {
  const benefits = sample.benefits ?? [];
  for (const benefit of benefits) {
    const ready = benefit.category && benefit.audience && benefit.rule_version && benefit.valid_from && benefit.valid_to && Number.isInteger(benefit.total_quota) && Number.isInteger(benefit.per_family_limit);
    if (!ready) throw new Error(`权益 ${benefit.benefit_id ?? '(未命名)'} 缺少额度、生效期或适用对象`);
  }
  for (const redemption of sample.redemptions ?? []) {
    if (!redemption.rule_version_frozen) throw new Error(`核销 ${redemption.redemption_id ?? '(未命名)'} 未冻结规则版本`);
  }
  for (const revocation of sample.revocations ?? []) {
    if (!revocation.reason) throw new Error(`撤销记录 ${revocation.redemption_id ?? '(未命名)'} 未留原因`);
  }
}
