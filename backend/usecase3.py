import cv2
import numpy as np
from datetime import datetime
import uuid
from ultralytics import YOLO
import csv
import os

def process_video3(input_path):
    csv_file = "milk_wastage.csv"

    # Remove existing CSV file
    if os.path.exists(csv_file):
        os.remove(csv_file)

    # Initialize CSV with headers if it doesn't exist
    with open(csv_file, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["Frame", "Timestamp", "Approx. Wastage Percentage", "Detection Start Time", "Alert Status"])

    counterA_roi = [[120, 830], [778, 627], [956, 998], [773, 1075], [55, 1075], [23, 914]]
    detection_start_time, is_currently_detecting, alert_status = None, False, False
    WHITE_THRESHOLD = 0.093

    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        print("Failed to load the video. Check the path.")
        return None, None, None

    fps = int(cap.get(cv2.CAP_PROP_FPS)) if cap.get(cv2.CAP_PROP_FPS) > 0 else 30
    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    # Output video path
    out_video = f"output_videos_3/output_{uuid.uuid4().hex}.mp4"
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(out_video, fourcc, fps, (frame_width, frame_height))

    # Initialize YOLO model
    model = YOLO("yolov8l.pt")
    frame_number = 0

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("End of video or failed to read frame.")
                break

            frame_number += 1
            timestamp = datetime.now().strftime("%H:%M:%S")  # Get current time

            # Run YOLO detection
            results = model.predict(source=frame, save=False, conf=0.7, verbose=False)
            current_person_count = 0  # Reset count for the current frame

            if results[0].boxes is not None:
                for box in results[0].boxes:
                    cls = int(box.cls[0])
                    if results[0].names[cls] == "person":
                        current_person_count += 1
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        confidence = box.conf[0]

                        if hasattr(box, 'id') and box.id is not None:
                            track_id = int(box.id[0])
                            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                            cv2.putText(frame, f"Person {track_id} ({confidence:.2f})",
                                        (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
                        else:
                            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                            cv2.putText(frame, f"Person ({confidence:.2f})",
                                        (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

            # HSV processing and ROI calculation
            hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
            mask = cv2.inRange(hsv, np.array([0, 0, 140]), np.array([100, 150, 255]))

            # Create ROI mask
            roi_mask = np.zeros_like(mask)
            counterA_roi_poly = np.array(counterA_roi, dtype=np.int32)
            cv2.fillPoly(roi_mask, [counterA_roi_poly], 255)
            masked_white = cv2.bitwise_and(mask, roi_mask)

            # Calculate white pixel percentage
            roi_area = cv2.countNonZero(roi_mask)
            white_pixels = cv2.countNonZero(masked_white)
            white_percentage = white_pixels / roi_area if roi_area > 0 else 0

            # Handle detection timing and status
            if white_percentage > WHITE_THRESHOLD:
                if not is_currently_detecting:
                    if detection_start_time is None:
                        detection_start_time = datetime.now()
                    is_currently_detecting = True
                alert_status = True
            else:
                is_currently_detecting = False
                detection_start_time = None
                alert_status = False

            detection_start_time_str = detection_start_time.strftime("%H:%M:%S") if detection_start_time else ""

            # Save frame to video
            out.write(frame)

            # Save data to CSV
            with open(csv_file, "a", newline="") as f:
                writer = csv.writer(f)
                writer.writerow([frame_number, timestamp, white_percentage, detection_start_time_str, alert_status])
                f.flush()  # Ensure data is written immediately

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    finally:
        cap.release()
        out.release()
        cv2.destroyAllWindows()

    return out_video, white_percentage, detection_start_time_str
