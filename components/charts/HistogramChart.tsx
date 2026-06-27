'use client';

import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useAppStore } from '../../app/store';

interface HistogramChartProps {
  title: string;
  bins: string[];
  counts: number[];
  normalCurve: number[];
}

export default function HistogramChart({ 
  title, 
  bins, 
  counts, 
  normalCurve 
}: HistogramChartProps) {
  const { isDarkMode } = useAppStore();

  const textColor = isDarkMode ? '#94A3B8' : '#475569';
  const lineColor = isDarkMode ? '#334155' : '#E2E8F0';

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
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
      borderColor: isDarkMode ? '#1E293B' : '#E2E8F0',
      textStyle: { color: isDarkMode ? '#F1F5F9' : '#0F172A' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '18%',
      containLabel: true
    },
    legend: {
      data: ['Count', 'Normal Distribution Fit'],
      textStyle: { color: textColor },
      top: 5,
      right: 10
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
      type: 'category',
      data: bins,
      axisLabel: { color: textColor, fontSize: 10, rotate: 15 },
      axisLine: { lineStyle: { color: lineColor } },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: textColor },
      axisLine: { lineStyle: { color: lineColor } },
      splitLine: { lineStyle: { color: lineColor, type: 'dashed' } }
    },
    series: [
      {
        name: 'Count',
        type: 'bar',
        barCategoryGap: '0%',
        data: counts,
        itemStyle: {
          color: 'rgba(59, 130, 246, 0.7)',
          borderColor: '#2563EB',
          borderWidth: 1
        }
      },
      normalCurve && normalCurve.length > 0 ? {
        name: 'Normal Distribution Fit',
        type: 'line',
        data: normalCurve,
        showSymbol: false,
        smooth: true,
        lineStyle: {
          color: '#EC4899', // Pink-500
          width: 2.5
        },
        z: 5
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
