import tensorflow as tf
import numpy as np
import cv2
import matplotlib.pyplot as plt
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image

IMG_SIZE = 224

# ---------------------------
# Load model
# ---------------------------
model = load_model("lodging_model.keras")

# ---------------------------
# Load and preprocess image
# ---------------------------
img_path = "test.jpg"
img = image.load_img(img_path, target_size=(IMG_SIZE, IMG_SIZE))
img_array = image.img_to_array(img)
original_img = np.array(img)
img_array = np.expand_dims(img_array, axis=0)
img_array = img_array / 255.0

# ---------------------------
# Get prediction FIRST (for class-aware masking)
# ---------------------------
pred = model.predict(img_array, verbose=0)[0][0]
is_lodged = pred > 0.5
confidence = pred * 100 if is_lodged else (1 - pred) * 100

print(f"\n🔍 Raw Model Prediction: {pred:.3f}")
print(f"📋 Classification: {'LODGED' if is_lodged else 'HEALTHY'} ({confidence:.1f}% confidence)")

# ---------------------------
# CLASS-AWARE MASK GENERATION
# ---------------------------
if not is_lodged:
    # For HEALTHY images - ZERO mask
    lodged_area_percent = 0
    best_mask = np.zeros((IMG_SIZE, IMG_SIZE))
    contours = []
    used_threshold = 0
    heatmap = np.zeros((IMG_SIZE, IMG_SIZE))  # Empty heatmap
    
    # Severity for healthy images
    severity_level = "NONE"
    severity_desc = "No lodging detected"
    action = "✅ Crops are healthy, no action needed"
    
    print("\n✅ HEALTHY CROP DETECTED - No lodging mask generated")
    
    # Create basic visualizations for healthy image
    original = cv2.imread(img_path)
    original = cv2.resize(original, (IMG_SIZE, IMG_SIZE))
    
    # Create blank visualizations
    overlay = original.copy()
    mask_viz = original.copy()
    contour_viz = original.copy()
    
