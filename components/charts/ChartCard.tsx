'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AlertCircle, HelpCircle } from 'lucide-react';
import { useAppStore } from '../../app/store';
import { getApiUrl } from '../../app/apiConfig';
import LineChart from './LineChart';
import BarChart from './BarChart';
import PieChart from './PieChart';
import ScatterChart from './ScatterChart';
import HeatmapChart from './HeatmapChart';
import HistogramChart from './HistogramChart';
import TreemapChart from './TreemapChart';
import RadarChart from './RadarChart';

interface ChartConfig {
  chart_type: string;
  title: string;
  x_column: string;
  y_column: string;
  group_by?: string;
  description: string;
}

export default function ChartCard({ config }: { config: ChartConfig }) {
  const { sessionId } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId && config) {
      setLoading(true);
      setError(null);
      
      axios.post(getApiUrl(`/api/chart_data/${sessionId}`), {
        chart_type: config.chart_type,
        x_column: config.x_column,
        y_column: config.y_column,
        group_by: config.group_by
      })
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load chart data for " + config.title, err);
        setError("Could not load visual dataset.");
        setLoading(false);
      });
    }
  }, [sessionId, config]);

  const renderChart = () => {
    if (!data) return null;
    
    const type = config.chart_type.toLowerCase();
    
    switch (type) {
      case 'line':
        return (
          <LineChart
            title=""
            xData={data.x_data || []}
            yData={data.y_data || []}
            xName={config.x_column}
            yName={config.y_column}
          />
        );
      case 'bar':
      case 'horizontal_bar':
        return (
          <BarChart
            title=""
            categories={data.categories || []}
            values={data.values || []}
            xName={config.x_column}
            yName={config.y_column}
            horizontal={type === 'horizontal_bar'}
          />
        );
      case 'pie':
        return <PieChart title="" data={data.data || []} />;
      case 'scatter':
        return (
          <ScatterChart
            title=""
            xData={data.x_data || []}
            yData={data.y_data || []}
            xName={config.x_column}
            yName={config.y_column}
          />
        );
      case 'heatmap':
        return (
          <HeatmapChart
            title=""
            columns={data.columns || []}
            correlations={data.correlations || []}
          />
        );
      case 'histogram':
        return (
          <HistogramChart
            title=""
            bins={data.bins || []}
            counts={data.counts || []}
            normalCurve={data.normal_curve || []}
          />
        );
      case 'treemap':
        return <TreemapChart title="" data={data.data || []} />;
      case 'radar':
        return (
          <RadarChart
            title=""
            indicators={data.indicators || []}
            data={data.data || []}
          />
        );
      default:
        return <p className="text-xs text-slate-400">Unsupported visualization type.</p>;
    }
  };

  return (
    <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      {/* Title & Info */}
      <div className="mb-4">
        <div className="flex items-start justify-between">
          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm tracking-wide">
            {config.title}
          </h4>
          <div className="group relative">
            <HelpCircle className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-pointer" />
            <div className="absolute right-0 top-6 hidden group-hover:block bg-slate-900 text-white text-[10px] p-2.5 rounded-lg max-w-[200px] z-20 leading-relaxed shadow-xl border border-slate-700">
              {config.description}
            </div>
          </div>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="flex-1 flex items-center justify-center min-h-[280px]">
        {loading ? (
          <div className="w-full space-y-4 animate-pulse">
            <div className="w-3/4 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="w-full h-44 bg-slate-100 dark:bg-slate-900/50 rounded-xl"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center text-rose-500 gap-2">
            <AlertCircle className="w-8 h-8 opacity-75" />
            <span className="text-xs font-semibold">{error}</span>
          </div>
        ) : (
          renderChart()
        )}
      </div>
    </div>
  );
}
