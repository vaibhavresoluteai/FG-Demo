import React, { useEffect, useState, useRef } from 'react';
import ApexCharts from 'react-apexcharts';

const Graph3: React.FC = () => {
  const [chartData, setChartData] = useState([
    { name: 'Approx. Wastage Percentage', data: [],color: '#FF0000' },
    { name: 'Frames', data: [] }
  ]);
  const [chartData1, setChartData1] = useState([
    { name: 'Alert Status', data: [], color: '#FF0000' }
  ]);

  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const connectWebSocket = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) return;

    ws.current = new WebSocket('ws://localhost:8000/ws/live-data3/');

    ws.current.onopen = () => {
      setIsConnected(true);
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
    };

    ws.current.onclose = () => {
      setIsConnected(false);
      if (!reconnectTimeout.current) {
        reconnectTimeout.current = setTimeout(connectWebSocket, 3000);
      }
    };

    ws.current.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);

        if (!parsedData?.data) {
          console.error("Invalid data format:", parsedData);
          return;
        }

        const {
          'Frame': frame,
          Timestamp,
          'Approx. Wastage Percentage': wastagePercentage,
          'Alert Status': alert
        } = parsedData.data;

        const today = new Date();
        const timestampMillis = new Date(`${today.toISOString().split('T')[0]}T${Timestamp}`).getTime();

        const wastageValue = (parseFloat(wastagePercentage) || 0) * 100;
        const formattedWastage = parseFloat(wastageValue.toFixed(2));
        const alertValue = alert === "True" ? 1 : 0;

        if (frame % 50 === 1) {
          setChartData((prevData) => [{
            ...prevData[0],
            data: [...prevData[0].data, { x: frame, y: formattedWastage }],
          }]);
        }

        setChartData1((prevData) => [{
          ...prevData[0],
          data: [...prevData[0].data, { x: timestampMillis, y: alertValue}],
        }]);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  };

  useEffect(() => {
    connectWebSocket();
    return () => {
      ws.current?.close();
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, []);

  return (
    <div className="p-4 w-full flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-xl font-semibold mb-4 text-center">Live Data Monitoring</h2>
      
      <div className="w-[70%] flex justify-center items-center space-x-8">
        <div className="max-w-3xl w-full">
          <ApexCharts 
            options={{ 
              chart: { type: 'area' },
              xaxis: { title: { text: 'Frame' } },
              yaxis: [{
                title: { text: 'Approx. Wastage Percentage (%)' },
                labels: { 
                  formatter: (val) => val.toFixed(2),
                },
                tooltip: {
                  enabled: true,
                  y: {
                    formatter: (val) => val.toFixed(2) + "%"
                  }
                },
                axisBorder: { show: true },
                axisTicks: { show: true },
              }],
            }} 
            series={chartData} 
            type="area" 
            height={400} 
            width={400} 
          />
        </div>
        <div className="max-w-2xl w-full">
          <ApexCharts 
            options={{ 
              chart: { type: 'line' },
              xaxis: { type: 'datetime', labels: { formatter: (value) => new Date(value).toLocaleTimeString('en-US', { hour12: false }) }},
              yaxis: [{
                title: { text: 'Alert Status (On/Off)' },
                labels: {
                  formatter: (val) => (val === 1 ? 'On' : 'Off'),
                },
                min: 0,
                max: 1,
                tickAmount: 1,
                axisBorder: { show: true },
                axisTicks: { show: true },
              }],
            }} 
            series={chartData1} 
            type="line" 
            height={400} 
            width={400} 
          />
        </div>
      </div>
    </div>
  );
};

export default Graph3;