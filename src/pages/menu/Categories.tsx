import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { HiOutlinePencil, HiOutlinePlus, HiOutlineTrash } from "react-icons/hi2";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { SkeletonRows } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "../../hooks/useCategories";
import { useUploadImage } from "../../hooks/useMenu";
import { getErrorMessage } from "../../lib/axios";
import { resolveAssetUrl } from "../../lib/assets";
import type { Category } from "../../types";
import { MenuTabs } from "./MenuTabs";

interface FormValues {
  name: string;
  description?: string;
  displayOrder: number;
}

export default function Categories() {
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const uploadImage = useUploadImage("/categories/upload-image");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [imagePath, setImagePath] = useState<string | undefined>();

  const { register, handleSubmit, reset } = useForm<FormValues>();

  useEffect(() => {
    if (formOpen) {
      setImagePath(editing?.image ?? undefined);
      reset(
        editing
          ? { name: editing.name, description: editing.description ?? "", displayOrder: editing.displayOrder }
          : { name: "", description: "", displayOrder: (categories?.length ?? 0) + 1 }
      );
    }
  }, [formOpen, editing, reset, categories?.length]);

  const onSubmit = handleSubmit((values) => {
    const payload = { ...values, image: imagePath };
    const mutation = editing ? updateCategory : createCategory;
    mutation.mutate(
      editing ? { id: editing.id, ...payload } : (payload as never),
      {
        onSuccess: () => {
          toast.success(editing ? "Category updated" : "Category created");
          setFormOpen(false);
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      }
    );
  });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const path = await uploadImage.mutateAsync(file);
    setImagePath(path);
  };

  return (
    <div className="space-y-4">
      <MenuTabs />
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <HiOutlinePlus size={16} className="mr-1" /> Add Category
        </Button>
      </div>

      {isLoading ? (
        <SkeletonRows rows={5} />
      ) : !categories || categories.length === 0 ? (
        <EmptyState title="No categories yet" description="Create categories like Beverages, Starters, Main Course..." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <Card key={category.id} className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                {category.image ? (
                  <img src={resolveAssetUrl(category.image)} alt="" className="h-12 w-12 rounded-xl object-cover" />
                ) : (
                  <div className="h-12 w-12 rounded-xl bg-[var(--bg-surface-2)]" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{category.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{category._count?.menuItems ?? 0} items</p>
                </div>
                <Badge tone={category.isActive ? "good" : "neutral"}>
                  {category.isActive ? "Active" : "Disabled"}
                </Badge>
              </div>
              {category.description && (
                <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{category.description}</p>
              )}
              <div className="mt-auto flex items-center justify-between pt-2">
                <button
                  className="text-xs text-brand-600 hover:underline"
                  onClick={() =>
                    updateCategory.mutate({ id: category.id, isActive: !category.isActive })
                  }
                >
                  {category.isActive ? "Disable" : "Enable"}
                </button>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditing(category);
                      setFormOpen(true);
                    }}
                  >
                    <HiOutlinePencil size={15} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(category)}>
                    <HiOutlineTrash size={15} className="text-red-500" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Edit Category" : "Add Category"}>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex items-center gap-4">
            {imagePath ? (
              <img src={resolveAssetUrl(imagePath)} alt="" className="h-14 w-14 rounded-xl object-cover" />
            ) : (
              <div className="h-14 w-14 rounded-xl bg-[var(--bg-surface-2)]" />
            )}
            <input type="file" accept="image/*" onChange={handleFile} className="text-xs" />
          </div>
          <Input label="Name" {...register("name", { required: true })} />
          <Input label="Description" {...register("description")} />
          <Input label="Display Priority" type="number" {...register("displayOrder")} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createCategory.isPending || updateCategory.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete category"
        description={`Delete "${deleteTarget?.name}"? Items in this category will need to be reassigned.`}
        danger
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() =>
          deleteTarget &&
          deleteCategory.mutate(deleteTarget.id, {
            onSuccess: () => {
              toast.success("Category deleted");
              setDeleteTarget(null);
            },
            onError: (err) => toast.error(getErrorMessage(err)),
          })
        }
      />
    </div>
  );
}
