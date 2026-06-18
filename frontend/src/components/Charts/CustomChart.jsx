import React from 'react';

/**
 * Premium custom SVG & CSS-based charting system.
 * Avoids heavy 3rd-party library dependencies, supports themes perfectly, and performs exceptionally.
 */

// Donut Progress Chart for Attendance/Completion Gauge
export const DonutProgress = ({
  value = 0,
  size = 120,
  strokeWidth = 10,
  color = 'var(--primary)',
  bgColor = 'var(--border-color)',
  label = 'Attendance'
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progressOffset = circumference - (Math.min(value, 100) / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={bgColor}
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={progressOffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset var(--transition-slow)',
            }}
          />
        </svg>
        {/* Center label */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1
        }}>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: `${size * 0.16}px`,
            fontWeight: 800,
            color: 'var(--text-primary)'
          }}>
            {value}%
          </span>
          <span style={{
            fontSize: `${size * 0.08}px`,
            color: 'var(--text-muted)',
            fontWeight: 600,
            marginTop: '2px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {label}
          </span>
        </div>
      </div>
    </div>
  );
};

// Bar Chart for Subject-wise Scores
export const BarChart = ({
  data = [], // [{ label: 'Maths', value: 85 }]
  max = 100,
  color = 'var(--primary)'
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', padding: '0.5rem 0' }}>
      {data.map((item, idx) => {
        const percentage = Math.min((item.value / max) * 100, 100);
        return (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div className="flex-between" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
              <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
              <span style={{ color: 'var(--text-primary)' }}>{item.value} / {max}</span>
            </div>
            
            {/* Custom Bar progress track */}
            <div style={{
              height: '10px',
              backgroundColor: 'var(--border-color)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                height: '100%',
                width: `${percentage}%`,
                borderRadius: 'var(--radius-full)',
                backgroundColor: item.color || color,
                transition: 'width var(--transition-slow)',
                backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.15) 100%)'
              }}></div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Line Chart for Grade Progression Trends over dates
export const LineChart = ({
  data = [], // [80, 85, 82, 90, 88, 95]
  labels = [], // ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  height = 200,
  color = 'var(--primary)'
}) => {
  if (data.length === 0) return null;

  const maxVal = 100;
  const minVal = 0;
  const paddingX = 40;
  const paddingY = 20;
  const chartHeight = height - paddingY * 2;
  const chartWidth = 500; // Simulated SVG viewBox width

  const points = data.map((val, idx) => {
    const x = paddingX + (idx / (data.length - 1)) * (chartWidth - paddingX * 2);
    // In SVG, y=0 is top, so we invert
    const y = paddingY + chartHeight - ((val - minVal) / (maxVal - minVal)) * chartHeight;
    return { x, y, value: val };
  });

  // Construct SVG Path (Bezier Curves)
  const pathD = points.reduce((path, pt, idx) => {
    if (idx === 0) return `M ${pt.x} ${pt.y}`;
    // Simple smooth curves
    const prevPt = points[idx - 1];
    const cpX1 = prevPt.x + (pt.x - prevPt.x) / 2;
    const cpY1 = prevPt.y;
    const cpX2 = prevPt.x + (pt.x - prevPt.x) / 2;
    const cpY2 = pt.y;
    return `${path} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${pt.x} ${pt.y}`;
  }, '');

  // Grid lines
  const gridLines = [25, 50, 75, 100];

  return (
    <div style={{ width: '100%' }}>
      <svg
        viewBox={`0 0 ${chartWidth} ${height}`}
        style={{ width: '100%', height: 'auto', overflow: 'visible' }}
      >
        {/* Grid lines */}
        {gridLines.map((line, idx) => {
          const y = paddingY + chartHeight - (line / 100) * chartHeight;
          return (
            <g key={idx}>
              <line
                x1={paddingX}
                y1={y}
                x2={chartWidth - paddingX}
                y2={y}
                stroke="var(--border-color)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={paddingX - 10}
                y={y + 4}
                fill="var(--text-muted)"
                fontSize="10"
                textAnchor="end"
                fontWeight="600"
              >
                {line}%
              </text>
            </g>
          );
        })}

        {/* The line path */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
          style={{
            strokeDasharray: 1000,
            strokeDashoffset: 0, // In realistic projects we could animate this
            transition: 'stroke-dashoffset 2s ease'
          }}
        />

        {/* Nodes points circles and tooltips */}
        {points.map((pt, idx) => (
          <g key={idx} className="chart-node" style={{ cursor: 'pointer' }}>
            <circle
              cx={pt.x}
              cy={pt.y}
              r="5"
              fill="var(--bg-secondary)"
              stroke={color}
              strokeWidth="2.5"
              style={{ transition: 'all 0.15s' }}
            />
            {/* Tooltip value */}
            <text
              x={pt.x}
              y={pt.y - 12}
              fill="var(--text-primary)"
              fontSize="10"
              fontWeight="700"
              textAnchor="middle"
            >
              {pt.value}%
            </text>
            {/* X Axis Label */}
            {labels[idx] && (
              <text
                x={pt.x}
                y={height - 2}
                fill="var(--text-muted)"
                fontSize="10"
                fontWeight="500"
                textAnchor="middle"
              >
                {labels[idx]}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
};
