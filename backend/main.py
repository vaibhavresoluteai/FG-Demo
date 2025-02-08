import os
import csv
import asyncio
import threading
import base64
import uuid
import shutil
from fastapi.responses import JSONResponse
from typing import List, Dict
from fastapi import FastAPI, File, UploadFile, HTTPException, WebSocket, Form
from fastapi.middleware.cors import CORSMiddleware
from usecase1 import process_video1
from usecase2 import process_video2
from usecase3 import process_video3
from usecase4 import process_video4
 
# Dummy data storage
rules = [
    {
        "id": "1",
        "rule": "Crate Count",
        #"type": "NONE",
        "enabled": True,
    },
    {
        "id": "2",
        "rule": "Milk Spillage",
       # "type": "NONE",
        "enabled": True,
    },
    {
        "id": "3",
        "rule": "Milk Wastage",
       # "type": "NONE",
        "enabled": True,
    },
    {
        "id": "4",
        "rule": "Total Crate Count",
        #"type": "NONE",
        "enabled": True,
    }
]
 
models = [
    {
        "id": "1",
        "name": "Crate Detection",
        "model_info": "General Crate detection model",
        "accuracy": "92.0%",
        "type": "Crates",
        "active": True
    },
    {
        "id": "2",
        "name": "Crate Count",
        "model_info": "General Crate count Model",
        "accuracy": "95.0%",
        "type": "Crates",
        "active": True
    },
    {
        "id": "3",
        "name": "None",
        # "model_info": "Model 3 info",
        # "accuracy": "93.0%",
        # "type": "Model 3 type",
        "active": True
    },
]
 
output_configurations = {
    "storage": [
        "Local Storage",
        "Cloud Storage",
        "Network Storage",
    ],
    "format": [
        "JSON",
        "CSV",
        "XML",
    ],
    "current_output_configurations": ["Local Storage", "JSON"]
}
 
 
app = FastAPI(
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)
 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
OUTPUT_FRAME_DIR = "output_frame"
image_websockets = set()
 
def clear_output_folder():
    """Deletes all existing images in the output_frame folder before starting."""
    if os.path.exists(OUTPUT_FRAME_DIR):
        for file in os.listdir(OUTPUT_FRAME_DIR):
            file_path = os.path.join(OUTPUT_FRAME_DIR, file)
            if os.path.isfile(file_path) and file.endswith(".jpg"):
                os.remove(file_path)
 
async def broadcast_images():
    """Continuously sends images every 5th frame via WebSocket and deletes after sending."""
    while True:
        if image_websockets:
            try:
                images = sorted(
                    [f for f in os.listdir(OUTPUT_FRAME_DIR) if f.endswith(".jpg")],
                    key=lambda x: int(x.split("_")[1].split(".")[0])  # Extract frame number
                )
 
                for image in images:
                    image_path = os.path.join(OUTPUT_FRAME_DIR, image)
 
                    # Read image as base64
                    with open(image_path, "rb") as img_file:
                        base64_image = base64.b64encode(img_file.read()).decode("utf-8")
 
                    # Send image to all active WebSockets
                    for ws in list(image_websockets):
                        try:
                            await ws.send_json({"frame": image, "image_data": base64_image})
                        except Exception:
                            image_websockets.remove(ws)  # Remove disconnected clients
 
                    # Remove the image after sending
                    os.remove(image_path)
 
                    await asyncio.sleep(0.5)  # Adjust delay if needed
 
            except Exception as e:
                print(f"Error streaming images: {e}")
 
        await asyncio.sleep(0.5)  # Check periodically
 
@app.websocket("/ws/live-images/")
async def websocket_images(websocket: WebSocket):
    """WebSocket endpoint for streaming images every 5 frames."""
    await websocket.accept()
    image_websockets.add(websocket)
    try:
        while True:
            await websocket.receive_text()
    except Exception:
        pass
    finally:
        image_websockets.remove(websocket)
 
# Start background WebSocket image streaming
@app.on_event("startup")
async def start_image_broadcast():
    """Clears old images and starts image broadcasting in a background thread."""
    clear_output_folder()  # Clear old images before starting
    asyncio.create_task(broadcast_images())
 
BASE_CSV_DIR = os.getcwd()  # Get the current working directory
 
