import os
import re
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from dotenv import load_dotenv
load_dotenv()
api_key = os.getenv("YOUTUBE_API_KEY")

youtube = build(
    "youtube",
    "v3",
    developerKey=api_key
)

class ChannelNotFoundError(Exception):
    pass

class CommentsDisabledError(Exception):
    pass

class NoCommentsError(Exception):
    pass

def return_channel_id(name: str) -> str:
    request = youtube.search().list(
        part="snippet",
        q=name,
        type="channel",
        maxResults=1
    )
    response = request.execute()
    if not response.get("items"):
        raise ChannelNotFoundError(f"No channel found for '{name}'.")
    item = response["items"][0]
    return item["snippet"]["channelId"]
    
def return_channel_stats(channel_id: str) -> dict:
    response = youtube.channels().list(
        part="statistics",
        id=channel_id
    ).execute()
    stats = response["items"][0]["statistics"]
    return {
        "subscribers": int(stats.get("subscriberCount", 0)),
        "views": int(stats.get("viewCount", 0)),
        "videos": int(stats.get("videoCount", 0)),
        "hidden_subscriber_count": stats.get("hiddenSubscriberCount", False)
    }

SHORTS_MAX_SECONDS = 60

def return_videos(channel_id: str, kind: str = "both") -> list[dict]:
    # Fetch 50 candidates (same search.list quota cost as 10) so filtering
    # still yields 10 results even on channels that mix videos and shorts.
    response = youtube.search().list(
        part = 'snippet',
        channelId = channel_id,
        order = 'date',
        type = 'video',
        maxResults = 50
    ).execute()

    vid_list = [item["id"]["videoId"] for item in response["items"]]

    details = youtube.videos().list(
        part = "contentDetails,snippet,statistics",
        id = ",".join(vid_list)
    ).execute()

    videos = []
    for item in details["items"]:
        duration = item["contentDetails"]["duration"]

        match = re.search(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', duration)
        hours = int(match.group(1)) if match.group(1) else 0
        mins  = int(match.group(2)) if match.group(2) else 0
        secs  = int(match.group(3)) if match.group(3) else 0

        total_secs = hours * 3600 + mins * 60 + secs

        if kind == "videos" and total_secs <= SHORTS_MAX_SECONDS:
            continue
        if kind == "shorts" and total_secs > SHORTS_MAX_SECONDS:
            continue

        stats = item.get("statistics", {})
        videos.append({
            "id": item["id"],
            "title": item["snippet"]["title"],
            "duration_seconds": total_secs,
            "thumbnail": item["snippet"]["thumbnails"]["medium"]["url"],
            "views": int(stats.get("viewCount", 0)),
            "comment_count": int(stats.get("commentCount", 0)),
        })

        if len(videos) == 10:
            break

    return videos

def return_comment_list(video_id: str) -> list[str]:
    try:
        request = youtube.commentThreads().list(
            part = 'snippet',
            videoId= video_id,
            maxResults = 200,
            textFormat = 'plainText',
            order = 'relevance'
        )
        response = request.execute()
    except HttpError as e:
        if e.resp.status == 403:
            raise CommentsDisabledError("Comments are disabled for this video.")
        raise

    comments = []
    for item in response["items"]:
        text = item["snippet"]["topLevelComment"]["snippet"]["textDisplay"]
        comments.append(text)

    if not comments:
        raise NoCommentsError("This video has no comments.")

    return comments