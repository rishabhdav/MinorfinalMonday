# Diabetes Detection Web App

A modern React application for diabetic retinopathy detection using multiple AI models. Users can upload retinal images and get predictions from different AI services.

## Features

- 🔐 User authentication (login/register)
- 🌓 Dark/Light theme toggle
- 🤖 5 separate AI model pages
- 📸 Image upload and analysis on each page
- 📊 Real-time results with risk assessment
- 🎨 Beautiful, responsive UI with Tailwind CSS

## AI Models Supported

1. **CNN RetinaNet** - Fast vessel segmentation
2. **ResNet-50 Classifier** - High accuracy pattern recognition
3. **Ensemble Vision** - Slow but most accurate consensus analysis
4. **Transformer DR** - Advanced feature extraction
5. **Hybrid Neural Net** - Dynamic analysis

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

The application will be available at http://localhost:5173

### 3. Backend Setup

The backend is a Spring Boot application running on port 8080 with the following API endpoints:

- `POST /api/cnn-retinanet` - CNN RetinaNet model analysis
- `POST /api/resnet-classifier` - ResNet-50 classifier analysis
- `POST /api/ensemble-vision` - Ensemble Vision analysis
- `POST /api/transformer-dr` - Transformer DR analysis
- `POST /api/hybrid-neural-net` - Hybrid Neural Net analysis

Each endpoint accepts a **multipart/form-data** POST request with:
- **Key**: `image`
- **Value**: fundus image file (JPG, PNG, etc.)

And returns a JSON response:
```json
{
  "class_id": 0,
  "class_name": "Normal",
  "confidence": 0.9999812841415405,
  "probabilities": [
    [
      0.9999812841415405,
      0.000001502018676546868,
      0.000012558210983115714,
      5.211725238041254e-7,
      0.000004141610133956419
    ]
  ]
}
```

**Note**: The frontend only reads `class_id`, `class_name`, `confidence`, and `probabilities` from the response.

## Project Structure

```
my-app/
├── public/                  # Static assets
├── src/
│   ├── components/          # React components
│   │   ├── Header.jsx       # Navigation header with model links
│   │   ├── Login.jsx        # Login component
│   │   ├── Register.jsx     # Registration component
│   │   ├── CNNRetinaNet.jsx # CNN RetinaNet model page
│   │   ├── ResNetClassifier.jsx # ResNet-50 model page
│   │   ├── EnsembleVision.jsx # Ensemble Vision model page
│   │   ├── TransformerDR.jsx # Transformer DR model page
│   │   └── HybridNeuralNet.jsx # Hybrid Neural Net model page
│   ├── context/             # React contexts
│   │   ├── AuthContext.jsx  # Authentication
│   │   └── ThemeContext.jsx # Theme management
│   ├── App.jsx              # Main application with routing
│   └── main.jsx             # Application entry point
├── package.json
└── vite.config.js
```

### 4. Build for Production

```bash
npm run build
```

## API Integration

Each model uses different AI service providers with their own API formats:

- **Hugging Face**: JSON-based image classification
- **Clarifai**: Computer vision API with concept detection
- **Roboflow**: Custom model inference with file upload
- **Replicate**: Serverless model predictions
- **OpenAI**: Vision-enabled chat completions

## Usage

1. Register/Login to access the app
2. Select your preferred AI model from the header dropdown
3. Upload a retinal image (PNG, JPG, GIF)
4. Click "Detect Diabetes" to get analysis
5. View results with probability score and risk assessment

## Tech Stack

- **Frontend**: React 19, Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Routing**: React Router DOM
- **Icons**: Heroicons
- **Build Tool**: Vite

## Project Structure

```
src/
├── components/
│   ├── Header.jsx          # Navigation with model selection
│   ├── Login.jsx           # Authentication form
│   └── Register.jsx        # Registration form
├── context/
│   ├── AuthContext.jsx     # User authentication
│   ├── ThemeContext.jsx    # Dark/light theme
│   └── ModelContext.jsx    # AI model management
├── App.jsx                 # Main app component
└── main.jsx               # App entry point
```
