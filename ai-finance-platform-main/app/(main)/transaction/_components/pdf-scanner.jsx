"use client";

import { useRef, useEffect } from "react";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";
import { scanPdf } from "@/actions/pdftransaction";

export function PdfScanner() {
  const fileInputRef = useRef(null);

  const {
    loading: scanPdfLoading,
    fn: scanPdfFn,
    data: scannedData,
  } = useFetch(scanPdf);

  const handlePdfScan = async (file) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size should be less than 10MB");
      return;
    }

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }

    await scanPdfFn(file);
  };

  useEffect(() => {
    if (scannedData && !scanPdfLoading) {
      toast.success(`Successfully imported ${scannedData.length} transactions`);
    }
  }, [scanPdfLoading, scannedData]);

  return (
    <div className="flex items-center gap-4">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".pdf"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handlePdfScan(file);
        }}
      />
      <Button
        type="button"
        variant="outline"
        className="w-full h-10 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 animate-gradient hover:opacity-90 transition-opacity text-white hover:text-white"
        onClick={() => fileInputRef.current?.click()}
        disabled={scanPdfLoading}
      >
        {scanPdfLoading ? (
          <>
            <Loader2 className="mr-2 animate-spin" />
            <span>Processing PDF...</span>
          </>
        ) : (
          <>
            <FileText className="mr-2" />
            <span>Upload Bank Statement PDF</span>
          </>
        )}
      </Button>
    </div>
  );
}