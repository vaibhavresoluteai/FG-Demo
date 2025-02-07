import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface SelectedRule {
    rule: string | null
}

const initialState: SelectedRule = {
    rule: "",
}

const selectedRuleSLice = createSlice({
    name: "rule",
    initialState,
    reducers: {
        setSelectedRule: (state, action: PayloadAction<string | null>) => {
            state.rule = action.payload
        }
    }
});

export const { setSelectedRule } = selectedRuleSLice.actions;
export default selectedRuleSLice.reducer;
