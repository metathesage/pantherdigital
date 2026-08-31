"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_FAN_ART, useFanArtStore, type FanArtItem } from "@/lib/store";

async function downscaleImage(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = dataUrl;
  });

  const maxSide = 900;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  canvas.getContext("2d")!.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

/** Recursively walk dropped directory entries (Chromium folder drops). */
interface FileSystemEntryLike {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  file?: (cb: (file: File) => void) => void;
  createReader?: () => {
    readEntries: (cb: (entries: FileSystemEntryLike[]) => void) => void;
  };
}

async function collectFiles(entries: FileSystemEntryLike[]): Promise<File[]> {
  const files: File[] = [];
  for (const entry of entries) {
    if (entry.isFile && entry.file) {
      const file = await new Promise<File | null>((resolve) =>
        entry.file!(resolve)
      );
      if (file) files.push(file);
    } else if (entry.isDirectory && entry.createReader) {
      const reader = entry.createReader();
      let batch: FileSystemEntryLike[] = [];
      do {
        batch = await new Promise<FileSystemEntryLike[]>((resolve) =>
          reader.readEntries(resolve)
        );
        files.push(...(await collectFiles(batch)));
      } while (batch.length > 0);
    }
  }
  return files.filter((f) => f.type.startsWith("image/"));
}

function FanArtCard({ item }: { item: FanArtItem }) {
  const [revealed, setRevealed] = useState(false);
  const remove = useFanArtStore((s) => s.remove);
  const needsBlur = item.nsfw && !revealed;

  return (
    <figure className="group overflow-hidden rounded-2xl bg-white/90 shadow-md ring-1 ring-sky-950/10 backdrop-blur">
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image}
          alt={item.title}
          loading="lazy"
          className={`block aspect-square w-full object-cover transition-all duration-500 ${
            needsBlur ? "scale-105 blur-2xl brightness-75" : ""
          }`}
        />
        {needsBlur && (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="absolute inset-0 grid place-items-center bg-sky-950/20"
          >
            <span className="rounded-full bg-black/60 px-4 py-2 text-xs font-bold text-white backdrop-blur transition hover:bg-black/80">
              Sensitive content — tap to view
            </span>
          </button>
        )}
        {revealed && (
          <button
            type="button"
            onClick={() => setRevealed(false)}
            className="absolute right-2 top-2 rounded-full bg-black/55 px-3 py-1 text-[10px] font-bold text-white backdrop-blur"
          >
            Hide
          </button>
        )}
      </div>
      <figcaption className="flex items-center justify-between gap-2 px-3.5 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-800">{item.title}</p>
          <p className="truncate text-xs text-zinc-400">by {item.artist}</p>
        </div>
        <button
          type="button"
          onClick={() => remove(item.id)}
          aria-label={`Remove ${item.title}`}
          className="shrink-0 rounded-lg p-1.5 text-zinc-300 transition-colors hover:bg-rose-50 hover:text-holo-pink"
        >
          <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </figcaption>
    </figure>
  );
}

