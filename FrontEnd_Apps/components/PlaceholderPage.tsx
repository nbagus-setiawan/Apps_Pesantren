export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-h1 text-neutral-900">{title}</h1>
        <p className="mt-1 text-sm text-neutral-500">{description}</p>
      </div>

      <div className="card flex flex-col items-center justify-center gap-3 p-16 text-center">
        <span className="text-3xl" aria-hidden>
          🚧
        </span>
        <p className="text-sm font-medium text-neutral-900">Modul ini belum dibangun.</p>
        <p className="max-w-sm text-sm text-neutral-500">
          Routing dan otorisasi halaman ini sudah tersedia — kontennya akan menyusul di tahap
          pengembangan berikutnya.
        </p>
      </div>
    </div>
  );
}
