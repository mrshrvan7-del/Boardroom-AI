'use client';

import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useAppStore } from '../../app/store';

interface ScatterChartProps {
  title: string;
  xData: number[];
  yData: number[];
  xName: string;
  yName: string;
}

export default function ScatterChart({ 
  title, 
  xData, 
  yData, 
  xName, 
  yName 
}: ScatterChartProps) {
  const { isDarkMode } = useAppStore();

  const textColor = isDarkMode ? '#94A3B8' : '#475569';
  const lineColor = isDarkMode ? '#334155' : '#E2E8F0';
  
  // Package data into [x, y] coordinates
  const scatterPoints = xData.map((x, idx) => [x, yData[idx]]);

  // Calculate Linear Regression line
  let regressionPoints: number[][] = [];
  if (xData.length > 1) {
    const n = xData.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    for (let i = 0; i < n; i++) {
      sumX += xData[i];
      sumY += yData[i];
      sumXY += xData[i] * yData[i];
      sumXX += xData[i] * xData[i];
    }

    const denom = n * sumXX - sumX * sumX;
    if (denom !== 0) {
      const slope = (n * sumXY - sumX * sumY) / denom;
      const intercept = (sumY - slope * sumX) / n;

      const minX = Math.min(...xData);
      const maxX = Math.max(...xData);

      regressionPoints = [
        [minX, slope * minX + intercept],
        [maxX, slope * maxX + intercept]
      ];
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
      trigger: 'item',
      backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
      borderColor: isDarkMode ? '#1E293B' : '#E2E8F0',
      textStyle: { color: isDarkMode ? '#F1F5F9' : '#0F172A' },
      formatter: (params: any) => {
        if (params.seriesName === 'Data Points') {
          return `${xName}: <b>${params.value[0].toFixed(2)}</b><br/>${yName}: <b>${params.value[1].toFixed(2)}</b>`;
        }
        return 'Trendline';
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '18%',
      containLabel: true
    },
    toolbox: {
      feature: {
        saveAsImage: { title: 'Export', pixelRatio: 2 }
      },
      iconStyle: { borderColor: textColor },
      right: 10,
      bottom: 0
    },
    xAxis: {
      type: 'value',
      name: xName,
      nameLocation: 'middle',
      nameGap: 24,
      nameTextStyle: { color: textColor },
      axisLine: { lineStyle: { color: lineColor } },
      axisLabel: { color: textColor },
      splitLine: { lineStyle: { color: lineColor, type: 'dashed' } }
    },
    yAxis: {
      type: 'value',
      name: yName,
      nameTextStyle: { color: textColor },
      axisLine: { lineStyle: { color: lineColor } },
      axisLabel: { color: textColor },
      splitLine: { lineStyle: { color: lineColor, type: 'dashed' } }
    },
    series: [
      {
        name: 'Data Points',
        type: 'scatter',
        data: scatterPoints,
        symbolSize: 8,
        itemStyle: {
          color: 'rgba(37, 99, 235, 0.6)',
          borderColor: '#1D4ED8',
          borderWidth: 1
        }
      },
      regressionPoints.length > 0 ? {
        name: 'Trendline',
        type: 'line',
        data: regressionPoints,
        showSymbol: false,
        lineStyle: {
          color: '#EC4899', // Pink-500
          width: 2.5,
          type: 'dashed'
        },
        z: 10
      } : null
    ].filter(Boolean)
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
