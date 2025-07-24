from model_predictor import predict_insulin, calculate_trend_factor, load_quest_params, cgm_history, update_cgm_history, ICR, ISF, CORRECTION_BG
from colorama import Fore, Style, init
import datetime
import numpy as np
import pandas as pd
import pkg_resources
import os
from pathlib import Path
import json

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
        return Fore.WHITE + f"{total:.2f} U"
    elif total < 2:
        return Fore.WHITE + f"{total:.2f} U"
    else:
        return Fore.WHITE + f"{total:.2f} U"

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

def get_available_models():
    """Obtiene la lista de modelos personalizados disponibles."""
    utils_dir = Path(__file__).parent
    models = []
    
    # Buscar modelos personalizados
    for i in range(1, 11):
        model_name = f"adult#{i:03d}"
        model_path = utils_dir / f"personalized_actor_{model_name}.pth"
        if model_path.exists():
            models.append(model_name)
    
    # Agregar modelo de población
    population_path = utils_dir / "population_actor.pth"
    if population_path.exists():
        models.append("population")
    
    return models

# Criterios de evaluación
def evaluate_result(cgm, carbs, iob, total_bolus, patient_name, cgm_hist):
    """Evalúa si el resultado es correcto, adecuado, subóptimo o inseguro."""
    # Cargar parámetros personalizados del paciente
    icr, isf = load_quest_params(patient_name)
    target_bg = CORRECTION_BG  # Glucosa objetivo

    # Calcular trend_factor
    trend_factor = calculate_trend_factor(cgm_hist, cgm) if cgm_hist else 1.0

    # Cálculo teórico de bolo
    meal_bolus = (carbs / icr) if carbs > 0 else 0.0
    correction_bolus = max(0, ((cgm - target_bg) / isf)) if cgm > target_bg else 0.0
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

def get_evaluation_score(evaluation):
    """Convierte la evaluación en un puntaje numérico para comparación."""
    if "Correcto" in evaluation:
        return 4
    elif "Adecuado" in evaluation:
        return 3
    elif "Subóptimo" in evaluation:
        return 2
    elif "Inseguro" in evaluation:
        return 1
    else:
        return 0

# Casos de prueba completos
test_cases = [
    {
        "name": "Desayuno normal, glucosa estable",
        "input": {
            "date": "2025-06-19T08:00:00Z",
            "cgm": 110,
            "cgm_history": generate_cgm_history(110, 0),
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
            "cgm_history": generate_cgm_history(180, 2.5),
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
            "cgm_history": generate_cgm_history(65, -1.5),
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
            "cgm_history": generate_cgm_history(200, 3.0),
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
            "cgm_history": generate_cgm_history(100, 0.2),
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
            "cgm_history": generate_cgm_history(120, -2.0),
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
            "cgm_history": generate_cgm_history(320, 2.0),
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
            "cgm_history": generate_cgm_history(45, -1.0),
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
            "cgm_history": generate_cgm_history(100, 0.0),
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
            "cgm_history": generate_cgm_history(110, 0.0),
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
            "cgm_history": generate_cgm_history(130, 0.5),
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
            "cgm_history": generate_cgm_history(70, -0.5),
            "carbs": 0,
            "insulinOnBoard": 0.0,
            "patient_name": "adult#001"
        }
    }
]