else:
    # For LODGED images - proceed with full Grad-CAM++ mask generation
    print("\n🌾 LODGED CROP DETECTED - Generating damage mask...")
    
    # ---------------------------
    # Get last conv layer
    # ---------------------------
    last_conv_layer = model.get_layer("Conv_1_bn")

    # ---------------------------
    # Create gradient model
    # ---------------------------
    grad_model = tf.keras.models.Model(
        [model.inputs],
        [last_conv_layer.output, model.output]
    )

    # ---------------------------
    # GRAD-CAM++ calculations
    # ---------------------------
    with tf.GradientTape() as tape:
        conv_outputs, predictions = grad_model(img_array)
        class_idx = 0
        loss = predictions[:, class_idx]

    grads = tape.gradient(loss, conv_outputs)

    first_derivative = grads
    second_derivative = first_derivative * first_derivative
    third_derivative = second_derivative * first_derivative
    global_sum = tf.reduce_sum(conv_outputs, axis=(0, 1, 2))

    alpha_num = second_derivative
    alpha_den = 2 * second_derivative + third_derivative * global_sum
    alpha_den = tf.where(alpha_den != 0.0, alpha_den, tf.ones_like(alpha_den))
    alphas = alpha_num / alpha_den
    weights = tf.reduce_sum(alphas * tf.nn.relu(first_derivative), axis=(0, 1, 2))
    weights = tf.maximum(weights, 0)
    weights /= tf.reduce_sum(weights) + 1e-8

    # Generate heatmap
    conv_outputs_np = conv_outputs[0].numpy()
    weights_np = weights.numpy()

    heatmap = np.zeros(conv_outputs_np.shape[:2], dtype=np.float32)
    for i in range(weights_np.shape[-1]):
        heatmap += weights_np[i] * conv_outputs_np[:, :, i]

    heatmap = np.maximum(heatmap, 0)
    heatmap /= np.max(heatmap) + 1e-8

    # ---------------------------
    # POST-PROCESSING
    # ---------------------------
    
    # Resize
    heatmap = cv2.resize(heatmap, (IMG_SIZE, IMG_SIZE), interpolation=cv2.INTER_CUBIC)

    # Apply CLAHE
    heatmap_uint8 = np.uint8(heatmap * 255)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    heatmap_enhanced = clahe.apply(heatmap_uint8)
    heatmap = heatmap_enhanced / 255.0

    # Multiple threshold experiment
    thresholds = [0.15, 0.20, 0.25, 0.30]
    best_mask = None
    best_area = 0

    for thresh in thresholds:
        temp_mask = np.zeros_like(heatmap)
        temp_mask[heatmap > thresh] = 1
        
        kernel = np.ones((5,5), np.uint8)
        temp_mask = cv2.morphologyEx(temp_mask.astype(np.uint8), cv2.MORPH_OPEN, kernel)
        temp_mask = cv2.morphologyEx(temp_mask, cv2.MORPH_CLOSE, kernel)
        
        area = np.sum(temp_mask) / (IMG_SIZE * IMG_SIZE) * 100
        
        if 15 < area < 70:
            best_mask = temp_mask
            best_area = area
            used_threshold = thresh
            break

    if best_mask is None:
        used_threshold = 0.20
        best_mask = np.zeros_like(heatmap)
        best_mask[heatmap > used_threshold] = 1
        kernel = np.ones((5,5), np.uint8)
        best_mask = cv2.morphologyEx(best_mask.astype(np.uint8), cv2.MORPH_OPEN, kernel)
        best_mask = cv2.morphologyEx(best_mask, cv2.MORPH_CLOSE, kernel)
        best_area = np.sum(best_mask) / (IMG_SIZE * IMG_SIZE) * 100

    lodged_area_percent = best_area

    # Find contours
    contours, _ = cv2.findContours(best_mask.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # ---------------------------
    # SEVERITY SCORING FOR LODGED IMAGES
    # ---------------------------
    if lodged_area_percent < 15:
        severity_level = "MILD"
        severity_desc = "Minor lodging, minimal yield impact"
        action = "Monitor closely, no immediate action needed"
    elif lodged_area_percent < 35:
        severity_level = "MODERATE"
        severity_desc = "Significant lodging, yield loss expected"
        action = "Prioritize harvesting in lodged areas"
    else:
        severity_level = "SEVERE"
        severity_desc = "Extensive lodging, major yield loss"
        action = "⚠️ IMMEDIATE HARVEST RECOMMENDED"

    # ---------------------------
    # VISUALIZATIONS FOR LODGED IMAGES
    # ---------------------------
    original = cv2.imread(img_path)
    original = cv2.resize(original, (IMG_SIZE, IMG_SIZE))

    # Create heatmap overlay
    heatmap_color = np.uint8(255 * heatmap)
    heatmap_color = cv2.applyColorMap(heatmap_color, cv2.COLORMAP_JET)
    overlay = cv2.addWeighted(original, 0.6, heatmap_color, 0.4, 0)

    # Create mask overlay
    mask_viz = original.copy()
    mask_viz[best_mask == 1] = [0, 255, 0]
    mask_viz = cv2.addWeighted(original, 0.6, mask_viz, 0.4, 0)

    # Create contour visualization
    contour_viz = original.copy()
    cv2.drawContours(contour_viz, contours, -1, (0, 255, 0), 2)

# ---------------------------
# DISPLAY (works for both healthy and lodged)
# ---------------------------
plt.figure(figsize=(20, 12))

# Original
plt.subplot(2, 4, 1)
plt.imshow(cv2.cvtColor(original, cv2.COLOR_BGR2RGB))
plt.title("Original Image", fontsize=14, fontweight='bold')
plt.axis("off")

# Grad-CAM++ Heatmap
plt.subplot(2, 4, 2)
if is_lodged:
    plt.imshow(cv2.cvtColor(overlay, cv2.COLOR_BGR2RGB))
    plt.title("Grad-CAM++ Heatmap", fontsize=14, fontweight='bold')
else:
    plt.imshow(cv2.cvtColor(original, cv2.COLOR_BGR2RGB))
    plt.title("No Lodging Detected", fontsize=14, fontweight='bold')
plt.axis("off")

# Mask
plt.subplot(2, 4, 3)
if is_lodged:
    plt.imshow(best_mask, cmap='gray')
    plt.title(f"Lodged Mask\n({lodged_area_percent:.1f}% area)", fontsize=14, fontweight='bold')
else:
    plt.imshow(np.zeros((IMG_SIZE, IMG_SIZE)), cmap='gray')
    plt.title("No Lodging (0% area)", fontsize=14, fontweight='bold')
plt.axis("off")

# Mask Overlay
plt.subplot(2, 4, 4)
if is_lodged:
    plt.imshow(cv2.cvtColor(mask_viz, cv2.COLOR_BGR2RGB))
    plt.title("Lodged Areas Highlighted", fontsize=14, fontweight='bold')
else:
    plt.imshow(cv2.cvtColor(original, cv2.COLOR_BGR2RGB))
    plt.title("All Areas Healthy", fontsize=14, fontweight='bold')
plt.axis("off")

# Contours
plt.subplot(2, 4, 5)
if is_lodged:
    plt.imshow(cv2.cvtColor(contour_viz, cv2.COLOR_BGR2RGB))
    plt.title(f"Lodging Boundaries\n({len(contours)} patches)", fontsize=14, fontweight='bold')
else:
    plt.imshow(cv2.cvtColor(original, cv2.COLOR_BGR2RGB))
    plt.title("No Boundaries", fontsize=14, fontweight='bold')
plt.axis("off")

# Severity
plt.subplot(2, 4, 6)
plt.axis("off")
if is_lodged:
    plt.text(0.1, 0.5, f"""
╔══════════════════════╗
║   SEVERITY REPORT    ║
╠══════════════════════╣
║ Level: {severity_level:<14} ║
║ Area: {lodged_area_percent:>5.1f}% {' ':<8} ║
╠══════════════════════╣
║ {severity_desc:<20} ║
╠══════════════════════╣
║ ACTION:              ║
║ {action:<20} ║
╚══════════════════════╝
""", fontsize=11, verticalalignment='center', fontfamily='monospace')
else:
    plt.text(0.1, 0.5, f"""
╔══════════════════════╗
║   SEVERITY REPORT    ║
╠══════════════════════╣
║ Level: {severity_level:<14} ║
║ Area: 0.0% {' ':<11} ║
╠══════════════════════╣
║ {severity_desc:<20} ║
╠══════════════════════╣
║ ACTION:              ║
║ {action:<20} ║
╚══════════════════════╝
""", fontsize=11, verticalalignment='center', fontfamily='monospace')

# Prediction
plt.subplot(2, 4, 7)
plt.axis("off")
plt.text(0.1, 0.5, f"""
╔══════════════════════╗
║   MODEL PREDICTION   ║
╠══════════════════════╣
║ Class: {'LODGED' if is_lodged else 'HEALTHY'} {' ':<8} ║
║ Confidence: {confidence:>5.1f}%{' ':<5} ║
║ Raw Score: {pred:>6.3f}{' ':<7} ║
╚══════════════════════╝
""", fontsize=11, verticalalignment='center', fontfamily='monospace')

# Threshold info
plt.subplot(2, 4, 8)
plt.axis("off")
if is_lodged:
    plt.text(0.1, 0.5, f"""
╔══════════════════════╗
║   SEGMENTATION INFO  ║
╠══════════════════════╣
║ Threshold: {used_threshold:.2f}{' ':<12} ║
║ Patches: {len(contours):>3}{' ':<14} ║
║ Method: Grad-CAM++{' ':<7} ║
║ Enhanced: CLAHE{' ':<10} ║
╚══════════════════════╝
""", fontsize=11, verticalalignment='center', fontfamily='monospace')
else:
    plt.text(0.1, 0.5, f"""
╔══════════════════════╗
║   SEGMENTATION INFO  ║
╠══════════════════════╣
║ Threshold: N/A{' ':<14} ║
║ Patches: 0{' ':<17} ║
║ Method: Skipped{' ':<9} ║
║ (Healthy Image){' ':<7} ║
╚══════════════════════╝
""", fontsize=11, verticalalignment='center', fontfamily='monospace')

plt.tight_layout()
plt.show()

# Console output
print("\n" + "="*60)
print(" 🌾 CROP LODGING ASSESSMENT REPORT - ENHANCED")
print("="*60)
if is_lodged:
    print(f"📊 Lodged Area: {lodged_area_percent:.1f}% of field")
    print(f"📍 Number of Lodged Patches: {len(contours)}")
    print(f"🎯 Threshold Used: {used_threshold:.2f}")
else:
    print(f"📊 Lodged Area: 0.0% of field")
    print(f"📍 Number of Lodged Patches: 0")
    print(f"🎯 Threshold Used: N/A")
print(f"\n⚠️  Severity Level: {severity_level}")
print(f"📝 Impact: {severity_desc}")
print(f"💡 Action: {action}")
print("="*60)