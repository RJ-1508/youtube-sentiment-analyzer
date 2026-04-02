from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
analyzer = SentimentIntensityAnalyzer()


def return_sentiment_data(comments: list[str]) ->tuple[list[float], float, int, int, int]:
    scores = []
    pos = 0
    neg = 0
    neu = 0
    for comment in comments:
        if len(comment.strip()) < 3:
            continue
        score = analyzer.polarity_scores(comment)["compound"]
        scores.append(score)
        if score >= 0.05:
            pos += 1
        elif score <= -0.05:
            neg += 1
        else:
            neu += 1
    average = sum(scores)/len(scores)
    return scores, average, pos, neg, neu