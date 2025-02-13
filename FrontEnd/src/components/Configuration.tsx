import React from "react";
import {
  Camera,
  Brain,
  Cog,
  Database as DatabaseIcon,
  BarChart,
  CircleFadingPlus,
} from "lucide-react";
// import {
//   mockCameras,
//   mockModels,
//   mockRules,
// } from "../data/mockData";
import { useCreateMediaProcessingMutation } from "../store/api/mediaProcessing";
import { useGetDetectionModelsQuery } from "../store/api/detectionModels";
import { useCreateCrateVideoProcessingMutation } from "../store/api/crateVideoProcessing";
import {
  useGetOutputConfigurationsQuery,
  useUpdateOutputConfigurationsMutation,
} from "../store/api/outputConfigurations";
import Loader from "./common/Loader";
import { DetectionModel } from "../store/models/DetectionModel";
import { useGetProcessingRulesQuery } from "../store/api/processingRules";
import { ProcessingRulesModel } from "../store/models/ProcessingRules";
// import Backdrop from "./common/Backdrop";
// import PageHeader from "./common/PageHeader";
import MediaFrameSelector from "./insights/MediaFrameSelector";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../store/middleware";
import { setCrateCountResponse, setMilkSpillageResponse, setMilkWastageResponse, setTotalCrateCountResponse, resetResponses } from "../store/api/responseReducer";
import { setSelectedRule } from "../store/api/selectedRuleSlice";
import { setConfigData, setFile, setFileName, setIsVideoProcessed } from "../store/api/configurationData";
import { RootState } from "../store/middleware";

