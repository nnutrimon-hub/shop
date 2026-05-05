"use client";
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
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
  type Category,
} from "@/services/hooks/useCategories";
import { useInfiniteAdminCategories } from "@/services/hooks/useProducts";
import { useDebounce } from "@/hooks/use-debounce";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { ChevronRight, Loader2, Pencil, Plus, Search, Tag, Trash2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

interface CategoryNode extends Category {
  children: CategoryNode[];
}

function buildTree(flat: Category[]): CategoryNode[] {
  const map = new Map<string, CategoryNode>();
  for (const c of flat) map.set(c._id, { ...c, children: [] });
  const roots: CategoryNode[] = [];
  for (const node of map.values()) {
    const pid = node.parent ? String(node.parent) : null;
    if (!pid || !map.has(pid)) roots.push(node);
    else map.get(pid)!.children.push(node);
  }
  return roots;
}

function flattenTree(
  nodes: CategoryNode[],
  depth = 0,
): { node: CategoryNode; depth: number }[] {
  const result: { node: CategoryNode; depth: number }[] = [];
  for (const node of nodes) {
    result.push({ node, depth });
    result.push(...flattenTree(node.children, depth + 1));
  }
  return result;
}

interface CategoryForm {
  name: string;
  parentId: string;
}

const EMPTY_FORM: CategoryForm = { name: "", parentId: "" };

function AdminCategoriesContent() {
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
  const [form, setForm] = useState<CategoryForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  // Load all categories for tree building (sidebar/parent selector)
  const { data: allCatsFlat = [] } = useCategories();
  const allCats = allCatsFlat as Category[];

  // Infinite query — used for the table display
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteAdminCategories(debouncedQ);

  const sentinelRef = useInfiniteScroll(
    useCallback(() => fetchNextPage(), [fetchNextPage]),
    !!hasNextPage && !isFetchingNextPage,
  );

  // Build tree from all cats (for indentation display) or use flat when searching
  const loadedCats = (data?.pages.flatMap((p) => p.categories) ?? []) as unknown as Category[];
  const total = data?.pages[0]?.total ?? 0;

  const flatList = useMemo(() => {
    if (debouncedQ) {
      // Searching: show flat results with depth=0
      return loadedCats.map((c) => ({ node: { ...c, children: [] } as CategoryNode, depth: 0 }));
    }
    // No search: build tree from all loaded cats for correct indentation
    const tree = buildTree(loadedCats);
    return flattenTree(tree);
  }, [loadedCats, debouncedQ]);

  const createCategory = useCreateCategory(() => setDialogOpen(false));
  const updateCategory = useUpdateCategory(() => setDialogOpen(false));
  const deleteCategory = useDeleteCategory();

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingId(cat._id);
    setForm({
      name: cat.name,
      parentId: cat.parent ? String(cat.parent) : "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { name: form.name, parentId: form.parentId || "" };
      if (editingId) {
        updateCategory.mutate({ id: editingId, data: payload });
      } else {
        createCategory.mutate(payload);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isPending = submitting || createCategory.isPending || updateCategory.isPending;

  const getDescendantIds = (id: string): Set<string> => {
    const result = new Set<string>([id]);
    const queue = [id];
    while (queue.length) {
      const cur = queue.shift()!;
      for (const c of allCats) {
        if (String(c.parent) === cur && !result.has(c._id)) {
          result.add(c._id);
          queue.push(c._id);
        }
      }
    }
    return result;
  };

  const parentOptions = editingId
    ? allCats.filter((c) => !getDescendantIds(editingId).has(c._id))
    : allCats;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Ангилал удирдах</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {debouncedQ ? `${loadedCats.length} / ${total} олдлоо` : `${allCats.length} ангилал`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Нэрээр хайх..."
              value={inputQ}
              onChange={(e) => setInputQ(e.target.value)}
              className="pl-9 w-52"
            />
          </div>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Ангилал нэмэх
          </Button>
        </div>
      </div>

      {/* Tree list */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      ) : flatList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground border-2 border-dashed rounded-2xl">
          <Tag className="w-14 h-14 opacity-20" />
          <p className="text-lg font-medium">
            {q ? "Хайлтын үр дүн олдсонгүй" : "Ангилал байхгүй байна"}
          </p>
          {!q && (
            <Button variant="outline" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Анхны ангилал нэмэх
            </Button>
          )}
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wide">
                  Ангилал
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wide hidden sm:table-cell">
                  Эцэг ангилал
                </th>
                <th className="px-4 py-3 w-24" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {flatList.map(({ node, depth }) => {
                const parentCat = node.parent
                  ? allCats.find((c) => c._id === String(node.parent))
                  : null;
                return (
                  <tr key={node._id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div
                        className="flex items-center gap-1.5"
                        style={{ paddingLeft: `${depth * 16}px` }}
                      >
                        {depth > 0 && (
                          <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                        )}
                        <span className="font-medium text-sm">{node.name}</span>
                        {node.children.length > 0 && (
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded ml-1">
                            {node.children.length} дэд
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {parentCat ? (
                        <span className="text-sm text-muted-foreground">{parentCat.name}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground italic opacity-40">
                          Үндсэн ангилал
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs gap-1.5"
                          onClick={() => openEdit(node)}
                        >
                          <Pencil className="w-3 h-3" />
                          Засах
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setConfirmDelete({ id: node._id, name: node.name })}
                          disabled={deleteCategory.isPending}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} />
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={(open) => { if (!open) setConfirmDelete(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ангилал устгах</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">&ldquo;{confirmDelete?.name}&rdquo;</span> ангилалыг устгахдаа итгэлтэй байна уу?
          </p>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setConfirmDelete(null)}
              disabled={deleteCategory.isPending}
            >
              Болих
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={deleteCategory.isPending}
              onClick={() => {
                if (!confirmDelete) return;
                deleteCategory.mutate(confirmDelete.id, {
                  onSuccess: () => setConfirmDelete(null),
                  onError: () => setConfirmDelete(null),
                });
              }}
            >
              {deleteCategory.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Тийм, устга
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingId ? "Ангилал засах" : "Шинэ ангилал нэмэх"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <fieldset disabled={isPending} className="space-y-4 border-0 p-0 m-0 min-w-0">
              <div className="space-y-1.5">
                <Label htmlFor="cat-name">
                  Нэр <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cat-name"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ангилалын нэр"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Эцэг ангилал</Label>
                <Select
                  value={form.parentId || "__none__"}
                  onValueChange={(v) =>
                    setForm({ ...form, parentId: v === "__none__" ? "" : (v ?? "") })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {form.parentId ? (
                        allCats.find((c) => c._id === form.parentId)?.name ?? form.parentId
                      ) : (
                        <span className="text-muted-foreground">Үндсэн ангилал (эцэг байхгүй)</span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Үндсэн ангилал (эцэг байхгүй)</SelectItem>
                    {parentOptions.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Хэрвээ энэ ангилал өөр ангилалын дэд ангилал бол эцгийг нь сонгоно
                </p>
              </div>
            </fieldset>

            <div className="flex gap-2 pt-1">
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
                {editingId ? "Хадгалах" : "Нэмэх"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminCategoriesPage() {
  return (
    <Suspense>
      <AdminCategoriesContent />
    </Suspense>
  );
}
