from fastapi import FastAPI
from backend.youtube_api import (
    returnChannelId,
    returnVideoId,
    returnCommentList,
)
from backend.nlp_sentiment import return_sentiment_data


app = FastAPI()

@app.get("/analyze")
def analyze(channel: str):
    channel_id = returnChannelId(channel)
    video_id = returnVideoId(channel_id)
    comments = returnCommentList(video_id)
    scores, avg, pos, neg, neu = return_sentiment_data(comments)

    return {
        "channel": channel,
        "video_id": video_id,
        "average_sentiment": avg,
        "positive": pos,
        "negative": neg,
        "neutral": neu
    }