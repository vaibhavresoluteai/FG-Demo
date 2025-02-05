import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { base_url } from "../base_URL";

export const crateVideoProcessingApi = createApi({
    reducerPath: "crateVideoProcessing",
    baseQuery: fetchBaseQuery({
        baseUrl: base_url,
        prepareHeaders: (headers) => {
            headers.set("Accept", "application/json");
            return headers;
        },
    }),
    tagTypes: ["Crate Video Processing"],
    endpoints: (builder) => ({
        createCrateVideoProcessing: builder.mutation({
            query: ({ payload }) => ({
                url: '/process-video/',
                method: "POST",
                body: payload,
            }),
            invalidatesTags: ["Crate Video Processing"],
        }),
    }),
});

export const { useCreateCrateVideoProcessingMutation } = crateVideoProcessingApi;