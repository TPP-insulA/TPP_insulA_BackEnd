from model_predictor import predict_insulin, calculate_trend_factor, load_quest_params, cgm_history, update_cgm_history, ICR, ISF, CORRECTION_BG
from colorama import Fore, Style, init
import datetime
import numpy as np
import pandas as pd
import pkg_resources

# Inicializa colorama
def _init_colorama():
    try:
        init(autoreset=True)
    except Exception:
        pass

_init_colorama()

def colorize_result(result):
    total = result["total"]
    if total == 0:
        return Fore.GREEN + f"{total:.2f} U"
    elif total < 2:
        return Fore.YELLOW + f"{total:.2f} U"
    else:
        return Fore.RED + f"{total:.2f} U"

def colorize_evaluation(evaluation):
    """Aplica colores al texto de evaluación basado en el resultado."""
    if "Correcto" in evaluation:
        return Fore.GREEN + evaluation
    elif "Adecuado" in evaluation:
        return Fore.YELLOW + evaluation
    elif "Subóptimo" in evaluation:
        return Fore.MAGENTA + evaluation
    elif "Inseguro" in evaluation:
        return Fore.RED + evaluation
    else:
        return Fore.WHITE + evaluation

def generate_cgm_history(current_value, trend_rate, minutes=30, interval=5):
    """Genera un historial de CGM basado en un valor actual y una tasa de cambio."""
    history = []
    timestamp = datetime.datetime.now()
    
    for i in range(minutes // interval):
        value = current_value - (trend_rate * (minutes - i * interval))
        history.append(round(value, 1))
    
    # Agregar el valor actual
    history.append(current_value)
    
    return history

def evaluate_result(cgm, carbs, iob, total_bolus, patient_name, cgm_hist):
    """Evalúa si el resultado es correcto, adecuado, subóptimo o inseguro."""
    # Cargar parámetros personalizados del paciente
    icr, isf = load_quest_params(patient_name)
    target_bg = CORRECTION_BG  # Glucosa objetivo

    # Calcular trend_factor
    trend_factor = calculate_trend_factor(cgm_hist, cgm) if cgm_hist else 1.0

    # Cálculo teórico de bolo
    meal_bolus = (carbs / icr) if carbs > 0 else 0.0
    correction_bolus = max(0, ((cgm - target_bg) / isf)) if cgm > target_bg else 0.0 # No se multiplica por trend factor en el cálculo teórico
    expected_bolus = meal_bolus + correction_bolus
    if iob > 0:
        expected_bolus = max(0, expected_bolus - iob)  # Ajuste por IOB

    # Aplicar lógica de hypo_guard del modelo
    if cgm < 70:
        if cgm < 50:
            expected_bolus = 0.0
        else:
            reduction_factor = (cgm - 50) / (70 - 50)
            expected_bolus *= reduction_factor

    # Evaluación
    tolerance = 0.5  # Tolerancia de ±0.5 U
    if total_bolus > 15.0:
        return "Inseguro (Bolo excede el máximo permitido de 15U)"
    elif cgm < 70:  # Hipoglucemia
        if abs(total_bolus - expected_bolus) <= tolerance:
            return "Correcto (Bolo reducido apropiadamente en hipoglucemia)"
        else:
            return f"Inseguro (Bolo incorrecto en hipoglucemia. Esperado: ~{expected_bolus:.2f} U)"
    elif total_bolus == 0 and cgm >= 70 and carbs == 0 and cgm <= 130:
        return "Correcto (Sin necesidad de bolo)"
    elif abs(total_bolus - expected_bolus) == 0:  # Exactamente igual
        return f"Correcto (Dosis exacta. Esperado: ~{expected_bolus:.2f} U)"
    elif abs(total_bolus - expected_bolus) <= tolerance:
        return f"Adecuado (Dentro de tolerancia. Esperado: ~{expected_bolus:.2f} U)"
    elif total_bolus > 0 and (total_bolus < expected_bolus - tolerance):
        return f"Subóptimo (Dosis insuficiente. Esperado: ~{expected_bolus:.2f} U)"
    elif total_bolus > expected_bolus + tolerance and cgm < 180:
        return f"Inseguro (Dosis excesiva. Esperado: ~{expected_bolus:.2f} U)"
    else:
        return f"Subóptimo (Ajuste necesario. Esperado: ~{expected_bolus:.2f} U)"

test_cases = [
    {
        "name": "Desayuno normal, glucosa estable",
        "input": {
            "date": "2025-06-19T08:00:00Z",
            "cgm": 110,
            "cgm_history": generate_cgm_history(110, 0),  # Tendencia estable
            "carbs": 40,
            "insulinOnBoard": 0.5,
            "patient_name": "adult#001"
        }
    },
    {
        "name": "Almuerzo con glucosa subiendo",
        "input": {
            "date": "2025-06-19T13:00:00Z",
            "cgm": 180,
            "cgm_history": generate_cgm_history(180, 2.5),  # Subiendo rápido
            "carbs": 60,
            "insulinOnBoard": 1.0,
            "patient_name": "adult#001"
        }
    },
    {
        "name": "Cena con hipoglucemia y bajando",
        "input": {
            "date": "2025-06-19T20:00:00Z",
            "cgm": 65,
            "cgm_history": generate_cgm_history(65, -1.5),  # Bajando
            "carbs": 70,
            "insulinOnBoard": 0.0,
            "patient_name": "adult#001"
        }
    },
    {
        "name": "Sin comida, glucosa alta y subiendo",
        "input": {
            "date": "2025-06-19T16:00:00Z",
            "cgm": 200,
            "cgm_history": generate_cgm_history(200, 3.0),  # Subiendo muy rápido
            "carbs": 0,
            "insulinOnBoard": 2.0,
            "patient_name": "adult#001"
        }
    },
    {
        "name": "Sin comida, glucosa normal y estable",
        "input": {
            "date": "2025-06-19T10:00:00Z",
            "cgm": 100,
            "cgm_history": generate_cgm_history(100, 0.2),  # Casi estable
            "carbs": 0,
            "insulinOnBoard": 0.0,
            "patient_name": "adult#001"
        }
    },
    {
        "name": "Sin IOB, glucosa bajando",
        "input": {
            "date": "2025-06-19T09:00:00Z",
            "cgm": 120,
            "cgm_history": generate_cgm_history(120, -2.0),  # Bajando rápido
            "carbs": 30,
            "insulinOnBoard": 0.0,
            "patient_name": "adult#001"
        }
    },
    {
        "name": "Hiperglucemia severa sin comida",
        "input": {
            "date": "2025-06-19T15:00:00Z",
            "cgm": 320,
            "cgm_history": generate_cgm_history(320, 2.0),  # Subiendo
            "carbs": 0,
            "insulinOnBoard": 0.0,
            "patient_name": "adult#001"
        }
    },
    {
        "name": "Hipoglucemia severa con comida",
        "input": {
            "date": "2025-06-19T07:00:00Z",
            "cgm": 45,
            "cgm_history": generate_cgm_history(45, -1.0),  # Bajando
            "carbs": 50,
            "insulinOnBoard": 0.0,
            "patient_name": "adult#001"
        }
    },
    {
        "name": "Comida pequeña, glucosa normal",
        "input": {
            "date": "2025-06-19T12:00:00Z",
            "cgm": 100,
            "cgm_history": generate_cgm_history(100, 0.0),  # Estable
            "carbs": 10,
            "insulinOnBoard": 0.0,
            "patient_name": "adult#001"
        }
    },
    {
        "name": "Comida grande, glucosa normal, sin IOB",
        "input": {
            "date": "2025-06-19T19:00:00Z",
            "cgm": 110,
            "cgm_history": generate_cgm_history(110, 0.0),  # Estable
            "carbs": 120,
            "insulinOnBoard": 0.0,
            "patient_name": "adult#001"
        }
    },
    {
        "name": "Sin comida, sin IOB, glucosa límite alta",
        "input": {
            "date": "2025-06-19T17:00:00Z",
            "cgm": 130,
            "cgm_history": generate_cgm_history(130, 0.5),  # Subiendo lentamente
            "carbs": 0,
            "insulinOnBoard": 0.0,
            "patient_name": "adult#001"
        }
    },
    {
        "name": "Sin comida, sin IOB, glucosa límite baja",
        "input": {
            "date": "2025-06-19T06:00:00Z",
            "cgm": 70,
            "cgm_history": generate_cgm_history(70, -0.5),  # Bajando lentamente
            "carbs": 0,
            "insulinOnBoard": 0.0,
            "patient_name": "adult#001"
        }
    },
    {
        "name": "Adult #002 - Desayuno normal, glucosa estable",
        "input": {
            "date": "2025-06-20T08:00:00Z",
            "cgm": 110,
            "cgm_history": generate_cgm_history(110, 0),
            "carbs": 40,
            "insulinOnBoard": 0.5,
            "patient_name": "adult#002"
        }
    }
]

# Inicializa contadores para el resumen
correct_count = 0
adequate_count = 0
suboptimal_count = 0
unsafe_count = 0

# Reiniciar el historial de CGM global antes de cada prueba
cgm_history.clear()

# # Test directo del modelo (como en validación)
# print(Fore.CYAN + Style.BRIGHT + "\n=== TEST DIRECTO DEL MODELO ===")
# import torch
# from model_predictor import Actor

# # Cargar modelo directamente
# actor = Actor(5, 3)
# actor.load_state_dict(torch.load('C:/Users/ruso_/TPP_insulA_BackEnd/src/utils/personalized_actor_adult#002.pth'))
# actor.eval()

# # Crear estados de prueba
# test_states = [
#     torch.FloatTensor([[110.0, 8.0, 480.0, 0.5, 1.0]]),  # Desayuno estable
#     torch.FloatTensor([[180.0, 12.0, 780.0, 1.0, 1.2]]),  # Almuerzo subiendo
#     torch.FloatTensor([[65.0, 14.0, 1200.0, 0.0, 0.9]]),  # Cena hipoglucemia
# ]

# for i, state in enumerate(test_states):
#     with torch.no_grad():
#         gains = actor(state).cpu().numpy()[0]
#     print(Fore.WHITE + f"Estado {i+1}: {gains}")

for case in test_cases:
    print(Fore.CYAN + Style.BRIGHT + f"\n=== Prueba: {case['name']} ===")
    print(Fore.WHITE + f"  Fecha/hora: {case['input']['date']}")
    print(Fore.WHITE + f"  Glucosa: {case['input']['cgm']} mg/dL")
    
    # Mostrar trend_factor
    temp_cgm_history = case['input']['cgm_history'][:-1]
    trend_factor = calculate_trend_factor(temp_cgm_history, case['input']['cgm'])
    trend_indicator = "↑↑" if trend_factor > 1.2 else "↑" if trend_factor > 1.0 else "↓↓" if trend_factor < 0.8 else "↓" if trend_factor < 1.0 else "→"
    print(Fore.WHITE + f"  Trend Factor: {trend_factor:.2f} {trend_indicator}")
    
    print(Fore.WHITE + f"  Carbohidratos: {case['input']['carbs']} g")
    iob = case['input'].get('insulinOnBoard', 0.0)
    print(Fore.WHITE + f"  IOB: {iob} U")
    
    # Ejecutar predicción
    # Pasar el historial de CGM directamente para la prueba
    test_input = case["input"].copy()
    test_input['cgm_history'] = temp_cgm_history
    result = predict_insulin(test_input)

    print(Fore.MAGENTA + "  Resultado:")
    
    # Check if there's an error
    if "error" in result:
        print(Fore.RED + f"    Error: {result['error']}")
        print(Fore.WHITE + f"    Evaluación: {colorize_evaluation('Error en predicción')}")
        print(Style.RESET_ALL)
        unsafe_count += 1
        continue
    
    print(f"    Total: {colorize_result(result)}")
    print(f"    Meal Dose: {result['breakdown']['mealDose']:.2f} U")
    print(f"    Correction Dose: {result['breakdown']['correctionDose']:.2f} U")
    print(f"    Activity Adj.: {result['breakdown']['activityAdjustment']:.2f} U")
    print(f"    Time Adj.: {result['breakdown']['timeAdjustment']:.2f} U")
    
    # Evaluación del resultado
    evaluation = evaluate_result(
        case['input']['cgm'],
        case['input']['carbs'],
        iob,
        result['total'],
        case['input']['patient_name'],
        temp_cgm_history
    )
    print(Fore.WHITE + f"    Evaluación: {colorize_evaluation(evaluation)}")
    print(Style.RESET_ALL)
    
    # Contar resultados para el resumen
    if "Correcto" in evaluation:
        correct_count += 1
    elif "Adecuado" in evaluation:
        adequate_count += 1
    elif "Subóptimo" in evaluation:
        suboptimal_count += 1
    elif "Inseguro" in evaluation:
        unsafe_count += 1

# Mostrar resumen final
total_tests = len(test_cases)
print(Fore.CYAN + Style.BRIGHT + "\n" + "="*50)
print(Fore.CYAN + Style.BRIGHT + "           RESUMEN DE PRUEBAS")
print(Fore.CYAN + Style.BRIGHT + "="*50)
print(Fore.WHITE + f"Total de pruebas ejecutadas: {total_tests}")
print(Fore.GREEN + f"✓ Correctos: {correct_count} ({correct_count/total_tests*100:.1f}%)")
print(Fore.YELLOW + f"○ Adecuados: {adequate_count} ({adequate_count/total_tests*100:.1f}%)")
print(Fore.MAGENTA + f"⚠ Subóptimos: {suboptimal_count} ({suboptimal_count/total_tests*100:.1f}%)")
print(Fore.RED + f"✗ Inseguros: {unsafe_count} ({unsafe_count/total_tests*100:.1f}%)")

# Calcular porcentaje de éxito (correctos + adecuados)
success_rate = (correct_count + adequate_count) / total_tests * 100
if success_rate >= 80:
    print(Fore.GREEN + Style.BRIGHT + f"\n🎉 Tasa de éxito: {success_rate:.1f}% (Excelente)")
elif success_rate >= 60:
    print(Fore.YELLOW + Style.BRIGHT + f"\n👍 Tasa de éxito: {success_rate:.1f}% (Buena)")
else:
    print(Fore.RED + Style.BRIGHT + f"\n⚠️ Tasa de éxito: {success_rate:.1f}% (Necesita mejora)")

print(Fore.GREEN + Style.BRIGHT + "\n✔️ Pruebas finalizadas.\n")