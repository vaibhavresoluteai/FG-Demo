import os
import csv
import asyncio
import threading
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
        # "active": True
    },
]


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

BASE_CSV_DIR = r"F:\ResoluteAI\FG-demo\backend"
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

# Define rules mapping
rules_mapping = {
    "Crate Count": process_video1,
    "Milk Spillage": process_video2,
    "Milk Wastage": process_video3,
    "Total Crate Count": process_video4
}

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

@app.post("/process-video/")
async def process_uploaded_video(rule: str = Form(...), file: UploadFile = File(...)):
    """
    Single endpoint that routes the request to the correct processing function based on the rule.
    """
    if rule not in rules_mapping:
        raise HTTPException(status_code=400, detail="Invalid rule selected.")

    input_video_path = file.filename
    processing_function = rules_mapping[rule]  # Get the function based on rule
    
    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(None, processing_function, input_video_path)

    if result is None:
        raise HTTPException(status_code=400, detail="Failed to process video.")

    # Handling different return structures for different processes
    if rule == "Crate Count":
        output_video_path, roi_box_count, total_crates = result
        return {"output_path": output_video_path, "roi_box_count": roi_box_count, "Total_crates": total_crates}
    
    elif rule == "Milk Spillage":
        output_video_path, white_percentage, detection_start_time_str, total_detection_time = result
        return {
            "output_path": output_video_path,
            "white_percentage": white_percentage,
            "detection_start_time": detection_start_time_str,
            "total_detection_time": total_detection_time
        }
    
    elif rule == "Milk Wastage":
        output_video_path, white_percentage, detection_start_time_str = result
        return {
            "output_path": output_video_path,
            "white_percentage": white_percentage,
            "detection_start_time": detection_start_time_str
        }
    
    elif rule == "Total Crate Count":
        output_video_path, box_count = result
        return {"output_path": output_video_path, "box_count": box_count}
    
    return {"message": "Processing completed."}