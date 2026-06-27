'use client';

import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useAppStore } from '../../app/store';

interface PieChartProps {
  title: string;
  data: { category: string; value: number }[];
}

export default function PieChart({ title, data }: PieChartProps) {
  const { isDarkMode } = useAppStore();

  const textColor = isDarkMode ? '#94A3B8' : '#475569';

  // Beautiful curated color palette
  const colorsList = [
    '#2563EB', // Blue
    '#10B981', // Emerald
    '#EC4899', // Pink
    '#F59E0B', // Amber
    '#8B5CF6', // Violet
    '#06B6D4', // Cyan
    '#EF4444', // Red
    '#6366F1'  // Indigo
  ];

  const chartData = data.map(item => ({
    name: item.category,
    value: item.value
  }));

  const totalValue = data.reduce((acc, curr) => acc + curr.value, 0);

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
      formatter: '{b}: <b>{c}</b> ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'right',
      top: 'middle',
      textStyle: { color: textColor },
      formatter: (name: string) => {
        const item = chartData.find(d => d.name === name);
        if (!item) return name;
        const pct = ((item.value / totalValue) * 100).toFixed(1);
        return `${name} (${pct}%)`;
      }
    },
    color: colorsList,
    series: [
      {
        name: 'Distribution',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['40%', '55%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: isDarkMode ? '#0F172A' : '#FFFFFF',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 12,
            fontWeight: 'bold',
            color: isDarkMode ? '#FFFFFF' : '#0F172A',
            formatter: '{b}\n{c} ({d}%)'
          }
        },
        labelLine: {
          show: false
        },
        data: chartData
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
