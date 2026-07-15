import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { useForgotPassword } from "../../hooks/useAuth";
import { getErrorMessage } from "../../lib/axios";

const schema = z.object({ email: z.string().email("Enter a valid email") });
type FormValues = z.infer<typeof schema>;

export default function ForgotPassword() {
  const forgotPassword = useForgotPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit((values) => {
    forgotPassword.mutate(values.email, {
      onSuccess: () => toast.success("If that email exists, a reset link has been sent"),
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  });

  return (
    <div>
      <h2 className="mb-1 text-xl font-semibold">Forgot your password?</h2>
      <p className="mb-6 text-sm text-[var(--text-secondary)]">
        Enter your email and we'll send you a reset link.
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
        <Button
          type="submit"
          className="w-full !bg-gradient-to-r !from-amber-400 !to-orange-600 !text-neutral-950 hover:!opacity-90"
          isLoading={forgotPassword.isPending}
        >
          Send reset link
        </Button>
      </form>
      <p className="mt-6 text-center text-xs">
        <Link to="/login" className="text-amber-400 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
