"use client";
import ProductGrid from "@/components/products/ProductGrid";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import type { Category } from "@/services/hooks/useCategories";
import { useCategories } from "@/services/hooks/useCategories";
import { useInfiniteProducts } from "@/services/hooks/useProducts";
import { ChevronRight, Loader2, Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

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

function hasDescendantSelected(
  node: CategoryNode,
  selectedId: string,
): boolean {
  return (
    node._id === selectedId ||
    node.children.some((c) => hasDescendantSelected(c, selectedId))
  );
}

interface TreeNodeProps {
  node: CategoryNode;
  selectedId: string;
  onSelect: (id: string) => void;
  depth?: number;
}

function TreeNode({ node, selectedId, onSelect, depth = 0 }: TreeNodeProps) {
  const isSelected = selectedId === node._id;
  const hasChildren = node.children.length > 0;
  const [open, setOpen] = useState(() =>
    hasDescendantSelected(node, selectedId),
  );

  // Auto-expand when a descendant becomes selected
  useEffect(() => {
    if (hasDescendantSelected(node, selectedId)) setOpen(true);
  }, [selectedId, node]);

  const handleNameClick = () => {
    onSelect(node._id);
    if (hasChildren) setOpen(true); // always expand when selecting a parent
  };

  return (
    <li>
      <div
        className={`flex items-center gap-1 rounded-lg py-1.5 text-sm transition-colors group ${
          isSelected
            ? "bg-primary/10 text-primary font-medium"
            : "hover:bg-muted text-foreground"
        }`}
        style={{ paddingLeft: `${(depth + 1) * 12}px`, paddingRight: "8px" }}
      >
        {/* Expand/collapse arrow — only shown if has children */}
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((o) => !o);
            }}
            className="shrink-0 text-muted-foreground hover:text-foreground p-0.5 rounded"
          >
            <ChevronRight
              className={`w-3.5 h-3.5 transition-transform duration-150 ${open ? "rotate-90" : ""}`}
            />
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}

        {/* Category name — click to select */}
        <span
          className="flex-1 truncate cursor-pointer"
          onClick={handleNameClick}
        >
          {node.name}
        </span>
      </div>

      {/* Children */}
      {hasChildren && open && (
        <ul>
          {node.children.map((child) => (
            <TreeNode
              key={child._id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const selectedCategoryId = searchParams.get("category_id") ?? "";
  const featuredParam = searchParams.get("featured");
  const saleParam = searchParams.get("sale");

  const setCategory = (id: string) => {
    const params = new URLSearchParams();
    if (id) params.set("category_id", id);
    router.push(`/products${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteProducts({
      category_id: selectedCategoryId || undefined,
      q: debouncedSearch || undefined,
      featured: featuredParam === "true" ? true : undefined,
      sale: saleParam === "true" ? true : undefined,
    });

  const sentinelRef = useInfiniteScroll(
    useCallback(() => fetchNextPage(), [fetchNextPage]),
    !!hasNextPage && !isFetchingNextPage,
  );

  const { data: categoriesFlat = [] } = useCategories();

  const tree = useMemo(
    () => buildTree(categoriesFlat as Category[]),
    [categoriesFlat],
  );

  const products = (data?.pages.flatMap((p) => p.products) ?? []) as Array<{
    _id: string;
    name: string;
    slug: string;
    imageKeys: string[];
    price: number;
    salePrice?: number | null;
    stock: number;
    isFeatured?: boolean;
  }>;
  const total = data?.pages[0]?.total ?? 0;

  const allCats = categoriesFlat as Category[];
  const selectedCat = allCats.find((c) => c._id === selectedCategoryId);

  const pageTitle =
    saleParam === "true"
      ? "Хямдрал"
      : featuredParam === "true"
        ? "Онцлох"
        : (selectedCat?.name ?? "Бүтээгдэхүүн");

  return (
    <div className="flex gap-6">
      {/* ── Left sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden md:block w-52 shrink-0">
        <div className="sticky top-6">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-3">
            Ангиллууд
          </h2>
          <ul className="space-y-0.5">
            {/* Бүгд */}
            <li>
              <div
                onClick={() => setCategory("")}
                className={`flex items-center rounded-lg py-1.5 px-3 text-sm cursor-pointer transition-colors ${
                  !selectedCategoryId && !featuredParam && !saleParam
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted"
                }`}
              >
                Бүгд
              </div>
            </li>

            {tree.map((node) => (
              <TreeNode
                key={node._id}
                node={node}
                selectedId={selectedCategoryId}
                onSelect={setCategory}
              />
            ))}
          </ul>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold">{pageTitle}</h1>
            {!isLoading && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {total} бараа
              </p>
            )}
          </div>
          {(selectedCategoryId || saleParam || featuredParam) && (
            <Badge
              variant="outline"
              className="cursor-pointer"
              onClick={() => {
                router.push("/products");
              }}
            >
              <X className="w-3 h-3 mr-1" />
              Цэвэрлэх
            </Badge>
          )}
        </div>

        {/* Mobile category chips */}
        <div className="md:hidden mb-4 flex flex-wrap gap-2">
          <Badge
            variant={!selectedCategoryId ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setCategory("")}
          >
            Бүгд
          </Badge>
          {allCats
            .filter((c) => !c.parent)
            .map((cat) => (
              <Badge
                key={cat._id}
                variant={selectedCategoryId === cat._id ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setCategory(cat._id)}
              >
                {cat.name}
              </Badge>
            ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Бараа хайх..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        <ProductGrid products={products} isLoading={isLoading} />

        <div ref={sentinelRef} />
        {isFetchingNextPage && (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}
