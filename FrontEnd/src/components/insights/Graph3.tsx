import React, { useEffect, useState, useRef } from 'react';
import ApexCharts from 'react-apexcharts';
import { setAlertStatus } from '../../store/api/alertStatus';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store/middleware';
import { setMilkWastageResponse } from '../../store/api/responseReducer';
 
const Graph3: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
 
  // Initialize chartData with a starting timestamp
  const initialTimestamp = new Date().getTime();
  const [chartData, setChartData] = useState<{ name: string; data: { x: number; y: number }[]; color?: string }[]>([
    { name: 'Approx. Wastage Percentage', data: [{ x: initialTimestamp, y: 0 }], color: '#FF0000' }
  ]);
 
  const [chartData1, setChartData1] = useState<{ name: string; data: { x: number; y: number }[]; color?: string }[]>([
    { name: 'Alert Status', data: [{ x: initialTimestamp, y: 0 }], color: '#FF0000' }
  ]);
 
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
 
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
          Frame: frame,
          Timestamp,
          'Approx. Wastage Percentage': wastagePercentage,
          'Alert Status': alert,
          'Detection Start Time': startTime
        } = parsedData.data;
 
        if (alert === 'True') {
          dispatch(setAlertStatus(true));
        } else {
          dispatch(setAlertStatus(false));
        }
 
        const tempData = {
          whitePercentage: wastagePercentage,
          detectionStartTime: startTime
        };
        dispatch(setMilkWastageResponse(tempData));
 
        const currentTimestamp = new Date().getTime(); // Get local timestamp
        const wastageValue = parseFloat(wastagePercentage) || 0;
        const formattedWastage = parseFloat(wastageValue.toFixed(2));
        const alertValue = alert === "True" ? 1 : 0;
 
        if (frame % 50 === 1) {
          setChartData((prevData) => [{
            ...prevData[0],
            data: [...prevData[0].data, { x: currentTimestamp, y: formattedWastage }],
          }]);
        }
 
        setChartData1((prevData) => [{
          ...prevData[0],
          data: [...prevData[0].data, { x: currentTimestamp, y: alertValue }],
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
 
      <div className="w-3/4 flex flex-col justify-center items-center space-x-8">
        {/* First Graph: Approx. Wastage Percentage */}
        <div className="max-w-3xl w-full">
          <ApexCharts
            options={{
              chart: { type: 'area' },
              xaxis: {
                type: 'datetime', // Use timestamps
                tickAmount: 4, // Ensure 5 tick marks
                labels: {
                  formatter: (value) => new Date(value).toLocaleTimeString('en-US', { hour12: false })
                }
              },
              yaxis: [{
                title: { text: 'Wastage Percentage (%)' },
                labels: {
                  formatter: (val: number) => val.toFixed(2) + "%"
                },
                tooltip: { enabled: true },
                axisBorder: { show: true },
                axisTicks: { show: true },
              }],
            }}
            series={chartData}
            type="area"
            height={250}
            width={350}
          />
        </div>
 
        {/* Second Graph: Alert Status */}
        <div className="max-w-2xl w-full">
          <ApexCharts
            options={{
              chart: { type: 'line' },
              xaxis: {
                type: 'datetime',
                tickAmount: 5, // Ensure 5 tick marks
                labels: {
                  formatter: (value) => new Date(value).toLocaleTimeString('en-US', { hour12: false })
                }
              },
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
            height={250}
            width={350}
          />
        </div>
      </div>
    </div>
  );
};
 
export default Graph3;