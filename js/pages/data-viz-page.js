import { initNav } from '../modules/nav.js';
import { initRouter } from '../modules/router.js';
import { initViz, bindToolbar } from '../modules/viz.js';
import { renderBarChart, renderStatusChart } from '../modules/charts.js';

initNav('data');
initRouter();

function updateCharts(stations) {
  const barEl = document.getElementById('barChart');
  const statusEl = document.getElementById('statusChart');
  const chartsRow = document.getElementById('chartsRow');
  const chartOptions = { width: 920, height: 340 };

  if (barEl) barEl.innerHTML = renderBarChart(stations, chartOptions);
  if (statusEl) {
    const isMobile = window.innerWidth <= 768;
    statusEl.innerHTML = renderStatusChart(stations, {
      ...chartOptions,
      maxStations: isMobile ? 10 : 28
    });
  }
  chartsRow?.classList.add('visible');
}

initViz({ onRender: updateCharts });
bindToolbar();
