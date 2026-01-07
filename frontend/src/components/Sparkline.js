import React, { useState, useRef } from 'react';

const Sparkline = ({ history = [], width = 100, height = 40 }) => {
  const [hoverData, setHoverData] = useState(null);
  const svgRef = useRef(null);

  if (history.length < 2) {
    return <svg width={width} height={height} className="sparkline-svg" />;
  }

  const max = Math.max(...history, 1);
  const min = 0;

  const getCoords = (point, i) => {
    const x = (i / (history.length - 1)) * width;
    const y = height - ((point - min) / (max - min)) * height;
    return { x, y };
  };

  const points = history.map(getCoords).map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
  const areaPath = `M ${points} L ${width},${height} L 0,${height} Z`;

  const handleMouseMove = (e) => {
    const svg = svgRef.current;
    if (!svg) return;
    
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
    
    const index = Math.round((svgP.x / width) * (history.length - 1));
    const point = history[index];
    const coords = getCoords(point, index);

    setHoverData({
      x: coords.x,
      y: coords.y,
      value: point,
    });
  };

  const handleMouseLeave = () => {
    setHoverData(null);
  };

  return (
    <svg 
      ref={svgRef}
      width="100%" 
      height="100%" 
      viewBox={`0 0 ${width} ${height}`} 
      preserveAspectRatio="none"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="sparkline-svg"
    >
      <defs>
        <linearGradient id="sparkline-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'var(--total-logs-color)', stopOpacity: 0.4 }} />
          <stop offset="100%" style={{ stopColor: 'var(--total-logs-color)', stopOpacity: 0.1 }} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sparkline-gradient)" />
      <polyline
        fill="none"
        stroke="var(--total-logs-color)"
        strokeWidth="1.5"
        points={points}
      />
      {hoverData && (
        <>
          <line className="hover-line" x1={hoverData.x} y1="0" x2={hoverData.x} y2={height} />
          <circle className="hover-circle" cx={hoverData.x} cy={hoverData.y} r="2" />
          <text className="hover-text" x={hoverData.x + 2} y={hoverData.y - 5}>{hoverData.value}</text>
        </>
      )}
    </svg>
  );
};

export default Sparkline;

