import React, { useEffect, useState, useRef } from 'react';
import ApexCharts from 'react-apexcharts';

const Graph4: React.FC = () => {
  const [chartData, setChartData] = useState([{ name: 'Total Crate Count', data: [] }]);
  const [maxFrame, setMaxFrame] = useState(500);
  const lastFrame = useRef<number | null>(null);
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
        const { Frame, "Total Crate Count": totalCrateCount } = parsedData.data;
        
        const frameNumber = parseInt(Frame);
        const crateCount = parseInt(totalCrateCount);
        
        setMaxFrame((prevMax) => Math.max(prevMax, Math.ceil(frameNumber / 100) * 100));
        
        if (lastCrateCount.current !== crateCount) {
          setChartData((prevData) => {
            const newData = [...prevData[0].data, { x: frameNumber, y: crateCount }];
            return [{ ...prevData[0], data: newData.slice(-50) }];
          });
          lastFrame.current = frameNumber;
          lastCrateCount.current = crateCount;
        }
      };
    }
  };

  const commonOptions = {
    chart: {
      zoom: { enabled: true, type: 'x', autoScaleYaxis: false },
      toolbar: { autoSelected: 'zoom', tools: { pan: true, reset: true } },
    },
    tooltip: { enabled: true },
  };

  const chartOptions = {
    ...commonOptions,
    chart: { ...commonOptions.chart, id: 'live-line-chart', type: 'area' },
    xaxis: {
      type: 'numeric',
      title: { text: 'Frame Number' },
      tickAmount: Math.floor(maxFrame / 100),
      min: 0,
      max: maxFrame,
      labels: {
        formatter: (value: number) => (value % 100 === 0 ? value.toString() : ''),
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
        <ApexCharts options={chartOptions} series={chartData} type="area" height={500} width={800} />
      </div>
    </div>
  );
};

export default Graph4;
 