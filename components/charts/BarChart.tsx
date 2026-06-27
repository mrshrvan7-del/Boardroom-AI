'use client';

import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useAppStore } from '../../app/store';

interface BarChartProps {
  title: string;
  categories: string[];
  values: number[];
  xName?: string;
  yName?: string;
  horizontal?: boolean;
}

export default function BarChart({ 
  title, 
  categories, 
  values, 
  xName, 
  yName,
  horizontal = false 
}: BarChartProps) {
  const { isDarkMode } = useAppStore();

  const textColor = isDarkMode ? '#94A3B8' : '#475569';
  const lineColor = isDarkMode ? '#334155' : '#E2E8F0';
  
  // Custom ECharts gradient color
  const gradientFill = {
    type: 'linear',
    x: 0,
    y: 0,
    x2: horizontal ? 1 : 0,
    y2: horizontal ? 0 : 1,
    colorStops: [
      { offset: 0, color: '#3B82F6' }, // Light blue
      { offset: 1, color: '#1D4ED8' }  // Dark blue
    ]
  };

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
      axisPointer: { type: 'shadow' },
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
    toolbox: {
      feature: {
        saveAsImage: { title: 'Export', pixelRatio: 2 }
      },
      iconStyle: { borderColor: textColor },
      right: 10,
      bottom: 0
    },
    xAxis: horizontal 
      ? {
          type: 'value',
          name: xName,
          nameTextStyle: { color: textColor },
          axisLine: { lineStyle: { color: lineColor } },
          axisLabel: { color: textColor },
          splitLine: { lineStyle: { color: lineColor, type: 'dashed' } }
        }
      : {
          type: 'category',
          data: categories,
          name: xName,
          nameTextStyle: { color: textColor },
          axisLine: { lineStyle: { color: lineColor } },
          axisLabel: { color: textColor, rotate: categories.length > 8 ? 30 : 0 },
          splitLine: { show: false }
        },
    yAxis: horizontal
      ? {
          type: 'category',
          data: categories,
          name: yName,
          nameTextStyle: { color: textColor },
          axisLine: { lineStyle: { color: lineColor } },
          axisLabel: { color: textColor },
          splitLine: { show: false }
        }
      : {
          type: 'value',
          name: yName,
          nameTextStyle: { color: textColor },
          axisLine: { lineStyle: { color: lineColor } },
          axisLabel: { color: textColor },
          splitLine: { lineStyle: { color: lineColor, type: 'dashed' } }
        },
    series: [
      {
        name: 'Value',
        type: 'bar',
        data: values,
        itemStyle: {
          color: gradientFill,
          borderRadius: horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]
        },
        label: {
          show: true,
          position: horizontal ? 'right' : 'top',
          color: textColor,
          fontSize: 10,
          formatter: (params: any) => {
            const val = params.value;
            return val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(1);
          }
        },
        barMaxWidth: 30
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
