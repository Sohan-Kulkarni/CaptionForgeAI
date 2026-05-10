# CaptionForge AI - Image Caption Generator

A premium full-stack AI image caption generator built with React, Vite, Tailwind CSS, Framer Motion, FastAPI, and HuggingFace BLIP.

The app lets users upload an image, preview it, generate exactly 4 caption variants, copy captions, listen to them, export TXT/JSON files, switch creative/detailed modes, and review recent local generation history.

## Tech Stack

Frontend:
- React + Vite
- Tailwind CSS
- Framer Motion
- Lucide React Icons
- Axios
- React Dropzone
- ShadCN-style source components

Backend:
- Python FastAPI
- HuggingFace Transformers
- `Salesforce/blip-image-captioning-base`
- Torch
- Pillow
- Uvicorn
- Python-dotenv

## Project Structure

```text
Image_Caption_Generator/
|-- backend/
|   |-- app/
|   |   |-- main.py
|   |   |-- routes/
|   |   |   `-- caption.py
|   |   |-- services/
|   |   |   `-- caption_service.py
|   |   |-- utils/
|   |   |   `-- validators.py
|   |   `-- models/
|   |       `-- caption.py
|   |-- requirements.txt
|   |-- .env
|   `-- .env.example
|-- frontend/
|   |-- src/
|   |   |-- animations/
|   |   |-- components/
|   |   |-- context/
|   |   |-- hooks/
|   |   |-- pages/
|   |   |-- services/
|   |   |-- App.jsx
|   |   `-- main.jsx
|   |-- package.json
|   |-- tailwind.config.js
|   |-- vite.config.js
|   |-- .env
|   `-- .env.example
`-- README.md
```

## Environment Variables

Backend: `backend/.env`

```env
MODEL_NAME=Salesforce/blip-image-captioning-base
MAX_UPLOAD_MB=8
MAX_IMAGE_PIXELS=20000000
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Frontend: `frontend/.env`

```env
VITE_API_URL=http://127.0.0.1:8001
```

## Backend Setup

From the project root:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

Backend startup downloads the BLIP model from HuggingFace if it is missing, then loads it into memory before accepting requests. Torch will use CUDA automatically when a compatible GPU build is installed.

Health check:

```powershell
Invoke-RestMethod http://127.0.0.1:8001/health
```

Caption endpoint:

```text
POST /generate-captions
multipart/form-data:
  file: image file
  mode: creative | detailed
```

Example response:

```json
{
  "captions": [
    "A dog running through a grassy field.",
    "A playful dog outdoors in nature.",
    "A brown dog sprinting across a green park.",
    "A happy dog enjoying an open field."
  ],
  "items": [
    {
      "text": "A dog running through a grassy field.",
      "confidence": 0.93,
      "strategy": "creative-controlled-sample"
    }
  ],
  "mode": "creative",
  "model": "Salesforce/blip-image-captioning-base"
}
```

## Frontend Setup

Open a second terminal from the project root:

```powershell
cd frontend
npm install
npm run dev
```

On Windows, if PowerShell blocks `npm.ps1`, use `npm.cmd install` and `npm.cmd run dev`.

Vite runs at:

```text
http://localhost:5173
```

Production build:

```powershell
npm run build
npm run preview
```

## Tailwind Setup Notes

Tailwind is already configured in:

- `frontend/tailwind.config.js`
- `frontend/postcss.config.js`
- `frontend/src/index.css`

The app uses class-based dark mode, CSS variables for theme tokens, custom animation keyframes, glass panels, a responsive layout, custom scrollbars, and shadcn-style component primitives.

## Features

- Drag-and-drop upload with file type and size validation
- Preview image before generation
- Generate exactly 4 captions per request
- Creative and detailed caption modes
- Multiple BLIP decoding strategies
- Loading progress and skeleton cards
- Copy caption button
- Speech synthesis for individual captions
- Download captions as TXT or JSON
- Regenerate captions
- Local recent generation history
- Dark/light theme toggle
- Responsive SaaS-style UI with Framer Motion transitions
- FastAPI validation and error handling

## Troubleshooting

If the frontend cannot reach the backend, confirm `VITE_API_URL` matches the FastAPI server URL and restart Vite after changing `.env`.

If the backend fails during startup, confirm internet access for the first HuggingFace download, enough disk space, and that `transformers`, `torch`, and `Pillow` installed correctly.

If caption generation is slow on CPU, try a smaller image or use a machine with a CUDA-capable GPU and a CUDA-enabled Torch installation.
