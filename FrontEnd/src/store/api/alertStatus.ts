import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface AlertStatus {
    alert: boolean
}

const initialState: AlertStatus = {
    alert: false
}

const alertStatusSlice = createSlice({
    name: "alert",
    initialState,
    reducers: {
        setAlertStatus: (state, action: PayloadAction<boolean>) => {
            state.alert = action.payload;
        }
    }
});

export const { setAlertStatus } = alertStatusSlice.actions;
export default alertStatusSlice.reducer;