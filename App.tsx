import React from "react";
import { BrowserRouter as Router, Route, Switch, Redirect } from "react-router-dom";
import Home from "./components/Home";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

import ErrorBoundary from "@/components/common/ErrorBoundary";

const App = () => {
  return (
    <ErrorBoundary>
      <Router>
        <Switch>
          <Route path="/" exact component={Home} />
          <Route path="/login" component={Login} />
          <Route path="/dashboard" component={Dashboard} />
          <Redirect to="/" />
        </Switch>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
