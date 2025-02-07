import React from "react";
import { BarChart } from "lucide-react";
import WebSocketGraph from "./insights/WebSocketGraph";
import { RootState } from "../store/middleware";
import { useSelector } from "react-redux";
import FrameViewer from "./insights/FrameViewer";

function Dashboard() {
  const selectedRule = useSelector((state: RootState) => state.rule.rule);
  const crateCount = useSelector((state: RootState) => state.response.crateCountResponse);
  const milkSpillage = useSelector((state: RootState) => state.response.milkSpillageResponse);
  const milkWastage = useSelector((state: RootState) => state.response.milkWastageResponse);
  const totalCrateCount = useSelector((state: RootState) => state.response.totalCrateCount);

  return (
    <div className="p-6">
      {/* Analytics Preview */}
      <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <BarChart className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-semibold">Analytics Preview</h2>
        </div>

        {/* Crate Count */}
        {selectedRule === "Crate Count" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoCard title="ROI Box Count" value={crateCount?.roiBoxCount} color="text-red-600" />
            <InfoCard title="Crates Count" value={crateCount?.totalCrates} color="text-green-600" />
          </div>
        )}

        {/* Milk Spillage */}
        {selectedRule === "Milk Spillage" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoCard title="White Percentage" value={milkSpillage?.whitePercentage} color="text-red-600" />
            <InfoCard title="Detection Start Time" value={milkSpillage?.detectionStartTime} color="text-green-600" />
            <InfoCard title="Total Detection Time" value={milkSpillage?.totalDetectionTime} color="text-red-600" />
          </div>
        )}

        {/* Milk Wastage */}
        {selectedRule === "Milk Wastage" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoCard title="White Percentage" value={milkWastage?.whitePercentage} color="text-red-600" />
            <InfoCard title="Detection Start Time" value={milkWastage?.detectionStartTime} color="text-green-600" />
          </div>
        )}

        {/* Total Crate Count */}
        {selectedRule === "Total Crate Count" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoCard title="Crates Count" value={totalCrateCount?.boxCount} color="text-red-600" />
          </div>
        )}

        {/* Frame Viewer */}
        <div className="m-12">
          <FrameViewer />
        </div>

        {/* WebSocket Graph */}
        <div className="flex flex-col mt-6">
          <WebSocketGraph />
        </div>
      </div>
    </div>
  );
}

/* Helper Component for Info Cards */
const InfoCard = ({ title, value, color }: { title: string; value: any; color: string }) => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="font-medium mb-2">{title}</h3>
      <p className={`text-2xl font-bold ${color}`}>{value ?? "N/A"}</p>
    </div>
  );
};

export default Dashboard;
