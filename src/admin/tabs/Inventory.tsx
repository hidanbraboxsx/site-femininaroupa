const SAFE_IMG_PLACEHOLDER = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzg4OCIgc3Ryb2tlLXdpZHRoPSIxLjUiPjxyZWN0IHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgeD0iMyIgeT0iMyIgcng9IjIiLz48Y2lyY2xlIGN4PSI5IiBjeT0iOSIgcj0iMiIvPjxwYXRoIGQ9Im0yMSAxNS0zLjA4Ni0zLjA4NmEyIDIgMCAwIDAtMi44MjggMEw2IDIxIi8+PC9zdmc+";
import React, { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowRight,
  Monitor,
  Smartphone,
  ArrowUpRight,
  Boxes,
  Eye,
  Heart,
  Image as ImageIcon,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  Sparkles,
  Star,
  Tag,
  Trash2,
  TriangleAlert
} from 'lucide-react';
import { adminApi, notifyStoreChange } from '../../lib/api';
import type { Product } from '../../types';
import { useAction, useLoad } from '../useLoad';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  SectionTitle,
  Select,
  Spinner,
  Stat,
  Table,
  Td,
  Textarea,
  Toggle,
  ImageUploader,
  cn,
  formatBRL,
  formatDate,
  useToast
} from '../ui';

/* ------------------------------------------------------------------ *
 * Estoque
 * ------------------------------------------------------------------ */

const REASONS_IN = [
  { value: 'compra_fornecedor', label: 'Compra de fornecedor' },
  { value: 'devolucao', label: 'Devolução de cliente' },
  { value: 'ajuste_inventario', label: 'Ajuste de inventário' },
  { value: 'bonificacao', label: 'Bonificação' },
  { value: 'transferencia', label: 'Transferência' }
];

const REASONS_OUT = [
  { value: 'venda', label: 'Venda' },
  { value: 'perda_avaria', label: 'Perda / avaria' },
  { value: 'ajuste_inventario', label: 'Ajuste de inventário' },
  { value: 'uso_interno', label: 'Uso interno' },
  { value: 'transferencia', label: 'Transferência' }
];

