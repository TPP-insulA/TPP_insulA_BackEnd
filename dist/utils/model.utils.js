"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModelPrediction = void 0;
const child_process_1 = require("child_process");
const getModelPrediction = async (data) => {
    return new Promise((resolve, reject) => {
        const pythonProcess = (0, child_process_1.spawn)('python', ['src/utils/model_predictor.py']);
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
            }
            catch (e) {
                reject(new Error('Failed to parse Python script output'));
            }
        });
        pythonProcess.stdin.write(JSON.stringify(data));
        pythonProcess.stdin.end();
    });
};
exports.getModelPrediction = getModelPrediction;
//# sourceMappingURL=model.utils.js.map