import React, { useCallback, useRef, useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");

const captureTips = [
  "Keep one clear subject in the frame.",
  "Move closer so the subject fills more of the image.",
  "Busy backgrounds can confuse a general-purpose model.",
];

const qualityNotes = [
  "Best for broad categories such as common animals or objects.",
  "Less reliable for flowers, branches, textures, statues, and miniatures.",
  "Use the alternate guesses when the confidence looks low.",
];

function buildFallbackAnalysis(predictions) {
  if (!predictions?.length) return null;

  const topConfidence = predictions[0].confidence;
  const secondConfidence = predictions[1]?.confidence ?? 0;
  const margin = Number((topConfidence - secondConfidence).toFixed(2));

  if (topConfidence >= 75 && margin >= 20) {
    return {
      confidence_band: "High",
      margin_vs_second: margin,
      note: "The model has a strong lead on this broad category.",
      guidance:
        "General ImageNet models still work best on one clear subject, but this result is relatively confident.",
    };
  }

  if (topConfidence >= 50 && margin >= 10) {
    return {
      confidence_band: "Moderate",
      margin_vs_second: margin,
      note: "The top guess looks reasonable, but nearby alternatives are still plausible.",
      guidance:
        "For mixed scenes or detailed natural images, check the next few predictions before trusting the top label.",
    };
  }

  return {
    confidence_band: "Low",
    margin_vs_second: margin,
    note: "This image looks ambiguous for a general-purpose classifier.",
    guidance:
      "Treat the top label as a rough guess. Flowers, bark, branches, miniatures, and patterned backgrounds are common failure cases.",
  };
}

function formatPercent(value) {
  return `${Number(value).toFixed(2)}%`;
}

function App() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = useCallback(
    (file) => {
      if (!file) return;

      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(file.type)) {
        setError("Please upload a valid image file: JPG, PNG, GIF, or WEBP.");
        return;
      }

      if (preview) {
        URL.revokeObjectURL(preview);
      }

      setImage(file);
      setPreview(URL.createObjectURL(file));
      setPredictions(null);
      setAnalysis(null);
      setError(null);
    },
    [preview]
  );

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      setDragOver(false);
      handleFile(event.dataTransfer.files[0]);
    },
    [handleFile]
  );

  const handleInputChange = (event) => {
    handleFile(event.target.files[0]);
  };

  const handlePredict = async () => {
    if (!image) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", image);

      const response = await axios.post(`${API_URL}/predict`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setPredictions(response.data.predictions);
      setAnalysis(response.data.analysis || null);
    } catch (err) {
      setError(
        err.response?.data?.error || "Prediction failed. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setImage(null);
    setPreview(null);
    setPredictions(null);
    setAnalysis(null);
    setError(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const topPrediction = predictions?.[0];
  const activeAnalysis = analysis || buildFallbackAnalysis(predictions);
  const confidenceTone = activeAnalysis?.confidence_band?.toLowerCase() || "low";

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">VisionAI</p>
          <h1>Minimal image classification with clearer confidence.</h1>
          <p className="hero-text">
            Upload a photo to get broad ImageNet predictions, a confidence readout, and a
            clearer warning when the scene is too ambiguous for a general-purpose model.
          </p>
        </div>

        <div className="hero-card">
          <div className="hero-stat">
            <span>Model</span>
            <strong>MobileNetV2</strong>
          </div>
          <div className="hero-stat">
            <span>Scope</span>
            <strong>General ImageNet</strong>
          </div>
          <div className="hero-stat">
            <span>Best for</span>
            <strong>Single clear subject</strong>
          </div>
        </div>
      </header>

      <main className="workspace">
        <section className="panel">
          <div className="section-head">
            <p className="section-kicker">Upload</p>
            <h2>Choose an image</h2>
            <p>
              This demo works best when the subject is close, centered, and not competing with
              branches, textures, or heavy background detail.
            </p>
          </div>

          <div
            className={`drop-zone ${dragOver ? "drag-over" : ""} ${preview ? "has-image" : ""}`}
            onDrop={handleDrop}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => !preview && fileInputRef.current?.click()}
          >
            {preview ? (
              <div className="preview-wrap">
                <img src={preview} alt="Uploaded preview" className="preview-image" />
                <button
                  type="button"
                  className="ghost-button image-change"
                  onClick={(event) => {
                    event.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Change image
                </button>
              </div>
            ) : (
              <div className="drop-content">
                <span className="drop-badge">Drop image</span>
                <h3>Drag and drop here</h3>
                <p>or click to browse from your device</p>
                <span className="file-types">JPG, PNG, GIF, WEBP</span>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="file-input"
          />

          {image && (
            <div className="actions">
              <button
                type="button"
                className="primary-button"
                onClick={handlePredict}
                disabled={loading}
              >
                {loading ? "Analysing image..." : "Classify image"}
              </button>

              <button type="button" className="ghost-button" onClick={handleReset}>
                Reset
              </button>
            </div>
          )}

          {error && <div className="error-box">{error}</div>}

          <div className="tip-grid">
            {captureTips.map((tip) => (
              <div key={tip} className="tip-card">
                {tip}
              </div>
            ))}
          </div>
        </section>

        <section className="panel results-panel">
          {!predictions ? (
            <div className="empty-state">
              <p className="section-kicker">Results</p>
              <h2>Waiting for your image</h2>
              <p>
                After you run a classification, this area will show the top guess, how confident
                the model looks, and alternate labels worth checking.
              </p>

              <div className="quality-list">
                {qualityNotes.map((note) => (
                  <div key={note} className="quality-item">
                    {note}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="result-summary">
                <div>
                  <p className="section-kicker">Top prediction</p>
                  <h2>{topPrediction.label}</h2>
                  <p className="summary-note">{activeAnalysis?.note}</p>
                </div>

                <span className={`confidence-pill confidence-${confidenceTone}`}>
                  {activeAnalysis?.confidence_band} confidence
                </span>
              </div>

              <div className="stat-grid">
                <div className="stat-card">
                  <span>Top score</span>
                  <strong>{formatPercent(topPrediction.confidence)}</strong>
                </div>
                <div className="stat-card">
                  <span>Gap to next guess</span>
                  <strong>{formatPercent(activeAnalysis?.margin_vs_second ?? 0)}</strong>
                </div>
                <div className="stat-card">
                  <span>Interpretation</span>
                  <strong>{activeAnalysis?.confidence_band}</strong>
                </div>
              </div>

              <div className="prediction-list">
                {predictions.map((prediction, index) => (
                  <div key={prediction.class_id} className="prediction-row">
                    <div className="prediction-meta">
                      <span className="prediction-rank">{String(index + 1).padStart(2, "0")}</span>
                      <div>
                        <p className="prediction-label">{prediction.label}</p>
                        <p className="prediction-id">{prediction.class_id}</p>
                      </div>
                    </div>

                    <div className="prediction-track">
                      <div
                        className="prediction-fill"
                        style={{ width: `${prediction.confidence}%` }}
                      />
                    </div>

                    <span className="prediction-score">{formatPercent(prediction.confidence)}</span>
                  </div>
                ))}
              </div>

              <div className="guidance-card">
                <p className="section-kicker">Read this result carefully</p>
                <p>{activeAnalysis?.guidance}</p>
              </div>
            </>
          )}
        </section>
      </main>

      <footer className="footer">
        Built with React, Flask, TensorFlow, and a general ImageNet classifier.
      </footer>
    </div>
  );
}

export default App;
