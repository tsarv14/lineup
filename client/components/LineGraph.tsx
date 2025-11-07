'use client'

interface LineGraphProps {
  data: number[]
  height?: number
  maxValue?: number
  color?: string
}

export default function LineGraph({ data, height = 40, maxValue, color = '#3b82f6' }: LineGraphProps) {
  const graphWidth = 100
  const padding = 2
  const graphHeight = height - padding * 2

  // Always show graph area, even with no data
  if (!data || data.length === 0) {
    // Return flat line at bottom if no data
    return (
      <svg width="100%" height={height} className="overflow-visible" viewBox={`0 0 ${graphWidth} ${height}`} preserveAspectRatio="none">
        <line
          x1="0"
          y1={height - padding}
          x2={graphWidth}
          y2={height - padding}
          stroke="#6b7280"
          strokeWidth="1"
        />
      </svg>
    )
  }

  // Normalize data to fit graph
  const max = maxValue || Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const stepX = data.length > 1 ? graphWidth / (data.length - 1) : 0

  // Generate path for line
  const points = data.map((value, index) => {
    const x = index * stepX
    const normalizedValue = (value - min) / range
    const y = graphHeight - (normalizedValue * graphHeight) + padding
    return `${x},${y}`
  })

  const pathData = `M ${points.join(' L ')}`

  return (
    <svg width="100%" height={height} className="overflow-visible" viewBox={`0 0 ${graphWidth} ${height}`} preserveAspectRatio="none">
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

