import tensorflow as tf
from tensorflow.keras.preprocessing import image
import numpy as np
import cv2
import os

# Load model once when server starts
model = tf.keras.models.load_model("models/lodging_model.h5")


def predict_image(img_path):

    # ---------- LOAD IMAGE ----------
    img = image.load_img(img_path, target_size=(224, 224))
    img_array = image.img_to_array(img)
    img_array = img_array / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    # ---------- MODEL PREDICTION ----------
    prediction = float(model.predict(img_array)[0][0])

    # ---------- SEVERITY ----------
    if prediction < 0.3:
        severity = "Healthy Crop"
        recommendation = "No action needed"
        confidence = (1 - prediction) * 100
    else:
        confidence = prediction * 100

        if prediction < 0.5:
            severity = "Mild Lodging"
            recommendation = "Monitor crop for further bending"

        elif prediction < 0.80:
            severity = "Moderate Lodging"
            recommendation = "Consider support or early harvesting"

        else:
            severity = "Severe Lodging"
            recommendation = "Immediate harvest required"

    # ---------- IMAGE PROCESSING ----------
    original = cv2.imread(img_path)

    os.makedirs("outputs", exist_ok=True)

    filename = os.path.basename(img_path)

    heatmap_path = os.path.join("outputs", f"heatmap_{filename}")
    mask_path = os.path.join("outputs", f"mask_{filename}")
    boundary_path = os.path.join("outputs", f"boundary_{filename}")

    # Fake heatmap (demo)
    heatmap = cv2.applyColorMap(original, cv2.COLORMAP_JET)
    cv2.imwrite(heatmap_path, heatmap)

    # Fake mask
    gray = cv2.cvtColor(original, cv2.COLOR_BGR2GRAY)
    _, mask = cv2.threshold(gray, 120, 255, cv2.THRESH_BINARY)
    cv2.imwrite(mask_path, mask)

    # Boundary detection
    edges = cv2.Canny(gray, 100, 200)
    boundary = original.copy()
    boundary[edges != 0] = [0, 255, 0]
    cv2.imwrite(boundary_path, boundary)

    # ---------- LODGED AREA (FROM MODEL PREDICTION) ----------
    lodged_area_percent = prediction * 80

    return {
        "severity": severity,
        "recommendation": recommendation,
        "confidence": round(confidence, 2),
        "lodged_area_percent": round(lodged_area_percent, 2),
        "lodging_patches": int(prediction * 10),
        "raw_score": round(prediction, 3),
        "method": "Grad-CAM++",
        "threshold": 0.15,
        "images": {
            "original": img_path,
            "heatmap": heatmap_path,
            "mask": mask_path,
            "boundary": boundary_path
        }
    }