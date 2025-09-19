window.renderVulnChart = function () {
  const canvas = document.getElementById('vulnChart');
  if (!canvas) {
    console.error("vulnChart not found when trying to render chart");
    return;
  }

  const ctx = canvas.getContext('2d');

  let severityCounts = [0, 0, 0, 0];
  if (window.lastScanResult && typeof window.getSeverityCounts === 'function') {
    severityCounts = window.getSeverityCounts(window.lastScanResult);
  } else if (typeof getSeverityCounts === 'function' && typeof lastScanResult !== 'undefined') {
    severityCounts = getSeverityCounts(lastScanResult);
  }

  const totalIssues = severityCounts.reduce((a, b) => a + b, 0);
  const zeroState = totalIssues === 0;


  const labels = zeroState
    ? ['No issues']
    : ['Critical', 'High', 'Moderate', 'Low'];
//green circle
  const values = zeroState
    ? [1]                          
    : severityCounts;

  const backgroundColors = zeroState
    ? ['#689D76']                 
    : ['#611C19', '#962E2A', '#e3967d', '#A1D6E2'];

  const hoverBackgroundColors = zeroState
    ? ['rgba(104, 157, 118, 0.50)']
    : ['rgba(97, 28, 25, 0.71)', 'rgba(150, 46, 42, 0.71)', 'rgba(227, 134, 125, 0.71)', 'rgba(161, 214, 226, 0.71)'];

  const data = {
    labels,
    datasets: [{
      data: values,
      backgroundColor: backgroundColors,
      borderWidth: 0,
      hoverBackgroundColor: hoverBackgroundColors,
      hoverBorderColor: zeroState ? ['#ffffff'] : [
        'rgba(97, 28, 25, 0.71)',
        'rgba(150, 46, 42, 0.71)',
        'rgba(227, 134, 125, 0.71)',
        'rgba(161, 214, 226, 0.71)'
      ],
      hoverBorderWidth: 6
    }]
  };

  // green when zero
  const centerText = {
    id: 'centerText',
    beforeDraw(chart) {
      const { ctx, chartArea } = chart;
      const centerX = (chartArea.left + chartArea.right) / 2;
      const centerY = (chartArea.top + chartArea.bottom) / 2;

      ctx.save();

      ctx.translate(centerX, centerY);
      ctx.scale(1.1, 0.9);
      ctx.translate(-centerX, -centerY);

      ctx.font = 'bold 66px "Fira Sans Condensed", sans-serif';
      ctx.fillStyle = zeroState ? '#689D76' : '#962E2A';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const numText = zeroState ? '0' : totalIssues.toString().padStart(2, '0');
      ctx.fillText(numText, centerX, centerY - 20);

      ctx.font = 'bold 24px "Fira Sans Condensed", sans-serif';
      ctx.fillStyle = '#384247';
      ctx.fillText(zeroState ? 'Issues' : 'issues found', centerX, centerY + 30);

      ctx.restore();
    }
  };

  const chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: data,
    options: {
      cutout: '65%',
      radius: '65%',
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      },
      interaction: {
        mode: 'nearest',
        intersect: true
      }
    },
    plugins: [centerText]
  });

  const labelText = document.querySelector('#chartLabel .label-text');
  const colorBox = document.querySelector('#chartLabel .color-box');

  const setNeutral = () => {
    if (!labelText || !colorBox) return;
    labelText.style.color = '#384247';
    labelText.textContent = zeroState ? 'No issues found' : 'hover to see details';
    colorBox.style.backgroundColor = zeroState ? backgroundColors[0] : 'transparent';
  };

  canvas.addEventListener('mousemove', function (event) {
    const points = chartInstance.getElementsAtEventForMode(
      event,
      'nearest',
      { intersect: true },
      true
    );

    if (points.length) {
      const index = points[0].index;
      const label = data.labels[index];
      const value = data.datasets[0].data[index];
      const total = zeroState ? 1 : data.datasets[0].data.reduce((a, b) => a + b, 0);
      const percent = Math.round((value / total) * 100);

      labelText.style.color = '#384247';
      labelText.textContent = zeroState ? 'No issues • 100%' : `${label} ${percent}%`;
      colorBox.style.backgroundColor = data.datasets[0].backgroundColor[index];
    } else {
      setNeutral();
    }
  });

  setNeutral();
};
