import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { base_url } from "../base_URL";

export const stopProcessingApi = createApi({
    reducerPath: "stopProcessingApi",
    baseQuery: fetchBaseQuery({
        baseUrl: base_url,
        prepareHeaders: (headers) => {
            headers.set("Accept", "application/json");
            return headers;
        }
    }),
    tagTypes: ["Stop Processing"],
    endpoints: (builder) => ({
        stopProcessing: builder.mutation({
            query: (process) => ({
                url: `/process_stopping/?process=${process}`,
                method: "POST",
            }),
            invalidatesTags: ["Stop Processing"],
        }),
    }),
});

export const { useStopProcessingMutation } = stopProcessingApi;