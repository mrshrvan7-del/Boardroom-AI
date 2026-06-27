'use client';

import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useAppStore } from '../../app/store';

interface RadarChartProps {
  title: string;
  indicators: { name: string; max: number }[];
  data: { name: string; value: number[] }[];
}

export default function RadarChart({ 
  title, 
  indicators, 
  data 
}: RadarChartProps) {
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
      backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
      borderColor: isDarkMode ? '#1E293B' : '#E2E8F0',
      textStyle: { color: isDarkMode ? '#F1F5F9' : '#0F172A' }
    },
    legend: {
      data: data.map(d => d.name),
      textStyle: { color: textColor },
      bottom: 0,
      left: 'center'
    },
    toolbox: {
      feature: {
        saveAsImage: { title: 'Export', pixelRatio: 2 }
      },
      iconStyle: { borderColor: textColor },
      right: 10,
      top: 0
    },
    radar: {
      indicator: indicators,
      axisName: {
        color: textColor,
        backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
        borderRadius: 3,
        padding: [3, 5]
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: isDarkMode 
            ? ['rgba(30, 41, 59, 0.4)', 'rgba(30, 41, 59, 0.2)'] 
            : ['rgba(241, 245, 249, 0.8)', 'rgba(241, 245, 249, 0.4)']
        }
      },
      axisLine: {
        lineStyle: { color: lineColor }
      },
      splitLine: {
        lineStyle: { color: lineColor }
      }
    },
    series: [
      {
        name: 'Group Attributes',
        type: 'radar',
        data: data.map((d, idx) => {
          const colors = ['#2563EB', '#EC4899', '#10B981'];
          const color = colors[idx % colors.length];
          return {
            name: d.name,
            value: d.value,
            itemStyle: { color },
            lineStyle: { width: 2 },
            areaStyle: {
              color: color,
              opacity: 0.15
            }
          };
        })
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
