'use client';

import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useAppStore } from '../../app/store';

interface HeatmapChartProps {
  title: string;
  columns: string[];
  correlations: { col1: string; col2: string; coefficient: number }[];
}

export default function HeatmapChart({ 
  title, 
  columns, 
  correlations 
}: HeatmapChartProps) {
  const { isDarkMode } = useAppStore();

  const textColor = isDarkMode ? '#94A3B8' : '#475569';
  const lineColor = isDarkMode ? '#334155' : '#E2E8F0';

  // Build matrix data
  const matrixData: [number, number, number][] = [];
  const n = columns.length;

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const col1 = columns[i];
      const col2 = columns[j];
      
      let coeff = 0.0;
      if (i === j) {
        coeff = 1.0;
      } else {
        const match = correlations.find(
          c => (c.col1 === col1 && c.col2 === col2) || (c.col1 === col2 && c.col2 === col1)
        );
        coeff = match ? match.coefficient : 0.0;
      }
      // ECharts Heatmap format: [xIndex, yIndex, value]
      matrixData.push([i, j, parseFloat(coeff.toFixed(2))]);
    }
  }

  const option = {
    backgroundColor: 'transparent',
    title: {
      text: title,
      textStyle: {
        color: isDarkMode ? '#FFFFFF' : '#0F172A',
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: 14,
        fontWeight: 'bold'
      },
      top: 5
    },
    tooltip: {
      position: 'top',
      backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
      borderColor: isDarkMode ? '#1E293B' : '#E2E8F0',
      textStyle: { color: isDarkMode ? '#F1F5F9' : '#0F172A' },
      formatter: (params: any) => {
        const x = columns[params.value[0]];
        const y = columns[params.value[1]];
        return `<b>${x}</b> & <b>${y}</b><br/>Correlation: <b>${params.value[2]}</b>`;
      }
    },
    grid: {
      left: '3%',
      right: '12%', // Leave room for visualMap
      bottom: '15%',
      top: '18%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: columns,
      axisLabel: { color: textColor, rotate: columns.length > 5 ? 30 : 0, fontSize: 10 },
      axisLine: { lineStyle: { color: lineColor } },
      splitArea: { show: true }
    },
    yAxis: {
      type: 'category',
      data: columns,
      axisLabel: { color: textColor, fontSize: 10 },
      axisLine: { lineStyle: { color: lineColor } },
      splitArea: { show: true }
    },
    visualMap: {
      min: -1,
      max: 1,
      calculable: true,
      orient: 'vertical',
      right: 'right',
      top: 'center',
      // Red to White to Blue gradient (diverging)
      inRange: {
        color: ['#EF4444', '#F8FAFC', '#3B82F6']
      },
      textStyle: { color: textColor },
      precision: 1
    },
    series: [
      {
        name: 'Correlation',
        type: 'heatmap',
        data: matrixData,
        label: {
          show: columns.length < 8,
          color: isDarkMode ? '#0F172A' : '#1E293B',
          fontSize: 10,
          fontWeight: 'bold'
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          }
        }
      }
    ]
  };

  return (
    <div className="w-full h-[320px]">
      <ReactECharts 
        option={option} 
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'svg' }}
      />
    </div>
  );
}
