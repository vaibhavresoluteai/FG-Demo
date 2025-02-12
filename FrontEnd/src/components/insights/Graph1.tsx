import React, { useEffect, useState, useRef } from 'react';
import ApexCharts from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

const WebSocketGraph: React.FC = () => {
  const [chartData, setChartData] = useState<{ name: string; data: { x: number; y: number }[] }[]>([{ name: 'Crates Count', data: [] }]);
  const [barChartData, setBarChartData] = useState<{ name: string; data: { x: number; y: number }[] }[]>([{ name: 'Crates', data: [] }]);
  const [maxFrame, setMaxFrame] = useState<number>(500); // Extend dynamically

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
        const { Frame, Crates, Crates_count } = parsedData.data;

        const frameNumber = parseInt(Frame);
        const crateCount = parseInt(Crates_count);
        const cratesValue = parseInt(Crates);

        // Update Line Chart (Crates Count)
        if (lastCrateCount.current !== crateCount) {
          setChartData((prevData) => [
            {
              ...prevData[0],
              data: [...prevData[0].data, { x: frameNumber, y: crateCount }],
            },
          ]);
          lastCrateCount.current = crateCount;
        }

        // Update Bar Chart (Only Detected Crates)
        if (cratesValue > 0 && lastCrates.current !== cratesValue) {
          setBarChartData((prevData) => [
            {
              ...prevData[0],
              data: [...prevData[0].data, { x: frameNumber, y: cratesValue }],
            },
          ]);
          lastCrates.current = cratesValue;
        }

        setMaxFrame((prevMax) => Math.max(prevMax, Math.ceil(frameNumber / 100) * 100));
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

  const lineChartOptions: ApexOptions = {
    ...commonOptions,
    chart: { ...commonOptions.chart, id: 'live-line-chart', type: "area" },
    xaxis: { type: 'numeric', title: { text: 'Frame Number' } },
    yaxis: { title: { text: 'Crates Count' } },
    stroke: { curve: 'smooth' },
    markers: { size: 4 },
    colors: ['#FF0000'],
  };

  const allFramesChartOptions: ApexOptions = {
    ...commonOptions,
    chart: { ...commonOptions.chart, id: 'all-frames-chart', type: "bar" },
    xaxis: {
      type: 'numeric',
      title: { text: 'Frame Number' },
      tickAmount: Math.floor(maxFrame / 100),
      min: 0,
      max: maxFrame,
      labels: {
        formatter: (value: string) => {
          const numValue = Number(value);
          return numValue % 100 === 0 ? numValue.toString() : "";
        }, // ✅ Show labels at 0,100,200...
      },
    },
    yaxis: { title: { text: 'Crates' } },
    colors: ['#FF0000'],
    plotOptions: { bar: { columnWidth: '20px' } },
    dataLabels: { enabled: false },
    tooltip: {
      enabled: true,
      x: { formatter: (value: number) => `Frame: ${value}` }, // ✅ Show frame number in tooltip
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

export default WebSocketGraph;



 