"use client";

import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js/auto';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

export function TaxCharts({ taxData }) {
  const deductionsChartRef = useRef(null);
  const taxTrendChartRef = useRef(null);
  const deductionsChartInstance = useRef(null);
  const taxTrendChartInstance = useRef(null);

  useEffect(() => {
    // Cleanup previous chart instances
    if (deductionsChartInstance.current) {
      deductionsChartInstance.current.destroy();
    }
    if (taxTrendChartInstance.current) {
      taxTrendChartInstance.current.destroy();
    }

    // Common chart options
    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          font: {
            size: 16,
            color: 'currentColor'
          }
        },
        legend: {
          labels: {
            color: 'currentColor'
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '₹' + value.toLocaleString('en-IN');
            },
            color: 'currentColor'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        },
        x: {
          ticks: {
            color: 'currentColor'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        }
      }
    };

    // Deductions vs Taxable Income Chart
    const deductionsCtx = deductionsChartRef.current.getContext('2d');
    deductionsChartInstance.current = new ChartJS(deductionsCtx, {
      type: 'bar',
      data: {
        labels: ['Total Income', 'Deductions', 'Taxable Income'],
        datasets: [{
          label: 'Amount (₹)',
          data: [
            taxData.totalIncome,
            taxData.totalDeductions,
            taxData.taxableIncome
          ],
          backgroundColor: [
            'rgba(75, 192, 192, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)'
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        ...commonOptions,
        plugins: {
          ...commonOptions.plugins,
          title: {
            ...commonOptions.plugins.title,
            text: 'Deductions Impact on Taxable Income'
          }
        }
      }
    });

    // Tax Liability Over Time Chart
    const taxTrendCtx = taxTrendChartRef.current.getContext('2d');
    taxTrendChartInstance.current = new ChartJS(taxTrendCtx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
          label: 'Monthly Tax Liability',
          data: taxData.monthlyBreakdown.map(month => month.tax),
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }]
      },
      options: {
        ...commonOptions,
        plugins: {
          ...commonOptions.plugins,
          title: {
            ...commonOptions.plugins.title,
            text: 'Tax Liability Over Time'
          }
        }
      }
    });

    // Cleanup function
    return () => {
      if (deductionsChartInstance.current) {
        deductionsChartInstance.current.destroy();
      }
      if (taxTrendChartInstance.current) {
        taxTrendChartInstance.current.destroy();
      }
    };
  }, [taxData]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 h-[400px]">
        <canvas ref={deductionsChartRef}></canvas>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 h-[400px]">
        <canvas ref={taxTrendChartRef}></canvas>
      </div>
    </div>
  );
} 