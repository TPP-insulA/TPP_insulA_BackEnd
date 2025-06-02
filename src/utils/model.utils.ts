import { spawn } from 'child_process';
import { InsulinPredictionData } from '../models';

export const getModelPrediction = async (data: InsulinPredictionData): Promise<number> => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', ['src/utils/model_predictor.py']);
    
    let result = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python process error:', error);
        reject(new Error(`Python process exited with code ${code}`));
        return;
      }

      try {
        const prediction = JSON.parse(result);
        if (prediction.error) {
          reject(new Error(prediction.error));
          return;
        }
        resolve(prediction.total);
      } catch (e) {
        reject(new Error('Failed to parse Python script output'));
      }
    });

    pythonProcess.stdin.write(JSON.stringify(data));
    pythonProcess.stdin.end();
  });
}; 