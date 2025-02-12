import React, { useEffect, useState, useRef } from 'react';
import ApexCharts from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

type CharDataType = {
  name: string,
  data: { x: number; y: number }[];
};

const Graph1: React.FC = () => {
  const [chartData, setChartData] = useState<CharDataType[]>([{ name: 'Crates Count', data: [] }]);
  const [barChartData, setBarChartData] = useState<CharDataType[]>([{ name: 'Crates', data: [] }]);
  const lastCrateCount = useRef<number | null>(null);
  const lastCrates = useRef<number | null>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    connectWebSocket();
    return () => ws.current?.close();
  }, []);

  const connectWebSocket = () => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      ws.current = new WebSocket('ws://localhost:8000/ws/live-data1/');

      ws.current.onmessage = (event) => {
        const parsedData = JSON.parse(event.data);
        const { Crates, Crates_count } = parsedData.data;
        
        const timestampValue = new Date();
        const crateCount = parseInt(Crates_count);
        const cratesValue = parseInt(Crates);

        // Update Line Chart (Crates Count)
        if (lastCrateCount.current !== crateCount) {
          setChartData((prevData) => [
            {
              ...prevData[0],
              data: [...prevData[0].data, { x: timestampValue.getTime(), y: crateCount }],
            },
          ]);
          lastCrateCount.current = crateCount;
        }

        // Update Bar Chart (Only Detected Crates)
        if (cratesValue > 0 && lastCrates.current !== cratesValue) {
          setBarChartData((prevData) => [
            {
              ...prevData[0],
              data: [...prevData[0].data, { x: timestampValue.getTime(), y: cratesValue }],
            },
          ]);
          lastCrates.current = cratesValue;
        }
      };
    }
  };

  const commonOptions: ApexOptions = {
    chart: {
      zoom: { enabled: true, type: 'x', autoScaleYaxis: false },
      toolbar: { autoSelected: 'zoom', tools: { pan: true, reset: true } },
    },
    tooltip: { enabled: true },
  };

  const xaxisConfig: ApexXAxis = {
    type: 'datetime',
    tickAmount: 5,
    labels: { 
      formatter: (value: string) => new Date(Number(value)).toLocaleTimeString('en-US', { hour12: false })
    }
  };

  const lineChartOptions: ApexOptions = {
    ...commonOptions,
    chart: { ...commonOptions.chart, id: 'live-line-chart', type: 'area' },
    xaxis: xaxisConfig,
    yaxis: { title: { text: 'Crates Count' } },
    stroke: { curve: 'smooth' },
    markers: { size: 4 },
    colors: ['#FF0000'],
  };

  const allFramesChartOptions: ApexOptions = {
    ...commonOptions,
    chart: { ...commonOptions.chart, id: 'all-frames-chart', type: 'bar' },
    xaxis: xaxisConfig,
    yaxis: { title: { text: 'Crates' } },
    colors: ['#FF0000'],
    plotOptions: { bar: { columnWidth: '20px' } },
    dataLabels: { enabled: false },
    tooltip: {
      enabled: true,
      x: { formatter: (value: number) => `Time: ${new Date(value).toLocaleTimeString('en-US', { hour12: false })}` },
    },
  };

  return (
    <div className="p-1 w-full flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-xl font-semibold mb-4 text-center">Live Data Monitoring</h2>

      <div className="w-[80%] flex flex-col items-center space-y-6">
        {/* Bar Chart (Detected Crates) */}
        <ApexCharts options={allFramesChartOptions} series={barChartData} type="bar" height={300} width={300} />

        {/* Line Chart (Crates Count over time) */}
        <ApexCharts options={lineChartOptions} series={chartData} type="area" height={300} width={300} />
      </div>
    </div>
  );
};

export default Graph1;