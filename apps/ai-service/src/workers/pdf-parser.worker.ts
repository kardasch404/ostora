import { parentPort, workerData } from 'worker_threads';
import * as pdfjsLib from 'pdfjs-dist';

interface PdfParseTask {
  pdfUrl: string;
  taskId: string;
}

async function parsePdf(pdfUrl: string): Promise<string> {
  try {
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText.trim();
  } catch (error) {
    throw new Error(`PDF parsing failed: ${error.message}`);
  }
}

if (parentPort) {
  const task: PdfParseTask = workerData;
  
  parsePdf(task.pdfUrl)
    .then((text) => {
      parentPort.postMessage({
        taskId: task.taskId,
        success: true,
        text,
      });
    })
    .catch((error) => {
      parentPort.postMessage({
        taskId: task.taskId,
        success: false,
        error: error.message,
      });
    });
}