const Configuration = () => {
  // const [selectedCamera, setSelectedCamera] = React.useState(
  //   mockCameras[0]?.id
  // );

  // const { data: rows = [], isLoading } = useGetMediaProcessingQuery();
  const [createMutation, { isLoading: createLoading }] =
    useCreateMediaProcessingMutation();
  
  const [createCrateMutation, { isLoading: createCrateLoading }] = useCreateCrateVideoProcessingMutation();
  const [updateMutation, { isLoading: updateLoading }] =
    useUpdateOutputConfigurationsMutation();
  const { data: modelRows = [], isLoading: modelLoading } =
    useGetDetectionModelsQuery();
  const {
    data: outputObject = {
      storage: [""],
      format: [""],
      current_output_configurations: ["", ""],
    },
    isLoading: outputLoading,
  } = useGetOutputConfigurationsQuery();
  const { data: ruleRows = [], isLoading: rulesLoading } =
    useGetProcessingRulesQuery();

  const savedConfigData = useSelector((state: RootState) => state.configuration.configData);
  const savedFile = useSelector((state: RootState) => state.configuration.file);
  const savedFileName = useSelector((state: RootState) => state.configuration.fileName);
  const isVideoProcessed = useSelector((state: RootState) => state.configuration.isVideoProcessed);
  const [selectedModel, setSelectedModel] = React.useState<any>(savedConfigData?.selectedModel || modelRows[0]?.id);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | undefined>(savedFile || undefined);
  const [capturedFrame, setCapturedFrame] = React.useState<string | null>(null);
  const [rules, setRules] = React.useState<ProcessingRulesModel[]>([]);
  const [params, setParams] = React.useState<Record<string, boolean>>({});
  const [saveOutput, setSaveOutput] = React.useState<boolean>(false);
  const [output, setOutput] = React.useState<string[]>(
    outputObject.current_output_configurations
  );
  const dispatch = useDispatch<AppDispatch>();

  if (ruleRows.length > 0 && rules.length === 0) {
    const newParams = ruleRows.reduce<Record<string, boolean>>((acc, ruleObj) => {
      acc[ruleObj.rule] = savedConfigData?.rule === ruleObj.rule && ruleObj.enabled;
      return acc;
    }, {});
  
    setParams(newParams);
    setRules(ruleRows);
  }

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("Selected file:", file); // Log file details
      setSelectedFile(file);

      const url = URL.createObjectURL(file);
      const generatedFileName = `file_${new Date().getTime()}`;
      console.log("Generated Object URL:", url);
      setPreviewUrl(url);
      dispatch(setFile(url))
      dispatch(setFileName(generatedFileName));
    }
  };
  React.useEffect(() => {
    fetch("http://localhost:8000/clear-frames", { method: "POST" });
  }, []);

  const handleSubmit = () => {
    dispatch(resetResponses());
    const formData = new FormData();
    if (selectedFile) formData.append("file", selectedFile);
    let selectedRule = Object.keys(params).find(key => params[key]);
    if (selectedRule) {
      dispatch(setSelectedRule(selectedRule));
      formData.append("rule", selectedRule);  // append the rule as a string
    }
    dispatch(setIsVideoProcessed(false));
    createCrateMutation({ payload: formData }).then((res) => {
      console.log(res);
      if (res.data) {
        dispatch(setIsVideoProcessed(true));
        if (selectedRule === "Crate Count") {
          const response = {
            roiBoxCount: res.data?.["roi_box_count"],
            totalCrates: res.data?.["Total_crates"]
          };
          dispatch(setCrateCountResponse(response));
        }else if(selectedRule === "Milk Spillage"){
          const response = {
            whitePercentage: res.data?.["white_percentage"],
            detectionStartTime: res.data?.["detection_start_time"],
            totalDetectionTime: res.data?.["total_detection_time"]
          }
          dispatch(setMilkSpillageResponse(response));
        }else if(selectedRule === "Milk Wastage"){
          const response = {
            whitePercentage: res.data?.["white_percentage"],
            detectionStartTime: res.data?.["detection_start_time"],
          }
          dispatch(setMilkWastageResponse(response));
        }else if(selectedRule === "Conveyor Belt Crate Count"){
          const response = {
            boxCount: res.data?.["box_count"],
          }
          dispatch(setTotalCrateCountResponse(response));
        }
        alert("Video processed successfully!");
      } else if (res.error) {
        dispatch(setIsVideoProcessed(true));
        alert("Failed to upload video.");
      }
    });
  };  

  const handleSubmitOutputConfigurations = (
    newOutputConfigurations: string[]
  ) => {
    updateMutation(newOutputConfigurations).then((res) => {
      console.log(res);

      if (res.data) {
        console.log(res.data);
        alert("Output Configurations updated successfully!");
      } else if (res.error) {
        console.error(res.error);
        alert("Failed to update Output Configurations.");
      }
    });
  };

  const toggleRule = (rule: string) => {
    setParams((params) => {
      const newParams: Record<string, boolean> = {};
  
      // Set all rules to false
      Object.keys(params).forEach((key) => {
        newParams[key] = false;
      });
  
      // Toggle only the selected rule
      newParams[rule] = !params[rule];
      return newParams;
    });
    dispatch(setConfigData({ rule }));
  };

  return (
    <div className="p-6">
      {/* <PageHeader title="Dashboard" /> */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Video Source Configuration */}
        <div className="bg-white rounded-lg lg:col-span-2 shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Camera className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Media Source </h2>
          </div>

          <div className="space-y-4">
            {/* File Input */}
            {!capturedFrame && <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Image/Video{" "}
                {createLoading && (
                  <span className="text-red-500">(Processing...)</span>
                )}
              </label>
              <input
                type="file"
                accept="image/*,video/*"
                id="file"
                className="w-full border border-gray-300 rounded-lg p-2"
                onChange={handleFileChange}
              />
            </div>}

            {/* {previewUrl && <div>
              <h2>Preview Area</h2>
              <div className="aspect-[16/9] bg-gray-100 rounded-lg flex items-center justify-center overflow">
                <div className="flex flex-col justify-center items-center w-full max-w-md">
                  <h2 className="text-xl font-semibold mb-2 self-start">Video Preview:</h2>
                  <video key={previewUrl} src={previewUrl} controls className="h-auto w-full object-contain border rounded-lg" />
                </div>
              </div>
            </div>} */}
            
          </div>
        </div>

        {/* special backdrop for only detection model as their is API implemented here */}

        {/* Detection Model Configuration */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Detection Model</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Model
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2"
                value={selectedModel}
                onChange={(e) => {
                  setSelectedModel(e.target.value)
                  dispatch(setConfigData({selectedModel: e.target.value}))
                }}
              >
                {[modelRows[2], ...modelRows.filter((_, index) => index !== 2)]
                  .filter((model): model is DetectionModel => model !== undefined && model.active)
                  .map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                ))}
              </select>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">Model Information</h3>
              <p className="text-sm text-gray-600">
                {modelRows.find((m: DetectionModel) => m.id === selectedModel)
                  ?.model_info || modelRows[0]?.model_info}
              </p>
            </div>
          </div>
        </div>

        {/* Processing Logic Configuration */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Cog className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Processing Logic</h2>
          </div>
          <div className="space-y-4">
            {rules.map((rule: ProcessingRulesModel) => (
              <div
                key={rule.id}
                className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg ${
                  !rule.enabled ? "hidden" : ""
                }`}
              >
                <div>
                  <p className="font-medium">{rule.rule}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={params[rule.rule]}
                    onClick={() => toggleRule(rule.rule)}
                    // readOnly
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Output Configuration */}
        <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <DatabaseIcon className="w-5 h-5 text-blue-500" />
            <div className="flex justify-between w-[100%]">
              <h2 className="text-lg font-semibold">Output Configuration</h2>
              <div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={saveOutput}
                    onClick={() => setSaveOutput((prev) => !prev)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Storage Location
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2"
                value={output[0]}
              >
                Local Storage
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Output Format
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2"
                value={output[1]}
              >
                JSON
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="save-images" className="rounded" />
              <label htmlFor="save-images" className="text-sm text-gray-700">
                Save detection images
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <div className="inline-block">
              <div
                className={`flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg px-4 py-2 cursor-pointer ${
                  updateLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {updateLoading ? (
                  <Loader />
                ) : (
                  <CircleFadingPlus className="w-5 h-5 text-white" />
                )}
                <h2 className="text-lg font-semibold">
                  Set Output Configuration
                </h2>
              </div>
            </div>
          </div>
        </div>

        {/* Process Button */}
        <div className="bg-transparent p-1 lg:col-span-2">
          <div className="flex items-center justify-end">
            <div className="inline-block">
              <div
                className={`flex items-center gap-2 rounded-lg px-4 py-2 ${
                  isVideoProcessed && !createLoading
                    ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                    : "bg-gray-400 text-gray-600 cursor-not-allowed opacity-50"
                }`}
                onClick={isVideoProcessed && !createLoading ? handleSubmit : undefined}
              >
                {createLoading ? (
                  <Loader />
                ) : (
                  <CircleFadingPlus className="w-5 h-5 text-white" />
                )}
                <h2 className="text-lg font-semibold">Process Video</h2>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* <Backdrop open={createLoading} /> */}
    </div>
  );
};

export default Configuration;