def test_single_model(model_name, verbose=True):
    """Prueba un modelo específico con todos los casos de prueba."""
    results = []
    
    if verbose:
        print(Fore.CYAN + Style.BRIGHT + f"\n{'='*60}")
        print(Fore.CYAN + Style.BRIGHT + f"PROBANDO MODELO: {model_name}")
        print(Fore.CYAN + Style.BRIGHT + f"{'='*60}")
    
    for i, case in enumerate(test_cases):
        # Crear una copia del caso de prueba con el modelo específico
        test_input = case["input"].copy()
        test_input["patient_name"] = model_name
        
        # Ejecutar predicción
        try:
            result = predict_insulin(test_input)
            
            if "error" in result:
                evaluation = "Error en predicción"
                score = 0
            else:
                evaluation = evaluate_result(
                    test_input['cgm'],
                    test_input['carbs'],
                    test_input.get('insulinOnBoard', 0.0),
                    result['total'],
                    model_name,
                    test_input['cgm_history'][:-1]
                )
                score = get_evaluation_score(evaluation)
            
            results.append({
                "test_case": case["name"],
                "model": model_name,
                "cgm": test_input['cgm'],
                "carbs": test_input['carbs'],
                "iob": test_input.get('insulinOnBoard', 0.0),
                "predicted_bolus": result.get('total', 0.0),
                "meal_dose": result.get('breakdown', {}).get('mealDose', 0.0),
                "correction_dose": result.get('breakdown', {}).get('correctionDose', 0.0),
                "evaluation": evaluation,
                "score": score,
                "error": result.get('error', None)
            })
            
            if verbose:
                print(Fore.WHITE + f"  Test {i+1:2d}: {case['name'][:30]:<30} | "
                      f"Bolo: {result.get('total', 0.0):5.2f}U | "
                      f"Eval: {evaluation[:20]:<20}")
                
        except Exception as e:
            if verbose:
                print(Fore.RED + f"  Test {i+1:2d}: Error - {str(e)}")
            results.append({
                "test_case": case["name"],
                "model": model_name,
                "cgm": test_input['cgm'],
                "carbs": test_input['carbs'],
                "iob": test_input.get('insulinOnBoard', 0.0),
                "predicted_bolus": 0.0,
                "meal_dose": 0.0,
                "correction_dose": 0.0,
                "evaluation": f"Error: {str(e)}",
                "score": 0,
                "error": str(e)
            })
    
    return results

def generate_comparison_table(all_results):
    """Genera una tabla comparativa de rendimiento entre modelos."""
    # Agrupar resultados por modelo
    model_stats = {}
    
    for result in all_results:
        model = result["model"]
        if model not in model_stats:
            model_stats[model] = {
                "correct": 0,
                "adequate": 0,
                "suboptimal": 0,
                "unsafe": 0,
                "errors": 0,
                "total_score": 0,
                "total_tests": 0,
                "avg_bolus": 0.0,
                "bolus_values": []
            }
        
        stats = model_stats[model]
        stats["total_tests"] += 1
        stats["total_score"] += result["score"]
        stats["bolus_values"].append(result["predicted_bolus"])
        
        if result["error"]:
            stats["errors"] += 1
        elif "Correcto" in result["evaluation"]:
            stats["correct"] += 1
        elif "Adecuado" in result["evaluation"]:
            stats["adequate"] += 1
        elif "Subóptimo" in result["evaluation"]:
            stats["suboptimal"] += 1
        elif "Inseguro" in result["evaluation"]:
            stats["unsafe"] += 1
    
    # Calcular promedios
    for model, stats in model_stats.items():
        if stats["total_tests"] > 0:
            stats["avg_bolus"] = np.mean(stats["bolus_values"])
            stats["avg_score"] = stats["total_score"] / stats["total_tests"]
            stats["success_rate"] = (stats["correct"] + stats["adequate"]) / stats["total_tests"] * 100
    
    return model_stats

