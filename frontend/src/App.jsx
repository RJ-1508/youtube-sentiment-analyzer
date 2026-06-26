import { useState } from "react";
import "./App.css";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const formatNumber = (num) => {
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + "B";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toString();
};

const ThumbnailTick = ({ x, y, payload }) => (
  <g transform={`translate(${x - 30},${y + 5})`}>
    <image href={payload.value} width="60" height="34" />
  </g>
);

function App() {
  const [channel, setChannel] = useState("");
  const [channelId, setChannelId] = useState("");
  const [channelStats, setChannelStats] = useState(null);
  const [videos, setVideos] = useState([]);
  const [sentiment, setSentiment] = useState(null);
  const [allSentiment, setAllSentiment] = useState([]);
  const [channelError, setChannelError] = useState(null);
  const [loadingAll, setLoadingAll] = useState(false);
  const [loadingChannel, setLoadingChannel] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [loadingAnalyzeId, setLoadingAnalyzeId] = useState(null);
  const [videoKind, setVideoKind] = useState("both");
  const [showBreakdown, setShowBreakdown] = useState(false);

  const clickHandler = async () => {
    setLoadingChannel(true);
    setChannelError(null);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/channel?channel=${encodeURIComponent(channel)}`,
      );
      const data = await response.json();
      if (!response.ok) {
        setChannelError(data.message ?? "Channel not found.");
        return;
      }
      setChannelId(data.channel_id);
      setChannelStats(data.stats);
    } catch {
      setChannelError("Could not reach the server. Is the backend running?");
    } finally {
      setLoadingChannel(false);
    }
  };

  const fetchVideos = async () => {
    setLoadingVideos(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/videos?channel_id=${encodeURIComponent(channelId)}&kind=${videoKind}`,
      );
      const data = await response.json();
      setVideos(data.videos);
    } finally {
      setLoadingVideos(false);
    }
  };

  const analyzeVideo = async (videoId) => {
    setLoadingAnalyzeId(videoId);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/analyze?video_id=${encodeURIComponent(videoId)}`,
      );
      const data = await response.json();
      setSentiment(data);
    } finally {
      setLoadingAnalyzeId(null);
    }
  };

  const fetchAllSentiment = async () => {
    setLoadingAll(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/analyze-all?channel_id=${encodeURIComponent(channelId)}`,
      );
      const data = await response.json();
      setAllSentiment(data.results);
    } finally {
      setLoadingAll(false);
    }
  };

  const resetAll = () => {
    setChannel("");
    setChannelId("");
    setChannelStats(null);
    setVideos([]);
    setSentiment(null);
    setAllSentiment([]);
    setChannelError(null);
    setShowBreakdown(false);
  };

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "24px 20px",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "28px", lineHeight: 1.2, margin: "0 0 8px" }}>
        YouTube Stats and Sentiment Analyzer
      </h1>
      <p
        style={{
          fontSize: "14px",
          color: "#666",
          margin: "0 0 24px",
          maxWidth: 640,
          marginInline: "auto",
        }}
      >
        Enter the name of any YouTube channel to analyze the sentiment of the
        comments across the top 50 comments on their 10 most recent videos.
        Click on a video to generate analysis or simply click on the analyze all
        videos button to see trends. Comments are scored using VADER sentiment
        analysis (-1 = most negative, +1 = most positive).
      </p>

      <div className="search-row">
        <input
          className="search-input"
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" &&
            !loadingChannel &&
            channel.trim() &&
            clickHandler()
          }
          placeholder="Channel name"
        />
        <button
          className="btn"
          onClick={clickHandler}
          disabled={loadingChannel || !channel.trim()}
        >
          {loadingChannel ? "Loading..." : "Get Channel Stats"}
        </button>
        <button className="btn" onClick={resetAll}>
          New Search
        </button>
      </div>

      {channelError && (
        <p
          style={{ color: "#c0392b", fontSize: "14px", margin: "-16px 0 16px" }}
        >
          {channelError}
        </p>
      )}

      {channelStats && (
        <div className="stat-cards">
          {!channelStats.hidden_subscriber_count && (
            <div className="stat-card">
              <div style={{ fontSize: "22px", fontWeight: "bold" }}>
                {formatNumber(channelStats.subscribers)}
              </div>
              <div style={{ fontSize: "13px", color: "#666" }}>Subscribers</div>
            </div>
          )}
          <div className="stat-card">
            <div style={{ fontSize: "22px", fontWeight: "bold" }}>
              {formatNumber(channelStats.views)}
            </div>
            <div style={{ fontSize: "13px", color: "#666" }}>Total Views</div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: "22px", fontWeight: "bold" }}>
              {formatNumber(channelStats.videos)}
            </div>
            <div style={{ fontSize: "13px", color: "#666" }}>Videos</div>
          </div>
        </div>
      )}

      <div className="action-row">
        <select
          className="filter-select"
          value={videoKind}
          onChange={(e) => setVideoKind(e.target.value)}
          disabled={!channelId}
        >
          <option value="both">Videos &amp; Shorts</option>
          <option value="videos">Videos only</option>
          <option value="shorts">Shorts only</option>
        </select>
        <button
          className="btn"
          onClick={fetchVideos}
          disabled={loadingVideos || !channelId}
        >
          {loadingVideos ? "Loading..." : "Get 10 Most Recent Videos"}
        </button>
        <button
          className="btn"
          onClick={fetchAllSentiment}
          disabled={loadingAll || videos.length === 0}
        >
          {loadingAll ? "Analyzing..." : "Analyze All Videos"}
        </button>
      </div>

      <ul className="video-list">
        {videos.map((video) => (
          <li
            key={video.id}
            className={`video-card${loadingAnalyzeId ? " loading" : ""}`}
            onClick={() => !loadingAnalyzeId && analyzeVideo(video.id)}
          >
            <img
              src={video.thumbnail}
              alt="thumbnail"
              style={{
                width: 120,
                height: 90,
                objectFit: "cover",
                borderRadius: 4,
                flexShrink: 0,
                opacity: loadingAnalyzeId === video.id ? 0.5 : 1,
                transition: "opacity 0.15s",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <p style={{ margin: 0, fontWeight: "bold", textAlign: "left" }}>
                {loadingAnalyzeId === video.id ? "Loading..." : video.title}
              </p>
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: "13px",
                  color: "#666",
                  textAlign: "right",
                }}
              >
                {formatNumber(video.views)} views &nbsp;·&nbsp;{" "}
                {formatNumber(video.comment_count)} comments
              </p>
            </div>
          </li>
        ))}
      </ul>

      {allSentiment.length > 0 && (
        <div style={{ width: "100%", marginTop: 8 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <h2 style={{ margin: 0, fontSize: "18px" }}>
              Sentiment across recent videos
            </h2>
            <button
              className="btn"
              onClick={() => setShowBreakdown(!showBreakdown)}
            >
              {showBreakdown ? "Hide breakdown" : "Show breakdown"}
            </button>
          </div>
          <div style={{ width: "100%", height: 440 }}>
            <ResponsiveContainer>
              <ComposedChart
                data={allSentiment}
                margin={{ top: 20, right: 40, left: 0, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="thumbnail"
                  tick={<ThumbnailTick />}
                  interval={0}
                  height={60}
                />
                <YAxis
                  yAxisId="left"
                  domain={[0, 1]}
                  tickFormatter={(v) => `${Math.round(v * 100)}%`}
                />
                <YAxis yAxisId="right" orientation="right" domain={[-1, 1]} />
                <Tooltip
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.title ?? ""
                  }
                  formatter={(value, name) =>
                    name === "average_sentiment"
                      ? value.toFixed(3)
                      : `${(value * 100).toFixed(1)}%`
                  }
                />
                <Legend />
                {showBreakdown && (
                  <>
                    <Bar
                      yAxisId="left"
                      dataKey="positive"
                      stackId="sentiment"
                      fill="#4ade80"
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="neutral"
                      stackId="sentiment"
                      fill="#94a3b8"
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="negative"
                      stackId="sentiment"
                      fill="#f87171"
                    />
                  </>
                )}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="average_sentiment"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#8884d8" }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {sentiment && (
        <div style={{ marginTop: 24 }}>
          {sentiment.error ? (
            <p style={{ color: "#888" }}>{sentiment.message}</p>
          ) : (
            <div>
              <h2 style={{ fontSize: "18px", margin: "0 0 12px" }}>
                Sentiment
              </h2>
              <p style={{ margin: "4px 0" }}>
                Average: {sentiment.average_sentiment}
              </p>
              <p style={{ margin: "4px 0" }}>Positive: {sentiment.positive}</p>
              <p style={{ margin: "4px 0" }}>Negative: {sentiment.negative}</p>
              <p style={{ margin: "4px 0" }}>Neutral: {sentiment.neutral}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
