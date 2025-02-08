import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface ConfigState{
    configData: {[key: string]: string | boolean | null} | null,
    file: string | null
    fileName: string | null,
    isVideoProcessed: boolean | null
}

const initialState: ConfigState = {
    configData: null,
    file: null,
    fileName: null,
    isVideoProcessed: true
}

const configurationSlice = createSlice({
    name: "configuration",
    initialState,
    reducers: {
        setConfigData: (state, action: PayloadAction<{ [key: string]: string | boolean }>) => {
            state.configData = {
                ...state.configData,
                ...action.payload
            }
        },
        setFile: (state, action: PayloadAction<string | null>) => {
            state.file = action.payload;
        },
        setFileName: (state, action: PayloadAction<string | null>) => {
            state.fileName = action.payload;
        },
        setIsVideoProcessed: (state, action: PayloadAction<boolean | null>) => {
            state.isVideoProcessed = action.payload;
        },
        clearConfigData: (state) => {
            state.configData = null;
            state.file = null;
        }
    }
});

export const { setConfigData, setFile, setFileName, setIsVideoProcessed, clearConfigData } = configurationSlice.actions;
export default configurationSlice.reducer;