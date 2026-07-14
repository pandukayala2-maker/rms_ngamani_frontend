import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Modal } from "../../components/ui/Modal";
import { Input, Select, Textarea } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { useCreateMenuItem, useUpdateMenuItem, useUploadImage } from "../../hooks/useMenu";
import { getErrorMessage } from "../../lib/axios";
import { resolveAssetUrl } from "../../lib/assets";
import type { Category, MenuItem } from "../../types";

const schema = z.object({
  name: z.string().min(1, "Required"),
  itemCode: z.string().min(1, "Required"),
  categoryId: z.string().uuid("Select a category"),
  subcategory: z.string().optional(),
  description: z.string().optional(),
  price: z.coerce.number().positive("Must be positive"),
  discountPrice: z.coerce.number().optional(),
  tax: z.coerce.number().min(0).max(100).default(0),
  prepTimeMins: z.coerce.number().optional(),
  ingredients: z.string().optional(),
  tags: z.string().optional(),
  isVeg: z.boolean().default(true),
  spicyLevel: z.enum(["NONE", "MILD", "MEDIUM", "HOT", "EXTRA_HOT"]).default("NONE"),
  isFeatured: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  displayOrder: z.coerce.number().default(0),
  status: z.enum(["ACTIVE", "HIDDEN", "OUT_OF_STOCK", "DISABLED"]).default("ACTIVE"),
  showOnQr: z.boolean().default(true),
  posOnly: z.boolean().default(false),
  isTempHidden: z.boolean().default(false),
  isSeasonal: z.boolean().default(false),
  isAvailable: z.boolean().default(true),
});

type FormValues = z.infer<typeof schema>;

interface MenuFormProps {
  open: boolean;
  onClose: () => void;
  item: MenuItem | null;
  categories: Category[];
}

export function MenuForm({ open, onClose, item, categories }: MenuFormProps) {
  const createItem = useCreateMenuItem();
  const updateItem = useUpdateMenuItem();
  const uploadImage = useUploadImage("/menu-items/upload-image");
  const [imagePath, setImagePath] = useState<string | undefined>(undefined);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (open) {
      setImagePath(item?.image ?? undefined);
      reset(
        item
          ? {
              ...item,
              discountPrice: item.discountPrice ?? undefined,
              subcategory: item.subcategory ?? undefined,
              description: item.description ?? undefined,
              prepTimeMins: item.prepTimeMins ?? undefined,
              ingredients: item.ingredients.join(", "),
              tags: item.tags.join(", "),
            }
          : {
              tax: 0,
              isVeg: true,
              spicyLevel: "NONE",
              status: "ACTIVE",
              showOnQr: true,
              isAvailable: true,
              displayOrder: 0,
            }
      );
    }
  }, [open, item, reset]);

  const onSubmit = handleSubmit((values) => {
    const payload = {
      ...values,
      image: imagePath,
      ingredients: values.ingredients ? values.ingredients.split(",").map((s) => s.trim()).filter(Boolean) : [],
      tags: values.tags ? values.tags.split(",").map((s) => s.trim()).filter(Boolean) : [],
    };

    const mutation = item ? updateItem : createItem;
    mutation.mutate(
      item ? { id: item.id, ...payload } : (payload as never),
      {
        onSuccess: () => {
          toast.success(item ? "Menu item updated" : "Menu item created");
          onClose();
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      }
    );
  });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const path = await uploadImage.mutateAsync(file);
      setImagePath(path);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={item ? "Edit Menu Item" : "Add Menu Item"} maxWidth="max-w-2xl">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex items-center gap-4">
          {imagePath ? (
            <img src={resolveAssetUrl(imagePath)} alt="" className="h-16 w-16 rounded-xl object-cover" />
          ) : (
            <div className="h-16 w-16 rounded-xl bg-[var(--bg-surface-2)]" />
          )}
          <div>
            <input type="file" accept="image/*" onChange={handleFile} className="text-xs" />
            {uploadImage.isPending && <p className="text-xs text-[var(--text-muted)]">Uploading...</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Item Name" error={errors.name?.message} {...register("name")} />
          <Input label="Item Code" error={errors.itemCode?.message} {...register("itemCode")} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select label="Category" error={errors.categoryId?.message} {...register("categoryId")}>
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Input label="Subcategory" {...register("subcategory")} />
        </div>

        <Textarea label="Description" rows={2} {...register("description")} />

        <div className="grid grid-cols-3 gap-4">
          <Input label="Price" type="number" step="0.01" error={errors.price?.message} {...register("price")} />
          <Input label="Discount Price" type="number" step="0.01" {...register("discountPrice")} />
          <Input label="Tax (%)" type="number" step="0.01" {...register("tax")} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input label="Prep Time (mins)" type="number" {...register("prepTimeMins")} />
          <Select label="Spicy Level" {...register("spicyLevel")}>
            <option value="NONE">None</option>
            <option value="MILD">Mild</option>
            <option value="MEDIUM">Medium</option>
            <option value="HOT">Hot</option>
            <option value="EXTRA_HOT">Extra Hot</option>
          </Select>
          <Input label="Display Order" type="number" {...register("displayOrder")} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Ingredients (comma separated)" {...register("ingredients")} />
          <Input label="Tags (comma separated)" {...register("tags")} />
        </div>

        <Select label="Status" {...register("status")}>
          <option value="ACTIVE">Active</option>
          <option value="HIDDEN">Hidden</option>
          <option value="OUT_OF_STOCK">Out of Stock</option>
          <option value="DISABLED">Disabled</option>
        </Select>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 rounded-xl bg-[var(--bg-surface-2)] p-3">
          {(
            [
              ["isVeg", "Vegetarian"],
              ["isFeatured", "Featured"],
              ["isBestseller", "Bestseller"],
              ["showOnQr", "Show on QR Menu"],
              ["posOnly", "POS Only"],
              ["isTempHidden", "Temporarily Hidden"],
              ["isSeasonal", "Seasonal Item"],
              ["isAvailable", "Available"],
            ] as const
          ).map(([field, label]) => (
            <label key={field} className="flex items-center gap-2 text-xs">
              <Controller
                control={control}
                name={field}
                render={({ field: { value, onChange } }) => (
                  <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
                )}
              />
              {label}
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={createItem.isPending || updateItem.isPending}>
            {item ? "Save Changes" : "Create Item"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
