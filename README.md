# 40percent-online_3DMouse

A web-based 3D mouse that utilizes your smartphone's gyroscope feature to control your 3D environment in 3D environment.

## 📸 Interface Overview

INSERT_IMAGE_FOR_WEB_APP_INTERFACE

## ✨ Features

- **No App Installation Required:** Everything runs smoothly straight from your web browser. 
- **Smartphone Gyroscope Integration:** Turn your everyday smartphone into a fully functional, intuitive 3D mouse.
- **Real-time Synchronization:** Low-latency connection ensures your phone's movements are translated instantly to the Blender workspace.

## 🚀 Installation & Running Instructions

To run both the backend and frontend, you will need Node.js installed.

### 1. Install Dependencies
Open your terminal in both the `frontend` and `backend` directories and run the following command to sync Node.js and download the necessary dependencies:

Run this in both frontend and backend folders
```
npm i
# OR
pnpm i

```

### 2. Start the Backend server

Navigate to the `backend` directory and start the web app:

```
pnpm dev
# OR
npm dev

```

### 3. Start the Frontend server

Before starting the main frontend development server, you need to set up the tunnel:

1. Navigate to the `frontend` folder.
2. Run the tunnel command:
```
npm tunnel
# OR
pnpm tunnel

```


3. **Wait** for the tunnel installation/setup to complete fully.

Below is the image when it has been successfully installed:

INSERT_IMAGE_FOR WHEN_IT'S_SUCCESSFULLY_INSTALLED

4. Once completed, press `Ctrl + C` to terminate the tunnel process.
5. Finally, start the frontend server:
```
pnpm run dev
# OR
npm run dev

```




## 🧊 Blender Setup Instructions

To get the 3D mouse communicating with your Blender workspace, you need to load the Python script provided in the repo.

1. Open your specific `.blend` file in Blender.
2. Navigate to the **Scripting** workspace tab at the top.
3. Create a new text data-block (click "New").
4. **Copy and paste** the entire contents of `blender.py` from this repository into the Blender scripting editor.
5. Click the **Run Script** button in the editor header.
6. Your Blender scene is now ready to receive gyroscope data from your phone!
