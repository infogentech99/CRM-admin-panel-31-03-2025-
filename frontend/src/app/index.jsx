import React, { useEffect, useState, Suspense } from "react";
import { Router as RouterHistory } from "react-router-dom";
import { Provider } from "react-redux";
import Router from "@/router";
import history from "@/utils/history";
import store from "@/redux/store";

import { Button, Result } from "antd";

import useNetwork from "@/hooks/useNetwork";

function App() {
  const { isOnline: isNetwork } = useNetwork();
  useEffect(() => {
    console.log("🚫 No Internet Connection")
    fetch("http://localhost:8888/api/lead/list?page=1")
      .then((res) => res.json())
      .then((data) => {
        console.log("➡️ Fetched Leads Data:", data);
      })
      .catch((err) => {
        console.error("❌ Fetch Error:", err);
      });
  }, []);

  if (!isNetwork)
    return (
      <>
        <Result
          status="404"
          title="No Internet Connection"
          subTitle="Check your Internet Connection or your network."
          extra={
            <Button href="/" type="primary">
              Try Again
            </Button>
          }
        />
      </>
    );
  else {
    return (
      <RouterHistory history={history}>
        <Provider store={store}>
          <Router />
        </Provider>
      </RouterHistory>
    );
  }
}

export default App;
