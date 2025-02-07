import React, { useEffect, useState, useRef } from 'react';
import ApexCharts from 'react-apexcharts';

const WebSocketGraph: React.FC = () => {
  const [chartData, setChartData] = useState([{ name: 'Crates Count', data: [] }]);
  const [barChartData, setBarChartData] = useState([{ name: 'Crates', data: [] }]);
  const [isConnected, setIsConnected] = useState(false);

  const lastCrateCount = useRef<number | null>(null);
  const lastCrates = useRef<number | null>(null);
  const barChartRef = useRef<HTMLDivElement>(null);
  const areaChartRef = useRef<HTMLDivElement>(null);

  const scrollToEnd = (chartRef: React.RefObject<HTMLDivElement>) => {
    if (chartRef.current) {
      setTimeout(() => {
        chartRef.current!.scrollLeft = chartRef.current!.scrollWidth;
      }, 50); // Delay to ensure scroll updates after rendering
    }
  };

  const commonOptions = {
    xaxis: {
      type: 'datetime',
      labels: {
        show: true,
        format: 'HH:mm:ss',
        rotate: -45,
        style: { fontSize: '12px' },
        hideOverlappingLabels: true,
      },
    },
    tooltip: {
      enabled: true,
      x: { format: 'HH:mm:ss' },
    },
  };

  const lineChartOptions = {
    ...commonOptions,
    chart: {
      id: 'live-line-chart',
      type: 'area',
      animations: { enabled: false },
      zoom: { enabled: true, type: 'x', autoScaleYaxis: true },
      toolbar: { show: true },
    },
    yaxis: { title: { text: 'Crates Count' } },
    stroke: { curve: 'smooth' },
    markers: { size: 4 },
    colors: ['#FF0000'],
  };

  const barChartOptions = {
    ...commonOptions,
    chart: { id: 'live-bar-chart', type: 'bar' },
    yaxis: { title: { text: 'Crates' } },
    colors: ['#FF0000'],
    xaxis: {
      type: 'datetime',
      tickPlacement: 'on',
      labels: { show: true, format: 'HH:mm:ss' },
    },
    plotOptions: {
      bar: {
        columnWidth: '50%', // Prevent bars from turning into thin lines
      },
    },
    dataLabels: {
      enabled: false,
    },
  };

  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    connectWebSocket();
    return () => ws.current?.close();
  }, []);

  const connectWebSocket = () => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      ws.current = new WebSocket('ws://localhost:8000/ws/live-data1/');
      ws.current.onopen = () => setIsConnected(true);
      ws.current.onclose = () => setIsConnected(false);

      ws.current.onmessage = (event) => {
        const parsedData = JSON.parse(event.data);
        const { Timestamp, Crates, Crates_count } = parsedData.data;

        const timestampMillis = new Date(`1970-01-01T${Timestamp}Z`).getTime();
        const crateCount = parseInt(Crates_count);
        const cratesValue = parseInt(Crates);

        if (lastCrateCount.current !== crateCount) {
          setChartData((prevData) => {
            const newData = [...prevData[0].data, { x: timestampMillis, y: crateCount }];

            return [{
              ...prevData[0],
              data: newData.slice(-50),
            }];
          });
          lastCrateCount.current = crateCount;
          scrollToEnd(areaChartRef);
        }

        if (lastCrates.current !== cratesValue) {
          setBarChartData((prevData) => {
            const newData = [...prevData[0].data, { x: timestampMillis, y: cratesValue }];

            return [{
              ...prevData[0],
              data: newData.slice(-5), // Show only the latest 5 bars
            }];
          });
          lastCrates.current = cratesValue;
          scrollToEnd(barChartRef);
        }
      };
    }
  };

  return (
    <div className="p-1 w-full flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-xl font-semibold mb-4 text-center">Live Data Monitoring</h2>
      <div className="w-[80%] flex  justify-center items-center space-x-8">
        {/* Bar Chart Container with Scroll */}
        <div ref={barChartRef} className="max-w-md w-full overflow-x-auto whitespace-nowrap overflow-hidden">
          <ApexCharts options={barChartOptions} series={barChartData} type="bar" height={400} width={600} />
        </div>

        {/* Area Chart Container with Scroll */}
        <div ref={areaChartRef} className="max-w-md w-full overflow-x-auto whitespace-nowrap overflow-hidden">
          <ApexCharts options={lineChartOptions} series={chartData} type="area" height={400} width={600} />
        </div>
      </div>
    </div>
  );
};

export default WebSocketGraph;
 