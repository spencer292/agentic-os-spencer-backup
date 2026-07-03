import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#184241',
          borderRadius: 36,
        }}
      >
        <span
          style={{
            fontSize: 110,
            fontWeight: 700,
            color: '#E68C04',
            lineHeight: 1,
          }}
        >
          G
        </span>
      </div>
    ),
    { ...size },
  )
}