export function StockTab({ liveKey }: { liveKey: number }) {
  const { data, loading, error, reload } = useLoad(() => adminApi.stock(), [liveKey]);
  const movements = useLoad(() => adminApi.movements({ limit: 40 }), [liveKey]);
  const { busy, run } = useAction();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ productId: '', variantKey: '', type: 'entrada' as 'entrada' | 'saida', quantity: '1', reason: 'compra_fornecedor', note: '' });

  const products = data?.products || [];
  const selectedProduct = products.find((product) => product.id === form.productId);
  const variants = Object.keys(selectedProduct?.inventory || {});

  function openMove(productId: string, variantKey: string, type: 'entrada' | 'saida') {
    setForm({
      productId,
      variantKey,
      type,
      quantity: '1',
      reason: type === 'entrada' ? 'compra_fornecedor' : 'ajuste_inventario',
      note: ''
    });
    setOpen(true);
  }

  async function submitMove() {
    const result = await run(async () => {
      await adminApi.moveStock({
        productId: form.productId,
        variantKey: form.variantKey,
        type: form.type,
        quantity: Number(form.quantity),
        reason: form.reason,
        note: form.note
      });
      setOpen(false);
      await Promise.all([reload(), movements.reload()]);
    });
    toast.push(result.ok ? 'Movimento registrado e notificado.' : (result as any).error, result.ok ? 'success' : 'error');
  }

  async function quickMove(productId: string, variantKey: string, delta: number) {
    const result = await run(async () => {
      await adminApi.moveStock({
        productId,
        variantKey,
        type: delta > 0 ? 'entrada' : 'saida',
        quantity: Math.abs(delta),
        reason: 'ajuste_inventario',
        note: 'Ajuste rápido pelo painel'
      });
      await Promise.all([reload(), movements.reload()]);
    });
    if (!result.ok) toast.push((result as any).error, 'error');
  }

  if (loading && !data) return <Spinner label="Lendo estoque…" />;
  if (error) return <Card><p className="text-sm text-red-300">{error}</p></Card>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Unidades" value={data?.totals.units ?? 0} />
        <Stat label="Custo do estoque" value={formatBRL(data?.totals.costValue)} />
        <Stat label="Valor de venda" value={formatBRL(data?.totals.saleValue)} tone="good" />
        <Stat label="Variações críticas" value={data?.criticalCount ?? 0} tone={data?.criticalCount ? 'warn' : 'default'} hint={`limite ≤ ${data?.lowStockThreshold} un.`} />
      </div>

      <Card>
        <SectionTitle
          title="Inventário por variação"
          subtitle="cada lançamento gera movimento auditável e alerta no Telegram"
          action={
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                icon={<Trash2 className="h-3.5 w-3.5 text-stone-400" />}
                onClick={async () => {
                  if (!window.confirm('Deseja zerar os saldos de estoque para começar a contagem real física do zero?')) return;
                  const res = await run(async () => {
                    await adminApi.clearStock();
                  });
                  toast.push(res.ok ? 'Estoque zerado para contagem 100% real.' : 'Falha ao zerar.', res.ok ? 'success' : 'error');
                  await Promise.all([reload(), movements.reload()]);
                }}
              >
                Zerar Estoque Real
              </Button>
              <Button
                size="sm"
                variant="primary"
                icon={<Plus className="h-3.5 w-3.5" />}
                onClick={() => openMove(products[0]?.id || '', Object.keys(products[0]?.inventory || {})[0] || '', 'entrada')}
              >
                Novo movimento
              </Button>
            </div>
          }
        />
        {products.length === 0 ? (
          <EmptyState title="Nenhum produto cadastrado" description="Cadastre produtos na aba Catálogo para gerenciar o estoque." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {products.map((product: any) => (
              <div key={product.id} className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card-bg)] p-3.5 shadow-sm hover:border-rose-500/30 transition-all">
                <div className="flex items-start gap-3 mb-2.5">
                  {product.images?.[0] ? (
                    <img referrerPolicy="no-referrer" src={product.images[0]} alt="" onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }} className="h-12 w-12 rounded-xl object-cover border border-[var(--admin-border)] shrink-0 shadow-xs" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black/10 dark:bg-white/5 border border-[var(--admin-border)] shrink-0">
                      <ImageIcon className="h-5 w-5 text-stone-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="truncate">
                        <p className="text-sm font-semibold text-[var(--admin-text-main)] truncate">{product.name}</p>
                        <p className="text-[11px] text-[var(--admin-text-subtle)]">{product.sku} · {product.category}</p>
                      </div>
                      <Badge tone={product.total === 0 ? 'bad' : product.critical.length ? 'warn' : 'good'}>
                        {product.total} un.
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  {Object.entries(product.inventory).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between gap-1.5 rounded-lg bg-black/20 px-2 py-1 min-w-0">
                      <span className="text-[11px] text-stone-400 truncate min-w-0 font-medium" title={key}>{key}</span>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          className="flex h-5 w-5 items-center justify-center rounded text-xs text-stone-400 hover:bg-white/10 hover:text-white disabled:opacity-30 cursor-pointer"
                          disabled={busy || Number(value) <= 0}
                          onClick={() => quickMove(product.id, key, -1)}
                          title="Diminuir estoque"
                        >
                          −
                        </button>
                        <span className={cn('w-5 text-center text-xs font-bold tabular-nums', Number(value) <= (data?.lowStockThreshold || 3) ? 'text-amber-300' : 'text-stone-200')}>
                          {String(value)}
                        </span>
                        <button
                          className="flex h-5 w-5 items-center justify-center rounded text-xs text-stone-400 hover:bg-white/10 hover:text-white cursor-pointer"
                          disabled={busy}
                          onClick={() => quickMove(product.id, key, 1)}
                          title="Aumentar estoque"
                        >
                          +
                        </button>
                        <button
                          className="ml-1 rounded px-1.5 py-0.5 text-[10px] font-semibold text-rose-400/90 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer transition-colors whitespace-nowrap"
                          onClick={() => openMove(product.id, key, 'entrada')}
                          title="Lançar movimento detalhado"
                        >
                          lançar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle title="Últimos movimentos" subtitle="entradas e saídas reais" />
        {movements.loading && !movements.data ? (
          <Spinner />
        ) : (
          <Table head={['Data', 'Tipo', 'Produto', 'Variação', 'Qtd', 'Saldo', 'Motivo', 'Responsável']} empty={(movements.data?.movements || []).length === 0}>
            {(movements.data?.movements || []).map((movement: any) => (
              <tr key={movement.id} className="hover:bg-white/[0.02]">
                <Td className="text-xs text-stone-500">{formatDate(movement.at)}</Td>
                <Td>
                  <Badge tone={movement.type === 'entrada' ? 'good' : 'warn'}>
                    {movement.type === 'entrada' ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                    {movement.type}
                  </Badge>
                </Td>
                <Td className="text-xs text-stone-300">{movement.productName}</Td>
                <Td className="text-[11px] text-stone-400">{movement.variantKey}</Td>
                <Td className="text-xs text-stone-200">{movement.quantity}</Td>
                <Td className="text-xs text-stone-400">{movement.balanceAfter}</Td>
                <Td className="text-[11px] text-stone-500">{movement.reason}{movement.note ? ` · ${movement.note}` : ''}</Td>
                <Td className="text-[11px] text-stone-500">{movement.actor}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Registrar movimento de estoque"
        subtitle="entradas e saídas disparam notificação no Telegram"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="primary" loading={busy} onClick={submitMove} disabled={!form.productId || !form.variantKey}>Registrar</Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button size="sm" variant={form.type === 'entrada' ? 'success' : 'outline'} onClick={() => setForm({ ...form, type: 'entrada', reason: 'compra_fornecedor' })}>
              <ArrowDownLeft className="h-3.5 w-3.5" /> Entrada
            </Button>
            <Button size="sm" variant={form.type === 'saida' ? 'danger' : 'outline'} onClick={() => setForm({ ...form, type: 'saida', reason: 'ajuste_inventario' })}>
              <ArrowUpRight className="h-3.5 w-3.5" /> Saída
            </Button>
          </div>
          <Field label="Produto">
            <Select
              value={form.productId}
              onChange={(event) => {
                const product = products.find((entry: any) => entry.id === event.target.value);
                setForm({ ...form, productId: event.target.value, variantKey: Object.keys(product?.inventory || {})[0] || '' });
              }}
            >
              {products.map((product: any) => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Variação">
            <Select value={form.variantKey} onChange={(event) => setForm({ ...form, variantKey: event.target.value })}>
              {variants.map((variant) => (
                <option key={variant} value={variant}>{variant}</option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantidade">
              <Input type="number" min={1} value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} />
            </Field>
            <Field label="Motivo">
              <Select value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })}>
                {(form.type === 'entrada' ? REASONS_IN : REASONS_OUT).map((reason) => (
                  <option key={reason.value} value={reason.value}>{reason.label}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Observação (opcional)">
            <Input value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Catálogo
 * ------------------------------------------------------------------ */

const EMPTY_PRODUCT = {
  name: '',
  sku: '',
  category: 'Vestidos',
  price: '',
  compareAtPrice: '',
  costPrice: '',
  description: '',
  fabric: '',
  care: '',
  images: [] as string[],
  sizes: 'PP, P, M, G, GG',
  colors: 'Rosa (#F7B7CA), Marfim (#FFFBF5)',
  initialStock: '0',
  isNewArrival: false,
  isFeatured: false
};

function parseColors(raw: string) {
  return raw
    .split(',')
    .map((entry) => {
      const match = entry.match(/^\s*(.+?)\s*\((#?[0-9a-fA-F]{3,8})\)\s*$/);
      if (match) return { name: match[1], hex: match[2].startsWith('#') ? match[2] : `#${match[2]}` };
      return { name: entry.trim(), hex: '#DC7898' };
    })
    .filter((color) => color.name);
}

export function CatalogTab({ liveKey }: { liveKey: number }) {
  const { data, loading, reload } = useLoad(() => adminApi.products(), [liveKey]);
  const { busy, run } = useAction();
  const toast = useToast();
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<any>(EMPTY_PRODUCT);
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');

  const products = data?.products || [];

  const filteredProducts = products.filter((p) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term) || p.category.toLowerCase().includes(term);
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_PRODUCT);
    setOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setForm({
      name: product.name,
      sku: product.sku,
      category: product.category,
      price: String(product.price),
      compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : '',
      costPrice: String(product.costPrice),
      description: product.description,
      fabric: product.fabric,
      care: product.care,
      images: Array.isArray(product.images) ? [...product.images] : (product.images ? [product.images] : []),
      sizes: product.sizes.join(', '),
      colors: product.colors.map((color) => `${color.name} (${color.hex})`).join(', '),
      initialStock: '0',
      isNewArrival: Boolean(product.isNewArrival),
      isFeatured: Boolean(product.isFeatured)
    });
    setOpen(true);
  }

  async function save() {
    if (!form.name || form.name.trim().length < 2) {
      toast.push('Por favor, informe o Nome da Peça (mínimo 2 letras).', 'error');
      return;
    }
    const numPrice = Number(form.price);
    if (isNaN(numPrice) || numPrice <= 0) {
      toast.push('Por favor, informe o Preço de Venda da peça.', 'error');
      return;
    }

    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      category: form.category.trim() || 'Vestidos',
      price: numPrice,
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
      costPrice: Number(form.costPrice || 0),
      description: form.description.trim(),
      fabric: form.fabric.trim(),
      care: form.care.trim(),
      images: Array.isArray(form.images) ? form.images.filter(Boolean) : (form.images ? [form.images] : []),
      sizes: (form.sizes || 'PP, P, M, G, GG').split(',').map((size: string) => size.trim()).filter(Boolean),
      colors: parseColors(form.colors || 'Único'),
      initialStock: Math.max(0, Number(form.initialStock || 0)),
      isNewArrival: Boolean(form.isNewArrival),
      isFeatured: Boolean(form.isFeatured)
    };

    const result = await run(async () => {
      if (editing) {
        await adminApi.updateProduct(editing.id, payload);
      } else {
        await adminApi.createProduct(payload);
      }
      notifyStoreChange();
      setOpen(false);
      await reload();
    });
    toast.push(result.ok ? (editing ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso no catálogo!') : (result as any).error, result.ok ? 'success' : 'error');
  }

  async function remove(product: Product) {
    if (!window.confirm(`Remover "${product.name}" do catálogo? Esta ação não afeta pedidos já registrados.`)) return;
    const result = await run(async () => {
      await adminApi.deleteProduct(product.id); notifyStoreChange();
      await reload();
    });
    toast.push(result.ok ? 'Produto removido.' : (result as any).error, result.ok ? 'success' : 'error');
  }

  const previewPhotos = (Array.isArray(form.images) ? form.images : (form.images ? [form.images] : [])).filter((u: any) => typeof u === 'string' && u.trim().length > 0);
  const previewColors = parseColors(form.colors || '');
  const previewSizes = form.sizes ? form.sizes.split(',').map((s: string) => s.trim()).filter(Boolean) : [];

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--admin-text-main)]">Catálogo de Produtos</h2>
            <p className="mt-0.5 text-xs text-[var(--admin-text-muted)]">
              {products.length} produto(s) cadastrados · Fotos de alta definição e estoque real
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Alternador de Visualização Grid / Tabela */}
            <div className="flex items-center rounded-xl border border-[var(--admin-border)] bg-[var(--admin-input-bg)] p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                  viewMode === 'grid'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)]'
                )}
                title="Visualização em Cards Modernos"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                  viewMode === 'table'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)]'
                )}
                title="Visualização em Tabela Compacta"
              >
                <List className="h-3.5 w-3.5" />
                <span>Tabela</span>
              </button>
            </div>

            <Button size="sm" variant="primary" icon={<Plus className="h-3.5 w-3.5" />} onClick={openCreate}>
              Novo produto
            </Button>
          </div>
        </div>

        {loading && products.length === 0 ? (
          <Spinner />
        ) : products.length === 0 ? (
          <EmptyState title="Catálogo vazio" description="Cadastre o primeiro produto para abrir a loja." />
        ) : viewMode === 'grid' ? (
          /* Cards Modernos com Imagens */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => {
              const margin = product.price > 0 ? Math.round(((product.price - (product.costPrice || 0)) / product.price) * 100) : 0;
              return (
                <div
                  key={product.id}
                  className="group relative flex flex-col rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card-bg)] shadow-xs hover:shadow-lg hover:border-rose-500/40 transition-all duration-300 overflow-hidden"
                >
                  {/* Foto Principal */}
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/5 dark:bg-black/20">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-stone-400">
                        <ImageIcon className="h-10 w-10 stroke-1" />
                      </div>
                    )}

                    {/* Badges de Destaque / Novidade / Categoria */}
                    <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
                      <span className="rounded-lg bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-semibold text-white tracking-wide border border-white/10 uppercase">
                        {product.category}
                      </span>
                      {product.isNewArrival && (
                        <span className="rounded-lg bg-rose-500/90 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                          NOVIDADE
                        </span>
                      )}
                    </div>

                    <div className="absolute top-2.5 right-2.5 z-10">
                      <Badge tone={(product.totalStock ?? 0) === 0 ? 'bad' : (product.totalStock ?? 0) <= 3 ? 'warn' : 'good'}>
                        {product.totalStock ?? 0} un.
                      </Badge>
                    </div>

                    {/* Ações Rápidas no Hover */}
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <span className="text-[11px] font-medium text-white/90 truncate">
                        {product.colors?.length || 0} cores • {product.sizes?.length || 0} tam.
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(product)}
                          className="rounded-lg bg-white/20 backdrop-blur-md p-1.5 text-white hover:bg-white hover:text-black transition-colors"
                          title="Editar produto"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(product)}
                          className="rounded-lg bg-red-600/80 backdrop-blur-md p-1.5 text-white hover:bg-red-500 transition-colors"
                          title="Remover produto"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Informações do Produto */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-xs font-mono-admin text-[var(--admin-text-subtle)] uppercase tracking-wider">{product.sku}</p>
                        {product.reviewsCount > 0 && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-500">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {product.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm text-[var(--admin-text-main)] mt-0.5 line-clamp-1" title={product.name}>
                        {product.name}
                      </h3>
                    </div>

                    {/* Cores */}
                    {product.colors && product.colors.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        {product.colors.slice(0, 5).map((c: any, i: number) => (
                          <span
                            key={i}
                            title={c.name}
                            className="h-3.5 w-3.5 rounded-full border border-black/20 shadow-xs"
                            style={{ backgroundColor: c.hex || '#ccc' }}
                          />
                        ))}
                        {product.colors.length > 5 && (
                          <span className="text-[10px] text-[var(--admin-text-subtle)] font-medium">+{product.colors.length - 5}</span>
                        )}
                      </div>
                    )}

                    {/* Preços e Margem */}
                    <div className="pt-2 border-t border-[var(--admin-border)] flex items-end justify-between">
                      <div>
                        <p className="text-base font-bold text-rose-500 dark:text-rose-400 tracking-tight">
                          {formatBRL(product.price)}
                        </p>
                        {product.compareAtPrice ? (
                          <p className="text-[11px] text-[var(--admin-text-subtle)] line-through">
                            {formatBRL(product.compareAtPrice)}
                          </p>
                        ) : (
                          <p className="text-[11px] text-[var(--admin-text-subtle)]">
                            Custo: {formatBRL(product.costPrice)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="inline-block rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 text-[10px] font-semibold">
                          Margem {margin}%
                        </span>
                      </div>
                    </div>

                    {/* Botões de Ação Diretos */}
                    <div className="pt-2 flex items-center gap-1.5 border-t border-[var(--admin-border)]">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        icon={<Pencil className="h-3 w-3" />}
                        onClick={() => openEdit(product)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300"
                        icon={<Trash2 className="h-3 w-3" />}
                        onClick={() => remove(product)}
                        title="Remover produto da loja"
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Tabela Compacta */
          <Table head={['Produto', 'Categoria', 'Preço', 'Custo', 'Estoque', 'Avaliações', '']} empty={false}>
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-white/[0.02]">
                <Td>
                  <div className="flex items-center gap-2.5">
                    {product.images?.[0] ? (
                      <img referrerPolicy="no-referrer" src={product.images[0]} alt="" className="h-10 w-10 rounded-xl object-cover border border-[var(--admin-border)] shadow-xs" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5"><ImageIcon className="h-4 w-4 text-stone-600" /></div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-[var(--admin-text-main)]">{product.name}</p>
                      <p className="text-[11px] text-[var(--admin-text-subtle)]">{product.sku}</p>
                    </div>
                  </div>
                </Td>
                <Td className="text-xs text-[var(--admin-text-muted)]">{product.category}</Td>
                <Td className="text-sm font-semibold text-[var(--admin-text-main)]">{formatBRL(product.price)}</Td>
                <Td className="text-xs text-[var(--admin-text-muted)]">{formatBRL(product.costPrice)}</Td>
                <Td>
                  <Badge tone={(product.totalStock ?? 0) === 0 ? 'bad' : (product.totalStock ?? 0) <= 3 ? 'warn' : 'good'}>
                    {product.totalStock ?? 0} un.
                  </Badge>
                </Td>
                <Td className="text-xs text-[var(--admin-text-muted)]">
                  {product.reviewsCount > 0 ? (
                    <span className="flex items-center gap-1 text-amber-500 font-semibold">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {product.rating.toFixed(1)} ({product.reviewsCount})
                    </span>
                  ) : '—'}
                </Td>
                <Td>
                  <div className="flex gap-1">
                    <button className="rounded-lg p-1.5 text-[var(--admin-text-muted)] hover:bg-[var(--admin-item-hover)] hover:text-[var(--admin-text-main)]" onClick={() => openEdit(product)}><Pencil className="h-3.5 w-3.5" /></button>
                    <button className="rounded-lg p-1.5 text-[var(--admin-text-muted)] hover:bg-red-500/10 hover:text-red-500" onClick={() => remove(product)}><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Editar produto' : 'Novo produto'}
        subtitle="Configure preços, galeria de fotos, variantes e visualize o preview ao vivo para os leads"
        wide
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="primary" loading={busy} onClick={save} >Salvar produto</Button>
          </>
        }
      >
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Formulário (7 colunas) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card-bg)] p-4 space-y-3">
              <p className="text-xs font-semibold text-rose-500 dark:text-rose-400 uppercase tracking-wider">Identificação</p>
              <Field label="Nome da Peça"><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ex: Vestido Longo Plissado Romantique" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="SKU (opcional)"><Input value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} placeholder="FDS-VES-001" /></Field>
                <Field label="Categoria"><Input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Ex: Vestidos" /></Field>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card-bg)] p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--admin-border)] pb-2.5">
                <p className="text-xs font-semibold text-rose-500 dark:text-rose-400 uppercase tracking-wider">Preços & Descontos Promocionais</p>
                <span className="text-[11px] text-[var(--admin-text-subtle)] font-medium">Controle Inteligente</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Preço de Venda Final (R$)" hint="Valor cobrado da cliente no checkout">
                  <Input
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(event) => {
                      const newPrice = event.target.value;
                      setForm({ ...form, price: newPrice });
                    }}
                    placeholder="196.72"
                  />
                </Field>

                <Field label="Custo de Aquisição (R$)" hint="Para cálculo real de margem de lucro">
                  <Input
                    type="number"
                    step="0.01"
                    value={form.costPrice}
                    onChange={(event) => setForm({ ...form, costPrice: event.target.value })}
                    placeholder="85.00"
                  />
                </Field>
              </div>

              {/* Seção Inteligente de Desconto Promocional */}
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="enable-discount"
                      checked={Boolean(form.compareAtPrice && Number(form.compareAtPrice) > Number(form.price || 0))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const base = Number(form.price || 100);
                          const original = (base * 1.25).toFixed(2);
                          setForm({ ...form, compareAtPrice: original });
                        } else {
                          setForm({ ...form, compareAtPrice: '' });
                        }
                      }}
                      className="rounded border-rose-400 text-rose-600 focus:ring-rose-500 h-4 w-4 cursor-pointer"
                    />
                    <label htmlFor="enable-discount" className="text-xs font-bold text-[var(--admin-text-main)] cursor-pointer">
                      Ativar Desconto Promocional nesta Peça (% OFF)
                    </label>
                  </div>
                  {form.compareAtPrice && Number(form.compareAtPrice) > Number(form.price || 0) && (
                    <span className="rounded-full bg-white dark:bg-stone-900 border border-rose-300 px-2.5 py-0.5 text-[10px] font-bold text-rose-600 shadow-2xs">
                      {Math.round(((Number(form.compareAtPrice) - Number(form.price)) / Number(form.compareAtPrice)) * 100)}% OFF Ativo
                    </span>
                  )}
                </div>

                {form.compareAtPrice && Number(form.compareAtPrice) > Number(form.price || 0) ? (
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Preço Original De (R$)" hint="Preço que aparecerá riscado">
                        <Input
                          type="number"
                          step="0.01"
                          value={form.compareAtPrice}
                          onChange={(e) => {
                            const newCompare = e.target.value;
                            setForm({ ...form, compareAtPrice: newCompare });
                          }}
                          placeholder="239.90"
                        />
                      </Field>

                      <Field label="Ajustar por Porcentagem (%)" hint="Calcula o preço final automaticamente">
                        <Input
                          type="number"
                          min={1}
                          max={99}
                          placeholder="Ex: 18"
                          onChange={(e) => {
                            const pct = Number(e.target.value);
                            const orig = Number(form.compareAtPrice || 0);
                            if (pct > 0 && pct < 100 && orig > 0) {
                              const calculatedPrice = (orig * (1 - pct / 100)).toFixed(2);
                              setForm({ ...form, price: calculatedPrice });
                            }
                          }}
                        />
                      </Field>
                    </div>

                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 flex items-center justify-between">
                      <span>Resultado na Loja: De <strong>R$ {Number(form.compareAtPrice).toFixed(2)}</strong> por <strong>R$ {Number(form.price).toFixed(2)}</strong></span>
                      <span className="font-bold">Economia: R$ {(Number(form.compareAtPrice) - Number(form.price)).toFixed(2)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-[var(--admin-text-subtle)]">
                    Marque a caixa acima para configurar preço original "De" e exibir a badge de desconto "% OFF" para as clientes.
                  </p>
                )}
              </div>

              {!editing ? <Field label="Estoque inicial por variação"><Input type="number" min={0} value={form.initialStock} onChange={(event) => setForm({ ...form, initialStock: event.target.value })} /></Field> : null}
            </div>

            <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card-bg)] p-4 space-y-3">
              <p className="text-xs font-semibold text-rose-500 dark:text-rose-400 uppercase tracking-wider">Fotos do Produto</p>
              <ImageUploader
                label="Anexar Fotos (Arquivo, Arrastar, Print Ctrl+V ou Link)"
                hint="Anexe fotos em alta resolução para exibição aos leads"
                value=""
                onChange={(val) => {
                  if (!val) return;
                  const current = Array.isArray(form.images) ? form.images : [];
                  setForm({ ...form, images: [...current, val] });
                  toast.push('Foto anexada!', 'success');
                }}
              />

              {previewPhotos.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <p className="text-[11px] font-medium text-[var(--admin-text-subtle)]">Fotos da Galeria ({previewPhotos.length}):</p>
                  <div className="flex gap-2 flex-wrap">
                    {previewPhotos.map((imgUrl: string, idx: number) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-[var(--admin-border)] bg-black/20 shadow-xs">
                        <img referrerPolicy="no-referrer" src={imgUrl} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).src = SAFE_IMG_PLACEHOLDER; }} className="h-16 w-16 object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            const list = previewPhotos.filter((_: string, i: number) => i !== idx);
                            setForm({ ...form, images: list });
                          }}
                          className="absolute top-1 right-1 rounded-full bg-red-600 text-white p-1 hover:bg-red-500 shadow-md transition-colors"
                          title="Remover foto"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card-bg)] p-4 space-y-3">
              <p className="text-xs font-semibold text-rose-500 dark:text-rose-400 uppercase tracking-wider">Variações & Detalhes</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tamanhos (separados por vírgula)"><Input value={form.sizes} onChange={(event) => setForm({ ...form, sizes: event.target.value })} placeholder="PP, P, M, G, GG" /></Field>
                <Field label="Cores (Nome e Hex)"><Input value={form.colors} onChange={(event) => setForm({ ...form, colors: event.target.value })} placeholder="Rosa (#F9D5E5), Champagne (#F7E7CE)" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tecido"><Input value={form.fabric} onChange={(event) => setForm({ ...form, fabric: event.target.value })} placeholder="Chiffon de Seda Toque Nobre" /></Field>
                <Field label="Cuidados"><Input value={form.care} onChange={(event) => setForm({ ...form, care: event.target.value })} placeholder="Lavagem delicada à mão" /></Field>
              </div>
              <Field label="Descrição"><Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Descreva os diferenciais da peça para a cliente..." /></Field>
              <div className="flex items-center gap-4 pt-1">
                <Toggle checked={form.isNewArrival} onChange={(value) => setForm({ ...form, isNewArrival: value })} label="Marcar como Novidade" />
                <Toggle checked={form.isFeatured} onChange={(value) => setForm({ ...form, isFeatured: value })} label="Destacar na Home" />
              </div>
            </div>
          </div>

          {/* Coluna da Direita: Preview em Tempo Real da Visão do Lead (5 colunas) */}
          <div className="lg:col-span-5">
            <div className="sticky top-2 rounded-2xl border border-rose-500/30 bg-gradient-to-b from-[#15151c] to-[#0d0d12] p-4 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
                <span className="flex items-center gap-1.5 text-xs font-bold text-rose-400 uppercase tracking-wider">
                  <Eye className="h-4 w-4" />
                  Preview ao Vivo do Lead
                </span>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-semibold px-2 py-0.5">
                  Sincronizado
                </span>
              </div>

              {/* Card da Loja */}
              <div className="rounded-2xl border border-white/10 bg-white dark:bg-stone-900 shadow-md overflow-hidden text-stone-900 dark:text-stone-100">
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-stone-100 dark:bg-stone-800">
                  {previewPhotos[0] ? (
                    <img referrerPolicy="no-referrer" src={previewPhotos[0]} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).src = SAFE_IMG_PLACEHOLDER; }} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-stone-400">
                      <ImageIcon className="h-12 w-12 stroke-1" />
                    </div>
                  )}

                  <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1 z-10">
                    {/* Badge % OFF no estilo pílula (Imagem 2) */}
                    {form.compareAtPrice && Number(form.compareAtPrice) > Number(form.price || 0) ? (
                      <div className="px-2.5 py-0.5 rounded-full bg-white text-[#DC7898] shadow-xs flex items-center justify-center font-bold text-[9px] leading-tight border border-rose-200 uppercase tracking-wider">
                        <span>{Math.round(((Number(form.compareAtPrice) - Number(form.price)) / Number(form.compareAtPrice)) * 100)}% OFF</span>
                      </div>
                    ) : null}

                    {form.isNewArrival && (
                      <div className="px-2 py-0.5 rounded-full bg-[#E07A9A] text-white text-[8.5px] font-bold tracking-wider uppercase shadow-xs flex items-center gap-1">
                        <span>NOVO</span>
                      </div>
                    )}
                  </div>

                  {/* Botão de Coração Favoritos (Imagem 1) */}
                  <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/95 text-[#DC7898] shadow-xs flex items-center justify-center border border-rose-100 z-10">
                    <Heart className="w-3.5 h-3.5 fill-[#DC7898]" />
                  </div>
                </div>

                <div className="p-3.5 space-y-2">
                  <p className="font-semibold text-sm line-clamp-1 text-stone-900 dark:text-stone-100">
                    {form.name || 'Nome do Vestido / Peça'}
                  </p>

                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-bold text-rose-600 dark:text-rose-400">
                      {form.price ? formatBRL(Number(form.price)) : 'R$ 0,00'}
                    </span>
                    {form.compareAtPrice ? (
                      <span className="text-xs text-stone-400 line-through">
                        {formatBRL(Number(form.compareAtPrice))}
                      </span>
                    ) : null}
                  </div>

                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    em até 3x de {form.price ? formatBRL(Number(form.price) / 3) : 'R$ 0,00'} sem juros
                  </p>

                  {/* Cores */}
                  {previewColors.length > 0 && (
                    <div className="flex items-center gap-1.5 pt-1">
                      {previewColors.map((c: any, i: number) => (
                        <span
                          key={i}
                          title={c.name}
                          className="h-3 w-3 rounded-full border border-black/20 shadow-xs"
                          style={{ backgroundColor: c.hex }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Tamanhos */}
                  {previewSizes.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap pt-1">
                      {previewSizes.map((s: string, i: number) => (
                        <span key={i} className="rounded border border-stone-200 dark:border-stone-700 px-1.5 py-0.5 text-[9px] font-medium text-stone-600 dark:text-stone-300">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="button"
                      disabled
                      className="w-full rounded-xl bg-rose-500 py-2 text-center text-xs font-semibold text-white shadow-sm"
                    >
                      Comprar Agora
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Cupons
 * ------------------------------------------------------------------ */

export function CouponsTab({ liveKey }: { liveKey: number }) {
  const { data, loading, reload } = useLoad(() => adminApi.coupons(), [liveKey]);
  const { busy, run } = useAction();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    minPurchase: '',
    maxUses: '',
    validUntil: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
    description: ''
  });

  async function create() {
    const result = await run(async () => {
      await adminApi.createCoupon({
        code: form.code.toUpperCase(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minPurchase: form.minPurchase ? Number(form.minPurchase) : 0,
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        validUntil: form.validUntil,
        description: form.description
      });
      setOpen(false);
      setForm({ ...form, code: '', discountValue: '', minPurchase: '', maxUses: '', description: '' });
      await reload();
    });
    toast.push(result.ok ? 'Cupom criado.' : (result as any).error, result.ok ? 'success' : 'error');
  }

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle
          title="Cupons"
          subtitle="validação real de data, valor mínimo, escopo e limite de uso"
          action={<Button size="sm" variant="primary" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setOpen(true)}>Novo cupom</Button>}
        />
        {loading && !data ? (
          <Spinner />
        ) : (
          <Table head={['Código', 'Desconto', 'Mínimo', 'Usos', 'Validade', 'Status', '']} empty={(data?.coupons || []).length === 0}>
            {(data?.coupons || []).map((coupon) => (
              <tr key={coupon.id} className="hover:bg-white/[0.02]">
                <Td className="font-mono-admin text-xs text-rose-300">{coupon.code}</Td>
                <Td className="text-sm text-stone-200">{coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : formatBRL(coupon.discountValue)}</Td>
                <Td className="text-xs text-stone-400">{formatBRL(coupon.minPurchase)}</Td>
                <Td className="text-xs text-stone-400">{coupon.usedCount}{coupon.maxUses ? `/${coupon.maxUses}` : ''}</Td>
                <Td className="text-xs text-stone-400">{coupon.validUntil}</Td>
                <Td><Badge tone={coupon.isActive ? 'good' : 'neutral'}>{coupon.isActive ? 'ativo' : 'inativo'}</Badge></Td>
                <Td>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" loading={busy} onClick={async () => { await adminApi.toggleCoupon(coupon.id); await reload(); }}>Alternar</Button>
                    <button className="rounded-lg p-1.5 text-stone-400 hover:bg-red-500/10 hover:text-red-300" onClick={async () => { await adminApi.deleteCoupon(coupon.id); await reload(); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Novo cupom de desconto"
        subtitle="crie cupons inteligentes com validação automática de regras e limite de usos"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="primary" loading={busy} onClick={create} disabled={!form.code || !form.discountValue}>Criar cupom</Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Exemplos Prontos Interativos */}
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
            <p className="text-[11px] font-semibold text-rose-300 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              Exemplos Prontos · Clique para Preencher:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                {
                  code: 'BEMVINDA10',
                  label: 'Primeira Compra 10%',
                  discountType: 'percentage',
                  discountValue: '10',
                  minPurchase: '150',
                  maxUses: '500',
                  description: '10% de desconto de boas-vindas para novos clientes'
                },
                {
                  code: 'FRETEGRATIS',
                  label: 'Frete Grátis (R$ 25)',
                  discountType: 'fixed',
                  discountValue: '25',
                  minPurchase: '199',
                  maxUses: '200',
                  description: 'Abatimento do frete para compras acima de R$ 199'
                },
                {
                  code: 'VIP50',
                  label: 'Cliente VIP (R$ 50 OFF)',
                  discountType: 'fixed',
                  discountValue: '50',
                  minPurchase: '300',
                  maxUses: '100',
                  description: 'Desconto especial de R$ 50 para pedidos VIP'
                },
                {
                  code: 'OFF20',
                  label: '20% OFF Especial',
                  discountType: 'percentage',
                  discountValue: '20',
                  minPurchase: '250',
                  maxUses: '150',
                  description: '20% de desconto em vestidos e peças selecionadas'
                }
              ].map((preset) => (
                <button
                  key={preset.code}
                  type="button"
                  onClick={() => {
                    const thirtyDays = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
                    setForm({
                      code: preset.code,
                      discountType: preset.discountType,
                      discountValue: preset.discountValue,
                      minPurchase: preset.minPurchase,
                      maxUses: preset.maxUses,
                      validUntil: thirtyDays,
                      description: preset.description
                    });
                  }}
                  className={cn(
                    'px-2 py-1 rounded-lg text-xs font-mono font-medium border transition-all cursor-pointer',
                    form.code === preset.code
                      ? 'bg-rose-500 text-white border-rose-400 font-bold'
                      : 'bg-black/40 text-stone-300 border-white/10 hover:border-rose-400/50 hover:text-white'
                  )}
                >
                  {preset.code} · <span className="text-[10px] opacity-80">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Ticket Preview do Cupom no Checkout */}
          <div className="rounded-xl border border-dashed border-rose-500/30 bg-black/40 p-3">
            <div className="flex items-center justify-between text-[10px] text-stone-400 mb-2 border-b border-white/5 pb-1">
              <span className="flex items-center gap-1 font-semibold text-rose-300">
                <Tag className="w-3 h-3 text-rose-400" />
                Preview do Cupom no Checkout
              </span>
              <span className="font-mono text-emerald-400 text-[10px]">Visão do Lead</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white font-mono font-bold text-xs shadow-md">
                  {form.discountType === 'percentage' ? (form.discountValue || '0') + '%' : 'R$'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-stone-100">
                      {form.code || 'CODIGO'}
                    </span>
                    <span className="rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.2 text-[10px] font-semibold">
                      {form.discountType === 'percentage'
                        ? (form.discountValue || '0') + '% OFF'
                        : 'R$ ' + (form.discountValue || '0') + ',00 OFF'}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400">
                    {form.description || 'Desconto aplicado no carrinho'}
                  </p>
                </div>
              </div>
              <div className="text-right text-[10px] text-stone-400 font-mono">
                <div>Mínimo: R$ {form.minPurchase || '0'},00</div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Código"><Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase().replace(/\s+/g, '') })} placeholder="BEMVINDA10" /></Field>
            <Field label="Tipo">
              <Select value={form.discountType} onChange={(event) => setForm({ ...form, discountType: event.target.value })}>
                <option value="percentage">Percentual (%)</option>
                <option value="fixed">Valor fixo (R$)</option>
              </Select>
            </Field>
            <Field label={form.discountType === 'percentage' ? 'Desconto (%)' : 'Desconto (R$)'}>
              <Input type="number" value={form.discountValue} onChange={(event) => setForm({ ...form, discountValue: event.target.value })} placeholder="10" />
            </Field>
            <Field label="Compra mínima (R$)"><Input type="number" value={form.minPurchase} onChange={(event) => setForm({ ...form, minPurchase: event.target.value })} placeholder="150" /></Field>
            <Field label="Limite de usos"><Input type="number" value={form.maxUses} onChange={(event) => setForm({ ...form, maxUses: event.target.value })} placeholder="500" /></Field>
            <Field label="Válido até"><Input type="date" value={form.validUntil} onChange={(event) => setForm({ ...form, validUntil: event.target.value })} /></Field>
            <div className="sm:col-span-2"><Field label="Descrição"><Input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Ex: 10% de desconto para novos clientes" /></Field></div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Banners da Vitrine com Edição Avançada e Preview em Tempo Real */
/* ------------------------------------------------------------------ */

export function BannersTab({ liveKey }: { liveKey: number }) {
  const { data, loading, reload } = useLoad(() => adminApi.banners(), [liveKey]);
  const { busy, run } = useAction();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  const EMPTY_BANNER = {
    badge: 'NOVA ESTAÇÃO',
    title: 'Nova Coleção\nPrimavera',
    subtitle: 'Peças delicadas para cada momento seu. Tecidos nobres, estampas autorais e caimento feito para valorizar sua feminilidade.',
    ctaText: 'VER COLEÇÃO',
    categoryFilter: 'Vestidos',
    imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1800&q=80',
    alignment: 'left' as 'left' | 'center' | 'right',
    active: true
  };

  const [form, setForm] = useState<any>(EMPTY_BANNER);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_BANNER);
    setOpen(true);
  }

  function openEdit(banner: any) {
    setEditing(banner);
    setForm({
      badge: banner.badge || '',
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      ctaText: banner.ctaText || 'VER COLEÇÃO',
      categoryFilter: banner.categoryFilter || 'Vestidos',
      imageUrl: banner.imageUrl || '',
      alignment: banner.alignment || 'left',
      active: banner.active !== false
    });
    setOpen(true);
  }

  async function saveBanner() {
    if (!form.title.trim()) {
      toast.push('Por favor, informe o título do banner.', 'error');
      return;
    }
    const payload = {
      badge: form.badge.trim(),
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      ctaText: form.ctaText.trim() || 'VER COLEÇÃO',
      categoryFilter: form.categoryFilter.trim() || 'Vestidos',
      imageUrl: form.imageUrl.trim(),
      alignment: form.alignment || 'left',
      active: Boolean(form.active)
    };

    const result = await run(async () => {
      if (editing) {
        await adminApi.updateBanner(editing.id, payload);
      } else {
        await adminApi.createBanner(payload);
      }
      notifyStoreChange();
      setOpen(false);
      await reload();
    });
    toast.push(
      result.ok
        ? (editing ? 'Banner atualizado com sucesso!' : 'Novo banner publicado na vitrine!')
        : (result as any).error,
      result.ok ? 'success' : 'error'
    );
  }

  async function removeBanner(banner: any) {
    if (!window.confirm(`Deseja excluir o banner "${banner.title}" da vitrine?`)) return;
    const result = await run(async () => {
      await adminApi.deleteBanner(banner.id);
      notifyStoreChange();
      await reload();
    });
    toast.push(result.ok ? 'Banner removido.' : (result as any).error, result.ok ? 'success' : 'error');
  }

  const banners = data?.banners || [];

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle
          title="Banners da Vitrine"
          subtitle="Carrossel nobre do topo da loja — personalize fotos, textos e botões com preview em tempo real"
          action={
            <Button size="sm" variant="primary" icon={<Plus className="h-3.5 w-3.5" />} onClick={openCreate}>
              Novo banner
            </Button>
          }
        />

        {loading && banners.length === 0 ? (
          <Spinner />
        ) : banners.length === 0 ? (
          <EmptyState
            title="Nenhum banner cadastrado"
            description="Cadastre banners para dar vida ao topo da sua loja com imagens e títulos marcantes."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {banners.map((banner) => (
              <div
                key={banner.id}
                className="group relative overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card-bg)] shadow-sm hover:border-rose-500/40 transition-all"
              >
                {/* Imagem do Banner */}
                <div className="relative h-44 w-full overflow-hidden bg-stone-900">
                  {banner.imageUrl ? (
                    <img
                      referrerPolicy="no-referrer"
                      src={banner.imageUrl}
                      alt={banner.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-stone-500">
                      <ImageIcon className="h-10 w-10 stroke-1" />
                    </div>
                  )}
                  {/* Badge de Status */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                    <Badge tone={banner.active ? 'good' : 'neutral'}>
                      {banner.active ? '● No ar na loja' : '○ Pausado'}
                    </Badge>
                    {banner.badge ? (
                      <span className="rounded-full bg-black/60 backdrop-blur border border-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-rose-300">
                        {banner.badge}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Conteúdo & Ações */}
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--admin-text-main)] line-clamp-1">
                        {banner.title}
                      </h3>
                      {banner.subtitle && (
                        <p className="text-xs text-[var(--admin-text-muted)] line-clamp-2 mt-0.5 font-light">
                          {banner.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[var(--admin-border)] flex items-center justify-between">
                    <span className="text-[11px] text-[var(--admin-text-subtle)] font-mono">
                      CTA: {banner.ctaText || 'VER COLEÇÃO'} · {banner.categoryFilter || 'Vestidos'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        icon={<Pencil className="h-3 w-3 text-rose-400" />}
                        onClick={() => openEdit(banner)}
                        title="Editar textos, foto e configurações deste banner"
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          await adminApi.updateBanner(banner.id, { active: !banner.active });
                          notifyStoreChange();
                          await reload();
                          toast.push(banner.active ? 'Banner pausado.' : 'Banner ativado!', 'success');
                        }}
                        title={banner.active ? 'Pausar exibição' : 'Ativar na loja'}
                      >
                        {banner.active ? 'Pausar' : 'Ativar'}
                      </Button>
                      <button
                        type="button"
                        className="rounded-lg p-2 text-stone-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                        onClick={() => removeBanner(banner)}
                        title="Excluir este banner"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal Inteligente de Edição / Criação com Preview ao Vivo */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Editar Banner do Topo' : 'Novo Banner para a Vitrine'}
        subtitle="Configure a imagem, frases de destaque, botão e visualize exatamente como o lead verá no site em tempo real"
        wide
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="primary" loading={busy} onClick={saveBanner}>
              {editing ? 'Salvar Alterações no Banner' : 'Publicar Banner'}
            </Button>
          </>
        }
      >
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Formulário (6 colunas) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card-bg)] p-4 space-y-3">
              <p className="text-xs font-semibold text-rose-500 dark:text-rose-400 uppercase tracking-wider">
                Textos do Banner
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Selo Superior (Badge)" hint="Ex: NOVA COLEÇÃO, EDIÇÃO LIMITADA">
                  <Input
                    value={form.badge}
                    onChange={(e) => setForm({ ...form, badge: e.target.value })}
                    placeholder="NOVA COLEÇÃO"
                  />
                </Field>
                <Field label="Filtro de Categoria" hint="Ex: Vestidos, Conjuntos, Todos">
                  <Input
                    value={form.categoryFilter}
                    onChange={(e) => setForm({ ...form, categoryFilter: e.target.value })}
                    placeholder="Vestidos"
                  />
                </Field>
              </div>

              <Field label="Título Principal *" hint="Dica: use enter ou \\n para quebrar a linha">
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Nova Coleção\nPrimavera"
                />
              </Field>

              <Field label="Subtítulo Editorial">
                <Input
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  placeholder="Peças delicadas para cada momento seu. Tecidos nobres e caimento fluido."
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Texto do Botão (CTA)">
                  <Input
                    value={form.ctaText}
                    onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                    placeholder="VER COLEÇÃO"
                  />
                </Field>
                <Field label="Alinhamento do Texto">
                  <Select
                    value={form.alignment}
                    onChange={(e) => setForm({ ...form, alignment: e.target.value as any })}
                  >
                    <option value="left">Esquerda (Padrão)</option>
                    <option value="center">Centralizado</option>
                    <option value="right">Direita</option>
                  </Select>
                </Field>
              </div>

              <div className="pt-2">
                <Toggle
                  checked={form.active}
                  onChange={(val) => setForm({ ...form, active: val })}
                  label="Manter este banner ativo no carrossel da loja"
                />
              </div>
            </div>

            {/* Upload da Imagem do Banner */}
            <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card-bg)] p-4 space-y-3">
              <p className="text-xs font-semibold text-rose-500 dark:text-rose-400 uppercase tracking-wider">
                Imagem de Fundo do Banner
              </p>
              <ImageUploader
                label="Anexar Imagem do Banner"
                hint="Anexe fotos de alta resolução (recomendado 1800x600 px)"
                value={form.imageUrl}
                onChange={(val) => setForm({ ...form, imageUrl: val })}
              />

              {/* Sugestões de Fotos Nobres da Boutique */}
              <div className="pt-2 border-t border-[var(--admin-border)]">
                <p className="text-[11px] font-medium text-[var(--admin-text-subtle)] mb-2">
                  Sugestões da Coleção Flor de Seda (Clique para aplicar):
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Primavera Chiffon', url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1800&q=80' },
                    { label: 'Vestido Rosé Nobre', url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=1800&q=80' },
                    { label: 'Editorial Linho', url: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1800&q=80' }
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setForm({ ...form, imageUrl: preset.url })}
                      className="group relative rounded-xl overflow-hidden border border-[var(--admin-border)] hover:border-rose-400 p-1 text-left bg-black/20 transition-all"
                    >
                      <img
                        referrerPolicy="no-referrer"
                        src={preset.url}
                        alt=""
                        className="h-12 w-full object-cover rounded-lg group-hover:scale-105 transition-transform"
                      />
                      <p className="text-[10px] text-stone-300 font-medium truncate mt-1 text-center">
                        {preset.label}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Coluna da Direita: PREVIEW 100% REAL IDENTICO AO SITE DO LEAD (6 colunas) */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--admin-border)] pb-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-rose-400 uppercase tracking-wider">
                <Eye className="h-4 w-4" />
                Preview em Tempo Real (Visão do Lead)
              </span>

              {/* Alternador Desktop / Celular */}
              <div className="flex items-center rounded-lg border border-[var(--admin-border)] bg-[var(--admin-input-bg)] p-0.5">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={cn(
                    'flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
                    previewDevice === 'desktop' ? 'bg-rose-500 text-white font-semibold' : 'text-stone-400 hover:text-stone-200'
                  )}
                  title="Visão Desktop"
                >
                  <Monitor className="h-3 w-3" />
                  <span>Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={cn(
                    'flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
                    previewDevice === 'mobile' ? 'bg-rose-500 text-white font-semibold' : 'text-stone-400 hover:text-stone-200'
                  )}
                  title="Visão Celular"
                >
                  <Smartphone className="h-3 w-3" />
                  <span>Celular</span>
                </button>
              </div>
            </div>

            {/* MOCKUP DO BANNER DA HOME */}
            <div
              className={cn(
                'relative mx-auto rounded-2xl overflow-hidden border border-rose-300/40 shadow-xl transition-all bg-[#F6E5E8]',
                previewDevice === 'mobile' ? 'w-[320px] min-h-[360px]' : 'w-full min-h-[380px]'
              )}
            >
              {/* Imagem de Fundo com Degradê Idêntico à Home */}
              <div className="absolute inset-0 z-0">
                <img
                  referrerPolicy="no-referrer"
                  src={form.imageUrl || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1800&q=80'}
                  alt=""
                  className="w-full h-full object-cover object-right lg:object-center filter brightness-[0.96]"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#F7E7EA] via-[#F7E7EA]/85 to-transparent sm:via-[#F7E7EA]/75" />
              </div>

              {/* Conteúdo Dinâmico */}
              <div
                className={cn(
                  'relative z-10 flex flex-col justify-center h-full p-6',
                  form.alignment === 'center'
                    ? 'text-center items-center'
                    : form.alignment === 'right'
                      ? 'text-right items-end'
                      : 'text-left items-start'
                )}
              >
                {/* Badge com Coração */}
                {form.badge && (
                  <div className="inline-flex items-center gap-1.5 text-[#DC7898] text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase mb-2">
                    <Heart className="w-3 h-3 fill-[#DC7898]" />
                    <span>{form.badge}</span>
                  </div>
                )}

                {/* Título com Fonte Serifada Nobre */}
                <h2
                  className={cn(
                    'font-serif font-medium tracking-tight text-[#2D2427] leading-[1.15] mb-2 whitespace-pre-line',
                    previewDevice === 'mobile' ? 'text-xl' : 'text-3xl'
                  )}
                >
                  {form.title ? form.title.replace(/\\n/g, '\n') : 'Título do Banner'}
                </h2>

                {/* Subtítulo */}
                {form.subtitle && (
                  <p
                    className={cn(
                      'text-stone-700 font-light leading-relaxed mb-4 max-w-sm',
                      previewDevice === 'mobile' ? 'text-[11px] line-clamp-3' : 'text-xs'
                    )}
                  >
                    {form.subtitle}
                  </p>
                )}

                {/* Botão CTA Rosa */}
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#DC7898] text-white text-xs font-semibold tracking-wider uppercase shadow-md hover:bg-[#c96282] transition-colors">
                  <span>{form.ctaText || 'VER COLEÇÃO'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            <p className="text-[11px] text-stone-500 text-center font-mono pt-1">
              {previewDevice === 'mobile' ? 'Simulação Tela de Smartphone' : 'Simulação Desktop Vitrine'} · 100% idêntico à loja
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
