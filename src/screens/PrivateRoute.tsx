import React from "react";
import { Navigate } from "react-router-dom";

interface PrivateRouteProps {
  isAuthenticated: boolean;
  children: React.ReactElement;
  redirectTo?: string;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({
  isAuthenticated,
  children,
  redirectTo = "/login",
}) => {
  return isAuthenticated ? children : <Navigate to={redirectTo} />;
};

export default PrivateRoute;
