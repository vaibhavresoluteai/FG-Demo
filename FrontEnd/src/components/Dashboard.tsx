import React, { useEffect } from 'react'
import { BarChart } from 'lucide-react'
import WebSocketGraph from './insights/WebSocketGraph';
import { RootState } from '../store/middleware';
import { useSelector } from 'react-redux';

function Dashboard() {
    const selectedRule = useSelector((state: RootState) => state.rule.rule);
    const crateCount = useSelector((state: RootState) => state.response.crateCountResponse)
    const milkSpillage = useSelector((state: RootState) => state.response.milkSpillageResponse);
    const milkWastage = useSelector((state: RootState) => state.response.milkWastageResponse);
    const totalCrateCount = useSelector((state: RootState) => state.response.totalCrateCount);

    
  return (
    <div className='p-6'>
        {/* Analytics Preview */}
        <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <BarChart className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Analytics Preview</h2>
          </div>
          {selectedRule === "Crate Count" && <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">ROI Box Count</h3>
              <p className="text-2xl font-bold text-red-600">
                {crateCount?.roiBoxCount ?? "N/A"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Crates Count</h3>
              <p className="text-2xl font-bold text-green-600">
                {crateCount?.totalCrates ?? "N/A"}
              </p>
            </div>
          </div>}
          {selectedRule === "Milk Spillage" && <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">White Percentage</h3>
              <p className="text-2xl font-bold text-red-600">
                {milkSpillage?.whitePercentage ?? "N/A"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Detection Start Time</h3>
              <p className="text-2xl font-bold text-green-600">
                {milkSpillage?.detectionStartTime ?? "N/A"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Total Detection Time</h3>
              <p className="text-2xl font-bold text-red-600">
                {milkSpillage?.totalDetectionTime ?? "N/A"}
              </p>
            </div>
          </div>}
          {selectedRule === "Milk Wastage" && <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">White Percentage</h3>
              <p className="text-2xl font-bold text-red-600">
                {milkWastage?.whitePercentage ?? "N/A"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Detection Start Time</h3>
              <p className="text-2xl font-bold text-green-600">
                {milkWastage?.detectionStartTime ?? "N/A"}
              </p>
            </div>
          </div>}
          {selectedRule === "Total Crate Count" && <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Crates Count</h3>
              <p className="text-2xl font-bold text-red-600">
                {totalCrateCount?.boxCount ?? "N/A"}
              </p>
            </div>
          </div>}
          <div className='flex flex-col'>
            <WebSocketGraph />
          </div>
        </div>
    </div>
  )
}

export default Dashboard;