import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { useResetPassword } from "../../hooks/useAuth";
import { getErrorMessage } from "../../lib/axios";

const schema = z
  .object({
    password: z.string().min(8, "Minimum 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const navigate = useNavigate();
  const resetPassword = useResetPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit((values) => {
    resetPassword.mutate(
      { token, password: values.password },
      {
        onSuccess: () => {
          toast.success("Password reset successfully. Please sign in.");
          navigate("/login");
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      }
    );
  });

  return (
    <div>
      <h2 className="mb-1 text-xl font-semibold">Reset your password</h2>
      <p className="mb-6 text-sm text-[var(--text-secondary)]">Choose a new password for your account.</p>
      <form onSubmit={onSubmit} className="space-y-4">
        <Input label="New password" type="password" error={errors.password?.message} {...register("password")} />
        <Input
          label="Confirm password"
          type="password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <Button type="submit" className="w-full" isLoading={resetPassword.isPending} disabled={!token}>
          Reset password
        </Button>
        {!token && <p className="text-xs text-red-500">Missing reset token. Use the link from your email.</p>}
      </form>
    </div>
  );
}
