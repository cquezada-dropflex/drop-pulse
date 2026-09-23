"use client";

import { useId, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  rectSwappingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button, Icon, ImageTile, SegmentedControl, notifyUndo } from "@/components/df";
import { StickyActions } from "@/components/shell/sticky-actions";
import type { ImageOption } from "@/lib/types";
import { cn } from "@/lib/utils";

type View = "opciones" | "elegidas" | "descartadas";

function SortableTile({
  image,
  order,
  sortable,
  onSelect,
  onDiscard,
}: {
  image: ImageOption;
  order?: number;
  sortable: boolean;
  onSelect: () => void;
  onDiscard: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
    disabled: !sortable,
  });
  const canDiscard = image.status === "idle";
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("relative list-none", isDragging && "z-sticky scale-105 shadow-md")}
    >
      <ImageTile
        src={image.src}
        alt={image.alt}
        state={image.status}
        order={order}
        onSelect={onSelect}
        {...(sortable
          ? { ...listeners, "aria-describedby": attributes["aria-describedby"], "aria-roledescription": "imagen reordenable" }
          : {})}
        className="touch-manipulation"
      />
      {canDiscard ? (
        <button
          type="button"
          onClick={onDiscard}
          aria-label={`Descartar ${image.alt}`}
          title="Descartar"
          className="absolute top-0 right-0 grid size-touch cursor-pointer place-items-center"
        >
          <span className="grid size-6 place-items-center rounded-full bg-background/85 text-foreground inset-ring-(length:--stroke-strong) inset-ring-muted-foreground">
            <Icon name="x" size="sm" strokeWidth={2} className="size-3.5" />
          </span>
        </button>
      ) : null}
    </li>
  );
}

/**
 * Elegir, ordenar y descartar imágenes. Tocar elige y asigna el número de orden (la 1 es la portada);
 * mantener presionado reordena (en escritorio se arrastra directamente); descartar apaga y deja “Recuperar”.
 */
export function ImagePicker({
  images: initial,
  onApprove,
}: {
  images: ImageOption[];
  onApprove?: (orderedIds: string[]) => void;
}) {
  const [images, setImages] = useState(initial);
  const [order, setOrder] = useState<string[]>(() =>
    initial
      .filter((i) => i.status === "selected")
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((i) => i.id),
  );
  const [view, setView] = useState<View>("opciones");
  // Id estable para que los aria-describedby de dnd-kit coincidan entre servidor y cliente.
  const dndId = useId();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    // Espacio reordena; Enter sigue eligiendo o quitando.
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space", "Enter"] },
    }),
  );

  const setStatus = (id: string, status: ImageOption["status"]) =>
    setImages((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));

  const toggle = (img: ImageOption) => {
    if (img.status === "idle") {
      setStatus(img.id, "selected");
      setOrder((o) => [...o, img.id]);
    } else if (img.status === "selected") {
      setStatus(img.id, "idle");
      setOrder((o) => o.filter((id) => id !== img.id));
    } else if (img.status === "discarded") {
      setStatus(img.id, "idle");
    } else if (img.status === "error") {
      // Reintento simulado (sin IA real todavía).
      setStatus(img.id, "generating");
      window.setTimeout(() => setStatus(img.id, "idle"), 1500);
    }
  };

  const discard = (img: ImageOption) => {
    setStatus(img.id, "discarded");
    notifyUndo("Imagen descartada", () => setStatus(img.id, "idle"));
  };

  // En "Elegidas" las imágenes se ven en su orden y se reordenan; en "Opciones" cada una queda en su
  // lugar (como en la referencia) y soltar una elegida sobre otra intercambia sus números.
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setOrder((o) => {
      const from = o.indexOf(String(active.id));
      const to = o.indexOf(String(over.id));
      if (from < 0 || to < 0) return o;
      if (view === "elegidas") return arrayMove(o, from, to);
      const next = [...o];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  };

  const selected = order.map((id) => images.find((i) => i.id === id)!).filter(Boolean);
  const shown =
    view === "elegidas" ? selected : view === "descartadas" ? images.filter((i) => i.status === "discarded") : images;
  // Ids ordenables en el orden en que aparecen en la grilla.
  const sortableIds = shown.filter((i) => i.status === "selected").map((i) => i.id);
  const discardedCount = images.filter((i) => i.status === "discarded").length;

  return (
    <div className="flex flex-col gap-3">
      <SegmentedControl
        block
        label="Ver"
        value={view}
        onChange={(v) => setView(v as View)}
        options={[
          { value: "opciones", label: "Opciones", count: images.length },
          { value: "elegidas", label: "Elegidas", count: selected.length },
          { value: "descartadas", label: "Descartadas", count: discardedCount },
        ]}
        className="lg:max-w-md"
      />

      {shown.length ? (
        <DndContext
          id={dndId}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
          accessibility={{
            screenReaderInstructions: {
              draggable: "Para reordenar, presiona espacio, muévete con las flechas y vuelve a presionar espacio para soltar.",
            },
          }}
        >
          <SortableContext items={sortableIds} strategy={view === "elegidas" ? rectSortingStrategy : rectSwappingStrategy}>
            <ul className="grid grid-cols-3 gap-2 p-0 lg:grid-cols-5 xl:grid-cols-6" aria-label="Opciones de imagen">
              {shown.map((img) => (
                <SortableTile
                  key={img.id}
                  image={img}
                  order={img.status === "selected" ? order.indexOf(img.id) + 1 : undefined}
                  sortable={img.status === "selected"}
                  onSelect={() => toggle(img)}
                  onDiscard={() => discard(img)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : (
        <p className="py-12 text-center text-body text-muted-foreground">
          {view === "elegidas" ? "Aún no eliges imágenes. Toca una opción para elegirla." : "No has descartado imágenes."}
        </p>
      )}

      <p className="text-caption text-muted-foreground">
        Toca para elegir; el número es el orden en tu tienda. Mantén presionado para reordenar.
      </p>

      <StickyActions>
        <Button icon="sparkle">Generar más</Button>
        <Button variant="primary" icon="check" disabled={!selected.length} onClick={() => onApprove?.(order)}>
          Aprobar {selected.length}
        </Button>
      </StickyActions>
    </div>
  );
}
