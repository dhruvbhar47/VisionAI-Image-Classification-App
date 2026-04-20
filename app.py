import io
import os

import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS
from PIL import Image, ImageOps, UnidentifiedImageError
from tensorflow.keras.applications import MobileNetV2  # pyright: ignore[reportMissingImports]
from tensorflow.keras.applications.mobilenet_v2 import (  # pyright: ignore[reportMissingImports]
    decode_predictions,
    preprocess_input,
)
from tensorflow.keras.preprocessing import image as keras_image  # pyright: ignore[reportMissingImports]

app = Flask(__name__)
CORS(app)

# Load pre-trained MobileNetV2 model (ImageNet weights)
print("Loading model...")
model = MobileNetV2(weights="imagenet")
print("Model loaded successfully.")

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def preprocess_image(img_bytes):
    """Preprocess image bytes for MobileNetV2."""
    img = Image.open(io.BytesIO(img_bytes))
    img = ImageOps.exif_transpose(img).convert("RGB")
    img = ImageOps.fit(
        img,
        (224, 224),
        method=Image.Resampling.LANCZOS,
        centering=(0.5, 0.5),
    )
    img_array = keras_image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = preprocess_input(img_array)
    return img_array


def build_analysis(results):
    top_confidence = results[0]["confidence"]
    second_confidence = results[1]["confidence"] if len(results) > 1 else 0.0
    margin_vs_second = round(top_confidence - second_confidence, 2)

    if top_confidence >= 75 and margin_vs_second >= 20:
        confidence_band = "High"
        note = "The model has a strong lead on this broad category."
    elif top_confidence >= 50 and margin_vs_second >= 10:
        confidence_band = "Moderate"
        note = "The top guess looks reasonable, but nearby alternatives are still plausible."
    else:
        confidence_band = "Low"
        note = "This image looks ambiguous for a general-purpose classifier."

    return {
        "confidence_band": confidence_band,
        "top_confidence": top_confidence,
        "margin_vs_second": margin_vs_second,
        "note": note,
        "guidance": (
            "This demo uses a general ImageNet model. It works best on one clear subject and may "
            "struggle with flowers, branches, bark, statues, miniatures, or visually busy scenes."
        ),
    }

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": "MobileNetV2", "dataset": "ImageNet (1000 classes)"})

@app.route("/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "No file part in request"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "File type not allowed. Use PNG, JPG, JPEG, GIF, or WEBP."}), 400

    try:
        img_bytes = file.read()
        if not img_bytes:
            return jsonify({"error": "Uploaded file is empty"}), 400

        processed = preprocess_image(img_bytes)

        predictions = model.predict(processed, verbose=0)
        decoded = decode_predictions(predictions, top=5)[0]

        results = [
            {
                "class_id": pred[0],
                "label": pred[1].replace("_", " ").title(),
                "confidence": float(round(pred[2] * 100, 2)),
            }
            for pred in decoded
        ]

        return jsonify({
            "success": True,
            "predictions": results,
            "top_prediction": results[0],
            "analysis": build_analysis(results),
        })

    except (UnidentifiedImageError, OSError):
        return jsonify({"error": "Invalid image file. Please upload a real image."}), 400
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {e}"}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5002))
    app.run(host="0.0.0.0", port=port, debug=False)
