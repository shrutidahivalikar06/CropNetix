import tensorflow as tf
from tensorflow.keras.preprocessing import image
import numpy as np

# Load model once when server starts
model = tf.keras.models.load_model("models/lodging_model.h5")


def predict_image(img_path):

    img = image.load_img(img_path, target_size=(224, 224))
    img_array = image.img_to_array(img)
    img_array = img_array / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    prediction = model.predict(img_array)[0][0]

    if prediction < 0.5:
        severity = "Healthy Crop"
        recommendation = "No action needed"
        confidence = (1 - prediction) * 100

    else:
        confidence = prediction * 100

        if prediction < 0.65:
            severity = "Mild Lodging"
            recommendation = "Monitor crop for further bending"

        elif prediction < 0.80:
            severity = "Moderate Lodging"
            recommendation = "Consider support or early harvesting"

        else:
            severity = "Severe Lodging"
            recommendation = "Immediate intervention required"

    return {
        "severity": severity,
        "recommendation": recommendation,
        "confidence": round(float(confidence), 2)
    }