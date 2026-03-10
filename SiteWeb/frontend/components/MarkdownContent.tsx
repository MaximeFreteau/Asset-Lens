// components/MarkdownContent.tsx
'use client'

import MarkdownPreview from '@uiw/react-markdown-preview'

export default function MarkdownContent({ source }: { source: string }) {
  return (
    <div data-color-mode="light">
      <MarkdownPreview source={source} />
    </div>
  )
}