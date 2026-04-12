from fastapi import FastAPI
from backend.youtube_api import (
    return_channel_id,
    return_videos,
    return_comment_list,
)
from backend.nlp_sentiment import return_sentiment_data
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/channel")
def get_channel(channel: str):
    channel_id = return_channel_id(channel)
    
    return {
        "channel_name": channel,
        "channel_id": channel_id
    }


@app.get("/videos")
def get_videos(channel_id: str):
    videos = return_videos(channel_id)

    return {
        "channel_id": channel_id,
        "videos": videos
    }


@app.get("/comments")
def get_comments(video_id: str):
    comment_list = return_comment_list(video_id)
    
    return {
        "video_id": video_id,
        "comments": comment_list
    }


@app.get("/analyze")
def analyze(video_id: str):
    comments = return_comment_list(video_id)
    scores, avg, pos, neg, neu = return_sentiment_data(comments)

    return {
        "video_id": video_id,
        "average_sentiment": avg,
        "positive": pos,
        "negative": neg,
        "neutral": neu
    }