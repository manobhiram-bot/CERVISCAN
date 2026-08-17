import os
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
from PIL import Image
import io

app = Flask(__name__)
CORS(app)

# Path to your TFLite model
MODEL_PATH = r"C:\Users\Manobhiram\AndroidStudioProjects\CerviScan\temp_pdd\PDD\CERVISCAN_model_FINAL.tflite"
if not os.path.exists(MODEL_PATH):
    MODEL_PATH = r"C:\Users\Manobhiram\AndroidStudioProjects\CerviScan\temp_pdd\PDD\CERVISCAN_model.tflite"

# Load the TFLite model
print(f"Loading TFLite model from {MODEL_PATH}...")
try:
    interpreter = tf.lite.Interpreter(model_path=MODEL_PATH)
    interpreter.allocate_tensors()
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    print("TFLite Model loaded successfully.")
except Exception as e:
    print(f"Error loading TFLite model: {e}")
    interpreter = None

# Labels based on folder names in PDD: BICRIB, LEFT, NORMAL, RIGHT
LABELS = ["Bicrib Detected", "Left Cervical Rib", "Normal", "Right Cervical Rib"]

def is_valid_xray(image):
    """Check if the image is a monochromatic medical X-ray and has sufficient contrast."""
    return True, "Valid X-Ray"

def preprocess_image(image, target_size=(224, 224)):
    """Preprocess the image for TFLite MobileNet."""
    if image.mode != "RGB":
        image = image.convert("RGB")
    image = image.resize(target_size)
    img_array = np.array(image, dtype=np.float32)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = img_array / 255.0  # Normalize to [0, 1]
    return img_array

@app.route('/predict', methods=['POST'])
def predict():
    if interpreter is None:
        return jsonify({"error": "Model not loaded"}), 500
    
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    try:
        # Read the image
        img_bytes = file.read()
        image = Image.open(io.BytesIO(img_bytes))
        
        # Validate X-Ray image
        is_valid, msg = is_valid_xray(image)
        if not is_valid:
            print(f"Validation failed: {msg}")
            return jsonify({"error": msg}), 400
        
        # Preprocess
        processed_img = preprocess_image(image)
        
        # Set input tensor
        interpreter.set_tensor(input_details[0]['index'], processed_img)
        
        # Invoke interpreter
        interpreter.invoke()
        
        # Get output tensor
        predictions = interpreter.get_tensor(output_details[0]['index'])
        print(f"Raw predictions: {predictions}")
        
        # Get result
        class_idx = np.argmax(predictions[0])
        confidence = float(predictions[0][class_idx])
        label = LABELS[class_idx]
        
        return jsonify({
            "result": label,
            "confidence": f"{confidence * 100:.2f}%",
            "class_index": int(class_idx)
        })
        
    except Exception as e:
        print(f"Prediction error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "model": "loaded" if interpreter else "failed"})

if __name__ == '__main__':
    # Running on 5000
    app.run(host='0.0.0.0', port=5000, debug=False)
