import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import { Input, Select } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/Skeleton";
import { useSettings, useUpdateSettings } from "../../hooks/useSettings";
import { getErrorMessage } from "../../lib/axios";
import type { Settings as SettingsType } from "../../types";

export default function Settings() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const { register, handleSubmit, reset } = useForm<SettingsType>();

  useEffect(() => {
    if (settings) reset(settings);
  }, [settings, reset]);

  const onSubmit = handleSubmit((values) => {
    updateSettings.mutate(values, {
      onSuccess: () => toast.success("Settings saved"),
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  });

  if (isLoading || !settings) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Restaurant Details</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Restaurant Name" {...register("restaurantName")} />
          <Input label="Contact" {...register("contact")} />
          <Input label="Address" className="sm:col-span-2" {...register("address")} />
          <Input label="GST / VAT Number" {...register("gstVat")} />
          <Select label="Currency" {...register("currency")}>
            <option value="INR">INR (₹)</option>
            <option value="KWD">KWD (KD)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
          </Select>
          <Select label="Language" {...register("language")}>
            <option value="en">English</option>
            <option value="hi">Hindi</option>
          </Select>
          <Select label="Theme" {...register("theme")}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </Select>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(
            [
              ["notifyLowStock", "Low Stock Alerts"],
              ["notifyNewOrders", "New Orders"],
              ["notifyCompletedOrders", "Completed Orders"],
              ["notifyInventoryAlerts", "Inventory Alerts"],
              ["notifyPaymentAlerts", "Payment Alerts"],
            ] as const
          ).map(([field, label]) => (
            <label key={field} className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register(field)} />
              {label}
            </label>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" isLoading={updateSettings.isPending}>
          Save Settings
        </Button>
      </div>
    </form>
  );
}
