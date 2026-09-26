import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseDomain } from '../src/domain.js';

const loadFixture = () => readFile(new URL('../fixtures/domain.json', import.meta.url), 'utf8');

test('样例领域资料完整', async () => {
  const value = parseDomain(await loadFixture());
  assert.equal(value.domain, 'campus-family-benefit');
  assert.ok(value.entities.length >= 3);
  assert.ok(value.rules.length >= 3);
});

test('核心对象与关键规则齐备', async () => {
  const value = parseDomain(await loadFixture());
  for (const entity of ['新生资格', '家庭成员', '城市权益', '商户核销', '结算记录']) {
    assert.ok(value.entities.includes(entity), `缺少对象：${entity}`);
  }
  const rules = value.rules.join('\n');
  for (const keyword of ['资格结论', '次数', '规则版本', '撤销', '同意', '结算']) {
    assert.ok(rules.includes(keyword), `规则未覆盖：${keyword}`);
  }
});

test('样例覆盖住宿、文化场馆与交通接驳', async () => {
  const { sample } = parseDomain(await loadFixture());
  const sectors = sample.benefits.map((benefit) => benefit.sector);
  for (const sector of ['住宿', '文化场馆', '交通接驳']) {
    assert.ok(sectors.includes(sector), `样例缺少业态：${sector}`);
  }
  for (const benefit of sample.benefits) {
    assert.ok(benefit.quota > 0 && benefit.valid_from && benefit.valid_to && benefit.audience && benefit.rule_version, `权益要素不全：${benefit.benefit_id}`);
  }
});

test('样例核销冻结规则版本且撤销留痕', async () => {
  const { sample } = parseDomain(await loadFixture());
  for (const redemption of sample.redemptions) {
    assert.ok(redemption.rule_version_frozen, `核销未冻结规则版本：${redemption.redemption_id}`);
    if (redemption.status === '已撤销') {
      assert.ok(redemption.revocation_reason, `撤销缺少原因：${redemption.redemption_id}`);
    }
  }
  assert.ok(sample.redemptions.some((redemption) => redemption.channel === '离线补传'), '样例缺少离线补传场景');
  assert.equal(sample.qualification.enrollment_detail_shared, false, '资格结论不得携带学籍明细');
});

test('缺字段或重复条目被拒绝', async () => {
  const value = parseDomain(await loadFixture());
  assert.throws(() => parseDomain('{}'), /缺少必要字段/);
  const duplicatedEntities = { ...value, entities: [...value.entities, value.entities[0]] };
  assert.throws(() => parseDomain(JSON.stringify(duplicatedEntities)), /重复/);
  const duplicatedRules = { ...value, rules: [...value.rules, value.rules[0]] };
  assert.throws(() => parseDomain(JSON.stringify(duplicatedRules)), /重复/);
});
