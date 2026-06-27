'use client';

import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useAppStore } from '../../app/store';

interface TreemapChartProps {
  title: string;
  data: any[];
}

export default function TreemapChart({ title, data }: TreemapChartProps) {
  const { isDarkMode } = useAppStore();

  const textColor = isDarkMode ? '#94A3B8' : '#475569';

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
    toolbox: {
      feature: {
        saveAsImage: { title: 'Export', pixelRatio: 2 }
      },
      iconStyle: { borderColor: textColor },
      right: 10,
      bottom: 0
    },
    series: [
      {
        name: 'Scale',
        type: 'treemap',
        visibleMin: 300,
        label: {
          show: true,
          formatter: '{b}'
        },
        itemStyle: {
          borderColor: isDarkMode ? '#0F172A' : '#FFFFFF',
          borderWidth: 1,
          gapWidth: 1
        },
        upperLabel: {
          show: true,
          height: 30,
          color: isDarkMode ? '#FFFFFF' : '#0F172A',
          fontWeight: 'bold'
        },
        levels: [
          {
            itemStyle: {
              borderColor: '#777',
              borderWidth: 0,
              gapWidth: 1
            },
            upperLabel: {
              show: false
            }
          },
          {
            itemStyle: {
              borderColor: '#555',
              borderWidth: 4,
              gapWidth: 4
            },
            color: [
              '#3B82F6', // Blue
              '#10B981', // Emerald
              '#EC4899', // Pink
              '#F59E0B', // Amber
              '#8B5CF6'  // Violet
            ]
          },
          {
            colorSaturation: [0.35, 0.5],
            itemStyle: {
              borderWidth: 1,
              gapWidth: 1,
              borderColorSaturation: 0.6
            }
          }
        ],
        data: data
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
