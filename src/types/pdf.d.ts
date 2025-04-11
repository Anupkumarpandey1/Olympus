// Type definitions for PDF.js
interface PDFDocumentProxy {
  numPages: number;
  getPage(pageNumber: number): Promise<PDFPageProxy>;
}

interface PDFPageProxy {
  getTextContent(): Promise<PDFTextContent>;
}

interface PDFTextContent {
  items: PDFTextItem[];
}

interface PDFTextItem {
  str: string;
}

interface PDFJSLib {
  getDocument(data: ArrayBuffer): PDFDocumentLoadingTask;
  GlobalWorkerOptions: {
    workerSrc: string;
  };
}

interface PDFDocumentLoadingTask {
  promise: Promise<PDFDocumentProxy>;
}

declare global {
  interface Window {
    pdfjsLib: PDFJSLib;
  }
}

export {}; 