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
        {/* Open Book Icon */}
        <svg width="32" height="32" viewBox="0 0 100 100" style={{ position: 'absolute', top: '2px' }}>
          {/* Book Pages */}
          <path d="M 30 35 Q 30 40 28 45 Q 30 50 30 55 L 45 55 L 45 35 Z" 
                fill="none" stroke="#FF8C00" strokeWidth="2"/>
          <path d="M 70 35 Q 70 40 72 45 Q 70 50 70 55 L 55 55 L 55 35 Z" 
                fill="none" stroke="#FF8C00" strokeWidth="2"/>
          {/* Quill */}
          <line x1="50" y1="50" x2="50" y2="25" stroke="#FF8C00" strokeWidth="2"/>
          <path d="M 50 25 L 47 28 M 50 25 L 53 28" stroke="#FF8C00" strokeWidth="1.5"/>
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}