CSV_FILES = {
    "process1": os.path.join(BASE_CSV_DIR, "crate_count.csv"),
    "process2": os.path.join(BASE_CSV_DIR, "milk_spillage.csv"),
    "process3": os.path.join(BASE_CSV_DIR, "milk_wastage.csv"),
    "process4": os.path.join(BASE_CSV_DIR, "total_crates_count.csv"),
}
 
 
os.makedirs(BASE_CSV_DIR, exist_ok=True)
 
last_sent_rows = {process: None for process in CSV_FILES.keys()}
initial_last_rows = {}
active_websockets = {process: set() for process in CSV_FILES.keys()}
 
def load_initial_last_rows():
    """Ensures CSV files exist and reads the last row from each CSV file."""
    global initial_last_rows
    for process, csv_file in CSV_FILES.items():
        if not os.path.exists(csv_file):
            with open(csv_file, "w", newline="") as f:
                writer = csv.writer(f)
                if process == "process1":
                    writer.writerow(["Frame", "Timestamp", "Crates", "Crates_count"])
                elif process == "process2":
                    writer.writerow(["Frame", "Timestamp", "Approx. Wastage Percentage", "Detection Start Time", "Total Detection Time", "Alert Status"])
                elif process == "process3":
                    writer.writerow(["Frame", "Timestamp", "Approx. Wastage Percentage", "Detection Start Time", "Alert Status"])
                elif process == "process4":
                    writer.writerow(["Frame", "Timestamp", "Total Crate Count"])
 
        with open(csv_file, "r") as f:
            reader = csv.DictReader(f)
            data = list(reader)
            if data:
                initial_last_rows[process] = data[-1]
 
async def broadcast_csv_updates(process: str, csv_file: str):
    """Reads the latest CSV content and broadcasts only new rows."""
    global last_sent_rows
    while True:
        if active_websockets[process]:
            try:
                if os.path.exists(csv_file):
                    with open(csv_file, "r") as f:
                        reader = csv.DictReader(f)
                        data = list(reader)
 
                    if data:
                        latest_data = data[-1]
                        if latest_data != last_sent_rows[process] and latest_data != initial_last_rows.get(process):
                            message = {"process": process, "data": latest_data}
                            for ws in list(active_websockets[process]):
                                try:
                                    await ws.send_json(message)
                                except Exception:
                                    active_websockets[process].remove(ws)
 
                            last_sent_rows[process] = latest_data
 
            except Exception as e:
                print(f"Error reading CSV for {process}: {e}")
 
        await asyncio.sleep(0.5)
 
@app.websocket("/ws/live-data1/")
async def websocket_endpoint_1(websocket: WebSocket):
    await websocket.accept()
    active_websockets["process1"].add(websocket)
    try:
        while True:
            await websocket.receive_text()
    except Exception:
        pass
    finally:
        active_websockets["process1"].remove(websocket)
 
@app.websocket("/ws/live-data2/")
async def websocket_endpoint_2(websocket: WebSocket):
    await websocket.accept()
    active_websockets["process2"].add(websocket)
    try:
        while True:
            await websocket.receive_text()
    except Exception:
        pass
    finally:
        active_websockets["process2"].remove(websocket)
 
@app.websocket("/ws/live-data3/")
async def websocket_endpoint_3(websocket: WebSocket):
    await websocket.accept()
    active_websockets["process3"].add(websocket)
    try:
        while True:
            await websocket.receive_text()
    except Exception:
        pass
    finally:
        active_websockets["process3"].remove(websocket)
 
@app.websocket("/ws/live-data4/")
async def websocket_endpoint_4(websocket: WebSocket):
    await websocket.accept()
    active_websockets["process4"].add(websocket)
    try:
        while True:
            await websocket.receive_text()
    except Exception:
        pass
    finally:
        active_websockets["process4"].remove(websocket)
 
