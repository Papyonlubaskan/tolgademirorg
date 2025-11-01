import { ImageResponse } from 'next/og'
 
export const size = {
  width: 32,
  height: 32,
}
 
export const contentType = 'image/png'
 
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#008080',
          position: 'relative',
        }}
      >
        {/* Open Book Icon - Simplified for 32x32 */}
        <svg width="28" height="28" viewBox="0 0 120 120" style={{ position: 'absolute' }}>
          {/* Left Page */}
          <path d="M 35 45 Q 32 55 30 65 Q 32 75 35 85 L 55 85 L 55 45 Z" 
                fill="none" stroke="#FF8C00" strokeWidth="3"/>
          
          {/* Right Page */}
          <path d="M 85 45 Q 88 55 90 65 Q 88 75 85 85 L 65 85 L 65 45 Z" 
                fill="none" stroke="#FF8C00" strokeWidth="3"/>
          
          {/* Spine */}
          <line x1="55" y1="45" x2="55" y2="85" stroke="#E91E63" strokeWidth="2.5"/>
          <line x1="65" y1="45" x2="65" y2="85" stroke="#E91E63" strokeWidth="2.5"/>
          
          {/* Quill Pen */}
          <line x1="60" y1="70" x2="60" y2="30" stroke="#FF8C00" strokeWidth="3"/>
          <line x1="60" y1="35" x2="55" y2="42" stroke="#FF8C00" strokeWidth="2"/>
          <line x1="60" y1="35" x2="65" y2="42" stroke="#FF8C00" strokeWidth="2"/>
          <polygon points="60,30 58,28 60,25 62,28" fill="#FF8C00"/>
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}

