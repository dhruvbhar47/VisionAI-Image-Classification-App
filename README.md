# 🔍 VisionAI – Image Classification App

A full-stack image classification web application built with **TensorFlow**, **Keras**, **React.js**, and **Flask**. Upload any image and get real-time predictions powered by **MobileNetV2** trained on **ImageNet** (1000 classes).

![Python](https://img.shields.io/badge/Python-3.11-blue?style=flat-square)
![TensorFlow](https://img.shields.io/badge/TensorFlow-2.16-orange?style=flat-square)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square)
![Flask](https://img.shields.io/badge/Flask-3.0-black?style=flat-square)

---

## ✨ Features

- 📸 Drag-and-drop image upload (JPG, PNG, GIF, WEBP)
- 🧠 Real-time inference using MobileNetV2 (transfer learning)
- 📊 Top-5 predictions with confidence scores
- ⚡ REST API backend for scalable inference
- 🐳 Docker support for easy deployment
- ☁️ Ready for AWS / GCP / Render / Railway deployment

---

## 🏗️ Project Structure

```
image-classifier/
├── backend/
│   ├── app.py              # Flask REST API
│   ├── requirements.txt    # Python dependencies
│   ├── Dockerfile          # Backend container
│   └── Procfile            # For Heroku / Render
├── frontend/
│   ├── src/
│   │   ├── App.js          # Main React component
│   │   ├── App.css         # Styles
│   │   └── index.js        # Entry point
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   └── Dockerfile          # Frontend container
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quick Start (Local)

### Prerequisites
- Python 3.11 recommended
- Node.js 18+
- Git

### 1. Clone the repo
```bash
git clone https://github.com/dhruvbhar47/image-classifier.git
cd image-classifier
```

### 2. Run the Backend
```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
Backend runs at: `http://localhost:5002`

### VS Code Setup (Important)
If VS Code shows errors like `Import "flask" could not be resolved`, it usually means the selected Python interpreter does not have the project packages installed yet.

1. Open the `backend` folder in VS Code.
2. Open the VS Code terminal.
3. Make sure you are using Python 3.11 for this project. If `python3 --version` shows a different version, install Python 3.11 first or use Docker.
4. Create the virtual environment:
```bash
python3.11 -m venv .venv
```
5. Activate it:
```bash
source .venv/bin/activate
```
Windows:
```bash
.venv\Scripts\activate
```
6. Install dependencies:
```bash
pip install -r requirements.txt
```
7. In VS Code, press `Cmd+Shift+P` on Mac or `Ctrl+Shift+P` on Windows/Linux.
8. Search for `Python: Select Interpreter`.
9. Choose the interpreter inside the project's `.venv` folder.
10. Reopen `app.py`. The missing import warnings should disappear.
11. Run the backend:
```bash
python app.py
```

### 3. Run the Frontend
```bash
cd frontend
npm install
npm start
```
Frontend runs at: `http://localhost:3000`

---

## 🐳 Docker (Recommended)

```bash
docker compose up --build
```

This starts:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5002`

The Docker setup now bakes `REACT_APP_API_URL` into the frontend image at build time, which is how Create React App expects environment variables to work.

---

## 🌐 API Endpoints

| Method | Endpoint    | Description              |
|--------|-------------|--------------------------|
| GET    | `/health`   | Health check             |
| POST   | `/predict`  | Upload image & get predictions |

### Example Request
```bash
curl -X POST http://localhost:5002/predict \
  -F "file=@your-image.jpg"
```

### Example Response
```json
{
  "success": true,
  "top_prediction": {
    "label": "Golden Retriever",
    "confidence": 94.32
  },
  "predictions": [
    { "label": "Golden Retriever", "confidence": 94.32 },
    { "label": "Labrador Retriever", "confidence": 3.11 },
    ...
  ]
}
```

---

## ☁️ Deployment

### Deploy Backend to Render
1. Go to [render.com](https://render.com) and create a new Web Service.
2. Connect your GitHub repo.
3. Set **Root Directory** to `backend`.
4. Set **Build Command** to `pip install -r requirements.txt`.
5. Set **Start Command** to `gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --timeout 120`.

After deploy, copy the backend URL. It will look like:

```text
https://your-backend-name.onrender.com
```

### Deploy Frontend to Vercel
1. Go to [vercel.com](https://vercel.com) and import the same repo.
2. Set **Root Directory** to `frontend`.
3. Set **Build Command** to `npm run build`.
4. Set **Output Directory** to `build`.
5. Add environment variable `REACT_APP_API_URL` and paste your Render backend URL.
6. Deploy.

Important: for Create React App, `REACT_APP_API_URL` is a build-time variable. If you change it later, redeploy the frontend so the new value is included in the built files.

---

## 🤖 Model Details

| Property    | Value                          |
|-------------|--------------------------------|
| Architecture | MobileNetV2                  |
| Dataset      | ImageNet (1.2M images)       |
| Classes      | 1000                         |
| Input Size   | 224 × 224 px                 |
| Technique    | Transfer Learning            |

---

## 🛠️ Tech Stack

- **ML/AI**: TensorFlow, Keras, MobileNetV2, NumPy, Pillow
- **Backend**: Python, Flask, Flask-CORS, Gunicorn
- **Frontend**: React.js, Axios, CSS3
- **DevOps**: Docker, Docker Compose

---

## 📄 License

MIT License — feel free to use and modify.