def run_event_loop():
    """Runs a dedicated event loop for WebSocket broadcasting in a separate thread."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    for process, csv_file in CSV_FILES.items():
        loop.create_task(broadcast_csv_updates(process, csv_file))
    loop.run_forever()
 
@app.on_event("startup")
async def start_background_tasks():
    """Loads initial data and starts WebSocket threads safely."""
    global last_sent_rows
    load_initial_last_rows()
    last_sent_rows = {process: None for process in CSV_FILES.keys()}
   
    # Run WebSocket tasks in a separate thread
    threading.Thread(target=run_event_loop, daemon=True).start()
 
# /models endpoint
@app.get("/models", response_model=List[dict])
def get_models():
    """
    Returns a list of dummy detection models with unique IDs and details.
    """
    return models
 
# /rules endpoint
@app.get("/rules", response_model=List[dict])
def get_rules():
    """
    Returns a list of processing rules with unique IDs and details.
    """
    return rules
 
@app.put("/rules/update", response_model=Dict[str, str])
def update_rule(updated_rules: List[Dict]):
    """
    Updates multiple processing rules based on the provided unique IDs.
    """
    for updated_rule in updated_rules:
        rule_id = updated_rule["id"]
 
        rule_found = False
        for rule in rules:
            if rule["id"] == rule_id:
                rule.update(updated_rule)
                rule_found = True
                break
 
        if not rule_found:
            raise HTTPException(status_code=404, detail=f"Rule with ID {rule_id} not found")
 
    return {"message": "Rule updated successfully"}
 
@app.put("/models/update", response_model=Dict[str, str])
def update_model(updated_models: List[Dict]):
    """
    Updates multiple processing models based on the provided unique IDs.
    """
    for updated_model in updated_models:
        model_id = updated_model["id"]
 
        model_found = False
        for model in models:
            if model["id"] == model_id:
                model.update(updated_model)
                model_found = True
                break
 
        if not model_found:
            raise HTTPException(status_code=404, detail=f"Model with ID {model_id} not found")
 
    return {"message": "Model updated successfully"}
 
# Define rules mapping
rules_mapping = {
    "Crate Count": process_video1,
    "Milk Spillage": process_video2,
    "Milk Wastage": process_video3,
    "Total Crate Count": process_video4
}
 
UPLOAD_DIR = "uploaded_videos"
os.makedirs(UPLOAD_DIR, exist_ok=True)
 
@app.post("/process-video/")
async def process_uploaded_video(rule: str = Form(...), file: UploadFile = File(...)):
    """
    Single endpoint that routes the request to the correct processing function based on the rule.
    """
    if rule not in rules_mapping:
        raise HTTPException(status_code=400, detail="Invalid rule selected.")
 
    # Generate a unique file name
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    input_video_path = os.path.join(UPLOAD_DIR, unique_filename)
        # Save uploaded video
    with open(input_video_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    processing_function = rules_mapping[rule]  # Get the function based on rule
   
    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(None, processing_function, input_video_path)
 
    if result is None:
        raise HTTPException(status_code=400, detail="Failed to process video.")
 
    # Handling different return structures for different processes
    if rule == "Crate Count":
        roi_box_count, total_crates = result
        return {"roi_box_count": roi_box_count, "Total_crates": total_crates}
   
    elif rule == "Milk Spillage":
        white_percentage, detection_start_time_str, total_detection_time = result
        return {
            "white_percentage": white_percentage,
            "detection_start_time": detection_start_time_str,
            "total_detection_time": total_detection_time
        }
   
    elif rule == "Milk Wastage":
        white_percentage, detection_start_time_str = result
        return {
            "white_percentage": white_percentage,
            "detection_start_time": detection_start_time_str
        }
   
    elif rule == "Total Crate Count":
        box_count = result
        return {"box_count": box_count}
   
    os.remove(input_video_path)
    return {"message": "Processing completed."}
 
 
def save_outputs():
    try:
        global processed_results  # Declare the global variable
        if not processed_results:
            raise HTTPException(status_code=404, detail="No processed results found")
 
        # Combine outputs into a JSON object
        output_data = {
            "process_video_output": processed_results
        }
 
        # Define the save path for JSON
        save_path = "./output.json"
 
        # Save to local storage
        with open(save_path, "w") as json_file:
            json.dump(output_data, json_file)
 
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
   
# GET output configurations
@app.get("/output_configurations", response_model=Dict[str, List[str]])
def get_output_configurations():
    """
    Returns a dict of output configurations with keys name storage and format both containing list of options.
    """
    return output_configurations
 
 
# PUT output configurations
@app.put("/output_configurations/update", response_model=Dict[str, str])
def update_output_configurations(updated_output_configurations: List[str]):
    """
    Updates the current_output_configurations with the provided storage and format values in output_configurations dict.
    """
    if len(updated_output_configurations) != 2:
        return {"error": "Invalid input, must be an array of exactly two elements."}
 
    output_configurations["current_output_configurations"] = updated_output_configurations
    save_outputs()
    return {"message": "Output Configurations updated successfully"}