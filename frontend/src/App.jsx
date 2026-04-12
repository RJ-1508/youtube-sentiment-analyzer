import { useState } from "react"

function App() {
  

  const [channel, setChannel] = useState('');
  const [channelId, setChannelId] = useState('');
  const [videos, setVideos] = useState([]);
  const [sentiment, setSentiment] = useState(null);
  const clickHandler = async () =>{
    const response = await fetch(`http://localhost:8000/channel?channel=${encodeURIComponent(channel)}`)
    const data = await response.json()
    setChannelId(data.channel_id)
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
  value = {channel}
  onChange={(e)=>setChannel(e.target.value)}
  />
  <button onClick = {clickHandler}>Fetch</button>
  <p>Channel ID: {channelId}</p>
  <button onClick = {fetchVideos}>Get Video List</button>
  <ul>
  {videos.map((video) => (
    <li key={video.id} onClick = {()=> analyzeVideo(video.id)}
    style = {{cursor:'pointer'}}>{video.title}</li>
  ))}
  </ul>
  {
    sentiment && (
      <div>
        <h2>Sentiment</h2>
        <p>Average: {sentiment.average_sentiment}</p>
        <p>Positive: {sentiment.positive}</p>
        <p>Negative: {sentiment.negative}</p>
        <p>Neutral: {sentiment.neutral}</p>
      </div>
    )
  }
  </div>
  );
}


export default App