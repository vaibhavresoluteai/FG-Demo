from ultralytics import YOLO
import cv2
import os
import datetime
import csv
stop_processing = False  

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

def process_video1(input_path,frame_interval: int = 5): 
    global stop_processing  
    stop_processing = False
    csv_file = "crate_count.csv"
    if os.path.exists(csv_file):
        os.remove(csv_file)
    
    with open(csv_file, "w") as f:
        writer = csv.writer(f)
        writer.writerow(["Frame","Timestamp","Crates","Crates_count"])  

    model = YOLO('crate_detection.pt')  
    output_video = f"output_videos_1/output_video1.mp4"

    if os.path.exists(output_video):
        os.remove(output_video)

    output_frame_dir = "output_frame"
    os.makedirs(output_frame_dir, exist_ok=True)  # Ensure folder exists

    unique_tracker_ids = set()
    tracker_centroids_in_roi = set()
    roi_box_count = 0

    roi_start = (1034, 448)
    roi_end = (1736, 1318)
    
    cap = cv2.VideoCapture(input_path)
    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = int(cap.get(cv2.CAP_PROP_FPS)) if cap.get(cv2.CAP_PROP_FPS) > 0 else 30
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_video, fourcc, fps, (frame_width, frame_height))

    frame_number = 0  

    while cap.isOpened():
        if stop_processing:
            print("Stopping YOLO process...")
            break
        ret, frame = cap.read()
        if not ret:
            break
        
        frame_number += 1  
        timestamp = datetime.datetime.now().strftime("%H:%M:%S")

        results = model.track(frame, persist=True, conf=0.85, iou=0.5, agnostic_nms=True)
        rois = detect_box(results)

        for roi in rois:
            x1, y1, x2, y2, score, tracker_id = roi[0], roi[1], roi[2], roi[3], roi[5], roi[6]  
            centroid_x = (x1 + x2) // 2
            centroid_y = (y1 + y2) // 2

            if tracker_id is not None and tracker_id not in unique_tracker_ids:
                if (x1 >= roi_start[0] and y1 >= roi_start[1] and x2 <= roi_end[0] and y2 <= roi_end[1]):
                    if (centroid_x, centroid_y) not in tracker_centroids_in_roi:
                        roi_box_count += 1  
                        tracker_centroids_in_roi.add((centroid_x, centroid_y))  
                        unique_tracker_ids.add(tracker_id)  

            bbox_message = f"ID: {tracker_id} {score}%"
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), thickness=2)
            cv2.circle(frame, (centroid_x, centroid_y), 5, (0, 0, 255), -1)  

            (text_width, text_height), baseline = cv2.getTextSize(bbox_message, cv2.FONT_HERSHEY_SIMPLEX, 0.8, 2)
            text_x, text_y = x1, y1 - text_height
            cv2.rectangle(frame, (text_x, text_y), (text_x + text_width, text_y + text_height + baseline), (0, 255, 0), thickness=cv2.FILLED)
            cv2.putText(frame, bbox_message, (text_x, text_y + text_height), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2, lineType=cv2.LINE_AA)

        cv2.rectangle(frame, roi_start, roi_end, (255, 0, 255), 2)
        
        crates_count = roi_box_count * 10  

        with open(csv_file, "a") as f:
            f.write(f"{frame_number},{timestamp},{roi_box_count},{crates_count}\n")

        out.write(frame)

        # Save every 5th frame
        if frame_number % frame_interval == 0:
            frame_path = os.path.join(output_frame_dir, f"frame_{frame_number}.jpg")
            cv2.imwrite(frame_path, frame)

    cap.release()
    out.release()
    cv2.destroyAllWindows()

    return roi_box_count, roi_box_count * 10

# Call this function from another thread to stop YOLO
def stop_yolo1():
    global stop_processing
    stop_processing = True

