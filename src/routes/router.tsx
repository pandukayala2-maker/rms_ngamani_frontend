import { lazy, Suspense, type ComponentType } from "react";
import { createBrowserRouter } from "react-router-dom";
import { AuthLayout } from "../components/layout/AuthLayout";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { PageLoader } from "./PageLoader";

// Every page is code-split so the initial bundle stays small — a customer
// scanning a QR code only downloads the public menu, not the whole admin
// dashboard, and staff only download the pages they actually visit.
function lazyPage(loader: () => Promise<{ default: ComponentType }>) {
  const LazyComponent = lazy(loader);
  return (
    <Suspense fallback={<PageLoader />}>
      <LazyComponent />
    </Suspense>
  );
}

const Login = () => lazyPage(() => import("../pages/auth/Login"));
const ForgotPassword = () => lazyPage(() => import("../pages/auth/ForgotPassword"));
const ResetPassword = () => lazyPage(() => import("../pages/auth/ResetPassword"));
const Dashboard = () => lazyPage(() => import("../pages/dashboard/Dashboard"));
const MenuList = () => lazyPage(() => import("../pages/menu/MenuList"));
const Categories = () => lazyPage(() => import("../pages/menu/Categories"));
const QRManagement = () => lazyPage(() => import("../pages/qr/QRManagement"));
const POS = () => lazyPage(() => import("../pages/pos/POS"));
const Orders = () => lazyPage(() => import("../pages/orders/Orders"));
const Tables = () => lazyPage(() => import("../pages/tables/Tables"));
const Inventory = () => lazyPage(() => import("../pages/inventory/Inventory"));
const Customers = () => lazyPage(() => import("../pages/customers/Customers"));
const Employees = () => lazyPage(() => import("../pages/roles/Employees"));
const Departments = () => lazyPage(() => import("../pages/roles/Departments"));
const Designations = () => lazyPage(() => import("../pages/roles/Designations"));
const Shifts = () => lazyPage(() => import("../pages/roles/Shifts"));
const RolePermissions = () => lazyPage(() => import("../pages/roles/RolePermissions"));
const Reports = () => lazyPage(() => import("../pages/reports/Reports"));
const SettingsPage = () => lazyPage(() => import("../pages/settings/Settings"));
const PublicMenu = () => lazyPage(() => import("../pages/public/PublicMenu"));
const NotFound = () => lazyPage(() => import("../pages/NotFound"));

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
            path: "/roles",
            element: <ProtectedRoute allowedRoles={["ADMIN"]} />,
            children: [
              { index: true, element: <Employees /> },
              { path: "departments", element: <Departments /> },
              { path: "designations", element: <Designations /> },
              { path: "shifts", element: <Shifts /> },
              { path: "permissions", element: <RolePermissions /> },
            ],
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
