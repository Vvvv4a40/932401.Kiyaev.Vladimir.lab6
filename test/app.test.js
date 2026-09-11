const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../app');

let server;
let origin;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  origin = `http://127.0.0.1:${address.port}`;
});

test.after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

test('возвращает недельный курс и среднее значение', async () => {
  const response = await fetch(`${origin}/api/rates/USD`);
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.currency, 'USD');
  assert.equal(data.rates.length, 7);
  assert.equal(data.avg, 92.61);
});

test('принимает код валюты в нижнем регистре', async () => {
  const response = await fetch(`${origin}/api/rates/cny`);
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.currency, 'CNY');
});

test('игнорирует query-параметры', async () => {
  const plainResponse = await fetch(`${origin}/api/rates/EUR`);
  const queryResponse = await fetch(`${origin}/api/rates/EUR?days=2&format=short`);

  assert.deepEqual(await queryResponse.json(), await plainResponse.json());
});

test('возвращает 404 для неизвестной валюты', async () => {
  const response = await fetch(`${origin}/api/rates/RUB`);
  const data = await response.json();

  assert.equal(response.status, 404);
  assert.deepEqual(data, { error: 'Currency not supported' });
});

test('отдаёт главную страницу и страницу about', async () => {
  const homeResponse = await fetch(`${origin}/`);
  const aboutResponse = await fetch(`${origin}/about`);

  assert.equal(homeResponse.status, 200);
  assert.match(await homeResponse.text(), /Курсы валют за неделю/);
  assert.equal(aboutResponse.status, 200);
  assert.match(await aboutResponse.text(), /Владимир Кияев/);
});
