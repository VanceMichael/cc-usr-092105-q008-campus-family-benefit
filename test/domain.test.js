import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseDomain } from '../src/domain.js';

const loadSample = async () => {
  const raw = await readFile(new URL('../fixtures/domain.json', import.meta.url), 'utf8');
  return parseDomain(raw);
};

test('样例领域资料完整', async () => {
  const value = await loadSample();
  assert.equal(value.domain, 'campus-family-benefit');
  assert.ok(value.entities.length >= 3);
  assert.ok(value.rules.length >= 3);
});

test('样例覆盖住宿、文化场馆与交通接驳三类业态', async () => {
  const { sample } = await loadSample();
  const categories = new Set(sample.benefits.map((b) => b.category));
  for (const expected of ['住宿', '文化场馆', '交通接驳']) {
    assert.ok(categories.has(expected), `缺少业态：${expected}`);
  }
});

test('核销冻结规则版本，撤销留下原因', async () => {
  const { sample } = await loadSample();
  for (const redemption of sample.redemptions) {
    assert.ok(redemption.rule_version_frozen, `${redemption.redemption_id} 未冻结规则版本`);
  }
  for (const revocation of sample.revocations) {
    assert.ok(revocation.reason, '撤销记录缺少原因');
  }
});

test('退订返还额度，回访需先取得同意', async () => {
  const { sample } = await loadSample();
  assert.ok(sample.cancellations.every((c) => c.quota_returned === true));
  assert.ok(sample.consents.some((c) => c.scope.includes('回访') && c.granted === true));
});

test('资格只含结论，学籍细节不出校', async () => {
  const { sample } = await loadSample();
  assert.ok(sample.eligibility.conclusion);
  assert.ok(sample.eligibility.withheld_fields.length > 0);
});

test('规则清单包含限次、冒充拦截与同意回访', async () => {
  const { rules } = await loadSample();
  assert.ok(rules.some((r) => r.includes('不得突破单项次数')));
  assert.ok(rules.some((r) => r.includes('不得冒充新生权益')));
  assert.ok(rules.some((r) => r.includes('未经同意不得把核销记录用于回访')));
});

test('权益缺额度或生效期时拒绝登记', () => {
  const broken = {
    domain: 'campus-family-benefit',
    version: 2,
    facts: ['f'],
    entities: ['e'],
    rules: ['r'],
    sample: { benefits: [{ benefit_id: 'bnf-x', category: '住宿', audience: '新生', rule_version: 'r1' }] },
  };
  assert.throws(() => parseDomain(JSON.stringify(broken)), /缺少额度、生效期或适用对象/);
});
