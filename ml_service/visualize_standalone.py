
import json
import os
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np

def visualize():
    try:
        metrics_path = os.path.join(os.path.dirname(__file__), 'metrics.json')
        if not os.path.exists(metrics_path):
            print("Metrics file not found.")
            return

        with open(metrics_path, 'r') as f:
            metrics = json.load(f)

        cm_data = metrics.get('confusion_matrix', {})
        cm = np.array([
            [cm_data.get('tn', 0), cm_data.get('fp', 0)],
            [cm_data.get('fn', 0), cm_data.get('tp', 0)]
        ])

        plt.figure(figsize=(8, 6))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                    xticklabels=['Predicted: No', 'Predicted: Yes'],
                    yticklabels=['Actual: No', 'Actual: Yes'])
        plt.title(f'Confusion Matrix (Acc: {metrics.get("accuracy", 0):.2f})')
        plt.ylabel('True Label')
        plt.xlabel('Predicted Label')
        plt.show()

    except Exception as e:
        print(f"Error in visualization: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    visualize()
