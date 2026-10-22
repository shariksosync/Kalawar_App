"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { Plus, Pencil, Trash2, Download, ArrowUpDown, Loader2, Sparkles, Upload, Image as ImageIcon, CheckCircle, X, GraduationCap, FileText, Eye, EyeOff, Building2, UploadCloud, CheckCircle2, AlertCircle, Filter, Search } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn, downloadFile } from "@/lib/utils";
import { AdminFilterSelect } from "./AdminFilterSelect";
import { getDistrictsByState } from "@/data/india-districts";
import {
  getApprovedStateAssociationDropdownOptions,
  getApprovedDistrictAssociationDropdownOptions,
} from "@/lib/club-coach-options";

export type AdminField = {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "textarea" | "select" | "image" | "password";
  options?: readonly string[];
  required?: boolean;
  minFutureDate?: boolean;
  showWhen?: { key: string; equals: string | string[] };
  hideInTable?: boolean;
  fullWidth?: boolean;
  placeholder?: string;
  allowOther?: boolean;
  otherOptionLabel?: string;
  customHelperText?: string;
  manageActionLabel?: string;
  onManageAction?: () => void;
};

export type AdminRecord = Record<string, any> & { id: string };

function isFieldVisible(f: AdminField, currentDraft: Record<string, any>): boolean {
  if (!f.showWhen) return true;
  const targetVal = currentDraft[f.showWhen.key];
  if (Array.isArray(f.showWhen.equals)) {
    return f.showWhen.equals.includes(targetVal);
  }
  return targetVal === f.showWhen.equals;
}

type Props = {
  moduleKey: string;
  singular: string;
  idPrefix: string;
  fields: AdminField[];
  rows: AdminRecord[];
  onRowsChange: (rows: AdminRecord[]) => void;
  query: string;
  statusKey?: string;
  onCreate?: (draft: Record<string, any>) => Promise<AdminRecord | void>;
  onUpdate?: (id: string, draft: Record<string, any>) => Promise<AdminRecord | void>;
  onDelete?: (id: string) => Promise<boolean | void>;
  isLoading?: boolean;
};

