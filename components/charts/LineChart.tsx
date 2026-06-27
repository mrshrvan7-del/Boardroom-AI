'use client';

import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useAppStore } from '../../app/store';

interface ChartProps {
  title: string;
  xData: any[];
  yData: number[];
  xName?: string;
  yName?: string;
  forecastData?: number[]; // Dashed line for forecasting
  forecastDates?: string[];
}

export default function LineChart({ 
  title, 
  xData, 
  yData, 
  xName, 
  yName,
  forecastData,
  forecastDates
}: ChartProps) {
  const { isDarkMode } = useAppStore();

  const textColor = isDarkMode ? '#94A3B8' : '#475569';
  const lineColor = isDarkMode ? '#334155' : '#E2E8F0';
  const primaryColor = '#2563EB'; // Blue-600
  const secondaryColor = '#EC4899'; // Pink-500 for forecast

  // Merge forecast data if provided
  let finalXData = [...xData];
  let actualSeriesData = [...yData];
  let forecastSeriesData = Array(yData.length - 1).fill(null);
  
  // Connect last actual data point to forecast
  if (yData.length > 0) {
    forecastSeriesData.push(yData[yData.length - 1]);
  }

  if (forecastData && forecastDates) {
    finalXData = [...xData, ...forecastDates];
    forecastSeriesData = [...forecastSeriesData, ...forecastData];
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
      trigger: 'axis',
      backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
      borderColor: isDarkMode ? '#1E293B' : '#E2E8F0',
      textStyle: {
        color: isDarkMode ? '#F1F5F9' : '#0F172A'
      }
    },
    legend: {
      data: ['Actual', 'Forecast'].filter((_, i) => i === 0 || (forecastData && forecastData.length > 0)),
      textStyle: { color: textColor },
      top: 5,
      right: 10
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
        saveAsImage: {
          title: 'Export',
          pixelRatio: 2
        }
      },
      iconStyle: {
        borderColor: textColor
      },
      right: 10,
      bottom: 0
    },
    xAxis: {
      type: 'category',
      data: finalXData,
      name: xName,
      nameTextStyle: { color: textColor },
      axisLine: { lineStyle: { color: lineColor } },
      axisLabel: { color: textColor, rotate: finalXData.length > 12 ? 30 : 0 },
      splitLine: { show: false }
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
        name: 'Actual',
        type: 'line',
        data: actualSeriesData,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: finalXData.length < 50,
        itemStyle: { color: primaryColor },
        lineStyle: { width: 3 },
        smooth: true,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(37, 99, 235, 0.25)' },
              { offset: 1, color: 'rgba(37, 99, 235, 0)' }
            ]
          }
        }
      },
      forecastData && forecastData.length > 0 ? {
        name: 'Forecast',
        type: 'line',
        data: forecastSeriesData,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: { color: secondaryColor },
        lineStyle: { width: 3, type: 'dashed' },
        smooth: true,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(236, 72, 153, 0.2)' },
              { offset: 1, color: 'rgba(236, 72, 153, 0)' }
            ]
          }
        }
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
