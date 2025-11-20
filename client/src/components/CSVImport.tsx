import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, CheckCircle2, Loader2 } from "lucide-react";
import Papa from "papaparse";
import { cn } from "@/lib/utils";

export function CSVImport() {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [flightCount, setFlightCount] = useState<number>(0);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast({
        title: "Invalid File",
        description: "Please upload a valid CSV file.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setFileName(file.name);

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        setFlightCount(results.data.length);
        setIsImporting(false);
        toast({
          title: "CSV Imported Successfully",
          description: `${results.data.length} flights have been imported.`,
        });
      },
      error: (error) => {
        console.error("CSV parse error:", error);
        setIsImporting(false);
        toast({
          title: "Import Failed",
          description: "There was an error parsing the CSV file.",
          variant: "destructive",
        });
      },
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <Card
      className={cn(
        "relative p-8 rounded-2xl border border-green-500/20",
        "bg-black/50 backdrop-blur-lg shadow-[0_0_25px_rgba(0,255,140,0.08)]",
        "transition-all duration-500 hover:shadow-[0_0_30px_rgba(0,255,120,0.2)]"
      )}
    >
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 border border-green-500/30">
          <FileText className="h-6 w-6 text-green-400" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-green-300">Import Flight History</h2>
          <p className="text-sm text-gray-400">Upload your Flighty CSV export</p>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center text-center rounded-2xl border-2 border-dashed p-10 transition-all cursor-pointer",
          isDragging
            ? "border-green-400 bg-green-500/10 shadow-[0_0_20px_rgba(0,255,120,0.3)]"
            : "border-green-900/50 bg-black/30 hover:border-green-400/70 hover:bg-green-500/5"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 border border-green-500/30">
            {isImporting ? (
              <Loader2 className="h-8 w-8 text-green-400 animate-spin" />
            ) : (
              <Upload className="h-8 w-8 text-green-400" />
            )}
          </div>

          <div>
            <p className="text-lg font-medium text-green-200">
              Drop your CSV file here
            </p>
            <p className="mt-1 text-sm text-gray-500">or click to browse</p>
          </div>

          <Button
            type="button"
            disabled={isImporting}
            className={cn(
              "mt-2 px-5 py-2 rounded-lg border border-green-500/30 text-green-300 font-semibold",
              "bg-black/40 shadow-[0_0_10px_rgba(0,255,140,0.15)]",
              "hover:bg-green-500/20 hover:text-green-200 hover:shadow-[0_0_15px_rgba(0,255,120,0.3)]",
              "transition-all duration-300 active:scale-[0.98]"
            )}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isImporting ? "Importing..." : "Browse CSV"}
          </Button>
        </div>
      </div>

      {/* File Info */}
      {fileName && (
        <div className="mt-6 flex items-center justify-between rounded-xl border border-green-900/40 bg-green-500/5 px-5 py-3">
          <div>
            <p className="text-sm text-green-300 font-medium">{fileName}</p>
            <p className="text-xs text-gray-500">{flightCount} flights imported</p>
          </div>
          <CheckCircle2 className="h-6 w-6 text-green-400" />
        </div>
      )}
    </Card>
  );
}
