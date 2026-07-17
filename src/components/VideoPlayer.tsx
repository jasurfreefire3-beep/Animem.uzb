import React from 'react';

interface VideoPlayerProps {
  key?: any;
  url: string;
  poster?: string;
}

export default function VideoPlayer({ url, poster }: VideoPlayerProps) {
  // Use capital-letter variables with 'as any' to bypass TypeScript JSX constraints safely 
  // without overriding the global IntrinsicElements namespace.
  const VideoPlayerElement = 'video-player' as any;
  const VideoSkinElement = 'video-skin' as any;

  return (
    <div className="w-full h-full min-h-[300px] md:min-h-[450px] lg:min-h-[500px] rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/10 flex items-center justify-center relative">
      <VideoPlayerElement class="w-full h-full block" className="w-full h-full block">
        <VideoSkinElement class="w-full h-full block media-default-skin media-default-skin--video" className="w-full h-full block media-default-skin media-default-skin--video">
          <video 
            src={url} 
            poster={poster} 
            playsInline 
            className="w-full h-full object-contain"
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        </VideoSkinElement>
      </VideoPlayerElement>
    </div>
  );
}
