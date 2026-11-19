const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('index.html','utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, 'Inline application script exists');
const ctx = { document: { getElementById: () => ({ replaceChildren() {} }) }, window: {}, confirm:()=>false };
vm.createContext(ctx);
vm.runInContext(script.replace(/render\(\);\s*$/, ''),ctx);
function evaluate(expression,entries=[],type='violence') {
  ctx.entries=entries; ctx.type=type;
  return vm.runInContext(expression,ctx);
}
function answer(id,value){return {id,q:id,answer:value};}
test('money: grouped thousands and decimal comma',()=>{
  assert.equal(evaluate("euros('1 500 euroa')"),1500);
  assert.equal(evaluate("euros('1 500,50 €')"),1500.5);
  assert.equal(evaluate("euros('0 euroa')"),0);
});
test('money: unknown is not zero',()=>{
  assert.equal(evaluate("euros('Ei tiedossa.')"),null);
  assert.equal(evaluate("euros('')"),null);
});
test('theft: unknown value does not create a valuation',()=>{
  assert.equal(evaluate('outcome()',[answer('value','Ei tiedossa.')],'theft'),null);
});
test('violence: unknown costs block compensation example',()=>{
  const entries=[answer('injury','Mustelma'),answer('cost','Ei tiedossa.'),answer('loss','0 euroa')];
  assert.equal(evaluate('outcome()',entries),null);
});
test('legal: natural-language negative answers are recognized',()=>{
  const entries=[answer('minorform','Kyllä.'),answer('serious','Ei, ei asetta.'),answer('age','30'),answer('close','Ei, ei läheinen.'),answer('work','Ei, ei työtehtävässä.'),answer('demand','Kyllä.')];
  assert.match(evaluate('legal()',entries),/asianomistajarikos/);
});
test('legal: unknown closeness does not pass as negative',()=>{
  const entries=[answer('minorform','Kyllä.'),answer('serious','Ei.'),answer('age','30'),answer('close','Ei tiedossa.'),answer('work','Ei.')];
  assert.match(evaluate('legal()',entries),/Syyteoikeus selvitettävä/);
});
