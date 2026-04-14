import { useState } from "react"

const formatNumber = (num) => {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return num.toString();
};

function App() {
  const [channel, setChannel] = useState('');
  const [channelId, setChannelId] = useState('');
  const [channelStats, setChannelStats] = useState(null);
  const [videos, setVideos] = useState([]);
  const [sentiment, setSentiment] = useState(null);

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

  return (
    <div>
      <h1>My YouTube App</h1>
      <input
        value={channel}
        onChange={(e) => setChannel(e.target.value)}
      />
      <button onClick={clickHandler}>Fetch</button>

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

      <button onClick={fetchVideos}>Get Video List</button>

      <ul style={{ listStyle: 'none', padding: 0 }}>
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
            <div>
              <p
                onClick={() => analyzeVideo(video.id)}
                style={{ margin: 0, fontWeight: 'bold', cursor: 'pointer' }}
              >
                {video.title}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>
                {formatNumber(video.views)} views &nbsp;·&nbsp; {formatNumber(video.comment_count)} comments
              </p>
            </div>
          </li>
        ))}
      </ul>

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
