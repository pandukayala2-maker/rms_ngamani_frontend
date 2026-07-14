import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { useLogin } from "../../hooks/useAuth";
import { getErrorMessage } from "../../lib/axios";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit((values) => {
    login.mutate(values, {
      onSuccess: () => {
        toast.success("Welcome back!");
        navigate("/");
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  });

  return (
    <div>
      <h2 className="mb-1 text-xl font-semibold">Sign in to your account</h2>
      <p className="mb-6 text-sm text-[var(--text-secondary)]">
        Manage your restaurant's menu, orders, and inventory.
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        <Input label="Email" type="email" placeholder="admin@spiceroute.com" error={errors.email?.message} {...register("email")} />
        <Input label="Password" type="password" placeholder="********" error={errors.password?.message} {...register("password")} />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs text-brand-600 hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" isLoading={login.isPending}>
          Sign in
        </Button>
      </form>
      <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
        Demo: admin@spiceroute.com / Password@123
      </p>
    </div>
  );
}
