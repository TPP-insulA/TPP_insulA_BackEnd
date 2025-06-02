import sys
import json
import datetime
import numpy as np
from stable_baselines3 import PPO
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def prepare_observation(cgm_values, hour_of_day, carb_input, insulin_on_board):
    logger.info('Preparing observation with parameters:')
    logger.info(f'CGM values length: {len(cgm_values)}')
    logger.info(f'Hour of day: {hour_of_day}')
    logger.info(f'Carb input: {carb_input}')
    logger.info(f'Insulin on board: {insulin_on_board}')
    
    cgm_values = [float(x) for x in cgm_values]
    cgm_values = [np.log1p(x) for x in cgm_values]
    cgm_values = cgm_values + [0] * (24 - len(cgm_values)) if len(cgm_values) < 24 else cgm_values[:24]
    hour_of_day_norm = hour_of_day / 24.0
    carb_log = np.log1p(float(carb_input))
    iob_log = np.log1p(float(insulin_on_board))
    bolus_log = 0.0
    observation = np.concatenate([cgm_values, [hour_of_day_norm, bolus_log, carb_log, iob_log]])
    logger.info(f'Observation shape: {observation.shape}')
    return observation.astype(np.float32)

def predict_insulin(data):
    try:
        logger.info('Starting insulin prediction')
        logger.info(f'Input data: {json.dumps(data, indent=2)}')
        
        # Load the model
        logger.info('Loading model from drl_model.zip')
        model = PPO.load("drl_model.zip")
        logger.info('Model loaded successfully')
        
        # Parse the input data
        request_date = datetime.datetime.fromisoformat(data['date'].replace('Z', '+00:00'))
        hour_of_day = request_date.hour
        logger.info(f'Request date: {request_date}, Hour of day: {hour_of_day}')
        
        # Prepare observation
        logger.info('Preparing observation for model')
        obs = prepare_observation(
            data['cgmPrev'],
            hour_of_day,
            data['carbs'],
            data['insulinOnBoard']
        )
        
        # Get prediction
        logger.info('Getting prediction from model')
        action, _ = model.predict(obs, deterministic=True)
        total_dose = float(action[0])
        logger.info(f'Model prediction: {total_dose}')
        
        # Return the prediction
        result = {
            "total": total_dose,
            "breakdown": {
                "correctionDose": total_dose,
                "mealDose": 0.0,
                "activityAdjustment": 0.0,
                "timeAdjustment": 0.0
            }
        }
        logger.info(f'Returning result: {json.dumps(result, indent=2)}')
        return result
    except Exception as e:
        logger.error(f'Error in predict_insulin: {str(e)}', exc_info=True)
        return {"error": str(e)}

if __name__ == "__main__":
    try:
        logger.info('Starting model predictor script')
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        logger.info('Input data received')
        result = predict_insulin(input_data)
        print(json.dumps(result))
        logger.info('Prediction completed and result sent')
    except Exception as e:
        logger.error(f'Error in main: {str(e)}', exc_info=True)
        print(json.dumps({"error": str(e)})) 