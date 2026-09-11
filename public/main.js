const buttons = document.querySelectorAll('[data-currency]');
const averageElement = document.querySelector('#average');
const currencyElement = document.querySelector('#current-currency');
const statusElement = document.querySelector('#status');
const chartElement = document.querySelector('#chart');
const listElement = document.querySelector('#rate-list');
const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const numberFormat = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function setSelectedCurrency(currency) {
  buttons.forEach((button) => {
    const selected = button.dataset.currency === currency;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}

function renderChart(currency, rates) {
  const lowestRate = Math.min(...rates);
  const highestRate = Math.max(...rates);
  const difference = Math.max(highestRate - lowestRate, 0.01);

  chartElement.replaceChildren();
  chartElement.setAttribute('aria-label', `График курса ${currency} за семь дней`);

  rates.forEach((rate, index) => {
    const column = document.createElement('div');
    const value = document.createElement('span');
    const bar = document.createElement('div');
    const label = document.createElement('span');
    const height = 38 + ((rate - lowestRate) / difference) * 62;

    column.className = 'bar-column';
    value.className = 'bar-value';
    bar.className = 'bar';
    label.className = 'bar-label';
    value.textContent = numberFormat.format(rate);
    label.textContent = dayNames[index];
    bar.style.setProperty('--height', `${height}%`);
    bar.title = `${dayNames[index]}: ${numberFormat.format(rate)} ₽`;
    column.append(value, bar, label);
    chartElement.append(column);
  });
}

function renderList(rates) {
  listElement.replaceChildren();

  rates.forEach((rate, index) => {
    const item = document.createElement('li');
    const day = document.createElement('span');
    const value = document.createElement('strong');

    day.textContent = dayNames[index];
    value.textContent = `${numberFormat.format(rate)} ₽`;
    item.append(day, value);
    listElement.append(item);
  });
}

async function loadRates(currency) {
  statusElement.textContent = 'Загрузка';
  statusElement.classList.remove('error');
  chartElement.setAttribute('aria-busy', 'true');

  try {
    const response = await fetch(`/api/rates/${currency}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Не удалось получить данные');
    }

    setSelectedCurrency(data.currency);
    currencyElement.textContent = data.currency;
    averageElement.textContent = `${numberFormat.format(data.avg)} ₽`;
    renderChart(data.currency, data.rates);
    renderList(data.rates);
    statusElement.textContent = navigator.onLine ? 'Получено' : 'Офлайн-кеш';
  } catch (error) {
    statusElement.textContent = 'Нет данных';
    statusElement.classList.add('error');
  } finally {
    chartElement.setAttribute('aria-busy', 'false');
  }
}

buttons.forEach((button) => {
  button.addEventListener('click', () => loadRates(button.dataset.currency));
});

if (buttons.length > 0) {
  loadRates('USD');
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
}