function emptyDraft(fields: AdminField[]): Record<string, any> {
  const d: Record<string, any> = {};
  for (const f of fields) {
    if (f.key in d && d[f.key]) continue;
    d[f.key] = f.options?.[0] ?? "";
  }
  return d;
}

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function AdminModule({
  moduleKey,
  singular,
  idPrefix,
  fields,
  rows,
  onRowsChange,
  query,
  statusKey,
  onCreate,
  onUpdate,
  onDelete,
  isLoading = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, any>>(() => emptyDraft(fields));
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<string>(fields[0].key);
  const [sortAsc, setSortAsc] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUploadKey, setCurrentUploadKey] = useState<string | null>(null);
  const [customFieldMode, setCustomFieldMode] = useState<Record<string, boolean>>({});

  const [filterColumn, setFilterColumn] = useState<string>("all");
  const [filterValue, setFilterValue] = useState<string>("all");
  const [customFilterText, setCustomFilterText] = useState<string>("");
  const [academyFilter, setAcademyFilter] = useState<string>("all");
  const [showPasswordFields, setShowPasswordFields] = useState<Record<string, boolean>>({});

  const [rawStateAssocs, setRawStateAssocs] = useState<any[]>([]);
  const [rawDistrictAssocs, setRawDistrictAssocs] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadAssocs() {
      try {
        const [sRes, dRes] = await Promise.all([
          fetch("/api/state-associations"),
          fetch("/api/district-associations"),
        ]);
        const [sJson, dJson] = await Promise.all([sRes.json(), dRes.json()]);
        if (isMounted) {
          if (sJson?.success && Array.isArray(sJson.associations)) {
            setRawStateAssocs(sJson.associations);
          }
          if (dJson?.success && Array.isArray(dJson.associations)) {
            setRawDistrictAssocs(dJson.associations);
          }
        }
      } catch (e) {
        // ignore
      }
    }
    loadAssocs();
    return () => {
      isMounted = false;
    };
  }, []);

  const approvedStateOptions = useMemo(() => {
    return getApprovedStateAssociationDropdownOptions(rawStateAssocs);
  }, [rawStateAssocs]);

  const todayStr = getTodayString();

  // All available columns in this module's data for filtering
  const filterableColumns = useMemo(() => {
    const list: { key: string; label: string; field?: AdminField }[] = [
      { key: "id", label: "Record ID" },
    ];
    fields.forEach((f) => {
      if (f.type !== "image" && f.key !== "src" && f.key !== "thumb") {
        list.push({ key: f.key, label: f.label, field: f });
      }
    });
    return list;
  }, [fields]);

  const selectedColumnField = useMemo(() => {
    return fields.find((f) => f.key === filterColumn);
  }, [fields, filterColumn]);

  const uniqueColumnValues = useMemo(() => {
    if (filterColumn === "all") return [];
    const valuesSet = new Set<string>();

    rows.forEach((r) => {
      const val = r[filterColumn];
      if (val !== undefined && val !== null && String(val).trim() !== "") {
        valuesSet.add(String(val).trim());
      }
    });

    // Also include options from field definition if select
    if (selectedColumnField?.options) {
      selectedColumnField.options.forEach((opt) => valuesSet.add(opt));
    }

    return Array.from(valuesSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [rows, filterColumn, selectedColumnField]);

  const academyOptions = useMemo(() => {
    if (moduleKey !== "players") return [];
    const set = new Set<string>();
    rows.forEach((r) => {
      const val = r.club || r.academy;
      if (val && String(val).trim()) set.add(String(val).trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows, moduleKey]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cText = customFilterText.trim().toLowerCase();

    const filtered = rows.filter((r) => {
      // 1. Global search query across all row values
      if (q) {
        const matchesGlobal = Object.values(r).some((v) =>
          String(v ?? "").toLowerCase().includes(q)
        );
        if (!matchesGlobal) return false;
      }

      // 2. Specific column dropdown / value filter
      if (filterColumn !== "all") {
        const rawVal = r[filterColumn];
        const strVal = String(rawVal ?? "").trim();
        const lowerVal = strVal.toLowerCase();

        // If a discrete value is selected from dropdown
        if (filterValue !== "all") {
          if (strVal !== filterValue && lowerVal !== filterValue.toLowerCase()) {
            return false;
          }
        }

        // If custom search text is entered for this column
        if (cText) {
          if (!lowerVal.includes(cText)) {
            return false;
          }
        }
      }

      // 3. Dedicated Academy filter for players module
      if (moduleKey === "players" && academyFilter !== "all") {
        const rowAcad = String(r.club || r.academy || "").trim().toLowerCase();
        if (rowAcad !== academyFilter.toLowerCase()) {
          return false;
        }
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      const cmp = String(a[sortKey] ?? "").localeCompare(String(b[sortKey] ?? ""), undefined, {
        numeric: true,
      });
      return sortAsc ? cmp : -cmp;
    });
  }, [rows, query, filterColumn, filterValue, customFilterText, academyFilter, moduleKey, sortKey, sortAsc]);

  function startCreate() {
    setEditingId(null);
    setCustomFieldMode({});
    setShowPasswordFields({});
    const initial = emptyDraft(fields);
    if (moduleKey === "players") {
      initial.username = "";
      initial.password = "";
    }
    initial.tempStateAssociation = "";
    initial.tempDistrictAssociation = "";
    if (moduleKey === "players") {
      initial.state = "";
      initial.district = "";
      initial.city = "";
    }
    if (moduleKey === "certificates") {
      initial.number = "Auto-generated upon creation";
      initial.issued = getTodayString();
      initial.status = "Issued";
    }
    if (moduleKey === "players") {
      initial.academicHistory = [];
    }
    if (moduleKey === "clubs") {
      initial.affiliationDocument = "";
      initial.affiliationDocumentName = "";
      initial.affiliationDocumentSize = "";
    }
    setDraft(initial);
    setOpen(true);
  }

  function startEdit(row: AdminRecord) {
    setEditingId(row.id);
    setCustomFieldMode({});
    setShowPasswordFields({});
    const base: Record<string, any> = { ...row };

    // Legacy data handling for temporary state & district association fields
    const existingTempState = typeof row.tempStateAssociation === "string" ? row.tempStateAssociation.trim() : "";
    const existingTempDistrict = typeof row.tempDistrictAssociation === "string" ? row.tempDistrictAssociation.trim() : "";
    const rawState = typeof row.state === "string" ? row.state.trim() : "";
    const rawDistrict = typeof row.district === "string" ? row.district.trim() : (typeof row.city === "string" ? row.city.trim() : "");

    const isDynamicFormatted = approvedStateOptions.length > 0
      ? approvedStateOptions.includes(rawState) || rawState.includes(" (")
      : rawState.includes(" (");

    if (existingTempState) {
      base.tempStateAssociation = existingTempState;
      base.tempDistrictAssociation = existingTempDistrict || rawDistrict;
      base.state = isDynamicFormatted ? rawState : "";
      base.district = isDynamicFormatted ? rawDistrict : "";
      base.city = isDynamicFormatted ? rawDistrict : "";
    } else if (rawState && !isDynamicFormatted) {
      // Legacy user: preserve old state & district in temporary fields
      base.tempStateAssociation = rawState;
      base.tempDistrictAssociation = rawDistrict;
      // Leave dynamic dropdown empty for admin selection
      base.state = "";
      base.district = "";
      base.city = "";
    } else {
      base.tempStateAssociation = "";
      base.tempDistrictAssociation = "";
      base.state = rawState;
      base.district = rawDistrict;
      base.city = rawDistrict;
    }

    if (moduleKey === "players") {
      base.academicHistory = Array.isArray(row.academicHistory) ? JSON.parse(JSON.stringify(row.academicHistory)) : [];
      base.username = row.username || "";
      base.password = row.rawPassword || row.password || "";
    }
    setDraft(base);
    setOpen(true);
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes <= 0) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  async function handleFileUpload(key: string, file: File) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File exceeds 2MB limit", { description: "Please upload a file under 2MB." });
      return;
    }

    try {
      setUploadingField(key);
      setUploadProgress(5);
      const formattedSize = formatFileSize(file.size);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", `wsf_${moduleKey}`);

      const timer = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(timer);
            return 90;
          }
          const step = Math.floor(Math.random() * 12) + 6;
          return Math.min(90, prev + step);
        });
      }, 100);

      const res = await new Promise<{ ok: boolean; data?: any }>((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload");
        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const pct = Math.round((evt.loaded / evt.total) * 90);
            setUploadProgress((curr) => Math.max(curr, pct));
          }
        };
        xhr.onload = () => {
          clearInterval(timer);
          try {
            const data = JSON.parse(xhr.responseText);
            resolve({ ok: xhr.status >= 200 && xhr.status < 300, data });
          } catch {
            resolve({ ok: false });
          }
        };
        xhr.onerror = () => {
          clearInterval(timer);
          resolve({ ok: false });
        };
        xhr.send(formData);
      });

      if (!res.ok || !res.data?.success) {
        throw new Error(res.data?.error || "Failed to upload file to Cloudinary");
      }

      setUploadProgress(100);
      await new Promise((r) => setTimeout(r, 400));

      setDraft((prev) => ({
        ...prev,
        [key]: res.data.url,
        [`${key}Name`]: file.name,
        [`${key}Size`]: formattedSize,
        affiliationDocumentName: file.name,
        affiliationDocumentSize: formattedSize,
      }));
      toast.success("File uploaded to Cloudinary", {
        description: `${file.name} (${formattedSize})`,
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("File upload failed", {
        description: error instanceof Error ? error.message : "Could not upload file",
      });
    } finally {
      setUploadingField(null);
      setUploadProgress(0);
    }
  }

  const tableColumns = useMemo(() => {
    const seen = new Set<string>();
    return fields.filter((f) => {
      if (f.hideInTable) return false;
      if (seen.has(f.key)) return false;
      seen.add(f.key);
      return true;
    });
  }, [fields]);

  async function save() {
    const missing = fields.filter(
      (f) =>
        isFieldVisible(f, draft) &&
        f.required === true &&
        !(moduleKey === "certificates" && f.key === "number") &&
        f.key !== "affiliationDocument" &&
        (!draft[f.key] || !String(draft[f.key]).trim())
    );
    if (missing.length) {
      toast.error("Please complete all required fields", {
        description: missing.map((m) => m.label).join(", "),
      });
      return;
    }

    if (moduleKey === "clubs") {
      if (!draft.affiliationDocument || !String(draft.affiliationDocument).trim()) {
        toast.error("Official Affiliation Document Required", {
          description: "Please upload the official affiliation document or certificate for this club before saving.",
        });
        return;
      }
    }

    // Date validations based on status
    if (draft.startDate && draft.endDate) {
      const start = new Date(draft.startDate);
      const end = new Date(draft.endDate);

      if (end < start) {
        toast.error("Invalid date range", {
          description: "Ending date must be on or after the starting date.",
        });
        return;
      }

      if (draft.status === "Upcoming") {
        if (draft.startDate < todayStr) {
          toast.error("Invalid date for Upcoming event", {
            description: `Event start date (${draft.startDate}) cannot be in the past for an Upcoming event. Please choose today or a future date.`,
          });
          return;
        }
      } else if (draft.status === "Ongoing") {
        if (draft.startDate > todayStr) {
          toast.error("Invalid start date for Ongoing event", {
            description: `Event has not started yet (${draft.startDate}). For an Ongoing event, start date must be today or earlier.`,
          });
          return;
        }
        if (draft.endDate < todayStr) {
          toast.error("Invalid end date for Ongoing event", {
            description: `Event has already ended (${draft.endDate}). For an Ongoing event, end date must be today or in the future.`,
          });
          return;
        }
      } else if (draft.status === "Completed") {
        if (draft.endDate > todayStr) {
          toast.error("Invalid date for Completed event", {
            description: `Event ending date (${draft.endDate}) cannot be in the future for a Completed event.`,
          });
          return;
        }
      }
    }

    setIsSaving(true);
    try {
      if (editingId) {
        if (onUpdate) {
          const res = await onUpdate(editingId, draft);
          if (res) {
            onRowsChange(rows.map((r) => (r.id === editingId ? res : r)));
          } else {
            onRowsChange(rows.map((r) => (r.id === editingId ? { ...r, ...draft } : r)));
          }
        } else {
          onRowsChange(rows.map((r) => (r.id === editingId ? { ...r, ...draft } : r)));
          toast.success(`${singular} updated`, { description: draft[fields[0].key] });
        }
      } else {
        if (onCreate) {
          const res = await onCreate(draft);
          if (res) {
            onRowsChange([res, ...rows]);
          }
        } else {
          const id = `${idPrefix}-${Math.floor(1000 + Math.random() * 9000)}`;
          onRowsChange([{ id, ...draft } as AdminRecord, ...rows]);
          toast.success(`${singular} created`, { description: draft[fields[0].key] });
        }
      }
      setOpen(false);
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save record", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    const targetId = deleteId;
    const targetLower = targetId.toLowerCase();
    const row = rows.find((r) => r.id.toLowerCase() === targetLower);
    setIsDeleting(true);
    setDeleteId(null);
    onRowsChange(rows.filter((r) => r.id.toLowerCase() !== targetLower));

    try {
      if (onDelete) {
        await onDelete(targetId);
      }
      if (row) toast.success(`${singular} deleted`, { description: row[fields[0].key] || row.id });
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete record", {
        description: error instanceof Error ? error.message : "An error occurred",
      });
      // Restore rows if failed
      if (row) {
        onRowsChange(rows);
      }
    } finally {
      setIsDeleting(false);
    }
  }

  function exportCsv() {
    const header = ["id", ...fields.map((f) => f.key)].join(",");
    const body = visible
      .map((r) => ["id", ...fields.map((f) => f.key)].map((k) => `"${(r[k] ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${moduleKey}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export ready", { description: `${visible.length} rows exported to CSV` });
  }

  function toggleSort(key: string) {
    if (key === sortKey) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  return (
    <div className="luxe-card overflow-hidden">
      {/* Hidden file input for Cloudinary upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && currentUploadKey) {
            handleFileUpload(currentUploadKey, file);
          }
          if (e.target) e.target.value = "";
        }}
      />

      {/* Top Controls & Dynamic Column Filters Bar */}
      <div className="border-border/60 border-b p-4 sm:p-5 space-y-3.5 bg-card/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          {/* Left: Dynamic Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
            {/* Filter by Column Custom Dropdown */}
            <AdminFilterSelect
              icon={<Filter className="size-3.5" />}
              label="Filter by:"
              value={filterColumn}
              onChange={(val) => {
                setFilterColumn(val);
                setFilterValue("all");
                setCustomFilterText("");
              }}
              options={[
                { value: "all", label: "All Columns" },
                ...filterableColumns.map((col) => ({
                  value: col.key,
                  label: col.label,
                })),
              ]}
              minWidth="min-w-[220px]"
            />

            {/* If a column is selected: show either unique values custom dropdown or search input */}
            {filterColumn !== "all" && uniqueColumnValues.length > 0 && uniqueColumnValues.length <= 40 && (
              <AdminFilterSelect
                label="Value:"
                value={filterValue}
                onChange={(val) => setFilterValue(val)}
                options={[
                  { value: "all", label: `All Values (${uniqueColumnValues.length})` },
                  ...uniqueColumnValues.map((val) => ({
                    value: val,
                    label: val,
                  })),
                ]}
                searchable={uniqueColumnValues.length > 6}
                minWidth="min-w-[200px]"
              />
            )}

            {filterColumn !== "all" && (uniqueColumnValues.length === 0 || uniqueColumnValues.length > 40) && (
              <div className="flex items-center gap-1.5 bg-background/80 border border-primary/40 rounded-xl px-3 py-1.5 text-xs shadow-sm animate-in fade-in max-w-xs">
                <Search className="size-3 text-primary shrink-0" />
                <input
                  type="text"
                  placeholder={`Search ${filterableColumns.find(c => c.key === filterColumn)?.label || ""}...`}
                  value={customFilterText}
                  onChange={(e) => setCustomFilterText(e.target.value)}
                  className="bg-transparent text-foreground font-semibold placeholder:text-muted-foreground outline-none text-xs w-36 sm:w-44"
                />
                {customFilterText && (
                  <button
                    type="button"
                    onClick={() => setCustomFilterText("")}
                    className="text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
            )}

            {/* Dedicated Academy Filter for Players Module */}
            {moduleKey === "players" && academyOptions.length > 0 && (
              <AdminFilterSelect
                icon={<Building2 className="size-3.5" />}
                label="Academy:"
                value={academyFilter}
                onChange={(val) => setAcademyFilter(val)}
                options={[
                  { value: "all", label: `All Academies (${rows.length})` },
                  ...academyOptions.map((acad) => {
                    const count = rows.filter(
                      (r) => (r.club || r.academy || "").trim().toLowerCase() === acad.toLowerCase()
                    ).length;
                    return {
                      value: acad,
                      label: `${acad} (${count})`,
                    };
                  }),
                ]}
                searchable={academyOptions.length > 5}
                minWidth="min-w-[220px]"
              />
            )}

            {/* Clear Filter Button */}
            {(filterColumn !== "all" || filterValue !== "all" || customFilterText || (moduleKey === "players" && academyFilter !== "all")) && (
              <button
                type="button"
                onClick={() => {
                  setFilterColumn("all");
                  setFilterValue("all");
                  setCustomFilterText("");
                  setAcademyFilter("all");
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-bold border border-destructive/30 transition-colors cursor-pointer"
                title="Clear filters"
              >
                <X className="size-3" />
                <span>Reset Filter</span>
              </button>
            )}

            <div className="flex items-center gap-2 pl-1">
              <span className="text-xs text-muted-foreground font-medium">
                <strong className="text-foreground">{visible.length}</strong> of {rows.length} records
              </span>
              {isLoading && <Loader2 className="size-3.5 animate-spin text-primary" />}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={exportCsv}
              disabled={visible.length === 0}
              className="border-border/70 hover:border-primary inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold disabled:opacity-40 transition-colors cursor-pointer bg-card/60"
            >
              <Download className="size-3.5" /> Export
            </button>
            <button
              onClick={startCreate}
              className="bg-gold-gradient text-background shadow-gold inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Plus className="size-3.5" /> Add {singular.toLowerCase()}
            </button>
          </div>
        </div>

        {/* Active Filter Pill Summary */}
        {(filterColumn !== "all" || query.trim()) && (
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-border/40 text-xs">
            <span className="text-muted-foreground text-[11px] font-semibold">Active Filters:</span>
            {query.trim() && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 text-[11px] font-bold font-mono">
                Keyword: "{query}"
              </span>
            )}
            {filterColumn !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px] font-bold">
                Column: {filterableColumns.find(c => c.key === filterColumn)?.label}
                {filterValue !== "all" ? ` = "${filterValue}"` : ""}
                {customFilterText ? ` contains "${customFilterText}"` : ""}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[42rem] text-sm">
          <thead>
            <tr className="border-border/60 border-b text-left">
              <th className="text-muted-foreground p-4 text-xs tracking-widest uppercase">ID</th>
              {tableColumns.map((f) => (
                <th key={f.key} className="p-4">
                  <button
                    onClick={() => toggleSort(f.key)}
                    className="text-muted-foreground hover:text-primary inline-flex items-center gap-1 text-xs tracking-widest uppercase"
                  >
                    {f.label}
                    <ArrowUpDown className="size-3" />
                  </button>
                </th>
              ))}
              <th className="text-muted-foreground p-4 text-xs tracking-widest uppercase text-right w-24 shrink-0 sticky right-0 bg-card/95 backdrop-blur-sm shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.3)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr
                key={r.id}
                className="border-border/40 hover:bg-accent/40 border-b transition-colors last:border-0 group"
              >
                <td className="text-muted-foreground p-4 font-mono text-xs font-semibold">{r.id}</td>
                {tableColumns.map((f) => (
                  <td
                    key={f.key}
                    className={cn(
                      "p-4",
                      f.key === tableColumns[0].key ? "font-medium text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {moduleKey === "gallery" && f.key === "type" ? (
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide inline-flex items-center gap-1",
                          r[f.key] === "video"
                            ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                            : "bg-blue-500/15 text-blue-400 border border-blue-500/30",
                        )}
                      >
                        {r[f.key] === "video" ? "🎬 Video" : "📷 Photo"}
                      </span>
                    ) : f.type === "image" || (f.key === "src" && r.type === "photo") ? (
                      <div className="flex items-center gap-2">
                        {r[f.key] || r.thumb || r.src ? (
                          <img
                            src={r[f.key] || r.thumb || r.src}
                            alt="Media thumbnail"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=600&q=80";
                            }}
                            className="size-10 rounded-lg object-cover object-top border border-border/70 shadow-sm shrink-0"
                          />
                        ) : (
                          <div className="size-9 rounded-lg bg-accent/50 grid place-items-center text-muted-foreground">
                            <ImageIcon className="size-4" />
                          </div>
                        )}
                      </div>
                    ) : f.key === "affiliationDocument" ? (
                      r.affiliationDocument ? (
                        <div className="flex items-center gap-2 max-w-[18rem]">
                          <div className="size-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                            <FileText className="size-3.5" />
                          </div>
                          <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
                            <span
                              className="text-xs font-semibold text-foreground truncate max-w-[150px] font-mono"
                              title={r.affiliationDocumentName || "Official_Document.pdf"}
                            >
                              {r.affiliationDocumentName || "Official_Document.pdf"}
                            </span>
                            {r.affiliationDocumentSize && (
                              <span className="px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 text-[10px] font-mono font-bold shrink-0">
                                {r.affiliationDocumentSize}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">No document</span>
                      )
                    ) : f.key === statusKey ? (
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide inline-flex items-center",
                          ["Active", "Verified", "Affiliated", "Published", "Issued"].includes(r[f.key])
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : r[f.key] === "Incomplete"
                              ? "bg-orange-500/20 text-orange-400 border border-orange-500/40 font-bold"
                              : ["Pending", "Under Review", "In Review", "Draft", "Upcoming", "Ongoing"].includes(r[f.key])
                                ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                                : "bg-destructive/15 text-destructive border border-destructive/30",
                        )}
                      >
                        {r[f.key] === "Incomplete" ? "⚠️ Incomplete" : (r[f.key] || "—")}
                      </span>
                    ) : (
                      <span className="line-clamp-2 max-w-[22rem]">{r[f.key]}</span>
                    )}
                  </td>
                ))}
                <td className="p-4 text-right w-24 shrink-0 sticky right-0 bg-card/95 backdrop-blur-sm shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.3)]">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      aria-label={`Edit ${r[fields[0].key]}`}
                      onClick={() => startEdit(r)}
                      className="border-border/70 hover:border-primary hover:text-primary grid size-8 place-items-center rounded-lg border transition-colors cursor-pointer"
                      title="Edit Official"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      aria-label={`Delete ${r[fields[0].key]}`}
                      onClick={() => setDeleteId(r.id)}
                      className="border-border/70 hover:border-destructive hover:text-destructive grid size-8 place-items-center rounded-lg border transition-colors cursor-pointer"
                      title="Delete Official"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {visible.length === 0 && !isLoading ? (
              <tr>
                <td
                  colSpan={tableColumns.length + 2}
                  className="text-muted-foreground p-12 text-center text-sm"
                >
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="size-12 rounded-full bg-accent/40 flex items-center justify-center text-primary">
                      <Sparkles className="size-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">No records found</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {query.trim()
                          ? `No records match "${query}". Try adjusting your search query.`
                          : `No ${singular.toLowerCase()}s registered yet. Click "Add ${singular.toLowerCase()}" to create one.`}
                      </p>
                    </div>
                    {!query.trim() && (
                      <button
                        onClick={startCreate}
                        className="bg-gold-gradient text-background shadow-gold inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold mt-2"
                      >
                        <Plus className="size-3.5" /> Add First {singular}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-2xl max-h-[90vh] p-4 sm:p-6 rounded-2xl overflow-y-auto bg-card/95 border-border/80 shadow-2xl backdrop-blur-md">
          <DialogHeader className="text-left space-y-1.5 pb-2 border-b border-border/60">
            {moduleKey === "certificates" && (
              <div className="inline-flex items-center gap-1.5 self-start px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/30">
                <Sparkles className="size-3" /> Official Certificate Issuance
              </div>
            )}
            <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              {editingId ? `Edit ${singular}` : `Add New ${singular}`}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
              {editingId
                ? `Update official details for record ${editingId}.`
                : moduleKey === "certificates"
                ? "Confer an official federation certificate and automatically dispatch verification & credentials to the recipient's email."
                : `Create an official ${singular.toLowerCase()} record in the federation registry.`}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 py-3">
            {/* Preserved Legacy Association Data Card (Hidden for new registrations) */}
            {Boolean(draft.tempStateAssociation || draft.tempDistrictAssociation) && (
              <div className="sm:col-span-2 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <AlertCircle className="size-3.5" /> Preserved Legacy Association Data
                  </span>
                  <span className="text-[10px] text-muted-foreground bg-background/60 px-2 py-0.5 rounded-md font-mono">
                    Admin Reference Only
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {draft.tempStateAssociation ? (
                    <div>
                      <Label className="text-[11px] font-semibold text-muted-foreground">
                        Temporary State Association
                      </Label>
                      <Input
                        type="text"
                        readOnly
                        value={draft.tempStateAssociation}
                        className="h-9 bg-background/60 border-amber-500/30 text-xs font-medium cursor-default text-amber-200 mt-1"
                      />
                    </div>
                  ) : null}
                  {draft.tempDistrictAssociation ? (
                    <div>
                      <Label className="text-[11px] font-semibold text-muted-foreground">
                        Temporary District Association
                      </Label>
                      <Input
                        type="text"
                        readOnly
                        value={draft.tempDistrictAssociation}
                        className="h-9 bg-background/60 border-amber-500/30 text-xs font-medium cursor-default text-amber-200 mt-1"
                      />
                    </div>
                  ) : null}
                </div>
                <p className="text-[10px] text-amber-400/80">
                  ℹ️ This user originally registered with legacy state/district data. Select the active dynamic State &amp; District Associations below to officially link their profile.
                </p>
              </div>
            )}

            {fields.map((f) => {
              if (!isFieldVisible(f, draft)) return null;
              if (f.key === "affiliationDocument") return null;

              const isFull =
                f.fullWidth ||
                f.type === "textarea" ||
                f.type === "image" ||
                f.key === "emergencyContact" ||
                f.key === "registeredAddress" ||
                f.key === "summary" ||
                f.key === "body" ||
                f.key === "excerpt" ||
                f.key === "message" ||
                f.key === "title" ||
                f.key === "headline" ||
                f.key === "holder" ||
                f.key === "email" ||
                f.key === "event" ||
                f.key === "state" ||
                f.key === "specialization";

              const isStartDate = f.key === "startDate";
              const isEndDate = f.key === "endDate";
              const statusVal = draft.status || "Upcoming";

              let minDate: string | undefined = undefined;
              let maxDate: string | undefined = undefined;
              let dateHint = "";

              if (isStartDate) {
                if (statusVal === "Upcoming") {
                  minDate = todayStr;
                  dateHint = "Upcoming: Starts today or future";
                } else if (statusVal === "Ongoing") {
                  maxDate = todayStr;
                  dateHint = "Ongoing: Started on or before today";
                } else if (statusVal === "Completed") {
                  maxDate = draft.endDate || todayStr;
                  dateHint = "Completed: Started before end date";
                }
              } else if (isEndDate) {
                if (statusVal === "Upcoming") {
                  minDate = draft.startDate || todayStr;
                  dateHint = "Upcoming: Ends on/after start date";
                } else if (statusVal === "Ongoing") {
                  minDate = todayStr;
                  dateHint = "Ongoing: Active today or future";
                } else if (statusVal === "Completed") {
                  minDate = draft.startDate;
                  maxDate = todayStr;
                  dateHint = "Completed: Ended on/before today";
                }
              }

              return (
                <div key={f.key} className={cn("grid gap-1.5", isFull ? "sm:col-span-2" : "sm:col-span-1")}>
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor={`${moduleKey}-${f.key}`} className="text-xs sm:text-sm font-semibold">
                      {f.label} {f.required && <span className="text-primary">*</span>}
                    </Label>
                    <div className="flex items-center gap-2">
                      {f.onManageAction && (
                        <button
                          type="button"
                          onClick={f.onManageAction}
                          className="text-[11px] text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer transition-colors bg-primary/10 hover:bg-primary/20 border border-primary/30 px-2 py-0.5 rounded-full"
                          title={f.manageActionLabel || "Manage Options"}
                        >
                          {f.manageActionLabel || "⚙️ Manage Options"}
                        </button>
                      )}
                      {(isStartDate || isEndDate) && dateHint && (
                        <span className="text-[10px] sm:text-[11px] text-amber-400 font-medium">{dateHint}</span>
                      )}
                    </div>
                  </div>

                  {f.type === "image" ? (
                    <div className="space-y-3">
                      {draft[f.key] ? (
                        <div className="relative rounded-xl overflow-hidden border border-border/80 bg-accent/20">
                          <div className="w-full min-h-[180px] max-h-[280px] flex items-center justify-center p-3 bg-black/40 backdrop-blur-sm relative">
                            <img
                              src={draft[f.key]}
                              alt="Image Preview"
                              className="max-h-64 max-w-full h-auto w-auto object-contain rounded-lg shadow-md"
                            />
                            <div className="absolute top-2 right-2 flex gap-1 z-10">
                              <button
                                type="button"
                                onClick={() => setDraft({ ...draft, [f.key]: "" })}
                                className="size-7 rounded-full bg-background/90 hover:bg-destructive text-foreground hover:text-white grid place-items-center transition-colors shadow-md cursor-pointer"
                                title="Remove image"
                              >
                                <X className="size-4" />
                              </button>
                            </div>
                          </div>
                          <div className="p-2.5 flex items-center justify-between text-xs bg-background/95 backdrop-blur-sm border-t border-border/60">
                            <span className="flex items-center gap-1.5 text-emerald-400 font-medium truncate max-w-[280px]">
                              <CheckCircle className="size-3.5 shrink-0" />
                              <span className="truncate">
                                {draft[f.key + "Name"] || "Cloudinary Image Attached"}
                              </span>
                              {draft[f.key + "Size"] && (
                                <span className="font-mono text-[10px] text-primary font-bold shrink-0">
                                  ({draft[f.key + "Size"]})
                                </span>
                              )}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentUploadKey(f.key);
                                fileInputRef.current?.click();
                              }}
                              disabled={uploadingField === f.key}
                              className="text-primary hover:underline font-semibold shrink-0 cursor-pointer"
                            >
                              Replace image
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setCurrentUploadKey(f.key);
                            fileInputRef.current?.click();
                          }}
                          className="border-2 border-dashed border-border hover:border-primary rounded-xl p-5 sm:p-6 text-center cursor-pointer transition-colors bg-accent/20 hover:bg-accent/40"
                        >
                          {uploadingField === f.key ? (
                            <div className="flex flex-col items-center gap-2.5 py-3 animate-in fade-in zoom-in-95 duration-200">
                              <div className="relative flex items-center justify-center">
                                <div className="absolute size-12 rounded-full bg-primary/20 animate-ping" />
                                <div className="size-12 rounded-xl bg-primary/20 border border-primary/60 flex items-center justify-center text-primary font-mono text-xs font-black">
                                  {uploadProgress}%
                                </div>
                              </div>
                              <p className="text-xs font-bold text-foreground">
                                {uploadProgress === 100 ? "Upload Complete (100%)" : `Uploading Media (${uploadProgress}%)...`}
                              </p>
                              <div className="w-48 bg-accent/60 rounded-full h-1.5 overflow-hidden border border-border/80 relative">
                                <div
                                  className="h-full bg-gold-gradient rounded-full transition-all duration-200 ease-out shadow-gold"
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <div className="size-10 rounded-full bg-primary/20 text-primary grid place-items-center">
                                <Upload className="size-5" />
                              </div>
                              <p className="text-sm font-semibold">
                                Click to upload {f.label ? f.label.toLowerCase() : "image"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                PNG, JPG, WebP up to 2MB (Cloudinary)
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : f.type === "textarea" ? (
                    <Textarea
                      id={`${moduleKey}-${f.key}`}
                      rows={3}
                      value={draft[f.key] ?? ""}
                      onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                      className="rounded-xl text-sm"
                    />
                  ) : f.type === "select" ? (
                    (() => {
                      const isOtherAllowed = !!f.allowOther || (moduleKey === "officials" && f.key === "category");
                      const isCustomMode = isOtherAllowed && !!customFieldMode[f.key];

                      if (isCustomMode) {
                        return (
                          <div className="space-y-1.5 animate-in fade-in duration-200">
                            <div className="flex items-center gap-2">
                              <Input
                                id={`${moduleKey}-${f.key}`}
                                placeholder={f.placeholder || `Enter custom ${f.label.toLowerCase()}...`}
                                value={draft[f.key] ?? ""}
                                autoFocus
                                className="h-10 sm:h-11 rounded-xl text-sm font-semibold border-primary/50 focus:border-primary flex-1"
                                onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomFieldMode((prev) => ({ ...prev, [f.key]: false }));
                                  setDraft((prev) => ({
                                    ...prev,
                                    [f.key]: (f.options && f.options[0]) || "",
                                  }));
                                }}
                                className="h-10 sm:h-11 px-3 rounded-xl border border-border/80 bg-accent/40 hover:bg-accent text-xs font-semibold text-foreground flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                                title="Switch back to dropdown list"
                              >
                                <span>↩ Back to list</span>
                              </button>
                            </div>
                            <p className="text-[11px] text-primary font-medium">
                              {f.customHelperText || (moduleKey === "officials" 
                                ? "✨ Typing custom level: Upon saving, this will automatically be added to the dropdown options."
                                : "✨ Custom entry: Upon saving, this will be saved for this record.")}
                            </p>
                          </div>
                        );
                      }

                      const rawVal = draft[f.key];
                      const isStateAssocField = f.key === "state" || f.label.toLowerCase().includes("state association");
                      const opts = isStateAssocField && approvedStateOptions.length > 0
                        ? approvedStateOptions
                        : ((f.options || []) as string[]);
                      let matchedVal = rawVal;
                      if (rawVal && !opts.includes(rawVal)) {
                        const found = opts.find((opt) => {
                          if (opt.toLowerCase() === String(rawVal).toLowerCase()) return true;
                          const withoutId = opt.replace(/\s*\([^)]*\)$/, "").trim();
                          if (withoutId.toLowerCase() === String(rawVal).toLowerCase()) return true;
                          return false;
                        });
                        if (found) matchedVal = found;
                      }
                      return (
                        <div className="space-y-1.5">
                          <select
                            id={`${moduleKey}-${f.key}`}
                            value={matchedVal ?? ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "__other__") {
                                setCustomFieldMode((prev) => ({ ...prev, [f.key]: true }));
                                setDraft((prev) => ({ ...prev, [f.key]: "" }));
                                return;
                              }

                              setDraft((prev) => {
                                const updated = { ...prev, [f.key]: val };
                                if (isStateAssocField) {
                                  updated.district = "";
                                  updated.city = "";
                                }
                                if (f.key === "status") {
                                  if (val === "Upcoming" && updated.startDate && updated.startDate < todayStr) {
                                    updated.startDate = todayStr;
                                    if (updated.endDate && updated.endDate < todayStr) {
                                      updated.endDate = todayStr;
                                    }
                                  } else if (val === "Ongoing") {
                                    if (updated.startDate && updated.startDate > todayStr) {
                                      updated.startDate = todayStr;
                                    }
                                    if (updated.endDate && updated.endDate < todayStr) {
                                      updated.endDate = todayStr;
                                    }
                                  } else if (val === "Completed" && updated.endDate && updated.endDate > todayStr) {
                                    updated.endDate = todayStr;
                                  }
                                }
                                return updated;
                              });
                            }}
                            className="w-full border-input bg-background/80 h-10 sm:h-11 rounded-xl border px-3 text-sm focus:border-primary outline-none transition-colors cursor-pointer"
                          >
                            <option value="">{isStateAssocField ? "Select State Association" : `Select ${f.label}`}</option>
                            {matchedVal && !opts.includes(matchedVal) && (
                              <option value={matchedVal} className="bg-card text-foreground py-1.5">
                                {matchedVal}
                              </option>
                            )}
                            {opts.map((o) => (
                              <option key={o} value={o} className="bg-card text-foreground py-1.5">
                                {o}
                              </option>
                            ))}
                            {isOtherAllowed && (
                              <option value="__other__" className="bg-primary/20 text-primary font-bold py-1.5">
                                {f.otherOptionLabel || (moduleKey === "officials" ? "➕ Other (Specify Custom Level / Tier...)" : "Other")}
                              </option>
                            )}
                          </select>
                        </div>
                      );
                    })()
                  ) : f.type === "date" ? (
                    <Input
                      id={`${moduleKey}-${f.key}`}
                      type="date"
                      min={minDate}
                      max={maxDate}
                      value={draft[f.key] ?? ""}
                      className="h-10 sm:h-11 rounded-xl text-sm"
                      onChange={(e) => {
                        const val = e.target.value;
                        setDraft((prev) => {
                          const updated = { ...prev, [f.key]: val };
                          if (isStartDate && val && updated.endDate && updated.endDate < val) {
                            updated.endDate = val;
                          }
                          // Auto-sync status based on dates
                          if (f.key === "startDate" || f.key === "endDate") {
                            const s = isStartDate ? val : updated.startDate;
                            const end = isEndDate ? val : updated.endDate;
                            if (s && end) {
                              if (s > todayStr) {
                                updated.status = "Upcoming";
                              } else if (end < todayStr) {
                                updated.status = "Completed";
                              } else {
                                updated.status = "Ongoing";
                              }
                            }
                          }
                          return updated;
                        });
                      }}
                    />
                  ) : moduleKey === "certificates" && f.key === "number" && !editingId ? (
                    <div className="space-y-1">
                      <Input
                        id={`${moduleKey}-${f.key}`}
                        disabled
                        value="KSM-CERT-2026-XXXX (Auto-generated upon issue)"
                        className="bg-accent/40 text-muted-foreground font-mono text-xs cursor-not-allowed border-dashed h-10 sm:h-11 rounded-xl"
                      />
                      <span className="text-[10px] sm:text-[11px] text-primary/80 inline-block font-medium">
                        ✨ Unique cryptographic certificate number will be generated on save.
                      </span>
                    </div>
                  ) : f.key === "city" || f.key === "district" || f.label.toLowerCase().includes("district") ? (
                    (() => {
                      const dynamicDistOpts = getApprovedDistrictAssociationDropdownOptions(rawDistrictAssocs, draft.state);
                      const staticDistOpts = getDistrictsByState(draft.state || "Maharashtra");
                      const distOptions = dynamicDistOpts.length > 0 ? dynamicDistOpts : (staticDistOpts || []);
                      const currentVal = draft[f.key] ?? draft.district ?? draft.city ?? "";

                      if (distOptions && distOptions.length > 0) {
                        return (
                          <select
                            id={`${moduleKey}-${f.key}`}
                            value={currentVal}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraft({ ...draft, [f.key]: val, city: val, district: val });
                            }}
                            className="w-full border-input bg-background/80 h-10 sm:h-11 rounded-xl border px-3 text-sm focus:border-primary outline-none transition-colors cursor-pointer"
                          >
                            <option value="">Select District Association</option>
                            {distOptions.map((d) => (
                              <option key={d} value={d} className="bg-card text-foreground py-1.5">
                                {d}
                              </option>
                            ))}
                            {currentVal && !distOptions.includes(currentVal) && (
                              <option value={currentVal} className="bg-card text-foreground py-1.5">
                                {currentVal}
                              </option>
                            )}
                          </select>
                        );
                      }
                      return (
                        <Input
                          id={`${moduleKey}-${f.key}`}
                          type="text"
                          placeholder={f.placeholder || "e.g. Pune, Mumbai, Varanasi"}
                          value={currentVal}
                          className="h-10 sm:h-11 rounded-xl text-sm"
                          onChange={(e) =>
                            setDraft({ ...draft, [f.key]: e.target.value, city: e.target.value, district: e.target.value })
                          }
                        />
                      );
                    })()
                  ) : f.key === "password" || f.type === "password" ? (
                    <div className="relative">
                      <Input
                        id={`${moduleKey}-${f.key}`}
                        type={showPasswordFields[f.key] ? "text" : "password"}
                        placeholder={f.placeholder || "Enter password"}
                        value={draft[f.key] ?? ""}
                        className="h-10 sm:h-11 rounded-xl text-sm pr-10 font-mono"
                        onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswordFields((prev) => ({ ...prev, [f.key]: !prev[f.key] }))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors cursor-pointer"
                        title={showPasswordFields[f.key] ? "Hide password" : "Show password"}
                      >
                        {showPasswordFields[f.key] ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <Input
                      id={`${moduleKey}-${f.key}`}
                      type={f.type === "number" ? "number" : "text"}
                      placeholder={f.placeholder}
                      value={draft[f.key] ?? ""}
                      className="h-10 sm:h-11 rounded-xl text-sm"
                      onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                    />
                  )}
                </div>
              );
            })}

            {/* Academic Transfer History Multi-Entry for Players */}
            {moduleKey === "players" && (
              <div className="sm:col-span-2 pt-3 border-t border-border/60 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs sm:text-sm font-bold flex items-center gap-1.5 text-primary">
                    <GraduationCap className="size-4" /> Academic &amp; Academy Transfer History
                  </Label>
                  <span className="text-[11px] font-semibold text-muted-foreground bg-accent/40 px-2.5 py-0.5 rounded-full">
                    {(((draft as any).academicHistory as any[]) || []).length} Recorded
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Official educational &amp; sports academy transfer history of this player.
                </p>

                <div className="space-y-3">
                  {((((draft as any).academicHistory as any[]) || [])).map((item, idx) => (
                    <div key={idx} className="p-3.5 sm:p-4 rounded-xl bg-accent/20 border border-border/70 space-y-2.5 relative">
                      <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
                        <span className="text-xs font-bold text-foreground">
                          Academy Record #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = (((draft as any).academicHistory as any[]) || []).filter((_: any, i: number) => i !== idx);
                            setDraft({ ...draft, academicHistory: next as any });
                          }}
                          className="text-xs text-destructive hover:bg-destructive/15 px-2 py-0.5 rounded-lg font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Trash2 className="size-3" /> Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        <div className="sm:col-span-2">
                          <Label className="text-[11px] font-semibold">Academy / Institute Name *</Label>
                          <Input
                            value={item.academy || ""}
                            onChange={(e) => {
                              const next = [...(((draft as any).academicHistory as any[]) || [])];
                              next[idx] = { ...next[idx], academy: e.target.value };
                              setDraft({ ...draft, academicHistory: next as any });
                            }}
                            placeholder="e.g. Apex Martial Arts Academy"
                            className="h-9 text-xs mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-[11px] font-semibold">Degree / Certification</Label>
                          <Input
                            value={item.degree || ""}
                            onChange={(e) => {
                              const next = [...(((draft as any).academicHistory as any[]) || [])];
                              next[idx] = { ...next[idx], degree: e.target.value };
                              setDraft({ ...draft, academicHistory: next as any });
                            }}
                            placeholder="e.g. Black Belt 1st Dan"
                            className="h-9 text-xs mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-[11px] font-semibold">Field of Study</Label>
                          <Input
                            value={item.fieldOfStudy || ""}
                            onChange={(e) => {
                              const next = [...(((draft as any).academicHistory as any[]) || [])];
                              next[idx] = { ...next[idx], fieldOfStudy: e.target.value };
                              setDraft({ ...draft, academicHistory: next as any });
                            }}
                            placeholder="e.g. Taekwondo / Athletics"
                            className="h-9 text-xs mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-[11px] font-semibold">Starting Date</Label>
                          <Input
                            type="date"
                            value={item.startDate || ""}
                            onChange={(e) => {
                              const next = [...(((draft as any).academicHistory as any[]) || [])];
                              next[idx] = { ...next[idx], startDate: e.target.value };
                              setDraft({ ...draft, academicHistory: next as any });
                            }}
                            className="h-9 text-xs mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-[11px] font-semibold">Ending Date</Label>
                          <Input
                            type="date"
                            value={item.endDate || ""}
                            onChange={(e) => {
                              const next = [...(((draft as any).academicHistory as any[]) || [])];
                              next[idx] = { ...next[idx], endDate: e.target.value };
                              setDraft({ ...draft, academicHistory: next as any });
                            }}
                            className="h-9 text-xs mt-1"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <Label className="text-[11px] font-semibold">Description / Notes</Label>
                          <Textarea
                            rows={2}
                            value={item.description || ""}
                            onChange={(e) => {
                              const next = [...(((draft as any).academicHistory as any[]) || [])];
                              next[idx] = { ...next[idx], description: e.target.value };
                              setDraft({ ...draft, academicHistory: next as any });
                            }}
                            placeholder="Training milestones, tournament achievements, or honors..."
                            className="text-xs mt-1 resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      const current = ((draft as any).academicHistory as any[]) || [];
                      setDraft({
                        ...draft,
                        academicHistory: [
                          ...current,
                          { academy: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "", description: "" },
                        ] as any,
                      });
                    }}
                    className="w-full py-2.5 rounded-xl border border-dashed border-primary/50 text-primary hover:bg-primary/5 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="size-3.5" /> + Add Academy History Entry
                  </button>
                </div>
              </div>
            )}

            {/* Official Affiliation Document for Clubs */}
            {moduleKey === "clubs" && (
              <div className="sm:col-span-2 border-t border-border/60 pt-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-0.5">
                  <span className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
                    <FileText className="size-4 text-primary shrink-0" /> Official Affiliation Document <span className="text-primary font-bold">*</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Required for official federation affiliation
                  </span>
                </div>

                {uploadingField === "affiliationDocument" ? (
                  <div className="p-6 rounded-2xl border-2 border-dashed border-primary/50 bg-primary/5 flex flex-col items-center justify-center gap-3 animate-in fade-in zoom-in-95">
                    <div className="relative flex items-center justify-center">
                      <div className="absolute size-14 rounded-full bg-primary/20 animate-ping" />
                      <div className="size-14 rounded-2xl bg-primary/20 border border-primary/60 flex items-center justify-center text-primary font-mono text-xs font-black">
                        {uploadProgress}%
                      </div>
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-xs font-bold text-foreground">
                        {uploadProgress === 100 ? "Upload Complete (100%)" : `Uploading Document to Vault (${uploadProgress}%)...`}
                      </p>
                      <p className="text-[11px] text-muted-foreground">Encrypting & storing digital affiliation record</p>
                    </div>
                    <div className="w-48 bg-accent/60 rounded-full h-1.5 overflow-hidden border border-border/80 relative">
                      <div
                        className="h-full bg-gold-gradient rounded-full transition-all duration-200 ease-out shadow-gold"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : draft.affiliationDocument ? (
                  <div className="p-4 sm:p-5 rounded-2xl bg-card/90 border border-primary/40 shadow-sm space-y-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="size-10 sm:size-11 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                          <FileText className="size-5" />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs sm:text-sm font-bold text-foreground truncate max-w-xs sm:max-w-md">
                              {draft.affiliationDocumentName || "Official_Affiliation_Document.pdf"}
                            </p>
                            {draft.affiliationDocumentSize && (
                              <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-[10px] font-mono font-bold shrink-0">
                                {draft.affiliationDocumentSize}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5">
                            <CheckCircle2 className="size-3.5 shrink-0" /> Uploaded &amp; Available for Download
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2.5 border-t border-border/50 flex-wrap">
                      <a
                        href={draft.affiliationDocument}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-accent/70 hover:bg-accent text-foreground text-xs font-semibold border border-border transition-colors cursor-pointer"
                      >
                        <Eye className="size-3.5" /> View
                      </a>
                      <button
                        type="button"
                        onClick={() => downloadFile(draft.affiliationDocument, draft.affiliationDocumentName || "Official_Affiliation_Document.pdf")}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gold-gradient text-background text-xs font-bold shadow-gold hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        <Download className="size-3.5" /> Download
                      </button>
                      <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary/15 hover:bg-primary/25 text-primary text-xs font-semibold cursor-pointer border border-primary/30 transition-colors">
                        <UploadCloud className="size-3.5" /> Replace
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,application/pdf,image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload("affiliationDocument", file);
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setDraft({
                            ...draft,
                            affiliationDocument: "",
                            affiliationDocumentName: "",
                            affiliationDocumentSize: "",
                          });
                        }}
                        className="p-1.5 rounded-lg bg-destructive/15 text-destructive hover:bg-destructive hover:text-white transition-colors cursor-pointer ml-auto"
                        title="Remove document"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-primary/40 hover:border-primary rounded-2xl p-6 text-center cursor-pointer transition-colors bg-primary/5 hover:bg-primary/10 flex flex-col items-center justify-center gap-2 group block">
                    <div className="size-11 rounded-2xl bg-primary/15 text-primary grid place-items-center group-hover:scale-105 transition-transform">
                      <UploadCloud className="size-5" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                        Click to upload Official Affiliation Document / Certificate *
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Supports PDF, PNG, JPG, or DOCX (Max 2MB)
                      </p>
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,application/pdf,image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload("affiliationDocument", file);
                      }}
                    />
                  </label>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-3 border-t border-border/60 sm:justify-end">
            <button
              onClick={() => setOpen(false)}
              disabled={isSaving || uploadingField !== null}
              className="w-full sm:w-auto border-border/70 rounded-xl border px-5 py-2.5 text-xs sm:text-sm font-semibold hover:border-primary hover:bg-accent/30 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={isSaving || uploadingField !== null}
              className="w-full sm:w-auto bg-gold-gradient text-background shadow-gold rounded-xl px-6 py-2.5 text-xs sm:text-sm font-bold hover:opacity-95 transition-opacity disabled:opacity-50 inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSaving && <Loader2 className="size-4 animate-spin" />}
              {editingId ? "Save changes" : "Create record"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Luxury Delete Record Confirmation Modal */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md animate-in fade-in"
            onClick={() => !isDeleting && setDeleteId(null)}
          />

          <div className="relative w-full max-w-md luxe-card p-6 sm:p-7 rounded-3xl border border-destructive/40 bg-card shadow-2xl z-10 space-y-5 animate-in zoom-in-95 text-foreground">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-destructive/15 border border-destructive/30 text-destructive grid place-items-center shadow-sm">
                  <Trash2 className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Delete {singular}?
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    This action will permanently delete this record.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteId(null)}
                className="size-8 rounded-full border border-border/60 hover:bg-accent grid place-items-center text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Target Record Preview */}
            {(() => {
              const targetRow = rows.find((r) => r.id === deleteId);
              if (!targetRow) return null;
              const primaryLabel = targetRow[fields[0]?.key] || targetRow.name || targetRow.title || targetRow.id;
              const secondaryLabel = targetRow[fields[1]?.key] || targetRow.email || targetRow.role || "";

              return (
                <div className="p-4 rounded-2xl bg-accent/20 border border-border/60 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <span className="font-bold text-foreground text-sm truncate">
                      {primaryLabel}
                    </span>
                    <span className="font-mono text-[11px] text-primary">
                      {targetRow.id}
                    </span>
                  </div>
                  {secondaryLabel && (
                    <p className="text-muted-foreground text-[11px] truncate">
                      {secondaryLabel}
                    </p>
                  )}
                  {statusKey && targetRow[statusKey] && (
                    <span className="inline-block rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.2 text-[9px] font-bold uppercase mt-1">
                      Status: {targetRow[statusKey]}
                    </span>
                  )}
                </div>
              );
            })()}

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete this {singular.toLowerCase()} record from the official federation database? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteId(null)}
                className="px-5 py-2.5 rounded-full border border-border/70 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full px-5 py-2.5 text-xs font-bold shadow-sm inline-flex items-center gap-1.5 transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="size-3.5" /> Delete Record
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
