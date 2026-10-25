"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { predictDR, fetchPredictions } from "@/lib/api";
import { useData } from "@/context/DataContext";
import { PredictionResult } from "@/types";

const ITEMS_PER_PAGE = 20;

export default function Home() {
  const { predictions, addPrediction } = useData();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestResult, setLatestResult] = useState<PredictionResult | null>(null);

  const [showHistory, setShowHistory] = useState(false);
  const [dateFilter, setDateFilter] = useState("");
  const [indexFilter, setIndexFilter] = useState("");
  const [page, setPage] = useState(1);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const loadedRef = useRef(false);

  // ক্লায়েন্ট-সাইড ফান্ডাস চেক — রেটিনা ইমেজ নয় 한다면 "Analyze" ক্লিক করার আগেই এরর দেখাবে
  function isLikelyFundus(file: File): Promise<{ ok: boolean; reason: string }> {
    return new Promise((resolve) => {
      if (!file.type.startsWith("image/")) {
        resolve({ ok: false, reason: "Please select a valid image file." });
        return;
      }

      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const { width, height } = img;
        const aspect = width / height;

        if (width < 224 || height < 224) {
          resolve({ ok: false, reason: "Image resolution is too low for a fundus image." });
          return;
        }
        if (aspect < 0.5 || aspect > 2.0) {
          resolve({ ok: false, reason: "Image aspect ratio does not look like a retinal fundus image." });
          return;
        }

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0);
        const imageData = ctx?.getImageData(0, 0, width, height);
        if (!imageData) {
          resolve({ ok: true, reason: "" });
          return;
        }
        const data = imageData.data;
        let r = 0, g = 0, b = 0, count = 0;
        const step = Math.max(1, Math.floor((data.length / 4) / 4000));
        for (let i = 0; i < data.length; i += step * 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count += 1;
        }
        r /= count;
        g /= count;
        b /= count;

        if (Math.abs(r - g) < 8 && Math.abs(g - b) < 8) {
          resolve({ ok: false, reason: "Image appears grayscale; not a color fundus image." });
          return;
        }
        if (r <= b) {
          resolve({ ok: false, reason: "Image does not look like a retinal fundus image." });
          return;
        }

        resolve({ ok: true, reason: "" });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ ok: false, reason: "Could not read image file." });
      };
      img.src = url;
    });
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    setError(null);

    if (!selected) {
      setPreviewUrl(null);
      return;
    }

    const newPreview = URL.createObjectURL(selected);
    setPreviewUrl(newPreview);

    const { ok, reason } = await isLikelyFundus(selected);
    if (!ok) {
      setError(reason);
      setFile(null);
      URL.revokeObjectURL(newPreview);
      setPreviewUrl(null);
      return;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select an image first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await predictDR(file);
      addPrediction(result);
      setLatestResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // ব্যাকএন্ড থেকে আগের রেজাল্ট আনুন — শুধু একবার
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const loadPrevious = async () => {
      try {
        const results = await fetchPredictions();
        results.forEach((r) => addPrediction(r));
      } catch (err) {
        console.error("Failed to load previous predictions:", err);
      } finally {
        setInitialLoaded(true);
      }
    };
    loadPrevious();
  }, []);

  const filteredPredictions = useMemo(() => {
    return predictions.filter((p) => {
      const matchesDate = dateFilter
        ? p.created_at.slice(0, 10) === dateFilter
        : true;
      const matchesIndex = indexFilter
        ? p.index.toString() === indexFilter.trim()
        : true;
      return matchesDate && matchesIndex;
    });
  }, [predictions, dateFilter, indexFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPredictions.length / ITEMS_PER_PAGE)
  );

  const paginatedPredictions = filteredPredictions.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const resetFiltersAndPage = () => {
    setPage(1);
  };

  if (!initialLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-textmain">Loading previous results...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="scene">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <section className="mx-auto flex max-w-4xl flex-col items-center px-6 pt-20 text-center">
        <h1 className="text-4xl font-bold text-textmain sm:text-5xl">
          Diabetic Retinopathy Screening
        </h1>
        <p className="mt-4 max-w-2xl text-textsecondary">
          Upload a retinal fundus image and get an instant referable /
          non-referable screening result powered by a lightweight on-device
          model.
        </p>
      </section>

      <section className="mx-auto mt-14 max-w-xl px-6">
        <div className="tilt-card">
          <div className="tilt-card-inner rounded-2xl border border-border bg-surface p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <label className="text-sm font-medium text-textmain">
                Retinal Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="rounded-lg border border-border bg-inputbg px-4 py-3 text-sm text-textmain file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-white hover:file:bg-primaryhover"
              />

              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="preview"
                  className="h-48 w-full rounded-lg object-cover border border-border"
                />
              )}

              <button
                type="submit"
                disabled={loading || !file || error !== null}
                className="rounded-lg bg-primary px-6 py-3 font-medium text-white transition hover:bg-primaryhover disabled:opacity-60"
              >
                {loading ? "Analyzing..." : "Run Detection"}
              </button>

              {error && <p className="text-sm text-red-500">{error}</p>}
            </form>

            {latestResult && (
              <div className="mt-6 rounded-xl border border-border bg-secondarybg p-5">
                <p className="text-sm text-textsecondary">Latest Result</p>
                <p className="mt-1 text-xl font-semibold text-textmain">
                  {latestResult.predicted_label}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-textsecondary">
                  <p>
                    Probability:{" "}
                    <span className="text-textmain">
                      {latestResult.probability_referable.toFixed(4)}
                    </span>
                  </p>
                  <p>
                    Entropy:{" "}
                    <span className="text-textmain">
                      {latestResult.entropy.toFixed(4)}
                    </span>
                  </p>
                  <p>
                    High Uncertainty:{" "}
                    <span className="text-textmain">
                      {latestResult.is_high_uncertainty ? "Yes" : "No"}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-16 mb-24 max-w-5xl px-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-textmain">
            Previous Test Results
          </h2>
          <button
            onClick={() => setShowHistory((prev) => !prev)}
            className="rounded-lg border border-primary px-5 py-2 text-sm font-medium text-primary transition hover:bg-primary hover:text-white"
          >
            {showHistory ? "Hide Results" : "Show Results"}
          </button>
        </div>

        {showHistory && (
          <div className="mt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-textsecondary">
                  Filter by Date
                </label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    resetFiltersAndPage();
                  }}
                  className="rounded-lg border border-border bg-inputbg px-3 py-2 text-sm text-textmain"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-textsecondary">
                  Filter by Index
                </label>
                <input
                  type="number"
                  placeholder="e.g. 5"
                  value={indexFilter}
                  onChange={(e) => {
                    setIndexFilter(e.target.value);
                    resetFiltersAndPage();
                  }}
                  className="rounded-lg border border-border bg-inputbg px-3 py-2 text-sm text-textmain"
                />
              </div>

              {(dateFilter || indexFilter) && (
                <button
                  onClick={() => {
                    setDateFilter("");
                    setIndexFilter("");
                    resetFiltersAndPage();
                  }}
                  className="self-end rounded-lg border border-border px-4 py-2 text-sm text-textsecondary hover:border-primary hover:text-primary"
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div className="mt-6 overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondarybg text-textsecondary">
                  <tr>
                    <th className="px-4 py-3">Index</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Result</th>
                    <th className="px-4 py-3">Probability</th>
                    <th className="px-4 py-3">Entropy</th>
                    <th className="px-4 py-3">High Uncertainty</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPredictions.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-6 text-center text-textsecondary"
                      >
                        No results found.
                      </td>
                    </tr>
                  )}
                  {paginatedPredictions.map((p) => (
                    <tr
                      key={p.id}
                      className="border-t border-border text-textmain"
                    >
                      <td className="px-4 py-3">{p.index}</td>
                      <td className="px-4 py-3">
                        {new Date(p.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">{p.predicted_label}</td>
                      <td className="px-4 py-3">
                        {p.probability_referable.toFixed(4)}
                      </td>
                      <td className="px-4 py-3">{p.entropy.toFixed(4)}</td>
                      <td className="px-4 py-3">
                        {p.is_high_uncertainty ? "Yes" : "No"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-textmain disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="text-sm text-textsecondary">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-textmain disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
