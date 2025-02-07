from ultralytics import YOLO
import cv2,datetime
import numpy as np
import matplotlib.path as mplPath
import os
import csv

def detect_box(results):
    boxes = results[0].boxes
    bboxes = boxes.xyxy
    scores = boxes.conf
    classes = boxes.cls
    ids = boxes.id  # Tracker IDs
 
    rois = []
    for index in range(len(boxes)):
        xmin = int(bboxes[index][0])
        ymin = int(bboxes[index][1])
        xmax = int(bboxes[index][2])
        ymax = int(bboxes[index][3])
        score = int(scores[index] * 100)
        class_id = int(classes[index])
        tracker_id = int(ids[index]) if ids is not None else None  # Tracker ID
        rois.append([xmin, ymin, xmax, ymax, class_id, score, tracker_id])
    return rois

def process_video4(input_path,frame_interval : int =5):
    csv_file = "total_crates_count.csv"

    # Initialize CSV with headers if it doesn't exist
    if os.path.exists(csv_file):
        os.remove(csv_file)
    with open(csv_file, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["Frame", "Timestamp", "Total Crate Count"])

    unique_ids_list = []
    box_count = 0

    section1_roi = [[820, 1010], [968, 1152], [1057, 1096], [889, 960]]
    section1_roi_poly = np.array(section1_roi)
    section1_roi_poly_path = mplPath.Path(section1_roi_poly)

    out_video = f"output_videos_4/output_video4.mp4"
    # Check if the output video already exists, if yes, delete it
    if os.path.exists(out_video):
        os.remove(out_video)
    output_frame_dir = "output_frame"
    os.makedirs(output_frame_dir, exist_ok=True)
    
    cap = cv2.VideoCapture(input_path)
    
    original_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    original_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = int(cap.get(cv2.CAP_PROP_FPS)) if cap.get(cv2.CAP_PROP_FPS) > 0 else 30
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(out_video, fourcc, fps, (original_width, original_height))

    model = YOLO('crate_count.pt')

    frame_number = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        frame_number += 1
        timestamp = datetime.datetime.now().strftime("%H:%M:%S")  # Get current time

        results = model.track(frame, persist=True, conf=0.65, iou=0.5, agnostic_nms=True)
        rois = detect_box(results)
    
        for roi in rois:
            x1, y1, x2, y2, class_id, score, tracker_id = roi  
            person_centroid = (x1 + x2) // 2, (y1 + y2) // 2

            cv2.circle(frame, person_centroid, 5, (0, 0, 255), -1)  # Red circle at the centroid

            if section1_roi_poly_path is not None:  # Check if centroid is inside ROI
                if section1_roi_poly_path.contains_point(person_centroid):
                    if tracker_id not in unique_ids_list:
                        unique_ids_list.append(tracker_id)

            box_count = len(unique_ids_list)
            bbox_message = f"Packet {score}%"
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), thickness=2)
            
            (text_width, text_height), baseline = cv2.getTextSize(bbox_message, cv2.FONT_HERSHEY_SIMPLEX, 0.8, 2)
            text_x, text_y = x1, y1 - text_height
            cv2.rectangle(frame, (text_x, text_y), (text_x + text_width, text_y + text_height + baseline), (0, 255, 0), thickness=cv2.FILLED)
            cv2.putText(frame, bbox_message, (text_x, text_y + text_height), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2, lineType=cv2.LINE_AA)
        
        cv2.polylines(frame, pts=[section1_roi_poly], isClosed=True, color=(255, 102, 102), thickness=2)  

        out.write(frame)
        if frame_number % frame_interval == 0:
            frame_path = os.path.join(output_frame_dir, f"frame_{frame_number}.jpg")
            cv2.imwrite(frame_path, frame)

        # **Live Saving Data to CSV**
        with open(csv_file, "a", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([frame_number, timestamp, box_count])
            f.flush()  # Ensure data is written immediately

    cap.release()
    out.release()
    cv2.destroyAllWindows()

    return box_count


