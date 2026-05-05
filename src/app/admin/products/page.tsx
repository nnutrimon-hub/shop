"use client";
import MultiImagePicker, {
  type MultiImagePickerRef,
} from "@/components/admin/MultiImagePicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useRole } from "@/hooks/use-role";
import { getImageUrl } from "@/lib/storage";
import { formatPrice, slugify } from "@/lib/utils";
import { useCategories } from "@/services/hooks/useCategories";
import {
  useCreateProduct,
  useDeleteProduct,
  useInfiniteAdminProducts,
  useUpdateProduct,
} from "@/services/hooks/useProducts";
import { Loader2, Package, Pencil, Plus, Search, Trash2 } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface VariantRow {
  label: string;
  price: string;
}

interface ProductForm {
  name: string;
  brand: string;
  barcode: string;
  description: string;
  price: string;
  salePrice: string;
  stock: string;
  imageKeys: string[];
  category: string;
  isFeatured: boolean;
  variants: VariantRow[];
}

const EMPTY_FORM: ProductForm = {
  name: "",
  brand: "",
  barcode: "",
  description: "",
  price: "",
  salePrice: "",
  stock: "",
  imageKeys: [],
  category: "",
  isFeatured: false,
  variants: [],
};

function AdminProductsContent() {
  const { isAdmin } = useRole();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const [inputQ, setInputQ] = useState(q);
  const debouncedQ = useDebounce(inputQ, 400);

  useEffect(() => {
    const p = new URLSearchParams(searchParams.toString());
    if (debouncedQ) p.set("q", debouncedQ);
    else p.delete("q");
    router.replace(`${pathname}?${p}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const pickerRef = useRef<MultiImagePickerRef>(null);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteAdminProducts(debouncedQ);
  const { data: categories = [] } = useCategories();
  const createProduct = useCreateProduct(() => setDialogOpen(false));
  const updateProduct = useUpdateProduct(() => setDialogOpen(false));
  const deleteProduct = useDeleteProduct();

  const allProducts = (data?.pages.flatMap((p) => p.products) ?? []) as Array<{
    _id: string;
    name: string;
    slug: string;
    brand?: string;
    barcode?: string;
    description?: string;
    imageKeys: string[];
    price: number;
    salePrice?: number | null;
    stock: number;
    isFeatured?: boolean;
    variants?: { label: string; price: number; order: number }[];
    category?: { _id: string; name: string };
  }>;
  const total = data?.pages[0]?.total ?? 0;

  const sentinelRef = useInfiniteScroll(
    useCallback(() => fetchNextPage(), [fetchNextPage]),
    !!hasNextPage && !isFetchingNextPage,
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const categoryIdFromProduct = (
    cat: (typeof allProducts)[0]["category"],
  ): string => {
    if (!cat) return "";
    if (typeof cat === "string") return cat;
    return String(cat._id);
  };

  const openEdit = (p: (typeof allProducts)[0]) => {
    setEditingId(p._id);
    setForm({
      name: p.name,
      brand: p.brand ?? "",
      barcode: p.barcode ?? "",
      description: p.description ?? "",
      price: String(p.price),
      salePrice: p.salePrice ? String(p.salePrice) : "",
      stock: String(p.stock),
      imageKeys: p.imageKeys ?? [],
      category: categoryIdFromProduct(p.category),
      isFeatured: p.isFeatured ?? false,
      variants: (p.variants ?? []).map((v) => ({
        label: v.label,
        price: String(v.price),
      })),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category) {
      toast.error("Ангилал сонгоно уу");
      return;
    }
    if (
      form.salePrice &&
      Number(form.salePrice) > 0 &&
      form.price &&
      Number(form.salePrice) >= Number(form.price)
    ) {
      toast.error("Хямдарсан үнэ үндсэн үнээс бага байх ёстой");
      return;
    }
    setSubmitting(true);
    try {
      const newKeys = (await pickerRef.current?.uploadPending()) ?? [];
      const existingKeys =
        pickerRef.current?.getExistingKeys() ?? form.imageKeys;
      const imageKeys = [...existingKeys, ...newKeys];

      const payload = {
        name: form.name,
        brand: form.brand,
        barcode: form.barcode,
        description: form.description,
        price: Number(form.price),
        salePrice:
          form.salePrice && Number(form.salePrice) > 0
            ? Number(form.salePrice)
            : null,
        stock: Number(form.stock),
        imageKeys,
        category: form.category,
        isFeatured: form.isFeatured,
        variants: form.variants
          .filter((v) => v.label.trim() && Number(v.price) > 0)
          .map((v, i) => ({
            label: v.label.trim(),
            price: Number(v.price),
            order: i,
          })),
        slug: slugify(form.name) + "-" + Date.now(),
      };

      if (editingId) {
        updateProduct.mutate({ id: editingId, data: payload });
      } else {
        createProduct.mutate(payload);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isPending =
    submitting || createProduct.isPending || updateProduct.isPending;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Бараа удирдах</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {debouncedQ
              ? `${allProducts.length} / ${total} олдлоо`
              : `${total} бараа`}
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-2 w-full md:justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Бараа хайх..."
              value={inputQ}
              onChange={(e) => setInputQ(e.target.value)}
              className="pl-9 md:w-52 w-full"
            />
          </div>
          {isAdmin && (
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Бараа нэмэх
            </Button>
          )}
        </div>
      </div>

      {/* Product grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
          ))}
        </div>
      ) : allProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground border-2 border-dashed rounded-2xl">
          <Package className="w-14 h-14 opacity-20" />
          <p className="text-lg font-medium">
            {debouncedQ ? "Хайлтын үр дүн олдсонгүй" : "Бараа байхгүй байна"}
          </p>
          {isAdmin && !debouncedQ && (
            <Button variant="outline" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Анхны бараагаа нэмэх
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {allProducts.map((p) => {
            const firstKey = p.imageKeys?.find(
              (k) => typeof k === "string" && k.trim().length > 0,
            );
            const thumbSrc = firstKey
              ? getImageUrl(firstKey.trim(), { width: 300 })
              : "";
            return (
              <div
                key={p._id}
                className="rounded-2xl border bg-card overflow-hidden hover:shadow-md hover:border-primary/30 transition-all group"
              >
                <div className="relative aspect-square bg-muted">
                  {thumbSrc ? (
                    <Image
                      src={thumbSrc}
                      alt={p.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                  )}
                  {p.imageKeys?.length > 1 && (
                    <Badge className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 bg-background/90 text-foreground border">
                      {p.imageKeys.length} зураг
                    </Badge>
                  )}
                  {p.salePrice != null &&
                    p.salePrice > 0 &&
                    p.salePrice < p.price && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        -{Math.round((1 - p.salePrice / p.price) * 100)}%
                      </div>
                    )}
                  {p.isFeatured && (
                    <div className="absolute bottom-2 left-2 text-[10px]">
                      ⭐
                    </div>
                  )}
                  {p.stock === 0 && (
                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                      <span className="text-xs font-semibold text-destructive bg-background px-2 py-1 rounded">
                        Дууссан
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  <div>
                    <p className="font-medium text-sm line-clamp-2 leading-snug">
                      {p.name}
                    </p>
                    {p.category && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {p.category.name}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      {p.salePrice != null && p.salePrice > 0 ? (
                        <div>
                          <p className="text-primary font-bold text-sm">
                            {formatPrice(p.salePrice)}
                          </p>
                          <p className="text-[10px] text-muted-foreground line-through">
                            {formatPrice(p.price)}
                          </p>
                        </div>
                      ) : (
                        <p className="text-primary font-bold text-sm">
                          {formatPrice(p.price)}
                        </p>
                      )}
                    </div>
                    <p
                      className={`text-xs font-medium ${p.stock > 0 ? "text-muted-foreground" : "text-destructive"}`}
                    >
                      {p.stock} ш
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-7 text-xs"
                      onClick={() => openEdit(p)}
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      Засах
                    </Button>
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() =>
                          setConfirmDelete({ id: p._id, name: p.name })
                        }
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} />
      {isFetchingNextPage && (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!confirmDelete}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Бараа устгах</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              &ldquo;{confirmDelete?.name}&rdquo;
            </span>{" "}
            барааг устгахдаа итгэлтэй байна уу?
          </p>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setConfirmDelete(null)}
              disabled={deleteProduct.isPending}
            >
              Болих
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={deleteProduct.isPending}
              onClick={() => {
                if (!confirmDelete) return;
                deleteProduct.mutate(confirmDelete.id, {
                  onSuccess: () => setConfirmDelete(null),
                  onError: () => setConfirmDelete(null),
                });
              }}
            >
              {deleteProduct.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Тийм, устга
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-5xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingId ? "Бараа засах" : "Шинэ бараа нэмэх"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="mt-2">
            <fieldset disabled={isPending} className="border-0 p-0 m-0 min-w-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* ── Left: Images ── */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-semibold">Зурагнууд</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Хамгийн ихдээ 5 зураг. ⭐ товчлуур дарж гол зургаа сонгоно
                      уу.
                    </p>
                  </div>
                  <MultiImagePicker
                    ref={pickerRef}
                    currentKeys={form.imageKeys}
                    maxImages={5}
                  />
                </div>

                {/* ── Right: Form fields ── */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">
                      Барааны нэр <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      required
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      placeholder="Барааны нэр оруулна уу"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="brand">Брэнд</Label>
                      <Input
                        id="brand"
                        value={form.brand}
                        onChange={(e) =>
                          setForm({ ...form, brand: e.target.value })
                        }
                        placeholder="KEWPIE"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="barcode">Бүтээгдэхүүний код</Label>
                      <Input
                        id="barcode"
                        value={form.barcode}
                        onChange={(e) =>
                          setForm({ ...form, barcode: e.target.value })
                        }
                        placeholder="4901577000010"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="description">Тайлбар</Label>
                    <textarea
                      id="description"
                      rows={4}
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                      placeholder="Барааны дэлгэрэнгүй тайлбар..."
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="price">
                        Үндсэн үнэ (₮){" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        required
                        min="0"
                        value={form.price}
                        onChange={(e) =>
                          setForm({ ...form, price: e.target.value })
                        }
                        placeholder="0"
                      />
                      {form.price && Number(form.price) > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {formatPrice(Number(form.price))}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="salePrice">Хямдарсан үнэ (₮)</Label>
                      <Input
                        id="salePrice"
                        type="number"
                        min="0"
                        max={
                          form.price && Number(form.price) > 0
                            ? String(Number(form.price) - 1)
                            : undefined
                        }
                        value={form.salePrice}
                        onChange={(e) =>
                          setForm({ ...form, salePrice: e.target.value })
                        }
                        placeholder="Хоосон = хямдрал байхгүй"
                      />
                      {form.salePrice &&
                        Number(form.salePrice) > 0 &&
                        form.price &&
                        Number(form.price) > 0 &&
                        (Number(form.salePrice) >= Number(form.price) ? (
                          <p className="text-xs text-destructive font-medium">
                            Хямдарсан үнэ үндсэн үнээс бага байх ёстой
                          </p>
                        ) : (
                          <p className="text-xs text-red-500 font-medium">
                            -
                            {Math.round(
                              (1 -
                                Number(form.salePrice) / Number(form.price)) *
                                100,
                            )}
                            % хямдрал
                          </p>
                        ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="stock">
                      Үлдэгдэл <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="stock"
                      type="number"
                      required
                      min="0"
                      value={form.stock}
                      onChange={(e) =>
                        setForm({ ...form, stock: e.target.value })
                      }
                      placeholder="0"
                    />
                    {form.stock && Number(form.stock) > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {Number(form.stock).toLocaleString()} ширхэг
                      </p>
                    )}
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.isFeatured}
                      onChange={(e) =>
                        setForm({ ...form, isFeatured: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-gray-300 text-primary"
                    />
                    <span className="text-sm font-medium">Онцлох бараа ⭐</span>
                    <span className="text-xs text-muted-foreground">
                      (Нүүр хуудсанд онцлох хэсэгт харагдана)
                    </span>
                  </label>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Хэмжээ / Variants</Label>
                      <button
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            variants: [
                              ...form.variants,
                              { label: "", price: "" },
                            ],
                          })
                        }
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Нэмэх
                      </button>
                    </div>
                    {form.variants.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Жишээ: 1кг, 450гр, 300гр
                      </p>
                    )}
                    {form.variants.map((v, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <Input
                          placeholder="Хэмжээ (1кг, 450гр...)"
                          value={v.label}
                          onChange={(e) => {
                            const updated = [...form.variants];
                            updated[i] = {
                              ...updated[i],
                              label: e.target.value,
                            };
                            setForm({ ...form, variants: updated });
                          }}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          placeholder="Үнэ ₮"
                          min="0"
                          value={v.price}
                          onChange={(e) => {
                            const updated = [...form.variants];
                            updated[i] = {
                              ...updated[i],
                              price: e.target.value,
                            };
                            setForm({ ...form, variants: updated });
                          }}
                          className="w-28"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setForm({
                              ...form,
                              variants: form.variants.filter((_, j) => j !== i),
                            })
                          }
                          className="text-destructive hover:text-destructive/80 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1.5">
                    <Label>
                      Ангилал <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={form.category}
                      onValueChange={(v) =>
                        setForm({ ...form, category: v ?? "" })
                      }
                    >
                      <SelectTrigger className="w-full min-w-0">
                        <SelectValue placeholder="Ангилал сонгох">
                          {(value) => {
                            if (value == null || value === "") return null;
                            const list = categories as Array<{
                              _id: string;
                              name: string;
                            }>;
                            const found = list.find(
                              (c) => String(c._id) === String(value),
                            );
                            return found?.name ?? String(value);
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          categories as Array<{ _id: string; name: string }>
                        ).map((c) => (
                          <SelectItem key={c._id} value={String(c._id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {(categories as Array<{ _id: string; name: string }>)
                      .length === 0 && (
                      <p className="text-xs text-amber-600">
                        Ангилал байхгүй байна.{" "}
                        <a href="/admin/categories" className="underline">
                          Ангилал нэмэх
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </fieldset>

            <div className="flex gap-2 pt-4 border-t mt-6">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setDialogOpen(false)}
                disabled={isPending}
              >
                Болих
              </Button>
              <Button type="submit" className="flex-1" disabled={isPending}>
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingId ? "Хадгалах" : "Бараа нэмэх"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense>
      <AdminProductsContent />
    </Suspense>
  );
}
