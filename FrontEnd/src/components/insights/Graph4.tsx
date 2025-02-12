import { ApexOptions } from 'apexcharts';
import React, { useEffect, useState, useRef } from 'react';
import ApexCharts from 'react-apexcharts';
type CharData = {
  name: string,
  data: {x: number, y: number}[]
}

const Graph4: React.FC = () => {
  const [chartData, setChartData] = useState<CharData[]>([{ name: 'Total Crate Count', data: [] }]);
  const lastCrateCount = useRef<number | null>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    connectWebSocket();
    return () => ws.current?.close();
  }, []);

  const connectWebSocket = () => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      ws.current = new WebSocket('ws://localhost:8000/ws/live-data4/');

      ws.current.onmessage = (event) => {
        const parsedData = JSON.parse(event.data);
        const { "Total Crate Count": totalCrateCount } = parsedData.data;
        const crateCount = parseInt(totalCrateCount);
        const timestampValue = new Date();

        if (lastCrateCount.current !== crateCount) {
          setChartData((prevData) => [
            {
              ...prevData[0],
              data: [...prevData[0].data, { x: timestampValue.getTime(), y: crateCount }], // Keep last 50 points
            },
          ]);
          lastCrateCount.current = crateCount;
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

  const chartOptions: ApexOptions = {
    ...commonOptions,
    chart: { ...commonOptions.chart, id: 'live-line-chart', type: 'area' },
    xaxis: {
      type: 'datetime',
      title: { text: 'Time' },
      tickAmount: 10,
      labels: {
        formatter: (value: string) =>
          new Date(Number(value)).toLocaleTimeString('en-US', { hour12: false }),
      },
    },
    yaxis: { title: { text: 'Crates Count' } },
    stroke: { curve: 'smooth' },
    markers: { size: 4 },
    colors: ['#FF0000'],
  };

  return (
    <div className="p-4 w-full flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-xl font-semibold mb-4 text-center">Live Crate Count Monitoring</h2>
      <div>
        <ApexCharts options={chartOptions} series={chartData} type="area" height={350} width={350} />
      </div>
    </div>
  );
};

export default Graph4;
 