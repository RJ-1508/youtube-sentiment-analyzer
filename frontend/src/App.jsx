import { useState } from "react"
import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  Tooltip, Legend, CartesianGrid, ResponsiveContainer
} from 'recharts';
const buttonStyle = {
  padding: '8px 16px',
  borderRadius: '8px',
  border: '1px solid #ccc',
  background: '#ffffff',
  cursor: 'pointer',
  fontSize: '14px',
  margin: '4px',
  color: '#333'
};
const formatNumber = (num) => {
  if (num >= 1_000_000_000) return (num/1_000_000_000).toFixed(1) + 'B';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return num.toString();
};

const ThumbnailTick = ({x, y, payload}) => {
  return (
    <g transform={`translate(${x - 30},${y + 5})`}>
      <image href={payload.value} width="60" height="34" />
    </g>
  )
}

function App() {
  const [channel, setChannel] = useState('');
  const [channelId, setChannelId] = useState('');
  const [channelStats, setChannelStats] = useState(null);
  const [videos, setVideos] = useState([]);
  const [sentiment, setSentiment] = useState(null);
  const [allSentiment, setAllSentiment] = useState([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const clickHandler = async () => {
    const response = await fetch(`http://localhost:8000/channel?channel=${encodeURIComponent(channel)}`)
    const data = await response.json()
    setChannelId(data.channel_id)
    setChannelStats(data.stats)
  };

  const fetchVideos = async () => {
    const response = await fetch(`http://localhost:8000/videos?channel_id=${encodeURIComponent(channelId)}`)
    const data = await response.json()
    console.log(data)
    setVideos(data.videos)
  };

  const analyzeVideo = async (videoId) => {
    const response = await fetch(`http://localhost:8000/analyze?video_id=${encodeURIComponent(videoId)}`)
    const data = await response.json()
    setSentiment(data)
  }
  const fetchAllSentiment = async () => {
    setLoadingAll(true);
    try {
      const response = await fetch(`http://localhost:8000/analyze-all?channel_id=${encodeURIComponent(channelId)}`)
      const data = await response.json();
      setAllSentiment(data.results);
    } finally {
      setLoadingAll(false);
  }}
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '28px', lineHeight: 1.2, margin: '0 0 16px' }}>YouTube Stats and Sentiment Analyzer</h1>
      <input
        value={channel}
        onChange={(e) => setChannel(e.target.value)}
      />
      <button style= {buttonStyle} onClick={clickHandler}>Get Channel Stats</button>

      {channelStats && (
        <div style={{ display: 'flex', gap: '16px', margin: '16px 0', justifyContent: 'center' }}>
          {!channelStats.hidden_subscriber_count && (
            <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '12px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{formatNumber(channelStats.subscribers)}</div>
              <div style={{ fontSize: '13px', color: '#666' }}>Subscribers</div>
            </div>
          )}
          <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '12px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{formatNumber(channelStats.views)}</div>
            <div style={{ fontSize: '13px', color: '#666' }}>Total Views</div>
          </div>
          <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '12px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{formatNumber(channelStats.videos)}</div>
            <div style={{ fontSize: '13px', color: '#666' }}>Videos</div>
          </div>
        </div>
      )}

      <button style= {buttonStyle} onClick={fetchVideos}>Get 10 Most Recent Videos</button>

      <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left' }}>
        {videos.map((video) => (
          <li
            key={video.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '12px'
            }}
          >
            <img
              src={video.thumbnail}
              alt="thumbnail"
              onClick={() => analyzeVideo(video.id)}
              style={{ width: '120px', height: '90px', objectFit: 'cover', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <p
                onClick={() => analyzeVideo(video.id)}
                style={{ margin: 0, fontWeight: 'bold', cursor: 'pointer' }}
              >
                {video.title}
              </p>
              <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#666', textAlign: 'right' }}>
                {formatNumber(video.views)} views &nbsp;·&nbsp; {formatNumber(video.comment_count)} comments
              </p>
            </div>
          </li>
        ))}
      </ul>
      <button
  style={{ ...buttonStyle, opacity: loadingAll ? 0.6 : 1 }}
  onClick={fetchAllSentiment}
  disabled={loadingAll}
>
  {loadingAll ? 'Analyzing...' : 'Analyze All Videos'}
</button>
      {allSentiment.length > 0 && (
        <div style={{ width: '100%', marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Sentiment across recent videos</h2>
            <button onClick={() => setShowBreakdown(!showBreakdown)}>
              {showBreakdown ? 'Hide breakdown' : 'Show breakdown'}
            </button>
            </div>
            <div style={{ width: '100%', height: 440 }}>
              <ResponsiveContainer>
                <ComposedChart data={allSentiment} margin={{ top: 20, right: 40, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="thumbnail" tick={<ThumbnailTick />} interval={0} height={60} />
                  <YAxis yAxisId="left" domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} />
                  <YAxis yAxisId="right" orientation="right" domain={[-1, 1]} />
                  <Tooltip
  labelFormatter={(_, payload) => payload?.[0]?.payload?.title ?? ''}
  formatter={(value, name) =>
    name === 'average_sentiment' ? value.toFixed(3) : `${(value * 100).toFixed(1)}%`
  }
/>
                  <Legend />

                  {showBreakdown && (<>
                    <Bar yAxisId="left" dataKey="positive" stackId="sentiment" fill="#4ade80" />
                    <Bar yAxisId="left" dataKey="neutral"  stackId="sentiment" fill="#94a3b8" />
                    <Bar yAxisId="left" dataKey="negative" stackId="sentiment" fill="#f87171" />
                  </>)}
                  <Line yAxisId="right" type="monotone" dataKey="average_sentiment" stroke="#8884d8" strokeWidth={2} dot={{ r: 4, fill: '#8884d8' }} activeDot={{ r: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
      )}
      {sentiment && (
        <div>
          {sentiment.error ? (
            <p>{sentiment.message}</p>
          ) : (
            <div>
              <h2>Sentiment</h2>
              <p>Average: {sentiment.average_sentiment}</p>
              <p>Positive: {sentiment.positive}</p>
              <p>Negative: {sentiment.negative}</p>
              <p>Neutral: {sentiment.neutral}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default App
