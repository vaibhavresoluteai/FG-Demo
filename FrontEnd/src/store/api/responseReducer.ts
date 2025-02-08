import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CrateCount{
    roiBoxCount: number,
    totalCrates: number
}
interface MilkSpillage{
    whitePercentage: number,
    detectionStartTime: string,
    totalDetectionTime: number
}
interface MilkWastage{
    whitePercentage: number,
    detectionStartTime: string
}
interface TotalCrateCount{
    boxCount: number
}

interface ResponseState {
  crateCountResponse: CrateCount | null;
  milkSpillageResponse: MilkSpillage | null;
  milkWastageResponse: MilkWastage | null;
  totalCrateCount: TotalCrateCount | null;
}

// ✅ Initial State
const initialState: ResponseState = {
  crateCountResponse: null,
  milkSpillageResponse: null,
  milkWastageResponse: null,
  totalCrateCount: null,
};

// ✅ Create Slice
const responseSlice = createSlice({
  name: "response",
  initialState,
  reducers: {
    setCrateCountResponse: (state, action: PayloadAction<CrateCount>) => {
      state.crateCountResponse = action.payload;
    },
    setMilkSpillageResponse: (state, action: PayloadAction<MilkSpillage>) => {
      state.milkSpillageResponse = action.payload;
    },
    setMilkWastageResponse: (state, action: PayloadAction<MilkWastage>) => {
      state.milkWastageResponse = action.payload;
    },
    setTotalCrateCountResponse: (state, action: PayloadAction<TotalCrateCount>) => {
      state.totalCrateCount = action.payload;
    },
    resetResponses: () => initialState,
  },
});

// ✅ Export Actions
export const {
  setCrateCountResponse,
  setMilkSpillageResponse,
  setMilkWastageResponse,
  setTotalCrateCountResponse,
  resetResponses
} = responseSlice.actions;

// ✅ Export Reducer
export default responseSlice.reducer;