export default function FanArtPage() {
  const items = useFanArtStore((s) => s.items);
  const add = useFanArtStore((s) => s.add);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [nsfw, setNsfw] = useState(false);
  const [fileCount, setFileCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dragging, setDragging] = useState(false);
  const pendingFiles = useRef<File[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  async function processFiles(
    files: File[],
    opts: { artist: string; nsfw: boolean; useTitles: boolean }
  ) {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) {
      setError("No image files found — PNG/JPG/WebP only.");
      return;
    }
    const capacity = MAX_FAN_ART - useFanArtStore.getState().items.length;
    if (capacity <= 0) {
      setError(`Gallery is full (${MAX_FAN_ART} pieces). Remove one to add another.`);
      return;
    }

    const queue = images.slice(0, capacity);
    setBusy(true);
    setError(null);
    let added = 0;

    for (let i = 0; i < queue.length; i++) {
      setStatus(`Adding ${i + 1}/${queue.length}…`);
      try {
        const image = await downscaleImage(queue[i]);
        const baseName = queue[i].name
          .replace(/\.[a-z0-9]+$/i, "")
          .replace(/[-_]+/g, " ");
        add({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          title:
            (opts.useTitles && baseName.trim()) ||
            (queue.length === 1 ? title.trim() : "") ||
            `Untitled ${i + 1}`,
          artist: artist.trim() || "Unknown",
          nsfw: opts.nsfw,
          image,
          createdAt: Date.now(),
        });
        added++;
      } catch {
        /* skip unreadable file */
      }
    }

    setBusy(false);
    setStatus(null);
    if (queue.length < images.length) {
      setError(`Added ${added} of ${images.length} — gallery cap is ${MAX_FAN_ART}.`);
    } else if (added > 0) {
      setStatus(`Added ${added} piece${added === 1 ? "" : "s"}.`);
      setTimeout(() => setStatus(null), 2500);
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (pendingFiles.current.length === 0) {
      setError("Choose or drop an image first.");
      return;
    }
    if (!title.trim() && !artist.trim()) {
      setError("Add a title and the artist name.");
      return;
    }
    await processFiles(pendingFiles.current, { artist, nsfw, useTitles: false });
    setTitle("");
    setArtist("");
    setNsfw(false);
    setFileCount(0);
    pendingFiles.current = [];
    formRef.current?.reset();
  }

  async function onDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragging(false);
    const dt = event.dataTransfer;
    const entries: FileSystemEntryLike[] = Array.from(
      dt.items ?? []
    )
      .map((item) =>
        typeof item.webkitGetAsEntry === "function"
          ? (item.webkitGetAsEntry() as unknown as FileSystemEntryLike | null)
          : null
      )
      .filter(Boolean) as FileSystemEntryLike[];

    if (entries.length > 0 && entries.some((e) => e.isDirectory)) {
      const files = await collectFiles(entries);
      await processFiles(files, { artist: artist || "Unknown", nsfw: false, useTitles: true });
    } else {
      const files = Array.from(dt.files ?? []);
      await processFiles(files, { artist: artist || "Unknown", nsfw, useTitles: true });
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
        Fan Art<span className="text-gradient">.</span>
      </h1>
      <p className="mt-2 max-w-xl text-zinc-500">
        A community wall for hololive TCG drawings. Uploads stay on your
        device — mark sensitive pieces and they stay blurred until revealed.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-sky-950/10 bg-white/70 p-4 text-sm backdrop-blur">
        <span className="font-semibold text-zinc-700">Drawing too?</span>
        <a href="https://x.com/hashtag/hOCG" target="_blank" rel="noopener noreferrer" className="font-semibold text-holo-blue hover:underline">
          #hOCG on X ↗
        </a>
        <a href="https://x.com/hololive_OCG_EN" target="_blank" rel="noopener noreferrer" className="font-semibold text-holo-purple hover:underline">
          @hololive_OCG_EN ↗
        </a>
        <span className="text-xs text-zinc-400">— where the official community posts daily.</span>
      </div>

      {/* Drag & drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`mt-6 rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
          dragging
            ? "border-holo-blue bg-holo-blue/10 scale-[1.01]"
            : "border-sky-950/20 bg-white/60 backdrop-blur hover:border-holo-blue/40"
        }`}
        aria-label="Drop images here"
      >
        {busy ? (
          <p className="text-sm font-semibold text-holo-blue">{status}</p>
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="none" className="mx-auto size-8 text-holo-cyan" aria-hidden>
              <path d="M12 16V4m0 0l-4 4m4-4l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <p className="mt-2 font-semibold text-zinc-700">
              Drop images or whole folders here
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Files never leave your browser · folder names become titles
            </p>
          </>
        )}

        {/* Upload form */}
        <form ref={formRef} onSubmit={onSubmit} className="mt-5 grid gap-3 text-left sm:grid-cols-[1fr_1fr_auto]">
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-400">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={60}
              placeholder="My Oshi card drawing"
              className="h-10 w-full rounded-xl border border-sky-950/15 bg-white px-3 text-sm outline-none focus:border-holo-blue/60 focus:ring-2 focus:ring-holo-blue/20"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-400">Artist</span>
            <input
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              maxLength={40}
              placeholder="Your handle"
              className="h-10 w-full rounded-xl border border-sky-950/15 bg-white px-3 text-sm outline-none focus:border-holo-blue/60 focus:ring-2 focus:ring-holo-blue/20"
            />
          </label>
          <div className="flex items-end gap-2">
            <label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-sky-950/25 bg-white px-4 text-sm font-semibold text-zinc-600 transition hover:border-holo-blue/50 hover:text-holo-blue">
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => {
                  pendingFiles.current = Array.from(e.target.files ?? []);
                  setFileCount(pendingFiles.current.length);
                }}
              />
              {fileCount > 0 ? `${fileCount} file${fileCount === 1 ? "" : "s"} chosen` : "Browse…"}
            </label>
            <label
              className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-sky-950/25 bg-white px-4 text-sm font-semibold text-zinc-600 transition hover:border-holo-blue/50 hover:text-holo-blue"
              title="Select an entire folder of drawings"
            >
              <input
                type="file"
                multiple
                {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
                className="sr-only"
                onChange={(e) => {
                  pendingFiles.current = Array.from(e.target.files ?? []).filter((f) =>
                    f.type.startsWith("image/")
                  );
                  setFileCount(pendingFiles.current.length);
                }}
              />
              Folder…
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-600">
            <input
              type="checkbox"
              checked={nsfw}
              onChange={(e) => setNsfw(e.target.checked)}
              className="size-4 accent-holo-pink"
            />
            Mark as sensitive (stays blurred)
          </label>
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-gradient-to-r from-holo-blue to-holo-purple px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-holo-blue/30 transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-50 sm:col-span-2 sm:w-fit"
          >
            {busy ? "Adding…" : "Add to gallery"}
          </button>
          {(error || status) && (
            <p
              role={error ? "alert" : undefined}
              className={`text-sm font-medium sm:col-span-3 ${error ? "text-holo-pink" : "text-emerald-600"}`}
            >
              {error ?? status}
            </p>
          )}
        </form>
      </div>

      {/* Gallery */}
      {mounted && items.length > 0 ? (
        <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[...items]
            .sort((a, b) => b.createdAt - a.createdAt)
            .map((item) => (
              <li key={item.id} className="animate-pop">
                <FanArtCard item={item} />
              </li>
            ))}
        </ul>
      ) : (
        mounted && (
          <div className="mt-10 rounded-2xl border border-dashed border-sky-950/20 p-14 text-center">
            <p className="text-lg font-semibold text-zinc-700">The wall is empty.</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-zinc-500">
              Be the first to pin a drawing — drag a folder of sketches onto
              the drop zone above.
            </p>
          </div>
        )
      )}
    </div>
  );
}
