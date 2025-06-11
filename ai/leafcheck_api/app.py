from flask import Flask, request, jsonify, render_template
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import numpy as np
from PIL import Image
import io
import base64
import os

app = Flask(__name__)
model = load_model('model/leaf_model.h5')  # Ensure this path is correct
print("Model output shape:", model.output_shape)

# Adjust these to match your model's class labels
class_names = ['Pepper_bell_Bacterial_spot', 'Pepper_bell_healthy', 'Potato_healthy',
               'Potato_late_blight','Tomato_Tomato_mosaic_virus','Tomato_Bacterial_spot',
               'Tomato_healthy', 'Tomato_Septorial_leaf_spot']

@app.route('/')
def index():
    return render_template('predict.html')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        img_data = data['image']
        img_bytes = base64.b64decode(img_data.split(',')[1])
        img = Image.open(io.BytesIO(img_bytes)).convert('RGB').resize((128, 128))  # convert to RGB
        img_array = image.img_to_array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)

        predictions = model.predict(img_array)

        # Debug info
        print("Prediction shape:", predictions.shape)
        print("Prediction values:", predictions)

        if predictions.size == 0:
            return jsonify({'error': 'Empty prediction result'}), 500

        if predictions.ndim != 2 or predictions.shape[0] != 1:
            return jsonify({'error': f'Unexpected prediction shape: {predictions.shape}'}), 500

        preds = predictions[0]

        if len(preds) != len(class_names):
            return jsonify({'error': 'Mismatch between number of classes and prediction output'}), 500

        top_idx = np.argmax(preds)
        confidence = float(preds[top_idx])

        result = {
            'class': class_names[top_idx],
            'confidence': confidence
        }

        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
