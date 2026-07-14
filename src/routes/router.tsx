import { createBrowserRouter } from "react-router-dom";
import { AuthLayout } from "../components/layout/AuthLayout";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import Login from "../pages/auth/Login";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";
import Dashboard from "../pages/dashboard/Dashboard";
import MenuList from "../pages/menu/MenuList";
import Categories from "../pages/menu/Categories";
import QRManagement from "../pages/qr/QRManagement";
import POS from "../pages/pos/POS";
import Orders from "../pages/orders/Orders";
import Tables from "../pages/tables/Tables";
import Inventory from "../pages/inventory/Inventory";
import Customers from "../pages/customers/Customers";
import Staff from "../pages/staff/Staff";
import Reports from "../pages/reports/Reports";
import SettingsPage from "../pages/settings/Settings";
import PublicMenu from "../pages/public/PublicMenu";
import NotFound from "../pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/m/:token",
    element: <PublicMenu />,
  },
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <Login /> },
      { path: "/forgot-password", element: <ForgotPassword /> },
      { path: "/reset-password", element: <ResetPassword /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: "/", element: <ProtectedRoute allowedRoles={["ADMIN", "MANAGER"]} />, children: [{ index: true, element: <Dashboard /> }] },
          { path: "/pos", element: <POS /> },
          { path: "/orders", element: <Orders /> },
          {
            path: "/menu",
            element: <ProtectedRoute allowedRoles={["ADMIN", "MANAGER"]} />,
            children: [
              { index: true, element: <MenuList /> },
              { path: "categories", element: <Categories /> },
            ],
          },
          {
            path: "/qr-codes",
            element: <ProtectedRoute allowedRoles={["ADMIN", "MANAGER"]} />,
            children: [{ index: true, element: <QRManagement /> }],
          },
          { path: "/tables", element: <Tables /> },
          {
            path: "/inventory",
            element: <ProtectedRoute allowedRoles={["ADMIN", "MANAGER"]} />,
            children: [{ index: true, element: <Inventory /> }],
          },
          { path: "/customers", element: <Customers /> },
          {
            path: "/staff",
            element: <ProtectedRoute allowedRoles={["ADMIN"]} />,
            children: [{ index: true, element: <Staff /> }],
          },
          {
            path: "/reports",
            element: <ProtectedRoute allowedRoles={["ADMIN", "MANAGER"]} />,
            children: [{ index: true, element: <Reports /> }],
          },
          {
            path: "/settings",
            element: <ProtectedRoute allowedRoles={["ADMIN"]} />,
            children: [{ index: true, element: <SettingsPage /> }],
          },
        ],
      },
    ],
  },
  { path: "*", element: <NotFound /> },
]);
