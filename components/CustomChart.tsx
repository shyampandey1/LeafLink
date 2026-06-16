
import React from 'react';

interface LineConfig {
  key: string;
  color: string;
  label: string;
  unit: string;
}

interface CustomChartProps {
  data: any[];
  lines: LineConfig[];
  yAxisLabel?: string;
  xAxisKey: string;
  height?: number;
  dualAxis?: boolean;
}

const CustomChart: React.FC<CustomChartProps> = ({
  data,
  lines,
  yAxisLabel,
  xAxisKey,
  height = 200,
  dualAxis = false
}) => {
  const width = 500;
  const padding = { top: 20, right: 50, bottom: 30, left: 50 };

  if (!data || data.length === 0) {
    return <div style={{ height: `${height}px` }} className="flex items-center justify-center text-gray-500">No data available</div>;
  }

  const getMinMax = (key: string) => {
    const values = data.map(d => d[key]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    // Add buffer
    const range = max - min;
    return [min - range * 0.1, max + range * 0.1];
  };

  const scales = lines.map(line => {
    const [min, max] = getMinMax(line.key);
    return {
      y: (value: number) => height - padding.bottom - ((value - min) / (max - min)) * (height - padding.top - padding.bottom),
      min,
      max
    };
  });
  
  const xScale = (index: number) => padding.left + (index / (data.length - 1)) * (width - padding.left - padding.right);

  const generatePath = (lineConfig: LineConfig, scaleIndex: number) => {
    const scale = scales[scaleIndex];
    let path = `M ${xScale(0)},${scale.y(data[0][lineConfig.key])}`;
    data.slice(1).forEach((d, i) => {
      path += ` L ${xScale(i + 1)},${scale.y(d[lineConfig.key])}`;
    });
    return path;
  };

  const renderYAxis = (scaleIndex: number, position: 'left' | 'right') => {
    const { min, max } = scales[scaleIndex];
    const ticks = 5;
    const tickValues = Array.from({ length: ticks }, (_, i) => min + (i / (ticks - 1)) * (max - min));
    
    return (
      <g>
        {tickValues.map((tick, i) => (
          <g key={i} transform={`translate(${position === 'left' ? padding.left : width - padding.right}, ${scales[scaleIndex].y(tick)})`}>
            <line x1={position === 'left' ? -5 : 5} y1="0" x2="0" y2="0" stroke="currentColor" className="text-gray-300 dark:text-gray-600" />
            <text
              x={position === 'left' ? -10 : 10}
              dy="0.32em"
              textAnchor={position === 'left' ? "end" : "start"}
              className="text-xs fill-current text-gray-500 dark:text-gray-400"
            >
              {Math.round(tick)}{lines[scaleIndex].unit}
            </text>
          </g>
        ))}
      </g>
    );
  };

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Grid Lines */}
        <g>
           {Array.from({ length: 5 }).map((_, i) => (
                <line
                    key={i}
                    x1={padding.left}
                    y1={padding.top + i * (height - padding.top - padding.bottom) / 4}
                    x2={width - padding.right}
                    y2={padding.top + i * (height - padding.top - padding.bottom) / 4}
                    className="stroke-current text-gray-200 dark:text-gray-700"
                    strokeWidth="1"
                />
            ))}
        </g>
        {/* X-Axis */}
        <g>
          {data.map((d, i) => (
            <text 
              key={i} 
              x={xScale(i)} 
              y={height - padding.bottom + 15}
              textAnchor="middle" 
              className="text-xs fill-current text-gray-500 dark:text-gray-400"
            >
              {new Date(d[xAxisKey]).getDate()}
            </text>
          ))}
          <text 
              x={width/2} 
              y={height}
              textAnchor="middle" 
              className="text-xs font-semibold fill-current text-gray-600 dark:text-gray-300"
            >
              Day of Month
            </text>
        </g>
        
        {/* Y-Axes */}
        {dualAxis ? (
          <>
            {renderYAxis(0, 'left')}
            {lines.length > 1 && renderYAxis(1, 'right')}
          </>
        ) : (
          renderYAxis(0, 'left')
        )}

        {/* Lines */}
        {lines.map((line, i) => (
          <path
            key={line.key}
            d={generatePath(line, dualAxis ? i : 0)}
            stroke={line.color}
            fill="none"
            strokeWidth="2"
          />
        ))}

        {/* Dots */}
        {lines.map((line, i) => (
          <g key={`dots-${line.key}`}>
            {data.map((d, j) => (
              <circle
                key={j}
                cx={xScale(j)}
                cy={scales[dualAxis ? i : 0].y(d[line.key])}
                r="3"
                fill={line.color}
              />
            ))}
          </g>
        ))}
      </svg>
      <div className="flex justify-center space-x-4 mt-2">
        {lines.map((line) => (
            <div key={line.key} className="flex items-center text-sm">
                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: line.color }}></span>
                <span>{line.label}</span>
            </div>
        ))}
      </div>
    </div>
  );
};

export default CustomChart;
