import React from 'react'
import { BarChart } from 'lucide-react'

function Dashboard() {
    const [crates, setcrates] = React.useState<string | null>();
    const [totalCrateCount, setTotalCrateCount] = React.useState<string | null>();
  return (
    <div className='p-6'>
        {/* Analytics Preview */}
        <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <BarChart className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Analytics Preview</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Crates</h3>
              <p className="text-2xl font-bold text-red-600">
                {crates || "N/A"}
              </p>
            </div>
            {/* <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Detection Rate</h3>
              <p className="text-2xl font-bold text-blue-600">24.5/min</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Average Confidence</h3>
              <p className="text-2xl font-bold text-green-600">92.3%</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Processing Time</h3>
              <p className="text-2xl font-bold text-purple-600">45ms</p>
            </div> */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Crates Count</h3>
              <p className="text-2xl font-bold text-green-600">
                {totalCrateCount || "N/A"}
              </p>
            </div>
          </div>
        </div>
    </div>
  )
}

export default Dashboard;