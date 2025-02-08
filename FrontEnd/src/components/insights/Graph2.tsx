import React, { useEffect, useState, useRef } from 'react';
import ApexCharts from 'react-apexcharts';

const MAX_DATA_POINTS = 50; // Prevent excessive memory usage

const Graph2: React.FC = () => {
  const [chartData, setChartData] = useState([
    { name: 'Total Detection Time', type: 'line', data: [], color: '#FF7F7F' }, // Light Red
    { name: 'Approx. Wastage Percentage', type: 'line', data: [], color: '#FF0000' }, // Dark Red
  ]);

  const [alertData, setAlertData] = useState([
    { name: 'Alert Status', data: [], color: '#FF0000' }
  ]);

  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const connectWebSocket = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) return;

    ws.current = new WebSocket('ws://localhost:8000/ws/live-data2/');

    ws.current.onopen = () => {
      setIsConnected(true);
      reconnectAttempts.current = 0; // Reset attempts on successful connection
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };

    ws.current.onclose = () => {
      setIsConnected(false);
      const delay = Math.min(5000, 1000 * (2 ** reconnectAttempts.current)); // Exponential backoff (max 5s)
      reconnectAttempts.current += 1;
      reconnectTimeout.current = setTimeout(connectWebSocket, delay);
    };

    ws.current.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        if (!parsedData?.data) return console.error("Invalid data format:", parsedData);

        const { Timestamp, 'Approx. Wastage Percentage': wastagePercentage, 'Total Detection Time': totalDetectionTime, 'Alert Status': alert } = parsedData.data;

        const today = new Date();
        const timestampMillis = new Date(`${today.toISOString().split('T')[0]}T${Timestamp}`).getTime();

        updateChartData(timestampMillis, totalDetectionTime, wastagePercentage);
        updateAlertData(timestampMillis, alert);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  };

  const updateChartData = (timestamp: number, totalTime: string, wastage: string) => {
    setChartData(prevData => [
      { ...prevData[0], data: [...prevData[0].data.slice(-MAX_DATA_POINTS), { x: timestamp, y: parseFloat(totalTime) || 0 }] },
      { ...prevData[1], data: [...prevData[1].data.slice(-MAX_DATA_POINTS), { x: timestamp, y: (parseFloat(wastage) || 0) * 100 }] },
    ]);
  };

  const updateAlertData = (timestamp: number, alert: string) => {
    setAlertData(prevData => [{
      ...prevData[0],
      data: [...prevData[0].data.slice(-MAX_DATA_POINTS), { x: timestamp, y: alert === "True" ? 1 : 0 }],
    }]);
  };

  useEffect(() => {
    connectWebSocket();
    return () => {
      ws.current?.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };
  }, []);

  return (
    <div className="p-4 w-full flex flex-col lg:flex-row items-center justify-center min-h-screen gap-4">
      {/* Line Chart - Total Detection Time & Wastage Percentage */}
      <div className="w-full lg:w-1/2 p-2">
        <h2 className="text-lg font-semibold mb-2 text-center">Live Data Monitoring</h2>
        <ApexCharts 
          options={{
            chart: { height: 300 },
            xaxis: { 
              type: 'datetime',
              labels: { formatter: (value) => new Date(value).toLocaleTimeString('en-US', { hour12: false }) } 
            },
            yaxis: [
              { title: { text: 'Total time Unattended (s)' }, labels: { formatter: val => val.toFixed(2) } },
              { opposite: true, title: { text: 'Approx. Wastage % (line)' }, labels: { formatter: val => val.toFixed(2) } }
            ]
          }} 
          series={chartData} 
          type="line" 
          height={400} 
          width="100%" 
        />
      </div>

      {/* Alert Status Graph */}
      <div className="w-full lg:w-1/2 p-2">
        <ApexCharts 
          options={{
            chart: { type: 'line' },
            xaxis: { 
              type: 'datetime', 
              labels: { formatter: (value) => new Date(value).toLocaleTimeString('en-US', { hour12: false }) } 
            },
            yaxis: [{
              title: { text: 'Alert Status' },
              labels: { formatter: val => (val === 1 ? 'On' : 'Off') },
              min: 0, max: 1, tickAmount: 1
            }]
          }} 
          series={alertData} 
          type="line" 
          height={300} 
          width="100%" 
        />
      </div>
    </div>
  );
};

export default Graph2;
