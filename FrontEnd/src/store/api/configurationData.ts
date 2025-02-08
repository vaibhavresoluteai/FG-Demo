import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface ConfigState{
    configData: {[key: string]: string | boolean | null} | null,
    file: string | null
}

const initialState: ConfigState = {
    configData: null,
    file: null
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
        clearConfigData: (state) => {
            state.configData = null;
            state.file = null;
        }
    }
});

export const { setConfigData, setFile, clearConfigData } = configurationSlice.actions;
export default configurationSlice.reducer;