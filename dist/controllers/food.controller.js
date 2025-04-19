"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processFoodName = exports.processFoodImage = void 0;
const error_middleware_1 = require("../middleware/error.middleware");
exports.processFoodImage = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    var _a, _b, _c;
    const { imageUrl } = req.body;
    if (!imageUrl) {
        res.status(400).json({ success: false, message: 'Image URL is required' });
        return;
    }
    try {
        const PAT = process.env.CLARIFAI_PAT;
        if (!PAT) {
            throw new Error('CLARIFAI_PAT environment variable is not set');
        }
        const raw = JSON.stringify({
            "user_app_id": {
                "user_id": "clarifai",
                "app_id": "main"
            },
            "inputs": [
                {
                    "data": {
                        "image": {
                            "url": imageUrl
                        }
                    }
                }
            ]
        });
        const requestOptions = {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Authorization': 'Key ' + PAT
            },
            body: raw
        };
        const response = await fetch("https://api.clarifai.com/v2/models/food-item-recognition/outputs", requestOptions);
        const result = await response.json();
        if (!response.ok) {
            throw new Error(`Clarifai API error: ${response.status}`);
        }
        if ((_c = (_b = (_a = result === null || result === void 0 ? void 0 : result.outputs) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.concepts) {
            const concepts = result.outputs[0].data.concepts;
            const predictions = concepts.map(concept => ({
                name: concept.name,
                probability: concept.value
            }));
            res.json({
                success: true,
                foodName: predictions[0].name,
                predictions: predictions
            });
            return;
        }
        res.status(404).json({
            success: false,
            message: 'No food detected in the image'
        });
        return;
    }
    catch (error) {
        console.error('Error processing image:', error);
        res.status(500).json({
            success: false,
            message: `Error processing image: ${error.message || 'Unknown error'}`
        });
        return;
    }
});
exports.processFoodName = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { query } = req.body;
    if (!query) {
        res.status(400).json({
            success: false,
            message: 'Food query is required'
        });
        return;
    }
    try {
        const NINJA_API_KEY = process.env.NINJA_CALORIE_API_KEY;
        if (!NINJA_API_KEY) {
            throw new Error('NINJA_CALORIE_API_KEY environment variable is not set');
        }
        const response = await fetch(`https://api.calorieninjas.com/v1/nutrition?query=${encodeURIComponent(query)}`, {
            headers: {
                'X-Api-Key': NINJA_API_KEY
            }
        });
        if (!response.ok) {
            throw new Error(`CalorieNinja API error: ${response.status}`);
        }
        const data = await response.json();
        const simplifiedNutrition = data.items.map(item => ({
            name: item.name,
            calories: item.calories,
            carbs_g: item.carbohydrates_total_g,
            protein_g: item.protein_g,
            fat_g: item.fat_total_g,
            serving_size_g: item.serving_size_g
        }));
        res.json({
            success: true,
            items: simplifiedNutrition
        });
        return;
    }
    catch (error) {
        console.error('Error fetching nutrition data:', error);
        res.status(500).json({
            success: false,
            message: `Error processing food query: ${error.message}`
        });
        return;
    }
});
//# sourceMappingURL=food.controller.js.map