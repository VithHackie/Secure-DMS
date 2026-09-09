import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Home from "./pages/home.tsx";
import Login from "./pages/Login.tsx";
import Registration from "./pages/Registration.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { ProtectedRoute, PublicRoute } from "./components/RouteGaurds.tsx";
import Profile from "./pages/Profile.tsx";
import DocumentVault from "./pages/Vault.tsx";

const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      {
        path: "/reg",
        element: <Registration />,
      },
      {
        path: "/login",
        element: <Login />,
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/profile",
        element: <Profile />,
      },
      {
        path: "/vault",
        element : <DocumentVault />
      }
    ],
  },
]);


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
);
