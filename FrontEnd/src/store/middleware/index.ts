import { configureStore } from "@reduxjs/toolkit";
import { mediaProcessingApi } from "../api/mediaProcessing";
import { detectionModelsApi } from "../api/detectionModels";
import { processingRulesApi } from "../api/processingRules";
import { outputConfigurationsApi } from "../api/outputConfigurations";
import { areaCoordinatesApi } from "../api/areaCoordinates";
import { crateVideoProcessingApi } from "../api/crateVideoProcessing";
import responseBuilder from "../api/responseReducer";
import ruleSelecter from "../api/selectedRuleSlice"
import configureData from "../api/configurationData"

export const store = configureStore({
  reducer: {
    [mediaProcessingApi.reducerPath]: mediaProcessingApi.reducer,
    [detectionModelsApi.reducerPath]: detectionModelsApi.reducer,
    [processingRulesApi.reducerPath]: processingRulesApi.reducer,
    [outputConfigurationsApi.reducerPath]: outputConfigurationsApi.reducer,
    [areaCoordinatesApi.reducerPath]: areaCoordinatesApi.reducer,
    [crateVideoProcessingApi.reducerPath]: crateVideoProcessingApi.reducer,
    response: responseBuilder,
    rule: ruleSelecter,
    configuration: configureData
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      mediaProcessingApi.middleware,
      detectionModelsApi.middleware,
      processingRulesApi.middleware,
      outputConfigurationsApi.middleware,
      areaCoordinatesApi.middleware,
      crateVideoProcessingApi.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