def print_comparison_table(model_stats):
    """Imprime la tabla comparativa de rendimiento."""
    print(Fore.CYAN + Style.BRIGHT + "\n" + "="*120)
    print(Fore.CYAN + Style.BRIGHT + "                           TABLA COMPARATIVA DE RENDIMIENTO")
    print(Fore.CYAN + Style.BRIGHT + "="*120)
    
    # Encabezados
    headers = [
        "Modelo", "Correctos", "Adecuados", "Subóptimos", "Inseguros", 
        "Errores", "Puntaje", "Tasa Éxito", "Bolo Prom."
    ]
    
    # Imprimir encabezados
    header_line = "|".join(f" {h:<12}" for h in headers)
    print(Fore.WHITE + f"|{header_line}|")
    print(Fore.WHITE + "-" * 120)
    
    # Ordenar modelos por puntaje promedio
    sorted_models = sorted(model_stats.items(), key=lambda x: x[1]["avg_score"], reverse=True)
    
    for model, stats in sorted_models:
        correct = stats["correct"]
        adequate = stats["adequate"]
        suboptimal = stats["suboptimal"]
        unsafe = stats["unsafe"]
        errors = stats["errors"]
        avg_score = stats["avg_score"]
        success_rate = stats["success_rate"]
        avg_bolus = stats["avg_bolus"]
        
        # Colorear según el rendimiento
        if success_rate >= 80:
            model_color = Fore.GREEN
        elif success_rate >= 60:
            model_color = Fore.YELLOW
        else:
            model_color = Fore.RED
        
        line = f"| {model_color}{model:<12}{Style.RESET_ALL}|"
        line += f" {Fore.GREEN}{correct:<12}{Style.RESET_ALL}|"
        line += f" {Fore.YELLOW}{adequate:<12}{Style.RESET_ALL}|"
        line += f" {Fore.MAGENTA}{suboptimal:<12}{Style.RESET_ALL}|"
        line += f" {Fore.RED}{unsafe:<12}{Style.RESET_ALL}|"
        line += f" {Fore.RED}{errors:<12}{Style.RESET_ALL}|"
        line += f" {Fore.CYAN}{avg_score:<8.2f}{Style.RESET_ALL}|"
        line += f" {Fore.CYAN}{success_rate:<8.1f}%{Style.RESET_ALL}|"
        line += f" {Fore.WHITE}{avg_bolus:<8.2f}{Style.RESET_ALL}|"
        
        print(line)
    
    print(Fore.WHITE + "-" * 120)

def save_results_to_csv(all_results, model_stats):
    """Guarda los resultados en archivos CSV."""
    # Crear DataFrame con todos los resultados
    df_results = pd.DataFrame(all_results)
    
    # Crear DataFrame con estadísticas de modelos
    df_stats = pd.DataFrame.from_dict(model_stats, orient='index')
    df_stats.index.name = 'model'
    df_stats.reset_index(inplace=True)
    
    # Guardar archivos
    df_results.to_csv('model_testing_results.csv', index=False)
    df_stats.to_csv('model_comparison_stats.csv', index=False)
    
    print(Fore.GREEN + f"\n✅ Resultados guardados en:")
    print(Fore.WHITE + f"   - model_testing_results.csv (resultados detallados)")
    print(Fore.WHITE + f"   - model_comparison_stats.csv (estadísticas comparativas)")

def main():
    """Función principal que ejecuta todas las pruebas."""
    print(Fore.CYAN + Style.BRIGHT + "🚀 INICIANDO PRUEBAS COMPARATIVAS DE MODELOS")
    print(Fore.CYAN + Style.BRIGHT + "="*60)
    
    # Obtener modelos disponibles
    available_models = get_available_models()
    print(Fore.WHITE + f"Modelos encontrados: {len(available_models)}")
    for model in available_models:
        print(Fore.WHITE + f"  - {model}")
    
    if not available_models:
        print(Fore.RED + "❌ No se encontraron modelos para probar")
        return
    
    # Ejecutar pruebas para cada modelo
    all_results = []
    
    for model in available_models:
        try:
            results = test_single_model(model, verbose=True)
            all_results.extend(results)
        except Exception as e:
            print(Fore.RED + f"❌ Error probando modelo {model}: {str(e)}")
    
    # Generar tabla comparativa
    model_stats = generate_comparison_table(all_results)
    print_comparison_table(model_stats)
    
    # Guardar resultados
    save_results_to_csv(all_results, model_stats)
    
    # Mostrar mejor modelo
    best_model = max(model_stats.items(), key=lambda x: x[1]["avg_score"])
    print(Fore.GREEN + Style.BRIGHT + f"\n🏆 MEJOR MODELO: {best_model[0]}")
    print(Fore.WHITE + f"   Puntaje promedio: {best_model[1]['avg_score']:.2f}")
    print(Fore.WHITE + f"   Tasa de éxito: {best_model[1]['success_rate']:.1f}%")
    
    print(Fore.GREEN + Style.BRIGHT + "\n✅ Pruebas completadas exitosamente!")

if __name__ == "__main__":
    main()