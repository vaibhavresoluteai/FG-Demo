import { BarChart } from "lucide-react";
import Graph1 from "./insights/Graph1";
import Graph2 from "./insights/Graph2";
import Graph3 from "./insights/Graph3";
import Graph4 from "./insights/Graph4";
import { RootState } from "../store/middleware";
import { useSelector } from "react-redux";
import FrameViewer from "./insights/FrameViewer";
import { useStopProcessingMutation } from "../store/api/stopProcessingApi";
import {motion} from "framer-motion"


function Dashboard() {
  const selectedRule = useSelector((state: RootState) => state.rule.rule);
  const isVideoProcessed = useSelector((state: RootState) => state.configuration.isVideoProcessed);
  const crateCount = useSelector((state: RootState) => state.response.crateCountResponse);
  const milkSpillage = useSelector((state: RootState) => state.response.milkSpillageResponse);
  const milkWastage = useSelector((state: RootState) => state.response.milkWastageResponse);
  const totalCrateCount = useSelector((state: RootState) => state.response.totalCrateCount);
  const alertStatus = useSelector((state: RootState) => state.alert.alert);
  const [stopProcessing, { isLoading }] = useStopProcessingMutation();
  
  const handleStopProcessing = async () => {
    try {
      const response = await stopProcessing(selectedRule).unwrap();
      alert(response.message);
    } catch (err) {
      console.log("Error stopping processing...", err);
    }
  };
  
  return (
    <div className="p-6">
      {/* Analytics Preview */}
      <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
        {/* Header */}
        <div className="flex justify-between items-center gap-2 mb-4">
          <div className="flex items-center gap-2">
            <BarChart className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Analytics Preview</h2>
          </div>
          {isVideoProcessed ? (
            <div className="bg-gray-300 text-gray-500 px-4 py-2 rounded-md">Processing not started</div>
          ) : (
            <div
              onClick={!isLoading ? handleStopProcessing : undefined}
              className={`cursor-pointer px-4 py-2 rounded-md hover:underline 
                ${isLoading ? "bg-gray-300 text-gray-500 pointer-events-none" : "bg-red-200 text-red-500"}`}
            >
              {isLoading ? "Stopping..." : "Stop Processing"}
            </div>
          )}

        </div>


        {/* Crate Count */}
        {selectedRule === "Crate Count" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoCard title="Stack Count" value={crateCount?.roiBoxCount} color="text-red-600" unit="" />
            <InfoCard title="Crates Count" value={crateCount?.totalCrates} color="text-green-600" unit="" />
          </div>
        )}

        {/* Milk Spillage */}
        {selectedRule === "Milk Spillage" && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <InfoCard title="Floor Spillage Rate" value={milkSpillage?.whitePercentage} color="text-red-600" unit="%" />
            <InfoCard title="Wastage Start Time" value={milkSpillage?.detectionStartTime} color="text-green-600" unit="" />
            <InfoCard title="Total Un-Attended Time" value={milkSpillage?.totalDetectionTime} color="text-red-600" unit="s" />
            {alertStatus && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="flex items-center justify-center text-center p-2 font-semibold text-white bg-red-500 rounded-lg shadow-lg"
              >
                🔔 Milk Spillage Alert! 🔔
              </motion.div>
            )}
          </div>
        )}

        {/* Milk Wastage */}
        {selectedRule === "Milk Wastage" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoCard title="Floor Spillage Rate" value={milkWastage?.whitePercentage} color="text-red-600" unit="%" />
            <InfoCard title="Wastage Start Time" value={milkWastage?.detectionStartTime} color="text-green-600" unit="" />
            {alertStatus && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="flex items-center justify-center text-center p-2 text-lg font-semibold text-white bg-red-500 rounded-lg shadow-lg"
              >
                🔔 Milk Wastage Alert!🔔
              </motion.div>
            )}
          </div>
        )}

        {/* Conveyor Belt Crate Count */}
        {selectedRule === "Conveyor Belt Crate Count" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoCard title="Crates Count" value={totalCrateCount?.boxCount} color="text-red-600" unit="" />
          </div>
        )}

        <div className="flex flex-col lg:flex-row items-center justify-center gap-1 p-1">
          {/* Frame Viewer */}
          <div className="w-full h-auto lg:w-2/3 p-1">
            <FrameViewer />
          </div>

          {/* WebSocket Graph */}
          <div className="w-full lg:w-1/2 flex flex-col gap-1">
            {selectedRule === 'Crate Count' && <Graph1 />}
            {selectedRule === 'Milk Spillage' && <Graph2 />}
            {selectedRule === 'Milk Wastage' && <Graph3 />}
            {selectedRule === 'Conveyor Belt Crate Count' && <Graph4 />}
          </div>
        </div>

      </div>
    </div>
  );
}

/* Helper Component for Info Cards */
const InfoCard = ({ title, value, color, unit }: { title: string; value: any; color: string, unit: string }) => {
  return (
    <div className="bg-gray-50 px-4 py-2 rounded-lg">
      <h3 className="font-medium mb-2">{title}</h3>
      <p className={`text-2xl font-bold ${color}`}>
        {value ? value + unit : "N/A"}
      </p>
    </div>
  );
};

export default Dashboard;
