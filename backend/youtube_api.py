import os
import re
from googleapiclient.discovery import build
from dotenv import load_dotenv
load_dotenv()
api_key = os.getenv("YOUTUBE_API_KEY")

youtube = build(
    "youtube",
    "v3",
    developerKey=api_key
)

def return_channel_id(name:str) -> str:
    request = youtube.search().list(
        part="snippet",
        q=name,   
        type="channel",
        maxResults=1
    )

    response = request.execute()
    return response["items"][0]["snippet"]["channelId"]
    
def return_video_id(channel_id: str) -> str:
    request = youtube.search().list(
        part = 'snippet',
        channelId = channel_id,
        order = 'date',
        type = 'video',
        maxResults = 10
    )

    response = request.execute() 

    vid_list = [item["id"]["videoId"] for item in response["items"]]

    details = youtube.videos().list(
        part = "contentDetails",
        id = ",".join(vid_list)
    ).execute()

    for item in details["items"]:
        duration = item["contentDetails"]["duration"]

        match = re.search(r'PT(?:(\d+)M)?(?:(\d+)S)?', duration)
        mins = int(match.group(1)) if match.group(1) else 0
        secs = int(match.group(2)) if match.group(2) else 0

        total_secs = mins * 60 + secs

        if total_secs >= 120:
            return item["id"]
    return vid_list[0] if vid_list else None
    
def return_comment_list(video_id: str) -> list[str]:
    request = youtube.commentThreads().list(
        part = 'snippet',
        videoId= video_id,
        maxResults = 100,
        textFormat = 'plainText',
        order = 'relevance'  
    )
    response = request.execute()
    comments = []

    for item in response["items"]:
        text = item["snippet"]["topLevelComment"]["snippet"]["textDisplay"]
        comments.append(text)
    return comments