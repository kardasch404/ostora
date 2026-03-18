import { configureStore } from "@reduxjs/toolkit";
import { authReducer } from "@/store/slices/auth-slice";

export const makeStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
    },
  });

export const store = makeStore();

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
