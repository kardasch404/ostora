import { parentPort, workerData } from 'worker_threads';
import * as natural from 'natural';

interface MatchTask {
  cvText: string;
  jobDescription: string;
  taskId: string;
}

function calculateTfIdfMatch(cvText: string, jobDescription: string): number {
  const TfIdf = natural.TfIdf;
  const tfidf = new TfIdf();
  
  tfidf.addDocument(cvText);
  tfidf.addDocument(jobDescription);
  
  const cvTerms = new Set<string>();
  tfidf.listTerms(0).forEach((item: any) => {
    if (item.tfidf > 0.1) cvTerms.add(item.term);
  });
  
  const jobTerms = new Set<string>();
  tfidf.listTerms(1).forEach((item: any) => {
    if (item.tfidf > 0.1) jobTerms.add(item.term);
  });
  
  const intersection = new Set([...cvTerms].filter(x => jobTerms.has(x)));
  const union = new Set([...cvTerms, ...jobTerms]);
  
  const jaccardSimilarity = intersection.size / union.size;
  return Math.round(jaccardSimilarity * 100);
}

if (parentPort) {
  const task: MatchTask = workerData;
  
  try {
    const matchScore = calculateTfIdfMatch(task.cvText, task.jobDescription);
    
    parentPort.postMessage({
      taskId: task.taskId,
      success: true,
      matchScore,
    });
  } catch (error) {
    parentPort.postMessage({
      taskId: task.taskId,
      success: false,
      error: error.message,
    });
  }
}
