import tensorflow as tf
import numpy as np
import cv2
import matplotlib.pyplot as plt
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image

IMG_SIZE = 224
ULTRA_SHARP = True  # Set True to remove weak activations

# ---------------------------
# Load model
# ---------------------------
model = load_model("lodging_model.h5")

# ---------------------------
# Load and preprocess image
# ---------------------------
img_path = "test.jpg"
img = image.load_img(img_path, target_size=(IMG_SIZE, IMG_SIZE))
img_array = image.img_to_array(img)
img_array = np.expand_dims(img_array, axis=0)
img_array = img_array / 255.0

# ---------------------------
# Get last conv layer for MobileNetV2
# ---------------------------
last_conv_layer = model.get_layer("Conv_1_bn")  # Correct layer

# ---------------------------
# Create gradient model
# ---------------------------
grad_model = tf.keras.models.Model(
    [model.inputs],
    [last_conv_layer.output, model.output]
)

# ---------------------------
# Compute gradients
# ---------------------------
with tf.GradientTape() as tape:
    conv_outputs, predictions = grad_model(img_array)
    loss = predictions[:, 0]

grads = tape.gradient(loss, conv_outputs)

# ---------------------------
# Global average pooling of gradients
# ---------------------------
pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
conv_outputs = conv_outputs[0]

# ---------------------------
# Compute heatmap (element-wise multiplication)
# ---------------------------
heatmap = tf.reduce_sum(conv_outputs * pooled_grads, axis=-1)
heatmap = tf.maximum(heatmap, 0)
heatmap /= tf.reduce_max(heatmap) + 1e-8  # Normalize to [0,1]
heatmap = heatmap.numpy()

# ---------------------------
# Sharpen contrast
# ---------------------------
heatmap = np.power(heatmap, 1.5)  # Increase to 2.0 for extra sharpness
if ULTRA_SHARP:
    heatmap[heatmap < 0.4] = 0  # Remove weak activations

# ---------------------------
# Resize heatmap to image size
# ---------------------------
heatmap = cv2.resize(heatmap, (IMG_SIZE, IMG_SIZE), interpolation=cv2.INTER_CUBIC)

# Optional smoothing to remove artifacts
heatmap = cv2.GaussianBlur(heatmap, (5, 5), 0)

# ---------------------------
# Apply colormap
# ---------------------------
heatmap = np.uint8(255 * heatmap)
heatmap = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)

# ---------------------------
# Overlay heatmap on original image
# ---------------------------
original = cv2.imread(img_path)
original = cv2.resize(original, (IMG_SIZE, IMG_SIZE))
superimposed = cv2.addWeighted(original, 0.6, heatmap, 0.4, 0)

# ---------------------------
# Show result
# ---------------------------
plt.figure(figsize=(6, 6))
plt.imshow(cv2.cvtColor(superimposed, cv2.COLOR_BGR2RGB))
plt.axis("off")
plt.title("Grad-CAM Visualization")
plt.show()