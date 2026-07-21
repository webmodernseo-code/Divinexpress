import styles from './RevenueChart.module.css';

export interface RevenueChartPoint {
  date: string;
  totalCents: number;
}

const MONTH_NAMES = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

function formatDateLabel(iso: string): string {
  const [, month, day] = iso.split('-');
  return `${Number(day)} ${MONTH_NAMES[Number(month) - 1]}`;
}

export function RevenueChart({ data }: { data: RevenueChartPoint[] }) {
  const width = 640;
  const height = 220;
  const paddingLeft = 8;
  const paddingTop = 16;
  const paddingBottom = 8;
  const chartWidth = width - paddingLeft;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxValue = Math.max(...data.map((d) => d.totalCents), 100);
  const stepX = data.length > 1 ? chartWidth / (data.length - 1) : 0;

  function xFor(index: number) {
    return paddingLeft + index * stepX;
  }
  function yFor(value: number) {
    return paddingTop + chartHeight - (value / maxValue) * chartHeight;
  }

  const linePoints = data.map((d, i) => `${xFor(i)},${yFor(d.totalCents)}`).join(' ');
  const baseline = paddingTop + chartHeight;
  const areaPoints = `${xFor(0)},${baseline} ${linePoints} ${xFor(data.length - 1)},${baseline}`;

  const labelStep = Math.max(1, Math.round(data.length / 7));
  const labeledPoints = data.filter((_, i) => i % labelStep === 0);

  return (
    <div className={styles.wrapper}>
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.svg} preserveAspectRatio="none">
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--dash-purple)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--dash-purple)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#revenueGradient)" stroke="none" />
        <polyline
          points={linePoints}
          fill="none"
          stroke="var(--dash-purple)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle cx={xFor(data.length - 1)} cy={yFor(data[data.length - 1].totalCents)} r="4" fill="var(--dash-purple)" />
      </svg>
      <div className={styles.xLabels}>
        {labeledPoints.map((d) => (
          <span key={d.date} className={styles.xLabel}>
            {formatDateLabel(d.date)}
          </span>
        ))}
      </div>
    </div>
  );
}
