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
const Hub = () => lazyPage(() => import("../pages/hub/Hub"));
const Dashboard = () => lazyPage(() => import("../pages/dashboard/Dashboard"));
const Branches = () => lazyPage(() => import("../pages/admin/Branches"));
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
const PosReport = () => lazyPage(() => import("../pages/reports/PosReport"));
const ProfitLoss = () => lazyPage(() => import("../pages/accounts/ProfitLoss"));
const BalanceSheet = () => lazyPage(() => import("../pages/accounts/BalanceSheet"));
const ChartOfAccounts = () => lazyPage(() => import("../pages/accounts/ChartOfAccounts"));
const Expenses = () => lazyPage(() => import("../pages/expenses/Expenses"));
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
          { path: "/", element: <Hub /> },
          {
            path: "/admin",
            children: [
              {
                element: <ProtectedRoute allowedRoles={["ADMIN", "MANAGER"]} />,
                children: [
                  { index: true, element: <Dashboard /> },
                  { path: "inventory", element: <Inventory /> },
                ],
              },
              {
                element: <ProtectedRoute allowedRoles={["ADMIN"]} />,
                children: [
                  { path: "branches", element: <Branches /> },
                  { path: "shifts", element: <Shifts /> },
                  { path: "departments", element: <Departments /> },
                  { path: "designations", element: <Designations /> },
                  { path: "employees", element: <Employees /> },
                  { path: "role-management", element: <RolePermissions /> },
                  { path: "settings", element: <SettingsPage /> },
                ],
              },
            ],
          },
          { path: "/pos", element: <POS /> },
          {
            path: "/menu",
            element: <ProtectedRoute allowedRoles={["ADMIN", "MANAGER"]} />,
            children: [
              { index: true, element: <MenuList /> },
              { path: "categories", element: <Categories /> },
              { path: "qr", element: <QRManagement /> },
            ],
          },
          {
            path: "/accounts",
            children: [
              {
                element: <ProtectedRoute allowedRoles={["ADMIN", "MANAGER"]} />,
                children: [
                  { index: true, element: <PosReport /> },
                  { path: "profit-loss", element: <ProfitLoss /> },
                  { path: "balance-sheet", element: <BalanceSheet /> },
                  { path: "expenses", element: <Expenses /> },
                  { path: "chart-of-accounts", element: <ChartOfAccounts /> },
                ],
              },
              { path: "orders", element: <Orders /> },
              { path: "tables", element: <Tables /> },
              { path: "customers", element: <Customers /> },
            ],
          },
        ],
      },
    ],
  },
  { path: "*", element: <NotFound /> },
]);
